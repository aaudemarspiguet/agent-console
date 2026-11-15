import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet } from 'react-native';
import type { Side } from '../useCameraSide';
import { island, type IslandState, type View as IslandView } from './store';
import { FULL_HEIGHT, HALF_HEIGHT, isHalf, isNarrow, NARROW_WIDTH, OPEN_WIDTH, OpenView } from './views';

/** The width of the iPhone 17's camera cutout in landscape (handoff T1). */
export const CUTOUT_WIDTH = 37;
/** Gap between the screen and the key area, as in the mockups. */
const KEYS_GAP = 14;
/** Where the screen starts, from the camera edge (mockups). */
const SCREEN_START = 14;
/** Where the key area starts, from the camera edge: beside the narrow screen, and beside the wide one. */
export const KEYS_START_NARROW = SCREEN_START + NARROW_WIDTH + KEYS_GAP;
export const KEYS_START_WIDE = SCREEN_START + OPEN_WIDTH + KEYS_GAP;

/**
 * The screen stays over the camera, its black margin covering the real Dynamic
 * Island (the user, 2026-11-14). It rests narrow (240) on the session list and
 * widens to 320 when there is something to read: a request, listening, a
 * transcript, a session, the effort view or a result. The keys slide aside and
 * narrow as it widens, and return as it narrows, so its widening is the alert
 * and the keys making room show what took over (option 1, chosen 2026-11-14).
 * Results and the effort view are also half height, 170, which still covers
 * the island. Width, height, corner and the keys all move together on the
 * prototype's 0.52 s cubic-bezier(.32, 1.28, .45, 1), on the JS driver: the
 * native driver cannot animate layout (React Native 0.88 docs, "Animations").
 */
const MOVE_MS = 520;
const MOVE_EASING = Easing.bezier(0.32, 1.28, 0.45, 1);

/**
 * The full-height screen's corners run parallel to the display's own (the user,
 * 2026-11-14): the iPhone 17's display corner is reported as 62 points, a
 * continuous curve (UIScreen's private `_displayCornerRadius`, as collected by
 * the ScreenCorners project; Apple publishes no figure). The screen sits 12
 * points from the top and bottom and 13.5 from the camera edge, so a parallel
 * corner is 62 - 12.5 = 49.5, drawn with the same continuous curve. The
 * half-height screen sits far from the display's corners, so it keeps its own.
 */
const DISPLAY_CORNER = 62;
const SCREEN_GAP = 12.5;
const FULL_RADIUS = DISPLAY_CORNER - SCREEN_GAP;
const HALF_RADIUS = 36;

/** Reduce Motion: movement becomes near-instant and the loops stop. */
export function useReduceMotion(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => live && setOn(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOn);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return on;
}

function target(view: IslandView | null) {
  return {
    height: isHalf(view) ? HALF_HEIGHT : FULL_HEIGHT,
    radius: isHalf(view) ? HALF_RADIUS : FULL_RADIUS,
    wide: isNarrow(view) ? 0 : 1,
  };
}

export interface ScreenMotion {
  height: Animated.Value;
  radius: Animated.Value;
  /** 0 narrow (resting on the list), 1 wide: drives the screen's width and the key area (K-7). */
  wide: Animated.Value;
}

/** Moves the screen and the key area to match what the screen shows. */
export function useScreenMotion(s: IslandState, still: boolean): ScreenMotion {
  const first = target(s.view);
  const values = useRef({
    height: new Animated.Value(first.height),
    radius: new Animated.Value(first.radius),
    wide: new Animated.Value(first.wide),
  }).current;
  const t = target(s.view);
  useEffect(() => {
    const run = (value: Animated.Value, toValue: number) =>
      Animated.timing(value, { toValue, duration: still ? 10 : MOVE_MS, easing: MOVE_EASING, useNativeDriver: false });
    const all = Animated.parallel([run(values.height, t.height), run(values.radius, t.radius), run(values.wide, t.wide)]);
    all.start();
    return () => all.stop();
  }, [values, t.height, t.radius, t.wide, still]);
  return values;
}

