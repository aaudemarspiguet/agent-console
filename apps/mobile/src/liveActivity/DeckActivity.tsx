import { Button, HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { buttonStyle, font, foregroundStyle, lineLimit, padding, tint } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

/**
 * The deck's Live Activity (brief K-12): what iOS shows in the real Dynamic
 * Island and on the Lock Screen while Deck is not on screen. iOS hides an app's
 * own Live Activity while that app is open (HIG, Live Activities), so this never
 * competes with the island the app draws itself.
 *
 * The layout below is turned into a string by the `'widget'` directive and runs
 * in expo-widgets' own runtime, where only `@expo/ui` SwiftUI components and
 * modifiers exist: no hooks, no imports of the app's code, no module-level
 * values. Colours are written out inside the function for that reason.
 */
export interface DeckActivityProps {
  /** Sessions on the PC. */
  sessions: number;
  /** Any session running or thinking. */
  working: boolean;
  /** Requests waiting (A-4). */
  requests: number;
  /** The oldest request, shown in the expanded island and on the Lock Screen. */
  project?: string;
  /** The oldest request's id; the buttons carry it, so a press answers the request it was drawn for. */
  requestId?: number;
  verb?: string;
  command?: string;
  /**
   * Each number key's state, keys 1 to 6 (A-3): 'thinking', 'running',
   * 'approval', 'finished', 'error', 'idle', or 'none' for a key with no session.
   */
  keys: string[];
}

const DeckActivity = (props: DeckActivityProps, environment: LiveActivityEnvironment) => {
  'widget';
  const amber = '#FF9F0A';
  const green = '#30D158';
  const grey = '#8E8E93';
  const waiting = props.requests > 0;
  const stale = environment.isStale === true;
  const glyph = waiting ? 'exclamationmark.circle.fill' : props.working ? 'circle.dashed' : 'checkmark.circle.fill';
  const glyphColour = stale ? grey : waiting ? amber : props.working ? '#FFFFFF' : green;
  const count = waiting ? props.requests : props.sessions;
  // The six number keys as dots in their state's colour (A-3), a quick look at
  // every session without opening Deck (the user, 2026-11-14). A tap opens Deck.
  const dotColour = (state: string) =>
    stale
      ? grey
      : state === 'thinking'
        ? '#64D2FF'
        : state === 'running'
          ? '#FFFFFF'
          : state === 'approval'
            ? amber
            : state === 'finished'
              ? green
              : state === 'error'
                ? '#FF453A'
                : '#48484A';
  const dotSymbol = (state: string) => (state === 'none' ? 'circle.dashed' : state === 'idle' ? 'circle' : 'circle.fill');
  const dots = (size: number) => (
    <HStack spacing={size}>
      {props.keys.map((state, i) => (
        <VStack key={`${i}`} spacing={3}>
          <Image systemName={dotSymbol(state)} color={dotColour(state)} size={size} />
          <Text modifiers={[font({ size: 11 }), foregroundStyle(grey)]}>{`${i + 1}`}</Text>
        </VStack>
      ))}
    </HStack>
  );
  const summary = stale
    ? 'Open Deck to see the latest.'
    : waiting
      ? `${props.project ?? 'A session'} needs approval`
      : `${props.sessions} sessions, ${props.working ? 'working' : 'all quiet'}`;

  return {
    banner: (
      <VStack alignment="leading" spacing={6} modifiers={[padding({ all: 14 })]}>
        <HStack spacing={8}>
          <Image systemName={glyph} color={glyphColour} size={18} />
          <Text modifiers={[font({ weight: 'semibold', size: 15 }), foregroundStyle('#FFFFFF')]}>{summary}</Text>
        </HStack>
        {dots(14)}
        {waiting && !stale && props.command ? (
          <Text modifiers={[font({ design: 'monospaced', size: 13 }), foregroundStyle('#EBEBF5'), lineLimit(2)]}>
            {props.command}
          </Text>
        ) : null}
      </VStack>
    ),
    compactLeading: <Image systemName={glyph} color={glyphColour} size={16} />,
    compactTrailing: (
      <Text modifiers={[font({ weight: 'semibold', size: 15 }), foregroundStyle(waiting && !stale ? amber : '#FFFFFF')]}>
        {`${count}`}
      </Text>
    ),
    minimal: <Image systemName={glyph} color={glyphColour} size={16} />,
    // The expanded corners curve away, so both corner slots are inset from the
    // edge; without it the count was clipped on the phone (2026-11-14). The HIG
    // says not to draw content all the way to the edge of the Dynamic Island.
    expandedLeading: (
      <Image systemName={glyph} color={glyphColour} size={22} modifiers={[padding({ leading: 10, top: 8 })]} />
    ),
    expandedTrailing: (
      <Text
        modifiers={[
          font({ weight: 'semibold', size: 17 }),
          foregroundStyle(waiting && !stale ? amber : '#FFFFFF'),
          padding({ trailing: 12, top: 8 }),
        ]}
      >
        {`${count}`}
      </Text>
    ),
    expandedCenter: (
      <Text modifiers={[font({ weight: 'semibold', size: 15 }), foregroundStyle('#FFFFFF'), lineLimit(1)]}>{summary}</Text>
    ),
    expandedBottom:
      waiting && !stale ? (
        <VStack alignment="leading" spacing={8}>
          {dots(14)}
          <Text modifiers={[font({ design: 'monospaced', size: 13 }), foregroundStyle('#FFFFFF'), lineLimit(1)]}>
            {props.command ?? ''}
          </Text>
          <HStack spacing={10}>
            <Button label="Deny" systemImage="xmark" target={`deny:${props.requestId}`} modifiers={[buttonStyle('bordered'), tint('#FF453A')]} />
            <Spacer />
            <Button label="Allow" systemImage="checkmark" target={`allow:${props.requestId}`} modifiers={[buttonStyle('borderedProminent'), tint('#0A84FF')]} />
          </HStack>
        </VStack>
      ) : (
        <VStack spacing={8}>
          {dots(18)}
          <Text modifiers={[font({ size: 12 }), foregroundStyle(grey)]}>
            {stale ? 'Deck is not running, so this may be out of date. Tap to open it.' : 'Tap to open Deck.'}
          </Text>
        </VStack>
      ),
  };
};

export default createLiveActivity<DeckActivityProps>('DeckActivity', DeckActivity);
