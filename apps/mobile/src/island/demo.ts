/**
 * TEMPORARY (handoff T13). Fake sessions and events matching the design boards,
 * so every island state can be reached on the phone before the island is wired
 * to the PC link (A-1 to A-3, Release 2). Remove with the switch in
 * `useIsland.ts` once real sessions arrive.
 */

export type AgentId = 'claudeCode' | 'codex' | 'cursor' | 'gemini';

/** A session's state (brief A-3). "Needs approval" comes from a waiting request. */
export type SessionState = 'running' | 'thinking' | 'finished' | 'error' | 'idle';

export interface Session {
  project: string;
  agent: AgentId;
  state: SessionState;
  /** Index into EFFORT_LEVELS. */
  effort: number;
  /** Tool calls, oldest first (A-14). */
  log: string[];
  /** A follow-up waiting for the end of the turn (V-4). */
  queued?: string;
}

export interface Request {
  id: number;
  /** The session's place: 1 to 6 are the number keys, higher numbers are on page 2. */
  session: number;
  tool: string;
  verb: string;
  body: string;
  /** What the demo "hears" when the user replies to this request. */
  reply: string;
}

export const AGENT_NAMES: Record<AgentId, string> = {
  claudeCode: 'Claude Code',
  codex: 'Codex',
  cursor: 'Cursor',
  gemini: 'Gemini',
};

/** The levels a demo session's model offers (E-1). */
export const EFFORT_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'];

export const PC_NAME = 'AMOGH-PC';

/** The sessions on the number keys, as on the boards (handoff T13, "The sessions"). */
export function demoSessions(): Record<number, Session | null> {
  return {
    1: {
      project: 'api-server',
      agent: 'claudeCode',
      state: 'running',
      effort: 2,
      log: ['Read: src/routes/users.ts', 'Edit: src/routes/users.ts', 'Bash: npm test', 'Write: migrations/004_users.sql'],
    },
    2: { project: 'web-app', agent: 'codex', state: 'finished', effort: 2, log: ['Edit: src/pages/Settings.tsx', 'Bash: gh pr create --draft'] },
    3: { project: 'docs-site', agent: 'cursor', state: 'idle', effort: 1, log: ['Read: docs/deploy.md'] },
    4: { project: 'infra', agent: 'gemini', state: 'thinking', effort: 2, log: ['Read: terraform/prod/main.tf'] },
    5: { project: 'mobile-app', agent: 'claudeCode', state: 'error', effort: 2, log: ['Bash: pnpm test', 'Edit: src/App.tsx'] },
    6: { project: 'data-jobs', agent: 'codex', state: 'running', effort: 2, log: ['Bash: python jobs/backfill.py --dry-run'] },
  };
}

/** The requests the demo sends, in turn. */
export const REQUESTS: Omit<Request, 'id'>[] = [
  {
    session: 1,
    tool: 'Bash',
    verb: 'Wants to run a command with Bash',
    body: 'npm run db:migrate -- --env production',
    reply: 'Use the staging database instead.',
  },
  {
    session: 6,
    tool: 'Bash',
    verb: 'Wants to run a command with Bash',
    body: 'python jobs/backfill.py --since 2026-01-01 --write',
    reply: 'Run it on one day first and show me the counts.',
  },
  {
    session: 4,
    tool: 'Edit',
    verb: 'Wants to edit a file',
    body: 'terraform/prod/main.tf\ninstance_type = "m6i.large"',
    reply: 'Leave prod alone. Make that change in staging.',
  },
];

/** What the demo "hears" for a follow-up to a working session. */
export const FOLLOW_UP = 'When the migration is done, run the tests and open a draft PR.';

/** The saved replies on the two saved-reply keys (R-1). Written on the PC in the real app. */
export const SAVED_REPLIES: Record<'reply1' | 'reply2', string> = {
  reply1: 'Run the tests and fix any failures.',
  reply2: 'Explain what you are about to do and why, then wait.',
};

/**
 * The session whose effort change the demo PC cannot confirm, so the "Not
 * changed" result (E-5, E-7) can be seen: mobile-app, as if its prompt box held
 * a stashed draft.
 */
export const EFFORT_FAILS_ON = 5;

/** A session the "started" event adds (on page 2 when every key is taken). */
export const NEW_SESSION: Session = {
  project: 'search-api',
  agent: 'claudeCode',
  state: 'running',
  effort: 2,
  log: ['Read: src/index.ts'],
};
