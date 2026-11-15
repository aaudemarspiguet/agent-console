import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { Led, Silk } from './PlateParts';
import { rawFor, shownFor, WHEEL_FEEL as feel } from './wheelFeel';

/** Width of the wheel's column: slot, light and label. */
export const WHEEL_COLUMN_WIDTH = 60;

const SLOT_WIDTH = 34;
const SLOT_HEIGHT = 168;
const SLOT_PADDING = 4;
const CYL_WIDTH = SLOT_WIDTH - 2 * SLOT_PADDING;
const CYL_HEIGHT = SLOT_HEIGHT - 2 * SLOT_PADDING;
/**
 * The cylinder's radius. A little more than half the visible height, so the
 * slot shows about 130 degrees of it (asin(80 / 88) = 65 degrees each way), as
 * a thumb wheel sunk into a plate does.
 */
const RADIUS = 88;
/** Distance between ridges along the surface, in points (the mockup's 5-point pitch). */
const PITCH = 5;
/** Thickness of a ridge along the surface, in points. */
const RIDGE = 2;
/** Direction the light comes from: above the wheel, in radians from straight on. */
const LIGHT_ANGLE = -0.5;
const RIDGES_EACH_WAY = Math.ceil((RADIUS * (Math.PI / 2)) / PITCH) + 1;

const DARK = [24, 24, 26];
const LIT = [128, 128, 134];

