import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { KeyId } from '@deck/protocol';
import type { KeyDef } from './layout';

interface KeyProps {
  def: KeyDef;
  left: number;
  top: number;
  width: number;
  height: number;
  onPress: (id: KeyId) => void;
}

/**
 * One key: a cap sitting in a recessed well. The cap moves down and the phone
 * gives a haptic on press (K-4). Values match the design boards' key styles.
 */
export function Key({ def, left, top, width, height, onPress }: KeyProps) {
  const isNumber = def.look === 'number';
  const look = lookStyles[def.look];

  return (
    <View style={[styles.well, { left, top, width, height }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={def.spoken ?? def.legend}
        onPressIn={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        onPress={() => onPress(def.id)}
        style={({ pressed }) => [styles.cap, pressed ? look.down : look.up, pressed && styles.capDown]}
      >
        {isNumber ? (
          <>
            {/* Status light for the session. Unlit until sessions are connected. */}
            <View style={styles.dot} />
            <Text style={styles.number}>{def.legend}</Text>
          </>
        ) : (
          <Text
            style={[styles.legend, def.legendSide === 'right' ? styles.legendRight : styles.legendLeft]}
            numberOfLines={2}
          >
            {def.legend}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    position: 'absolute',
    paddingHorizontal: 3,
    paddingTop: 3,
    paddingBottom: 6,
    borderRadius: 13,
    backgroundColor: '#040405',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.95), 0 1px 0 rgba(255,255,255,0.10)',
  },
  cap: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capDown: {
    transform: [{ translateY: 2 }],
  },
  dot: {
    position: 'absolute',
    top: 10,
    left: 11,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#48484A',
  },
  number: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  legend: {
    position: 'absolute',
    bottom: 9,
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: -0.08,
  },
  legendLeft: {
    left: 11,
    textAlign: 'left',
  },
  legendRight: {
    right: 11,
    textAlign: 'right',
  },
});

/** Cap finish for each look, at rest and pressed. */
const lookStyles = {
  number: StyleSheet.create({
    up: {
      borderColor: 'rgba(255,255,255,0.15)',
      backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
      boxShadow:
        'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -5px 9px rgba(0,0,0,0.2), 0 3px 0 #1A1A1D, 0 5px 8px rgba(0,0,0,0.6)',
    },
    down: {
      borderColor: 'rgba(255,255,255,0.15)',
      backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
      boxShadow:
        'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -3px 6px rgba(0,0,0,0.3), 0 1px 0 #1A1A1D, 0 1px 3px rgba(0,0,0,0.6)',
    },
  }),
  action: StyleSheet.create({
    up: {
      borderColor: 'rgba(255,255,255,0.1)',
      backgroundImage: 'linear-gradient(180deg, #343437, #252527)',
      boxShadow:
        'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -5px 9px rgba(0,0,0,0.25), 0 3px 0 #111113, 0 5px 8px rgba(0,0,0,0.6)',
    },
    down: {
      borderColor: 'rgba(255,255,255,0.1)',
      backgroundImage: 'linear-gradient(180deg, #343437, #252527)',
      boxShadow:
        'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -3px 6px rgba(0,0,0,0.3), 0 1px 0 #111113, 0 1px 3px rgba(0,0,0,0.6)',
    },
  }),
  primary: StyleSheet.create({
    up: {
      borderColor: 'rgba(255,255,255,0.26)',
      backgroundImage: 'linear-gradient(180deg, #3493FF, #0A84FF)',
      boxShadow:
        'inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -5px 9px rgba(0,40,110,0.28), 0 3px 0 #0A4FA3, 0 5px 8px rgba(0,0,0,0.6)',
    },
    down: {
      borderColor: 'rgba(255,255,255,0.26)',
      backgroundImage: 'linear-gradient(180deg, #3493FF, #0A84FF)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 0 #0A4FA3, 0 1px 3px rgba(0,0,0,0.6)',
    },
  }),
};
