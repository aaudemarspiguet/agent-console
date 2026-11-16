// PC side of the Gate 0 spike (product-brief.md, G0-1 to G0-3; handoff T8).
//
// - Pairing (C-1, C-2): shows a QR code holding this PC's addresses and a 32-byte
//   secret. The secret is kept in ~/.deck/agent.json so a paired phone can reconnect
//   after a restart without rescanning.
// - Link: a WebSocket server on the local network (port 8765). Every frame after the
//   two hellos is encrypted (packages/protocol/src/secure.ts).
// - Hooks: an HTTP server on 127.0.0.1 only (port 8766) that Claude Code's `http`
//   hooks call. A PermissionRequest is held open until the phone answers; a Stop hook
//   hands over a follow-up the phone queued. Every hook also feeds the session list
//   (sessions.ts; handoff T14).
// - `--install-hooks` and `--remove-hooks` add and remove Deck's hooks in Claude Code's
//   user settings, then exit (hooks.ts; brief A-1).
import { randomBytes as nodeRandomBytes, randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync, mkdirSync, readFileSync, watchFile, writeFileSync } from 'node:fs';
import { homedir, hostname, networkInterfaces } from 'node:os';
import { join } from 'node:path';
import { WebSocketServer, type WebSocket } from 'ws';
import qrcode from 'qrcode-terminal';
import { runHookCommand } from './hooks.js';
import { redirectEditRules } from './redirects.js';
import { Sessions } from './sessions.js';
import {
  PROTOCOL_VERSION,
  SecureChannel,
  fromBase64,
  sessionKey,
  toBase64,
  type AgentMessage,
  type HelloFromAgent,
  type HelloFromPhone,
  type Pairing,
  type PermissionRequest,
  type PhoneMessage,
  type SavedReplies,
  type SessionInfo,
} from '@deck/protocol';

// `--install-hooks`, `--remove-hooks`: change the settings file and exit.
if (await runHookCommand(process.argv.slice(2))) process.exit(0);

const LINK_PORT = Number(process.env.DECK_LINK_PORT ?? 8765);
const HOOK_PORT = Number(process.env.DECK_HOOK_PORT ?? 8766);
/** How long a request is held for the phone before the agent gives up and returns no decision. */
const HOLD_SECONDS = Number(process.env.DECK_HOLD_SECONDS ?? 590);

const random = (n: number) => new Uint8Array(nodeRandomBytes(n));

function log(text: string) {
  console.log(`${new Date().toISOString().slice(11, 23)}  ${text}`);
}

// ---------- Pairing ----------

interface Stored {
  pcId: string;
  secret: string;
}

function loadOrCreatePairing(): Stored {
  const dir = join(homedir(), '.deck');
  const file = join(dir, 'agent.json');
  const fresh = process.argv.includes('--new-pairing');
  if (!fresh) {
    try {
      return JSON.parse(readFileSync(file, 'utf8')) as Stored;
    } catch {
      // First run: fall through and create one.
    }
  }
  const stored: Stored = { pcId: randomUUID(), secret: toBase64(random(32)) };
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify(stored, null, 2), { mode: 0o600 });
  log(fresh ? 'Made a new pairing; phones paired before must scan again.' : `Saved a new pairing in ${file}.`);
  return stored;
}

/** IPv4 addresses on this PC that a phone on the same Wi-Fi could reach. */
function localAddresses(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((net) => net !== undefined && net.family === 'IPv4' && !net.internal)
    // 169.254.x.x is a link-local address Windows gives an adapter with no network;
    // a phone cannot reach it.
    .filter((net) => !net!.address.startsWith('169.254.'))
    .map((net) => net!.address);
}

const stored = loadOrCreatePairing();
const secret = fromBase64(stored.secret);

// ---------- The phone link ----------

interface Phone {
  socket: WebSocket;
  channel: SecureChannel;
  phoneId: string;
}

let phone: Phone | null = null;

function send(message: AgentMessage) {
  if (!phone) return false;
  phone.socket.send(phone.channel.seal(message));
  return true;
}

const links = new WebSocketServer({ port: LINK_PORT });

