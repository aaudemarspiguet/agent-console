// Shared between the phone app and the PC agent, so both sides agree on what
// travels over the local network. The message shapes are added by the Gate 0
// spike (product-brief.md, G0-1 and G0-2); until then only the version lives here.

/** Raised whenever a message changes shape. The two sides refuse to talk if it differs. */
export const PROTOCOL_VERSION = 0;

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
