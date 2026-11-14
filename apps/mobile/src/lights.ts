import type { KeyId } from '@deck/protocol';

/**
 * What the plate's lights show. Outside the island only lights change (K-3), so
 * this is everything the deck draws differently from one moment to the next.
 */

/** A number key's light: the session's state (A-3). Idle is no light. */
export type SessionLight = 'thinking' | 'running' | 'approval' | 'finished' | 'error';

export interface PlateLights {
  linked: boolean;
  requestWaiting: boolean;
  /** Number keys with a light on. A key not listed is unlit. */
  sessions: Partial<Record<KeyId, SessionLight>>;
  /** Keys that do nothing right now, drawn unlit (K-3). */
  unlit: KeyId[];
}

/**
 * Each state's colour (brief A-3, Apple's system colours) and how strong its
 * glow is. White, amber and green are the mockups' strengths; white is drawn
 * weaker because it is the brightest. Blue and red are set by eye to sit
 * between them; not yet checked on the phone.
 */
export const LIGHT_COLOURS: Record<SessionLight, { rgb: string; glow: number }> = {
  thinking: { rgb: '100,210,255', glow: 0.6 },
  running: { rgb: '255,255,255', glow: 0.32 },
  approval: { rgb: '255,159,10', glow: 0.8 },
  finished: { rgb: '48,209,88', glow: 0.8 },
  error: { rgb: '255,69,58', glow: 0.8 },
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
 * 'off' is the real state today, 'atRest' copies board "1 · At rest" (1 and 6
 * running, 2 finished, 4 thinking, 5 error, 3 idle), and
 * 'request' copies board "3 · No press" (a request waiting on session 1), and
 * 'states' shows all six states on keys 1 to 6: thinking, running, needs
 * approval, finished, error, idle.
 */
export const DEMO_LIGHTS = 'atRest' as 'off' | 'atRest' | 'request' | 'states';

const DEMOS: Record<typeof DEMO_LIGHTS, PlateLights> = {
  off: NOTHING_CONNECTED,
  atRest: {
    linked: true,
    requestWaiting: false,
    sessions: { session1: 'running', session2: 'finished', session4: 'thinking', session5: 'error', session6: 'running' },
    unlit: ['deny', 'allow', 'alwaysAllow', 'cancel', 'send'],
  },
  request: {
    linked: true,
    requestWaiting: true,
    sessions: { session1: 'approval', session2: 'finished', session4: 'thinking', session5: 'error', session6: 'running' },
    unlit: ['cancel', 'send'],
  },
  states: {
    linked: true,
    requestWaiting: true,
    sessions: { session1: 'thinking', session2: 'running', session3: 'approval', session4: 'finished', session5: 'error' },
    unlit: ['cancel', 'send'],
  },
};

export const SHOWN_LIGHTS = DEMOS[DEMO_LIGHTS];