links.on('connection', (socket, req) => {
  const from = req.socket.remoteAddress;
  let channel: SecureChannel | null = null;
  let phoneId = '';

  const drop = (why: string) => {
    log(`Link from ${from} closed: ${why}`);
    socket.close();
  };

  socket.on('message', (data) => {
    const text = data.toString();
    if (!channel) {
      // The phone's hello, in the clear: the version, which PC it expects, and its nonce.
      let hello: HelloFromPhone;
      try {
        hello = JSON.parse(text) as HelloFromPhone;
      } catch {
        return drop('first frame was not a hello');
      }
      if (hello.t !== 'hello' || hello.v !== PROTOCOL_VERSION) return drop(`wrong hello or version ${hello.v}`);
      if (hello.pcId !== stored.pcId) return drop('paired with a different PC');
      const agentNonce = random(32);
      const reply: HelloFromAgent = { t: 'hello', v: PROTOCOL_VERSION, nonce: toBase64(agentNonce) };
      socket.send(JSON.stringify(reply));
      channel = new SecureChannel(sessionKey(secret, fromBase64(hello.nonce), agentNonce), 'agentToPhone', random);
      phoneId = hello.phoneId;
      return;
    }

    // Every later frame must open with the session key. The first one that does proves
    // the phone holds the secret; until then the phone is not trusted with anything.
    let message: PhoneMessage;
    try {
      message = channel.open<PhoneMessage>(text);
    } catch (e) {
      return drop(`frame failed to open (${(e as Error).message})`);
    }

    if (!phone || phone.socket !== socket) {
      if (phone) {
        log('A newer link replaced the old one.');
        phone.socket.close();
      }
      phone = { socket, channel, phoneId };
      log(`Phone ${phoneId.slice(0, 8)} linked from ${from}.`);
      send({
        t: 'ready',
        pcName: hostname(),
        sessions: sessions.list(),
        waiting: [...pending.values()].map((p) => p.request),
        followups: [...followups].map(([sessionId, text]) => ({ sessionId, text })),
        replies: savedReplies,
      });
    }
    onPhoneMessage(message);
  });

  socket.on('close', () => {
    if (phone?.socket === socket) {
      phone = null;
      log('Phone link lost.');
    }
  });
  socket.on('error', (e) => log(`Link error: ${e.message}`));
});

function onPhoneMessage(message: PhoneMessage) {
  switch (message.t) {
    case 'ping':
      send({ t: 'pong' });
      break;
    case 'answer': {
      const waiting = pending.get(message.id);
      if (!waiting) return log(`Answer for ${message.id.slice(0, 8)}, which is no longer waiting.`);
      const always = message.decision === 'allow' && message.always === true;
      const decision =
        message.decision === 'allow'
          ? always
            ? { behavior: 'allow', updatedPermissions: sessionRules(waiting) }
            : { behavior: 'allow' }
          : { behavior: 'deny', message: message.message, interrupt: message.interrupt };
      if (always) {
        log(`  Claude Code suggested: ${JSON.stringify(waiting.suggestions)}`);
        log(`  rules sent: ${JSON.stringify((decision as { updatedPermissions?: unknown }).updatedPermissions)}`);
      }
      log(
        `Phone: ${always ? 'always allow (this session)' : message.decision}${message.message ? ` "${message.message}"` : ''} for ${waiting.request.tool}.`,
      );
      waiting.finish({ hookSpecificOutput: { hookEventName: 'PermissionRequest', decision } });
      break;
    }
    case 'followup':
      followups.set(message.sessionId, message.text);
      log(`Follow-up queued for session ${message.sessionId.slice(0, 8)}: "${message.text}"`);
      break;
    case 'cancelFollowup':
      if (followups.delete(message.sessionId)) log(`Follow-up for session ${message.sessionId.slice(0, 8)} cancelled from the phone.`);
      break;
    case 'seen':
      sessions.seen(message.sessionId);
      break;
  }
}

// ---------- Saved replies (R-1) ----------

// Written on the PC. Until the tray agent's window has its Saved Replies section,
// they live in ~/.deck/replies.json, created with these two on first run; an edit
// reaches the phone within a second or two.
const REPLIES_FILE = join(homedir(), '.deck', 'replies.json');
const DEFAULT_REPLIES: SavedReplies = {
  reply1: 'Run the tests and fix any failures.',
  reply2: 'Explain what you are about to do and why, then wait.',
};

