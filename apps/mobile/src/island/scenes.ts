import { Platform } from 'react-native';
import { REQUESTS } from './demo';
import { island, type IslandState } from './store';

/**
 * For comparing with the boards (handoff T13), web only: `?scene=Island3` puts
 * the island straight into that board's state, with the iPhone 17's insets and
 * the camera on the left as the boards draw it, and motion off so it lands at
 * once. `design/mockups/make-compare.ps1` opens the app this way beside each
 * board. It does nothing on the phone.
 */

const scene = Platform.OS === 'web' && typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('scene') : null;

/** The phone's figures from handoff T1, used in place of the web's zero insets. */
export const SCENE_VIEW = scene ? { side: 'left' as const, insets: { top: 0, right: 62, bottom: 20, left: 62 } } : null;

const request = () => ({ ...REQUESTS[0], id: 1 });
const reply = { kind: 'reply' as const, requestId: 1, session: 1 };

const SCENES: Record<string, (s: IslandState) => void> = {
  Island1: () => {},
  Island2: (s) => {
    s.open = true;
    s.view = 'list';
  },
  Island3: (s) => {
    s.queue = [request()];
    s.open = true;
    s.view = 'request';
    s.armed = true;
  },
  Island4: (s) => {
    s.open = true;
    s.view = 'result';
    s.card = { tone: 'green', glyph: 'check', title: 'Allowed', sub: 'api-server is running it now' };
  },
  Island5: (s) => {
    s.queue = [request()];
    s.talk = { target: reply, words: ['Use', 'the', 'staging', 'data'], heard: 4, startedAt: Date.now() };
    s.open = true;
    s.view = 'listening';
  },
  Island6: (s) => {
    s.queue = [request()];
    s.transcript = { target: reply, text: 'Use the staging database instead.', saved: false };
    s.open = true;
    s.view = 'transcript';
  },
  Island7: (s) => {
    s.sessions[1]!.state = 'finished';
    s.open = true;
    s.view = 'result';
    s.card = { tone: 'green', glyph: 'check', title: 'api-server finished', sub: 'Its turn has ended.' };
  },
  Island8: (s) => {
    s.selected = 1;
    s.open = true;
    s.view = 'session';
  },
  Island9: (s) => {
    s.queue = [request()];
  },
  Effort1: (s) => {
    s.selected = 1;
    s.effort = { session: 1, from: 2, to: 3 };
    s.open = true;
    s.view = 'effort';
  },
  Effort2: (s) => {
    s.selected = 1;
    s.open = true;
    s.view = 'result';
    s.card = { tone: 'green', glyph: 'check', title: 'Effort: xhigh', sub: 'api-server, from its next message' };
  },
  Effort3: (s) => {
    s.selected = 1;
    s.open = true;
    s.view = 'result';
    s.card = { tone: 'amber', glyph: 'bang', title: 'Not changed', sub: 'api-server is still on high' };
  },
  Reply1: (s) => {
    s.selected = 1;
    s.transcript = { target: { kind: 'follow', session: 1 }, text: 'Run the tests and fix any failures.', saved: true };
    s.open = true;
    s.view = 'transcript';
  },
  Reply2: (s) => {
    s.selected = 1;
    s.open = true;
    s.view = 'result';
    s.card = { tone: 'green', glyph: 'check', title: 'Follow-up queued', sub: 'api-server gets it when its turn ends' };
  },
};

if (scene && SCENES[scene]) SCENES[scene](island.s);
