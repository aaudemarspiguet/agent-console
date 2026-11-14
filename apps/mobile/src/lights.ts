import type { KeyId } from '@deck/protocol';

/**
 * What the plate's lights show. Outside the island only lights change (K-3), so
 * this is everything the deck draws differently from one moment to the next.
 */

/** A number key's light: a session working, finished, or waiting for approval (A-3, A-8). */
export type SessionLight = 'working' | 'finished' | 'approval';

export interface PlateLights {
  linked: boolean;
  requestWaiting: boolean;
  /** Number keys with a light on. A key not listed is unlit. */
  sessions: Partial<Record<KeyId, SessionLight>>;
  /** Keys that do nothing right now, drawn unlit (K-3). */
  unlit: KeyId[];
}

/** Light colours as the mockups draw them, and how strong each glow is. */
export const LIGHT_COLOURS: Record<SessionLight, { rgb: string; glow: number }> = {
  working: { rgb: '255,255,255', glow: 0.32 },
  finished: { rgb: '48,209,88', glow: 0.8 },
  approval: { rgb: '255,159,10', glow: 0.8 },
};

/** Nothing connected: every light off, and the keys that need a request or a session do nothing. */
export const NOTHING_CONNECTED: PlateLights = {
  linked: false,
  requestWaiting: false,
  sessions: {},
  unlit: ['deny', 'allow', 'alwaysAllow', 'cancel', 'send'],
};

/**
 * TEMPORARY (handoff task T6). Which lights to show while nothing is connected,
 * so the lit states can be seen and compared with the mockups:
 * 'off' is the real state today, 'atRest' copies board "1 · At rest", and
 * 'request' copies board "3 · No press" (a request waiting on session 1).
 */
export const DEMO_LIGHTS = 'atRest' as 'off' | 'atRest' | 'request';

const DEMOS: Record<typeof DEMO_LIGHTS, PlateLights> = {
  off: NOTHING_CONNECTED,
  atRest: {
    linked: true,
    requestWaiting: false,
    sessions: { session1: 'working', session2: 'finished', session4: 'working', session6: 'working' },
    unlit: ['deny', 'allow', 'alwaysAllow', 'cancel', 'send'],
  },
  request: {
    linked: true,
    requestWaiting: true,
    sessions: { session1: 'approval', session2: 'finished', session4: 'working', session6: 'working' },
    unlit: ['cancel', 'send'],
  },
};

export const SHOWN_LIGHTS = DEMOS[DEMO_LIGHTS];
