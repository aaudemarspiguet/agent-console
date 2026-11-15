// Every Claude Code session on this PC, built from its hooks (brief A-2, A-3, A-14;
// handoff T14).
//
// - A session appears at its first hook: SessionStart (a command hook, since SessionStart
//   takes no HTTP hooks) or whatever arrives first.
// - Its state follows brief A-3. "Needs approval" is not stored: it is shown while one of
//   its permission requests waits, over whatever the hooks last said.
// - Hooks give no event when the user interrupts a turn (Stop does not fire). While a
//   session is working and quiet, the agent reads the end of its transcript: an interrupt
//   (or a denial in the terminal) writes a user entry "[Request interrupted by user...".
//   Notification idle_prompt (60 s after Claude last answered) is a second net.
// - A session goes on SessionEnd, or when the process that sent its hooks has exited
//   (a closed terminal window sends no SessionEnd).
import { execFile } from 'node:child_process';
import { closeSync, fstatSync, openSync, readSync } from 'node:fs';
import { basename, isAbsolute, relative } from 'node:path';
import type { SessionInfo, SessionState } from '@deck/protocol';

type BaseState = Exclude<SessionState, 'needsApproval'>;

interface Tracked {
  info: Omit<SessionInfo, 'state'> & { state: BaseState };
  /** Tool calls between PreToolUse and their PostToolUse, by tool_use_id. */
  openTools: Set<string>;
  transcriptPath: string | null;
  /** The claude process that sent the hooks; null until found (or if it cannot be). */
  pid: number | null;
  lookingForPid: boolean;
}

const WORKING: BaseState[] = ['thinking', 'running'];
/** How long a working session must be quiet before its transcript is read. */
const QUIET_MS = 2500;
const CHECK_EVERY_MS = 2000;

export interface SessionEvents {
  changed(session: SessionInfo): void;
  gone(id: string): void;
  /** The transcript shows an interrupt or a denial in the terminal: nothing waits any more. */
  interrupted(id: string): void;
  log(text: string): void;
}

/** "Bash: npm test", "Edit: src/App.tsx" (A-14). Paths inside the project are shown relative to it; long targets are cut. */
export function toolLine(tool: string, target: string, cwd = ''): string {
  if (cwd && isAbsolute(target) && !/\s/.test(target)) {
    const rel = relative(cwd, target);
    if (rel && !rel.startsWith('..') && !isAbsolute(rel)) target = rel.split('\\').join('/');
  }
  const line = target && target !== tool ? `${tool}: ${target.replace(/\s+/g, ' ')}` : tool;
  return line.length > 120 ? `${line.slice(0, 119)}…` : line;
}

export class Sessions {
  private all = new Map<string, Tracked>();
  private timer: NodeJS.Timeout;

  constructor(
    private events: SessionEvents,
    /** Whether a permission request from this session is waiting for an answer. */
    private hasWaitingRequest: (sessionId: string) => boolean,
    /** "the command", "the file": the same summary a permission request shows. */
    private summarise: (tool: string, input: Record<string, unknown> | undefined) => string,
  ) {
    this.timer = setInterval(() => this.sweep(), CHECK_EVERY_MS);
    this.timer.unref();
  }

  list(): SessionInfo[] {
    return [...this.all.values()].map((s) => this.view(s)).sort((a, b) => a.key - b.key);
  }

  /** Re-send a session whose shown state may have changed (a request came or went). */
  touch(sessionId: string) {
    const s = this.all.get(sessionId);
    if (s) this.events.changed(this.view(s));
  }

  /**
   * One hook's input. `remotePort` is the hook connection's port on the PC, used once
   * per session to find the claude process (handoff T9: it owns that connection).
   */
  onHook(input: any, remotePort: number | undefined) {
    const id = String(input.session_id ?? '');
    if (!id) return;
    const event = String(input.hook_event_name ?? '');

    if (event === 'SessionEnd') {
      if (this.all.has(id)) this.remove(id, `SessionEnd (${input.reason ?? '?'})`);
      return;
    }

    let s = this.all.get(id);
    if (!s) {
      s = this.add(id, String(input.cwd ?? ''));
      this.events.log(`Session ${id.slice(0, 8)} on key ${s.info.key}: ${s.info.project} (first hook: ${event}).`);
    }
    s.info.lastSeen = Date.now();
    if (typeof input.transcript_path === 'string') s.transcriptPath = input.transcript_path;
    if (input.cwd && input.cwd !== s.info.cwd) {
      s.info.cwd = String(input.cwd);
      s.info.project = projectName(s.info.cwd);
    }
    const level = input.effort?.level;
    if (typeof level === 'string') s.info.effort = level;
    if (s.pid === null && !s.lookingForPid && remotePort) this.findPid(s, remotePort);

    const tool = String(input.tool_name ?? '');
    switch (event) {
      case 'SessionStart':
        break;
      case 'UserPromptSubmit':
        s.openTools.clear();
        s.info.state = 'thinking';
        break;
      case 'PreToolUse':
        s.openTools.add(String(input.tool_use_id ?? tool));
        s.info.state = 'running';
        s.info.tools = [...s.info.tools, toolLine(tool, this.summarise(tool, input.tool_input), s.info.cwd)].slice(-3);
        break;
      case 'PostToolUse':
      case 'PostToolUseFailure':
        s.openTools.delete(String(input.tool_use_id ?? tool));
        s.info.state = s.openTools.size > 0 ? 'running' : 'thinking';
        break;
      case 'PermissionRequest':
        // Shown as needs approval through hasWaitingRequest; the turn is still on.
        if (!WORKING.includes(s.info.state)) s.info.state = 'thinking';
        break;
      case 'Stop':
        s.openTools.clear();
        s.info.state = 'finished';
        break;
      case 'StopFailure':
        s.openTools.clear();
        s.info.state = 'error';
        break;
      case 'Notification':
        // idle_prompt: Claude answered about 60 s ago and nobody has typed. A session
        // still shown working missed its end (an interrupt the transcript check missed).
        if (input.notification_type === 'idle_prompt' && WORKING.includes(s.info.state)) {
          s.openTools.clear();
          s.info.state = 'idle';
          this.events.log(`  ${s.info.project}: idle_prompt while shown working; now idle.`);
        }
        break;
    }
    this.events.changed(this.view(s));
  }

