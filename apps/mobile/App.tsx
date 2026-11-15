import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Deck } from './src/Deck';
import { Measure } from './src/Measure';
import { Materials } from './src/materials/Materials';
import { startLive } from './src/link/live';
import { startLiveActivity } from './src/liveActivity';

/**
 * Which screen to show. 'deck' is the app. 'measure' is the measuring screen from
 * handoff task T1, for measuring another phone. 'materials' is the key
 * material samples from T5, kept as a record (src/materials/README.md). The T8
 * link test screen is gone: since T15 the deck pairs and links itself.
 */
const SCREEN = 'deck' as 'deck' | 'measure' | 'materials';

export default function App() {
  // The screen stays awake while the deck is open. P-2 narrows this to "while connected"
  // once there is a connection to check.
  // `suppressDeactivateWarnings` makes the hook catch a release that fails because the lock
  // had not started yet (an unhandled rejection whenever React remounts, found 2026-11-14).
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });

  // The real Dynamic Island and Lock Screen, while Deck is not on screen (K-12).
  // Does nothing on the web or in a build without expo-widgets' native code.
  useEffect(() => (SCREEN === 'deck' ? startLiveActivity() : undefined), []);
  // The PC link: pairing, sessions and requests (handoff T15).
  useEffect(() => (SCREEN === 'deck' ? startLive() : undefined), []);

  return (
    <SafeAreaProvider>
      <StatusBar hidden />
      {SCREEN === 'measure' ? (
        <Measure />
      ) : SCREEN === 'materials' ? (
        <Materials />
      ) : (
        <Deck />
      )}
    </SafeAreaProvider>
  );
}