function loadReplies(): SavedReplies {
  try {
    const r = JSON.parse(readFileSync(REPLIES_FILE, 'utf8'));
    return {
      reply1: typeof r.reply1 === 'string' && r.reply1.trim() ? r.reply1.trim() : DEFAULT_REPLIES.reply1,
      reply2: typeof r.reply2 === 'string' && r.reply2.trim() ? r.reply2.trim() : DEFAULT_REPLIES.reply2,
    };
  } catch (e) {
    if (existsSync(REPLIES_FILE)) log(`Could not read ${REPLIES_FILE} (${(e as Error).message}); using the defaults.`);
    return DEFAULT_REPLIES;
  }
}

if (!existsSync(REPLIES_FILE)) {
  mkdirSync(join(homedir(), '.deck'), { recursive: true });
  writeFileSync(REPLIES_FILE, JSON.stringify(DEFAULT_REPLIES, null, 2) + '\n');
}
let savedReplies = loadReplies();
watchFile(REPLIES_FILE, { interval: 1000 }, () => {
  const next = loadReplies();
  if (JSON.stringify(next) === JSON.stringify(savedReplies)) return;
  savedReplies = next;
  log(`Saved replies changed: 1 "${next.reply1}", 2 "${next.reply2}".`);
  send({ t: 'replies', replies: next });
}).unref();

// ---------- Claude Code hooks ----------

interface Waiting {
  request: PermissionRequest;
  /** What Claude Code offered as "don't ask again" (permission_suggestions), if anything. */
  suggestions: unknown[];
  finish: (body: object | null) => void;
  /** The person answered in the terminal; tell the phone and let go of the hook. */
  answeredElsewhere: () => void;
}

const pending = new Map<string, Waiting>();
const followups = new Map<string, string>();

/**
 * Always Allow, this session only (A-4): Claude Code's own suggestions, moved to the
 * "session" destination (in memory, gone when the session ends). Kept: addRules, and
 * addDirectories, which Claude Code offers instead of a rule when the call writes to
 * a folder it has not allowed. Left out: setMode, which would change the whole
 * session's permission mode. Without a rule suggestion, a rule for this tool is
 * added, narrowed to the exact command for Bash.
 *
 * A Bash command that writes files through `>` or `>>` also gets an Edit rule for
 * each target (redirects.ts): Claude Code checks those targets against Edit rules,
 * not the command's rule, so without them `echo x >> log.txt` asked again (seen on
 * the phone 2026-11-14, even with the suggested folder added).
 */
function sessionRules(waiting: Waiting): object[] {
  const rules = waiting.suggestions
    .filter((x: any) => x && x.type === 'addRules' && Array.isArray(x.rules) && x.rules.length > 0)
    .map((x: any) => ({ type: 'addRules', rules: x.rules, behavior: 'allow', destination: 'session' }));
  const folders = waiting.suggestions
    .filter((x: any) => x && x.type === 'addDirectories' && Array.isArray(x.directories) && x.directories.length > 0)
    .map((x: any) => ({ type: 'addDirectories', directories: x.directories, destination: 'session' }));
  const r = waiting.request;
  const targets = r.tool === 'Bash' ? redirectEditRules(r.summary, r.cwd) : [];
  const edits = targets.length
    ? [{ type: 'addRules', rules: targets.map((ruleContent) => ({ toolName: 'Edit', ruleContent })), behavior: 'allow', destination: 'session' }]
    : [];
  return [...(rules.length > 0 ? rules : fallbackRule(waiting)), ...edits, ...folders];
}

function fallbackRule(waiting: Waiting): object[] {
  const r = waiting.request;
  const rule = r.tool === 'Bash' ? { toolName: 'Bash', ruleContent: r.summary } : { toolName: r.tool };
  return [{ type: 'addRules', rules: [rule], behavior: 'allow', destination: 'session' }];
}

// ---------- Sessions ----------

/** What was last logged for each session, so the log shows changes only. */
const logged = new Map<string, string>();