  /** The phone opened this session: a finished one becomes idle (A-3). For T15. */
  seen(sessionId: string) {
    const s = this.all.get(sessionId);
    if (s && s.info.state === 'finished') {
      s.info.state = 'idle';
      this.events.changed(this.view(s));
    }
  }

  private view(s: Tracked): SessionInfo {
    return { ...s.info, tools: [...s.info.tools], state: this.hasWaitingRequest(s.info.id) ? 'needsApproval' : s.info.state };
  }

  private add(id: string, cwd: string): Tracked {
    const taken = new Set([...this.all.values()].map((s) => s.info.key));
    let key = 1;
    while (taken.has(key)) key++;
    const s: Tracked = {
      info: { id, agent: 'claudeCode', key, project: projectName(cwd), cwd, state: 'idle', effort: null, tools: [], lastSeen: Date.now() },
      openTools: new Set(),
      transcriptPath: null,
      pid: null,
      lookingForPid: false,
    };
    this.all.set(id, s);
    return s;
  }

  private remove(id: string, why: string) {
    const s = this.all.get(id);
    if (!s) return;
    this.all.delete(id);
    this.events.log(`Session ${id.slice(0, 8)} (${s.info.project}, key ${s.info.key}) ended: ${why}.`);
    this.events.gone(id);
  }

  private findPid(s: Tracked, remotePort: number) {
    s.lookingForPid = true;
    ownerOfPort(remotePort).then((pid) => {
      s.lookingForPid = false;
      if (pid && this.all.get(s.info.id) === s) {
        s.pid = pid;
        this.events.log(`  ${s.info.project}: hooks come from process ${pid}.`);
      }
    });
  }

  private sweep() {
    const now = Date.now();
    for (const s of [...this.all.values()]) {
      if (s.pid !== null && !alive(s.pid)) {
        this.remove(s.info.id, `process ${s.pid} exited`);
        continue;
      }
      const quiet = now - s.info.lastSeen > QUIET_MS;
      if (quiet && (WORKING.includes(s.info.state) || this.hasWaitingRequest(s.info.id))) {
        if (s.transcriptPath && endsInterrupted(s.transcriptPath)) {
          s.openTools.clear();
          s.info.state = 'idle';
          this.events.log(`  ${s.info.project}: the transcript shows an interrupt or a denial in the terminal; now idle.`);
          this.events.interrupted(s.info.id);
          this.events.changed(this.view(s));
        }
      }
    }
  }
}

function projectName(cwd: string): string {
  return basename(cwd.replace(/[\\/]+$/, '')) || cwd || '?';
}

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    // EPERM: it exists but belongs to someone else (an elevated terminal).
    return (e as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/** The process that owns the PC's end of a TCP connection to the hook port, from netstat. */
function ownerOfPort(port: number): Promise<number | null> {
  if (process.platform !== 'win32') return Promise.resolve(null);
  return new Promise((resolve) => {
    execFile('netstat', ['-ano', '-p', 'TCP'], { windowsHide: true, timeout: 5000 }, (err, stdout) => {
      if (err) return resolve(null);
      for (const line of stdout.split(/\r?\n/)) {
        const cols = line.trim().split(/\s+/);
        // Proto  Local  Foreign  State  PID
        if (cols.length === 5 && cols[1].endsWith(`:${port}`) && cols[2].endsWith(`:${process.env.DECK_HOOK_PORT ?? 8766}`)) {
          const pid = Number(cols[4]);
          return resolve(pid > 0 ? pid : null);
        }
      }
      resolve(null);
    });
  });
}

/**
 * Whether the last user or assistant entry in a transcript is an interrupt marker
 * ("[Request interrupted by user]" or "... for tool use]", seen in this PC's
 * transcripts). Reads only the file's last 64 KB.
 */
export function endsInterrupted(path: string): boolean {
  let fd: number | null = null;
  try {
    fd = openSync(path, 'r');
    const size = fstatSync(fd).size;
    const length = Math.min(size, 64 * 1024);
    const buffer = Buffer.alloc(length);
    readSync(fd, buffer, 0, length, size - length);
    const lines = buffer.toString('utf8').split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (!line.startsWith('{')) continue;
      let entry: any;
      try {
        entry = JSON.parse(line);
      } catch {
        continue; // the first line may be cut in half
      }
      if (entry.type === 'assistant') return false;
      if (entry.type !== 'user') continue;
      const content = entry.message?.content;
      const texts: string[] =
        typeof content === 'string' ? [content] : Array.isArray(content) ? content.filter((c: any) => c?.type === 'text').map((c: any) => String(c.text)) : [];
      if (texts.some((t) => t.startsWith('[Request interrupted by user'))) return true;
      // A tool result is a user entry too; keep looking past it for the marker or Claude.
      if (texts.length > 0) return false;
    }
  } catch {
    // No transcript, or not readable: nothing to say.
  } finally {
    if (fd !== null) closeSync(fd);
  }
  return false;
}
