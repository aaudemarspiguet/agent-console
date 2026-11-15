// Adds and removes Deck's hooks in Claude Code's settings (brief A-1; handoff T14).
//
//   pnpm agent --install-hooks [--dry-run] [--settings <file>]
//   pnpm agent --remove-hooks  [--dry-run] [--settings <file>]
//
// - The file is ~/.claude/settings.json unless --settings names another.
// - Before writing, the change is printed as a diff and the file is copied to
//   settings.json.deck-backup-<time> beside it. --dry-run prints the diff only.
// - Deck's own hooks are the ones whose URL (or command) points at the agent's hook port
//   on 127.0.0.1. Nothing else in the file is touched; other hooks on the same events
//   stay where they are. Installing twice leaves one copy.
// - Running sessions pick the change up through Claude Code's settings watcher (hooks
//   docs); a session that does not should be restarted.
// - With the agent stopped, the HTTP hooks fail as non-blocking errors and Claude Code
//   goes on as if they were not there (T8), so installing user-wide is safe.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const HOOK_PORT = Number(process.env.DECK_HOOK_PORT ?? 8766);
const BASE = `http://127.0.0.1:${HOOK_PORT}/hooks`;

type Hook = { type: string; url?: string; command?: string; timeout?: number; [k: string]: unknown };
type Group = { matcher?: string; hooks: Hook[]; [k: string]: unknown };

/**
 * The hooks Deck needs, by event. Checked against code.claude.com/docs/en/hooks on
 * 2026-11-14: HTTP hooks POST the event JSON; a connection failure is non-blocking.
 * SessionStart takes only command and mcp_tool hooks, so it uses curl (shipped with
 * Windows 10 and later) to post the same JSON; `|| true` keeps a stopped agent from
 * showing as a hook error.
 */
export function deckHooks(): Record<string, Hook> {
  const event = { type: 'http', url: `${BASE}/event`, timeout: 5 };
  return {
    // Held until the phone answers; the agent lets go after 590 s (HOLD_SECONDS).
    PermissionRequest: { type: 'http', url: `${BASE}/permission-request`, timeout: 600 },
    Stop: { type: 'http', url: `${BASE}/stop`, timeout: 10 },
    UserPromptSubmit: event,
    PreToolUse: event,
    PostToolUse: event,
    PostToolUseFailure: event,
    StopFailure: event,
    Notification: event,
    SessionEnd: event,
    SessionStart: {
      type: 'command',
      command: `curl -s -m 2 -X POST -H "Content-Type: application/json" --data-binary @- ${BASE}/event || true`,
      timeout: 5,
    },
  };
}

function isDeck(hook: Hook): boolean {
  const target = `127.0.0.1:${HOOK_PORT}/hooks/`;
  return (typeof hook.url === 'string' && hook.url.includes(target)) || (typeof hook.command === 'string' && hook.command.includes(target));
}

/** The settings with every Deck hook taken out, and empty groups and events dropped. */
export function withoutDeck(settings: any): any {
  const out = structuredClone(settings);
  if (!out.hooks || typeof out.hooks !== 'object') return out;
  for (const [event, groups] of Object.entries(out.hooks as Record<string, Group[]>)) {
    if (!Array.isArray(groups)) continue;
    const kept = groups
      .map((g) => (Array.isArray(g?.hooks) ? { ...g, hooks: g.hooks.filter((h) => !isDeck(h)) } : g))
      .filter((g) => !Array.isArray(g?.hooks) || g.hooks.length > 0);
    if (kept.length > 0) out.hooks[event] = kept;
    else delete out.hooks[event];
  }
  if (Object.keys(out.hooks).length === 0) delete out.hooks;
  return out;
}

/** The settings with Deck's hooks added, one group per event after any already there. */
export function withDeck(settings: any): any {
  const out = withoutDeck(settings);
  out.hooks ??= {};
  for (const [event, hook] of Object.entries(deckHooks())) {
    out.hooks[event] = [...(out.hooks[event] ?? []), { hooks: [hook] }];
  }
  return out;
}

/** A plain line diff (longest common subsequence), with two lines of context. */
export function diffLines(before: string, after: string): string {
  const a = before.split('\n');
  const b = after.split('\n');
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const rows: { mark: ' ' | '+' | '-'; text: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) rows.push({ mark: ' ', text: a[i++] }), j++;
    else if (j < b.length && (i >= a.length || lcs[i][j + 1] >= lcs[i + 1][j])) rows.push({ mark: '+', text: b[j++] });
    else rows.push({ mark: '-', text: a[i++] });
  }
  const near = (k: number) => rows.slice(Math.max(0, k - 2), k + 3).some((r) => r.mark !== ' ');
  const out: string[] = [];
  let skipped = false;
  rows.forEach((r, k) => {
    if (near(k)) {
      if (skipped) out.push('  ...');
      skipped = false;
      out.push(`${r.mark} ${r.text}`);
    } else skipped = true;
  });
  return out.join('\n');
}

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/** Runs --install-hooks or --remove-hooks if asked. Returns false when neither was. */
export async function runHookCommand(args: string[]): Promise<boolean> {
  const install = args.includes('--install-hooks');
  const remove = args.includes('--remove-hooks');
  if (!install && !remove) return false;
  if (install && remove) throw new Error('Pick one of --install-hooks and --remove-hooks.');
  const at = args.indexOf('--settings');
  const file = at >= 0 && args[at + 1] ? args[at + 1] : join(homedir(), '.claude', 'settings.json');
  const dryRun = args.includes('--dry-run');

  const exists = existsSync(file);
  const beforeText = exists ? readFileSync(file, 'utf8') : '{}\n';
  let settings: any;
  try {
    settings = JSON.parse(beforeText);
  } catch (e) {
    console.error(`${file} is not plain JSON (${(e as Error).message}). Nothing was changed.`);
    process.exitCode = 1;
    return true;
  }
  const next = install ? withDeck(settings) : withoutDeck(settings);
  const eol = beforeText.includes('\r\n') ? '\r\n' : '\n';
  const afterText = JSON.stringify(next, null, 2).replace(/\n/g, eol) + eol;

  console.log(`${install ? 'Installing' : 'Removing'} Deck's hooks in ${file}${exists ? '' : ' (a new file)'}`);
  if (JSON.stringify(next) === JSON.stringify(settings)) {
    console.log('Nothing to change.');
    return true;
  }
  console.log(diffLines(beforeText.replace(/\r\n/g, '\n'), afterText.replace(/\r\n/g, '\n')));
  if (dryRun) {
    console.log('Dry run: nothing was written.');
    return true;
  }
  if (exists) {
    const backup = `${file}.deck-backup-${stamp()}`;
    copyFileSync(file, backup);
    console.log(`Backed up the old file to ${backup}`);
  } else {
    mkdirSync(dirname(file), { recursive: true });
  }
  writeFileSync(file, afterText);
  console.log(install ? 'Installed. Start `pnpm agent` to receive them.' : 'Removed. Deck no longer receives hooks.');
  return true;
}
