/** Raised whenever a message changes shape. The two sides refuse to talk if it differs. */
export const PROTOCOL_VERSION = 1;

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

export type AgentMessage =
  /** Sent once the link is up: everything still waiting, so a reconnecting phone catches up. */
  | { t: 'ready'; pcName: string; waiting: PermissionRequest[] }
  | { t: 'request'; request: PermissionRequest }
  /** A request ended without the phone: answered in the terminal, or the wait ran out. */
  | { t: 'resolved'; id: string; how: 'answered' | 'gone' | 'timeout' }
  /** A queued follow-up was handed to a session by its Stop hook (G0-3). */
  | { t: 'followupSent'; sessionId: string }
  | { t: 'pong' };

export type PhoneMessage =
  | { t: 'answer'; id: string; decision: 'allow' | 'deny'; message?: string; interrupt?: boolean }
  /** Queues text for a session, handed over when its turn ends (Stop hook). */
  | { t: 'followup'; sessionId: string; text: string }
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
