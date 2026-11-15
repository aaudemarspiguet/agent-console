/** Raised whenever a message changes shape. The two sides refuse to talk if it differs. */
export const PROTOCOL_VERSION = 3;

/** Every key the deck can carry. A key does one action and its id never changes (K-2). */
export type KeyId =
  | 'session1'
  | 'session2'
  | 'session3'
  | 'session4'
  | 'session5'
  | 'session6'
  | 'deny'
  | 'allow'
  | 'alwaysAllow'
  | 'redirect'
  | 'cancel'
  | 'send'
  | 'reply1'
  | 'reply2';

/**
 * What the PC agent's QR code holds (C-1). The secret is the key established at
 * pairing (C-2): it only ever travels through the QR code, never over the network.
 */
export interface Pairing {
  v: number;
  /** The PC's IPv4 addresses on this network; the phone tries each in turn. */
  hosts: string[];
  port: number;
  /** Names this PC, so a phone can hold several pairings later. */
  pcId: string;
  /** 32 random bytes, base64. */
  secret: string;
}

/** A permission request from one agent session, as the island shows it. */
export interface PermissionRequest {
  id: string;
  /** The agent's own session id. */
  sessionId: string;
  /** The session's project folder (A-2 labels a row with it). */
  cwd: string;
  tool: string;
  /** One line to show: the command, the file, or the tool's input as JSON. */
  summary: string;
  /** Milliseconds since 1970 on the PC. */
  at: number;
}

/** A session's state (brief A-3). "Needs approval" is shown while one of its requests waits. */
export type SessionState = 'thinking' | 'running' | 'needsApproval' | 'finished' | 'error' | 'idle';

/** One agent session on the PC, as the session list shows it (A-2, A-3, A-14). */
export interface SessionInfo {
  /** The agent's own session id. */
  id: string;
  agent: 'claudeCode';
  /** Its place on the deck: 1 to 6 are the number keys, 7 and up are on page 2. Kept while it lives. */
  key: number;
  /** The project folder's name (A-2). */
  project: string;
  cwd: string;
  state: SessionState;
  /** The effort level the hooks last reported (E-2), for example "high"; null until one says. */
  effort: string | null;
  /** The last three tool calls, oldest first, as "Tool: target" (A-14). */
  tools: string[];
  /** Milliseconds since 1970 on the PC: the last hook from this session. */
  lastSeen: number;
}

/** The two saved replies, written on the PC (R-1). */
export interface SavedReplies {
  reply1: string;
  reply2: string;
}

/** A follow-up the PC holds for a session until its turn ends (V-4). */
export interface QueuedFollowup {
  sessionId: string;
  text: string;
}

export type AgentMessage =
  /** Sent once the link is up: every session, everything still waiting and queued, so a reconnecting phone catches up. */
  | {
      t: 'ready';
      pcName: string;
      sessions: SessionInfo[];
      waiting: PermissionRequest[];
      followups: QueuedFollowup[];
      replies: SavedReplies;
    }
  /** The saved replies changed on the PC (R-1: a change reaches the phone at once). */
  | { t: 'replies'; replies: SavedReplies }
  /** A session appeared or changed; replaces what the phone held for that id. */
  | { t: 'session'; session: SessionInfo }
  /** A session ended (SessionEnd) or its process is gone. Its key is free again. */
  | { t: 'sessionGone'; id: string }
  | { t: 'request'; request: PermissionRequest }
  /** A request ended without the phone: answered in the terminal, or the wait ran out. */
  | { t: 'resolved'; id: string; how: 'answered' | 'gone' | 'timeout' }
  /** A queued follow-up was handed to a session by its Stop hook (G0-3). */
  | { t: 'followupSent'; sessionId: string }
  | { t: 'pong' };

export type PhoneMessage =
  /** `always` with allow is Always Allow: the rule is added for this session only (A-4). */
  | { t: 'answer'; id: string; decision: 'allow' | 'deny'; always?: boolean; message?: string; interrupt?: boolean }
  /** Queues text for a session, handed over when its turn ends (Stop hook). */
  | { t: 'followup'; sessionId: string; text: string }
  /** Removes the follow-up queued for a session (V-4, Cancel). */
  | { t: 'cancelFollowup'; sessionId: string }
  /** The phone opened this session's view: a finished session becomes idle (A-3). */
  | { t: 'seen'; sessionId: string }
  | { t: 'ping' };

/** The two unencrypted frames that open a connection; everything after is sealed. */
export interface HelloFromPhone {
  t: 'hello';
  v: number;
  pcId: string;
  phoneId: string;
  /** 32 random bytes, base64. */
  nonce: string;
}
export interface HelloFromAgent {
  t: 'hello';
  v: number;
  /** 32 random bytes, base64. */
  nonce: string;
}