const sessions = new Sessions(
  {
    changed(session: SessionInfo) {
      const line = `${session.state}${session.effort ? `, effort ${session.effort}` : ''}${session.tools.length ? ` | ${session.tools.join(' | ')}` : ''}`;
      // Every hook updates lastSeen; the phone hears only of changes it would show.
      const shown = `${session.key} ${session.project} ${line}`;
      if (logged.get(session.id) === shown) return;
      logged.set(session.id, shown);
      log(`  [${session.key}] ${session.project}: ${line}`);
      send({ t: 'session', session });
    },
    gone(id: string) {
      logged.delete(id);
      followups.delete(id);
      for (const waiting of [...pending.values()]) if (waiting.request.sessionId === id) waiting.answeredElsewhere();
      send({ t: 'sessionGone', id });
    },
    interrupted(id: string) {
      clearSession(id, 'interrupt in the transcript');
    },
    log,
  },
  (sessionId) => [...pending.values()].some((w) => w.request.sessionId === sessionId),
  (tool, input) => summarise(tool, input),
);

function summarise(tool: string, input: Record<string, unknown> | undefined): string {
  if (!input) return tool;
  for (const key of ['command', 'file_path', 'url', 'pattern', 'path']) {
    if (typeof input[key] === 'string') return input[key] as string;
  }
  return JSON.stringify(input).slice(0, 300);
}

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let text = '';
    req.on('data', (chunk) => (text += chunk));
    req.on('end', () => {
      try {
        resolve(text ? JSON.parse(text) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

/** An empty 200 means "no decision": Claude Code carries on as if there were no hook. */
function reply(res: ServerResponse, body: object | null) {
  if (body) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  } else {
    res.writeHead(200);
    res.end();
  }
}

async function onPermissionRequest(req: IncomingMessage, res: ServerResponse) {
  const input = await readBody(req);
  sessions.onHook(input, req.socket.remotePort);
  const request: PermissionRequest = {
    id: randomUUID(),
    sessionId: String(input.session_id ?? ''),
    cwd: String(input.cwd ?? ''),
    tool: String(input.tool_name ?? '?'),
    summary: summarise(String(input.tool_name), input.tool_input),
    at: Date.now(),
  };
  log(`PermissionRequest ${request.tool}: ${request.summary}`);

  if (!phone) {
    log('  no phone linked; no decision returned, so Claude Code asks in the terminal.');
    return reply(res, null);
  }

  let done = false;
  const finish = (body: object | null, how?: 'answered' | 'gone' | 'timeout') => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    pending.delete(request.id);
    if (how) send({ t: 'resolved', id: request.id, how });
    if (!res.writableEnded && !res.destroyed) reply(res, body);
    sessions.touch(request.sessionId);
  };
  const timer = setTimeout(() => {
    log(`  held ${HOLD_SECONDS} s with no answer; returning no decision.`);
    finish(null, 'timeout');
  }, HOLD_SECONDS * 1000);

  // Claude Code drops the request when its own wait runs out. It does NOT drop it when
  // the person answers in the terminal first (tested in T8): the hook stays open until
  // its timeout. That case is caught by the session's later hooks (clearSession).
  res.on('close', () => {
    if (!done) {
      log(`  Claude Code closed the request after ${((Date.now() - request.at) / 1000).toFixed(1)} s.`);
      finish(null, 'gone');
    }
  });

  if (process.env.DECK_DEBUG_SUGGESTIONS) log(`  suggestions: ${JSON.stringify(input.permission_suggestions ?? null)}`);
  pending.set(request.id, {
    request,
    suggestions: Array.isArray(input.permission_suggestions) ? input.permission_suggestions : [],
    finish: (body) => finish(body),
    answeredElsewhere: () => finish(null, 'answered'),
  });
  send({ t: 'request', request });
  sessions.touch(request.sessionId);
}

/**
 * Clears requests the person already answered in the terminal. A later hook from the
 * same session shows the prompt is over: PostToolUse or PostToolUseFailure for that
 * exact tool call (it ran, so it was allowed), or the turn ending or a new prompt
 * (whatever was waiting in that session is over). A denial in the terminal fires no
 * tool hook, so it is only caught when the turn ends or the next prompt is sent.
 */
function clearSession(sessionId: string, why: string, call?: { tool: string; summary: string }) {
  for (const waiting of [...pending.values()]) {
    const r = waiting.request;
    if (r.sessionId !== sessionId) continue;
    if (call && (r.tool !== call.tool || r.summary !== call.summary)) continue;
    log(`  ${r.tool} request was answered in the terminal (${why}); clearing it from the phone.`);
    waiting.answeredElsewhere();
    if (call) return; // one tool call clears one request
  }
}

async function onSessionEvent(req: IncomingMessage, res: ServerResponse) {
  const input = await readBody(req);
  const sessionId = String(input.session_id ?? '');
  const event = String(input.hook_event_name ?? '');
  if (event === 'PostToolUse' || event === 'PostToolUseFailure') {
    const tool = String(input.tool_name ?? '');
    clearSession(sessionId, event, { tool, summary: summarise(tool, input.tool_input) });
  } else if (['UserPromptSubmit', 'StopFailure', 'SessionEnd'].includes(event)) {
    // The turn is over or a new one began: whatever waited in this session is over.
    // (PreToolUse, SessionStart and Notification say nothing about a waiting request.)
    clearSession(sessionId, event);
  }
  sessions.onHook(input, req.socket.remotePort);
  reply(res, null);
}

async function onStop(req: IncomingMessage, res: ServerResponse) {
  const input = await readBody(req);
  const sessionId = String(input.session_id ?? '');
  clearSession(sessionId, 'Stop');
  sessions.onHook(input, req.socket.remotePort);
  const text = followups.get(sessionId);
  log(`Stop from session ${sessionId.slice(0, 8)}${input.stop_hook_active ? ' (already continuing)' : ''}.`);
  if (text && !input.stop_hook_active) {
    followups.delete(sessionId);
    log(`  handing over the follow-up: "${text}"`);
    send({ t: 'followupSent', sessionId });
    // Two documented ways to keep the turn going (tested in T8). 'block' reaches Claude
    // labelled "Stop hook blocking error"; additionalContext, the default, reaches it as
    // hook context and the session records no hook error. DECK_FOLLOWUP_STYLE=block
    // switches back for comparison.
    if (process.env.DECK_FOLLOWUP_STYLE === 'block') return reply(res, { decision: 'block', reason: text });
    return reply(res, { hookSpecificOutput: { hookEventName: 'Stop', additionalContext: text } });
  }
  reply(res, null);
}

const hooks = createServer((req, res) => {
  const route = `${req.method} ${req.url}`;
  const handler =
    route === 'POST /hooks/permission-request'
      ? onPermissionRequest
      : route === 'POST /hooks/stop'
        ? onStop
        : route === 'POST /hooks/event'
          ? onSessionEvent
          : null;
  if (!handler) {
    res.writeHead(404);
    return res.end();
  }
  handler(req, res).catch((e) => {
    log(`Hook ${route} failed: ${(e as Error).message}`);
    if (!res.writableEnded) reply(res, null);
  });
});

hooks.listen(HOOK_PORT, '127.0.0.1');

// ---------- Start ----------

const pairing: Pairing = {
  v: PROTOCOL_VERSION,
  hosts: localAddresses(),
  port: LINK_PORT,
  pcId: stored.pcId,
  secret: stored.secret,
};

console.log(`Deck agent, protocol version ${PROTOCOL_VERSION}`);
console.log(`Link on port ${LINK_PORT} (${pairing.hosts.join(', ') || 'no network address found'})`);
console.log(`Hooks on http://127.0.0.1:${HOOK_PORT}/hooks/permission-request, /hooks/stop and /hooks/event`);
console.log('Scan this with the Deck app to pair:');
qrcode.generate(JSON.stringify(pairing), { small: true }, (qr) => {
  console.log(qr);
  // The same code as a page, for when the terminal is too narrow to show it whole.
  // It holds the pairing secret, so it lives in ~/.deck beside agent.json.
  const page = join(homedir(), '.deck', 'pair.html');
  writeFileSync(
    page,
    `<!doctype html><meta charset="utf-8"><title>Pair Deck</title>
<body style="margin:0;background:#fff;display:grid;place-items:center;min-height:100vh">
<pre style="font:16px/1 Consolas,monospace;letter-spacing:0;color:#000">${qr}</pre></body>`,
    { mode: 0o600 },
  );
  console.log(`Code too big for this window? Open ${page}`);
});
if (process.argv.includes('--print-pairing')) console.log(JSON.stringify(pairing));
