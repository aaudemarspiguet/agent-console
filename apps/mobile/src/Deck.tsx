import { useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { KeyId } from '@deck/protocol';
import { COLUMNS, DEFAULT_KEYS, type KeyDef, ROWS } from './layout';

const GAP = 9;
/** Room kept at each end of the plate for the island and the effort wheel. */
const SIDE_MARGIN = 62;

interface DeckProps {
  onKeyPress: (id: KeyId) => void;
}

/**
 * The plate and its keys, with the island closed. The keys do nothing yet beyond
 * the press movement and haptic (K-4); the island and the effort wheel are not built.
 */
export function Deck({ onKeyPress }: DeckProps) {
  const insets = useSafeAreaInsets();
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
          paddingLeft: Math.max(insets.left, SIDE_MARGIN),
          paddingRight: Math.max(insets.right, SIDE_MARGIN),
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 21),
        },
      ]}
    >
      <View style={styles.pill} accessibilityLabel="Island, closed" />
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

interface KeyProps {
  def: KeyDef;
  left: number;
  top: number;
  width: number;
  height: number;
  onPress: (id: KeyId) => void;
}

function Key({ def, left, top, width, height, onPress }: KeyProps) {
  const isNumber = def.look === 'number';
  return (
    <View style={[styles.well, { left, top, width, height }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={def.spoken ?? def.legend}
        onPressIn={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        onPress={() => onPress(def.id)}
        style={({ pressed }) => [
          styles.key,
          def.look === 'primary' && styles.keyPrimary,
          isNumber ? styles.keyCentered : styles.keyLegendCorner,
          pressed && styles.keyDown,
        ]}
      >
        <Text style={isNumber ? styles.number : styles.legend} numberOfLines={2}>
          {def.legend}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    flex: 1,
    backgroundColor: '#232326',
  },
  pill: {
    position: 'absolute',
    left: 10,
    top: '50%',
    marginTop: -70,
    width: 38,
    height: 140,
    borderRadius: 19,
    backgroundColor: '#000000',
  },
  grid: {
    flex: 1,
  },
  well: {
    position: 'absolute',
    paddingHorizontal: 3,
    paddingTop: 3,
    paddingBottom: 6,
    borderRadius: 13,
    backgroundColor: '#040405',
  },
  key: {
    flex: 1,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: '#2C2C2E',
  },
  keyPrimary: {
    backgroundColor: '#0A84FF',
    borderColor: 'rgba(255,255,255,0.26)',
  },
  keyCentered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLegendCorner: {
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  keyDown: {
    transform: [{ translateY: 2 }],
    opacity: 0.85,
  },
  number: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  legend: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
});
