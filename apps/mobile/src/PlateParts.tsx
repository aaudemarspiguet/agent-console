import { type StyleProp, StyleSheet, Text, type TextStyle, View } from 'react-native';

/** A small indicator light on the plate. Only lights change outside the island (K-3). */
export function Led({ color, label }: { color?: string; label: string }) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[
        styles.led,
        color
          ? { backgroundColor: color, boxShadow: `0 0 8px ${color}, inset 0 1px 1px rgba(255,255,255,0.6)` }
          : styles.ledOff,
      ]}
    />
  );
}

function Screw() {
  return (
    <View style={styles.screw}>
      <View style={styles.screwSlot} />
    </View>
  );
}

/** Fixed marking printed on the plate. */
export function Silk({ children, style }: { children: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[styles.silk, style]} numberOfLines={1}>
      {children}
    </Text>
  );
}

/** The row above the keys: the Link light and the Request light. */
export function StatusStrip({ linked, requestWaiting }: { linked: boolean; requestWaiting: boolean }) {
  return (
    <View style={styles.strip}>
      <Screw />
      <Silk>Link</Silk>
      <Led color={linked ? '#30D158' : undefined} label={linked ? 'Connected to the PC' : 'Not connected'} />
      <View style={styles.grow} />
      <Silk>Request</Silk>
      <Led color={requestWaiting ? '#FF9F0A' : undefined} label={requestWaiting ? 'A request is waiting' : 'No request'} />
      <Screw />
    </View>
  );
}

/**
 * Size of the closed island: the iPhone 17's cutout as measured in landscape
 * (docs/HANDOFF.md, T1), so the pill and the cutout show as one shape with no
 * black margin round it.
 */
export const ISLAND_PILL_WIDTH = 37;

const ISLAND_PILL_LENGTH = 125;

/** The island when closed: a black pill around the camera cutout (K-7). */
export function IslandPill() {
  return <View style={styles.pill} accessibilityLabel="Island, closed" />;
}

const styles = StyleSheet.create({
  strip: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  grow: {
    flex: 1,
  },
  silk: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  led: {
    width: 8,
    height: 8,
    borderRadius: 4,
    outlineWidth: 2,
    outlineColor: '#050506',
  },
  ledOff: {
    backgroundColor: '#3A3A3C',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.7)',
  },
  screw: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundImage: 'linear-gradient(160deg, #6A6A70, #2A2A2D 70%)',
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screwSlot: {
    width: 8,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    transform: [{ rotate: '35deg' }],
  },
  pill: {
    width: ISLAND_PILL_WIDTH,
    height: ISLAND_PILL_LENGTH,
    borderRadius: ISLAND_PILL_WIDTH / 2,
    backgroundColor: '#000000',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.035)',
  },
});
