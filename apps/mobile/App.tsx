import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PROTOCOL_VERSION } from '@deck/protocol';
import { Deck } from './src/Deck';
import { Measure } from './src/Measure';

/** True shows the measuring screen from handoff task T1 instead of the deck, to measure another phone. */
const MEASURE = false;

export default function App() {
  // The screen stays awake while the deck is open. P-2 narrows this to "while connected"
  // once there is a connection to check.
  useKeepAwake();

  return (
    <SafeAreaProvider>
      <StatusBar hidden />
      {MEASURE ? (
        <Measure />
      ) : (
        <Deck
          onKeyPress={(id) => {
            // Nothing is connected yet, so a press is only logged.
            console.log(`key ${id} (protocol ${PROTOCOL_VERSION})`);
          }}
        />
      )}
    </SafeAreaProvider>
  );
}