interface IslandProps {
  s: IslandState;
  side: Side;
  /** Distance of the screen from the camera edge. */
  inset: number;
  /** The plate's height, to centre the screen top to bottom. */
  plateHeight: number;
  motion: ScreenMotion;
  still: boolean;
}

/**
 * The deck's screen (K-1, K-7): a black panel beside the camera, covering the
 * real Dynamic Island, that shows one of the views in `views.tsx`.
 */
export function Island({ s, side, inset, plateHeight, motion, still }: IslandProps) {
  // The view on screen lags the state's view, so a change can fade out first.
  const [shown, setShown] = useState<IslandView | null>(s.view);
  const fadeIn = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;

  // Switching views: fade out over 0.1 s, draw the new view after 110 ms, fade it in over 0.26 s after 0.15 s.
  useEffect(() => {
    if (s.view === shown) return undefined;
    const fade = (toValue: number, duration: number, delay = 0) =>
      Animated.timing(fadeIn, { toValue, duration: still ? 1 : duration, delay: still ? 0 : delay, useNativeDriver: false });
    fade(0, 100).start();
    const timer = setTimeout(() => {
      setShown(s.view);
      fade(1, 260, 150).start();
    }, still ? 0 : 110);
    return () => clearTimeout(timer);
    // `shown` is read only to compare; listing it would rerun the fade it starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.view, still]);

  // Pressing a key that does nothing jitters the screen 3 points toward the
  // camera and lets it settle back without passing its resting place, so the
  // real island stays covered (the user, 2026-11-14; the prototype moved away
  // from the camera first, which uncovered it).
  const nudges = useRef(s.nudges);
  useEffect(() => {
    if (s.nudges === nudges.current) return;
    nudges.current = s.nudges;
    if (still) return;
    const towardCamera = side === 'left' ? -1 : 1;
    Animated.sequence([
      Animated.timing(shake, { toValue: 3 * towardCamera, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.timing(shake, { toValue: 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [s.nudges, side, still, shake]);

  // Centred top to bottom, worked out in points: iOS resolves a percentage `top`
  // against the parent's height less its padding, the web against the full
  // height, so `top: '50%'` put the island 19 points too high on the phone.
  const top = Animated.multiply(Animated.subtract(plateHeight, motion.height), 0.5);
  const width = motion.wide.interpolate({ inputRange: [0, 1], outputRange: [NARROW_WIDTH, OPEN_WIDTH] });
  const contentHeight = isHalf(shown) ? HALF_HEIGHT : FULL_HEIGHT;
  const contentWidth = isNarrow(shown) ? NARROW_WIDTH : OPEN_WIDTH;
  const contentTop = Animated.multiply(Animated.subtract(motion.height, contentHeight), 0.5);

  return (
    <Animated.View
      style={[
        styles.screen,
        { [side]: inset, top, width, height: motion.height, borderRadius: motion.radius, transform: [{ translateX: shake }] },
      ]}
    >
      {/* A tap anywhere that no row takes moves a result on, hides a request, or leaves a session view (K-5). */}
      <Pressable style={StyleSheet.absoluteFill} onPress={island.tapIsland} accessible={false}>
        <Animated.View
          style={[styles.content, { [side]: 0, width: contentWidth, height: contentHeight, top: contentTop, opacity: fadeIn }]}
        >
          {shown ? <OpenView view={shown} s={s} side={side} still={still} /> : null}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: 'absolute',
    zIndex: 4,
    backgroundColor: '#000000',
    overflow: 'hidden',
    // Apple's continuous corner, as the display's own (iOS only; the web draws a circular arc).
    borderCurve: 'continuous',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 18px 44px rgba(0,0,0,0.6)',
  },
  content: {
    position: 'absolute',
  },
});
