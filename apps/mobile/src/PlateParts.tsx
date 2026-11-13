import { StyleSheet, Text, View } from 'react-native';

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
export function Silk({ children }: { children: string }) {
  return <Text style={styles.silk}>{children}</Text>;
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

const RIDGES = 32;

/**
 * The effort wheel, drawn as hardware on the plate edge (K-9). It is only drawn
 * here: turning it is not built yet, so its light stays off.
 */
export function EffortWheel() {
  return (
    <View style={styles.wheel} accessibilityLabel="Effort wheel, not active">
      <Led label="Effort wheel light, off" />
      <View style={styles.wheelSlot}>
        <View style={styles.wheelCylinder}>
          {Array.from({ length: RIDGES }, (_, index) => (
            <View key={index} style={styles.ridge} />
          ))}
          <View style={styles.wheelShade} />
        </View>
      </View>
      <Silk>Effort</Silk>
    </View>
  );
}

/**
 * Size of the closed island. Apple's cutout is about 37 by 125 points, so this
 * leaves a black margin of about 6 points all round it.
 */
export const ISLAND_PILL_WIDTH = 49;
const ISLAND_PILL_LENGTH = 137;

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
  wheel: {
    width: 40,
    alignItems: 'center',
    gap: 7,
  },
  wheelSlot: {
    width: 34,
    height: 168,
    padding: 4,
    borderRadius: 17,
    backgroundColor: '#050506',
    boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.07)',
  },
  wheelCylinder: {
    flex: 1,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#1E1E20',
    gap: 3,
  },
  ridge: {
    height: 2,
    backgroundColor: '#4C4C50',
  },
  wheelShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundImage:
      'linear-gradient(180deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0) 24%, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0) 76%, rgba(0,0,0,0.88) 100%)',
  },
  pill: {
    width: ISLAND_PILL_WIDTH,
    height: ISLAND_PILL_LENGTH,
    borderRadius: ISLAND_PILL_WIDTH / 2,
    backgroundColor: '#000000',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.035)',
  },
});