function mix(t: number): string {
  const c = DARK.map((d, i) => Math.round(d + (LIT[i] - d) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/**
 * The ridges for the wheel turned to `surface` points. Each ridge sits at an
 * angle on the cylinder, so towards the top and bottom edges ridges crowd
 * together, thin out and turn away from the light, as on a real curved surface.
 */
function ridges(surface: number) {
  const shift = ((surface % PITCH) + PITCH) % PITCH;
  const out: { key: number; top: number; height: number; color: string; shadow: number }[] = [];
  for (let i = -RIDGES_EACH_WAY; i <= RIDGES_EACH_WAY; i += 1) {
    const angle = (i * PITCH - shift) / RADIUS;
    if (Math.abs(angle) >= Math.PI / 2) continue;
    const top = CYL_HEIGHT / 2 + RADIUS * Math.sin(angle);
    if (top < -RIDGE || top > CYL_HEIGHT) continue;
    const facing = Math.cos(angle);
    const lit = Math.max(0, Math.cos(angle - LIGHT_ANGLE));
    out.push({
      key: i,
      top,
      height: Math.max(0.35, RIDGE * facing),
      color: mix(0.12 + 0.88 * lit * lit),
      // The groove below each ridge: deeper-looking where the surface faces the viewer.
      shadow: 1.3 * facing,
    });
  }
  return out;
}

interface EffortWheelProps {
  /** The wheel will act on the selected session, so its light is on (E-6, K-9). Off, a drag does nothing. */
  active: boolean;
  /** The level the wheel sits at, as an index into the session's levels. */
  level: number;
  /** How many levels the session's model offers (E-1). */
  levels: number;
  /** Each step while turning. */
  onTurn: (level: number) => void;
  /** The wheel has settled on a level. */
  onStop: (level: number) => void;
}

/**
 * The effort wheel, drawn as hardware on the plate edge (K-9). A vertical drag
 * rolls the cylinder under the finger, one groove per level with a haptic tick,
 * and past either end it resists and springs back with a firmer stop (E-1).
 * Upward turns effort up.
 */
export function EffortWheel({ active, level, levels, onTurn, onStop }: EffortWheelProps) {
  const last = levels - 1;
  /** Where the wheel shows, in levels (fractions while turning). */
  const [shown, setShown] = useState(level);

  const anim = useRef(new Animated.Value(level)).current;
  const live = useRef({ feel, level, shown: level, startRaw: 0, tickLevel: level, stopped: false, dragging: false });
  const props = useRef({ active, last, onTurn, onStop });
  props.current = { active, last, onTurn, onStop };

  useEffect(() => {
    const id = anim.addListener(({ value }) => {
      live.current.shown = value;
      setShown(value);
    });
    return () => anim.removeListener(id);
  }, [anim]);

  // A new session, or a change the PC could not make, moves the wheel to that level.
  useEffect(() => {
    const s = live.current;
    if (s.dragging || level === s.level) return;
    s.level = level;
    s.tickLevel = level;
    Animated.spring(anim, { toValue: level, ...feel.spring, useNativeDriver: false }).start();
  }, [level, anim]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => props.current.active,
        onMoveShouldSetPanResponder: () => props.current.active,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          const s = live.current;
          const end = props.current.last;
          anim.stopAnimation();
          s.dragging = true;
          s.startRaw = rawFor(s.shown, end, s.feel);
          s.tickLevel = Math.round(Math.min(end, Math.max(0, s.shown)));
          s.stopped = false;
        },
        onPanResponderMove: (_, gesture) => {
          const s = live.current;
          const end = props.current.last;
          const raw = s.startRaw - gesture.dy / s.feel.stepPts;
          const nearest = Math.round(Math.min(end, Math.max(0, raw)));
          if (nearest !== s.tickLevel) {
            s.tickLevel = nearest;
            s.feel.tick();
            props.current.onTurn(nearest);
          }
          const overPts = raw < 0 ? -raw * s.feel.stepPts : raw > end ? (raw - end) * s.feel.stepPts : 0;
          if (overPts >= s.feel.stopAt && !s.stopped) {
            s.stopped = true;
            s.feel.stop();
          } else if (overPts === 0) {
            s.stopped = false;
          }
          anim.setValue(shownFor(raw, end, s.feel));
        },
        onPanResponderRelease: () => settle(),
        onPanResponderTerminate: () => settle(),
      }),
    // Everything is read through refs, so the responder never needs remaking.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function settle() {
    const s = live.current;
    s.dragging = false;
    const target = s.tickLevel;
    Animated.spring(anim, { toValue: target, ...s.feel.spring, useNativeDriver: false }).start();
    s.level = target;
    props.current.onStop(target);
  }

  function step(by: number) {
    const s = live.current;
    if (!props.current.active) return;
    const target = Math.min(last, Math.max(0, s.level + by));
    if (target === s.level) {
      s.feel.stop();
      return;
    }
    s.feel.tick();
    s.tickLevel = target;
    props.current.onTurn(target);
    settle();
  }

  const surface = shown * feel.stepPts;

  return (
    <View style={styles.wheel}>
      <Led
        color={active ? '#FFFFFF' : undefined}
        label={active ? 'Effort wheel light, on' : 'Effort wheel light, off'}
      />
      <View
        style={styles.slot}
        {...responder.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Effort wheel"
        accessibilityState={{ disabled: !active }}
        accessibilityValue={active ? { min: 0, max: last, now: level } : undefined}
        accessibilityActions={active ? [{ name: 'increment' }, { name: 'decrement' }] : undefined}
        onAccessibilityAction={(event) => step(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
      >
        <View style={styles.cylinder} pointerEvents="none">
          {ridges(surface).map((r) => (
            <View
              key={r.key}
              style={[
                styles.ridge,
                {
                  top: r.top,
                  height: r.height,
                  backgroundColor: r.color,
                  boxShadow: `0 ${r.shadow.toFixed(2)}px 0 rgba(0,0,0,0.55)`,
                },
              ]}
            />
          ))}
          <View style={styles.knurl} />
          <View style={styles.roundness} />
          <View style={styles.chamfers} />
          <View style={styles.glint} />
        </View>
        <View style={styles.rimShadow} pointerEvents="none" />
      </View>
      <Silk>Effort</Silk>
    </View>
  );
}

const fill = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

const styles = StyleSheet.create({
  /** Wide enough for the "Effort" label on one line; the slot is centred in it. */
  wheel: {
    width: WHEEL_COLUMN_WIDTH,
    alignItems: 'center',
    gap: 7,
  },
  /** The recess in the plate: dark, with a lit lower lip and a shadowed upper one. */
  slot: {
    width: SLOT_WIDTH,
    height: SLOT_HEIGHT,
    padding: SLOT_PADDING,
    borderRadius: SLOT_WIDTH / 2,
    backgroundColor: '#030304',
    boxShadow:
      'inset 0 3px 6px rgba(0,0,0,0.95), inset 0 -1px 1px rgba(255,255,255,0.05), 0 1px 0 rgba(255,255,255,0.09), 0 -1px 0 rgba(0,0,0,0.45)',
  },
  cylinder: {
    flex: 1,
    borderRadius: CYL_WIDTH / 2,
    overflow: 'hidden',
    backgroundColor: '#141416',
  },
  ridge: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  /**
   * Fine knurling across the ridges. Lines that run round the cylinder do not
   * move as it turns, so a fixed pattern is the right physics.
   */
  knurl: {
    ...fill,
    backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.32) 1px, rgba(0,0,0,0) 1px)',
    backgroundSize: '2px 100%',
    backgroundRepeat: 'repeat',
  },
  /** The curve: the surface turns away into darkness at top and bottom, lit from above. */
  roundness: {
    ...fill,
    backgroundImage:
      'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.55) 10%, rgba(0,0,0,0.12) 24%, rgba(255,255,255,0.06) 36%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.15) 68%, rgba(0,0,0,0.6) 88%, rgba(0,0,0,0.97) 100%)',
  },
  /** The wheel's rounded side edges. */
  chamfers: {
    ...fill,
    backgroundImage:
      'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(255,255,255,0.05) 14%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 72%, rgba(0,0,0,0.65) 100%)',
  },
  /** The highlight along the curve where it faces the light. */
  glint: {
    position: 'absolute',
    left: 2,
    right: 2,
    top: CYL_HEIGHT * 0.3,
    height: 10,
    borderRadius: 5,
    backgroundImage:
      'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0) 100%)',
  },
  /** The slot's upper rim casting its shadow onto the wheel. */
  rimShadow: {
    ...fill,
    borderRadius: SLOT_WIDTH / 2,
    boxShadow: 'inset 0 5px 6px rgba(0,0,0,0.75), inset 0 -2px 3px rgba(0,0,0,0.5)',
  },
});
