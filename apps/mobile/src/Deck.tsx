import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { KeyId } from '@deck/protocol';
import { Key } from './Key';
import { COLUMNS, DEFAULT_KEYS, ROWS } from './layout';
import { EffortWheel, ISLAND_PILL_WIDTH, IslandPill, StatusStrip } from './PlateParts';
import { useCameraSide } from './useCameraSide';

const GAP = 9;
/** Room kept at each end of the plate: one end for the island, the other for the effort wheel. */
const END_MARGIN = 62;
/** Distance of the effort wheel from the screen edge. */
const WHEEL_INSET = 11;
/** Where the island pill sits on a phone with no camera cutout to wrap. */
const ISLAND_FALLBACK_INSET = 8;

/**
 * Distance of the island pill from the camera edge. iOS does not report where the
 * cutout is, but it sits near the middle of the safe-area inset on that edge
 * (about 1 point further in), so the pill is centred there to wrap it.
 */
function islandInset(cameraEdgeInset: number): number {
  if (cameraEdgeInset < ISLAND_PILL_WIDTH) return ISLAND_FALLBACK_INSET;
  return cameraEdgeInset / 2 + 1 - ISLAND_PILL_WIDTH / 2;
}

interface DeckProps {
  onKeyPress: (id: KeyId) => void;
}

/**
 * The plate with the island closed: status strip, key grid, island pill and
 * effort wheel. Nothing is connected yet, so the Link light is off and a key
 * press only gives the press movement and haptic (K-4).
 */
export function Deck({ onKeyPress }: DeckProps) {
  const insets = useSafeAreaInsets();
  const cameraSide = useCameraSide();
  const wheelSide = cameraSide === 'left' ? 'right' : 'left';
  const [grid, setGrid] = useState({ width: 0, height: 0 });

  const onGridLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setGrid({ width, height });
  };

  const cellWidth = (grid.width - GAP * (COLUMNS - 1)) / COLUMNS;
  const cellHeight = (grid.height - GAP * (ROWS - 1)) / ROWS;

  return (
    <View
      style={[
        styles.plate,
        {
          paddingLeft: Math.max(insets.left, END_MARGIN),
          paddingRight: Math.max(insets.right, END_MARGIN),
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 21),
        },
      ]}
    >
      <View style={[styles.edge, { [cameraSide]: islandInset(insets[cameraSide]) }]} pointerEvents="none">
        <IslandPill />
      </View>
      <View style={[styles.edge, { [wheelSide]: WHEEL_INSET }]}>
        <EffortWheel />
      </View>

      <StatusStrip linked={false} requestWaiting={false} />
      <View style={styles.grid} onLayout={onGridLayout}>
        {grid.width > 0 &&
          DEFAULT_KEYS.map((key) => (
            <Key
              key={key.id}
              def={key}
              left={key.column * (cellWidth + GAP)}
              top={key.row * (cellHeight + GAP)}
              width={cellWidth * (key.wide ?? 1) + GAP * ((key.wide ?? 1) - 1)}
              height={cellHeight * (key.high ?? 1) + GAP * ((key.high ?? 1) - 1)}
              onPress={onKeyPress}
            />
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    flex: 1,
    gap: GAP,
    backgroundColor: '#232326',
    backgroundImage: 'linear-gradient(180deg, #2C2C30, #19191B)',
  },
  /** Holds the island or the wheel against one screen edge, centred top to bottom. */
  edge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  grid: {
    flex: 1,
  },
});
