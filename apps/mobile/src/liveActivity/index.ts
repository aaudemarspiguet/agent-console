import { AppState, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { island, type IslandState } from '../island/store';
import type { DeckActivityProps } from './DeckActivity';

/**
 * Runs the deck's Live Activity (brief K-12) from the island's state.
 *
 * - **Only on iOS, and only in a build that has expo-widgets' native code.**
 *   The development build installed before 2026-11-14 does not, and loading
 *   `expo-widgets` there throws, so this checks first and does nothing.
 * - **While Deck is open** it keeps the activity current. iOS hides it in the
 *   island meanwhile (HIG), so the person sees it only after leaving Deck.
 * - **Once Deck is suspended** nothing can update it from the phone (brief,
 *   "Stay connected in the background"). Each update therefore carries a stale
 *   date a little ahead; when Deck stops refreshing, iOS marks the activity stale
 *   and the layout shows "Open Deck to see the latest" instead of old numbers.
 *   Keeping it live in the background needs pushes from the PC agent (open).
 * - **Allow and Deny** in the expanded island run through Apple's
 *   LiveActivityIntent, which iOS runs in Deck's own process, and reach
 *   `answerFromLiveActivity`. Not yet tried on the phone.
 */

/** How long an update stays trustworthy, and how often it is refreshed while Deck is open. */
const STALE_AFTER_MS = 45_000;
const HEARTBEAT_MS = 20_000;

function propsFrom(s: IslandState): DeckActivityProps {
  const sessions = Object.values(s.sessions).filter(Boolean);
  const req = s.queue[0];
  return {
    sessions: sessions.length,
    working: sessions.some((x) => x!.state === 'running' || x!.state === 'thinking'),
    requests: s.queue.length,
    project: req ? (s.sessions[req.session]?.project ?? undefined) : undefined,
    verb: req?.verb,
    requestId: req?.id,
    command: req?.body,
    keys: [1, 2, 3, 4, 5, 6].map((n) => {
      const session = s.sessions[n];
      if (!session) return 'none';
      return island.pendingFor(n) ? 'approval' : session.state;
    }),
  };
}

/** After a failed start (Live Activities off in Settings, for example), wait this long before trying again. */
const RETRY_AFTER_MS = 60_000;

/** The running controller's stop function, so a second start replaces it instead of fighting it. */
let stopCurrent: (() => void) | null = null;

/**
 * Starts the controller and returns a function that stops it. Calling it again
 * stops the previous controller first: two controllers each ended the other's
 * activity on start and then failed to update their own, which is how "Can't
 * find live activity" reached the phone (mean review, 2026-11-14).
 */
export function startLiveActivity(): () => void {
  stopCurrent?.();
  stopCurrent = null;
  if (Platform.OS !== 'ios' || !requireOptionalNativeModule('ExpoWidgets')) return () => {};

  let modules: { widgets: typeof import('expo-widgets'); DeckActivity: typeof import('./DeckActivity').default };
  try {
    // Loaded only now, so a build without the native module never evaluates it.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const widgets = require('expo-widgets') as typeof import('expo-widgets');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DeckActivity = (require('./DeckActivity') as typeof import('./DeckActivity')).default;
    modules = { widgets, DeckActivity };
  } catch (error) {
    console.log('live activity unavailable:', String(error));
    return () => {};
  }
  const { widgets, DeckActivity } = modules;

  const staleDate = () => new Date(Date.now() + STALE_AFTER_MS);
  let last = '';
  let activity: ReturnType<typeof DeckActivity.start> | null = null;
  let retryAt = 0;
  let stopped = false;

  const refresh = (force: boolean) => {
    if (stopped) return;
    const props = propsFrom(island.s);
    const key = JSON.stringify(props);
    if (!force && key === last && activity) return;
    try {
      if (!activity) {
        // A Live Activity has to be started while the app is in the foreground.
        if (AppState.currentState !== 'active' || Date.now() < retryAt) return;
        for (const old of DeckActivity.getInstances()) old.end('immediate').catch(() => {});
        activity = DeckActivity.start(props, undefined, staleDate());
        last = key;
      } else {
        const current = activity;
        last = key;
        // iOS may have ended it: the person swiped it away, the 8-hour limit,
        // or a reload ended it. Then start a new one on the next refresh while
        // Deck is in the foreground (an unhandled rejection here, 2026-11-14).
        current.update(props, staleDate()).catch((error: unknown) => {
          console.log('live activity ended, starting a new one:', String(error));
          if (activity === current) {
            activity = null;
            last = '';
          }
        });
      }
    } catch (error) {
      // Live Activities turned off in Settings, or too many running: try again later, not on every change.
      console.log('live activity:', String(error));
      activity = null;
      retryAt = Date.now() + RETRY_AFTER_MS;
    }
  };

  let timer: ReturnType<typeof setInterval> | undefined;
  const heartbeat = (active: boolean) => {
    clearInterval(timer);
    timer = undefined;
    if (active) {
      refresh(true);
      timer = setInterval(() => refresh(true), HEARTBEAT_MS);
    }
  };

  const unsubscribe = island.subscribe(() => refresh(false));
  const appState = AppState.addEventListener('change', (state) => heartbeat(state === 'active'));
  let interactions: { remove: () => void } | null = null;
  try {
    interactions = widgets.addUserInteractionListener((event) => {
      if (event.source !== 'DeckActivity') return;
      // The button names the request it was drawn for, so a press never answers a different one.
      const [kind, id] = event.target.split(':');
      if ((kind === 'allow' || kind === 'deny') && id) island.answerFromLiveActivity(kind, Number(id));
    });
  } catch (error) {
    console.log('live activity buttons unavailable:', String(error));
  }
  heartbeat(AppState.currentState === 'active');

  const stop = () => {
    stopped = true;
    clearInterval(timer);
    unsubscribe();
    appState.remove();
    interactions?.remove();
    if (stopCurrent === stop) stopCurrent = null;
  };
  stopCurrent = stop;
  return stop;
}
