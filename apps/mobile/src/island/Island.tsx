import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet } from 'react-native';
import type { Side } from '../useCameraSide';
import { island, type IslandState, type View as IslandView } from './store';
import { FULL_HEIGHT, HALF_HEIGHT, isHalf, OPEN_WIDTH, OpenView } from './views';

/** The width of the iPhone 17's camera cutout in landscape (handoff T1). */
export const CUTOUT_WIDTH = 37;
/** Where the key area starts, from the camera edge (mockups). */
export const KEYS_START = 348;

/**
 * The screen is fixed open, where the open island used to sit (the user,
 * 2026-11-14): its black margin covers the real Dynamic Island, so the island
 * reads as hidden behind it. It never collapses to a pill. Only its height
 * changes, between full height and the half height of results and the effort
 * view, which still covers the island; that move uses the prototype's 0.52 s
 * cubic-bezier(.32, 1.28, .45, 1). React Native's native driver cannot animate
 * height, so it runs on the JS driver (React Native 0.88 docs, "Animations").
 */
const MOVE_MS = 520;
const MOVE_EASING = Easing.bezier(0.32, 1.28, 0.45, 1);

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
  return isHalf(view) ? { height: HALF_HEIGHT, radius: 36 } : { height: FULL_HEIGHT, radius: 38 };
}

interface IslandProps {
  s: IslandState;
  side: Side;
  /** Distance of the screen from the camera edge. */
  inset: number;
  /** The plate's height, to centre the screen top to bottom. */
  plateHeight: number;
  still: boolean;
}

/**
 * The deck's screen (K-1, K-7): a black panel beside the camera, covering the
 * real Dynamic Island, that shows one of the views in `views.tsx`.
 */
export function Island({ s, side, inset, plateHeight, still }: IslandProps) {
  const first = target(s.view);
  const height = useRef(new Animated.Value(first.height)).current;
  const radius = useRef(new Animated.Value(first.radius)).current;
  // The view on screen lags the state's view, so a change can fade out first.
  const [shown, setShown] = useState<IslandView | null>(s.view);
  const fadeIn = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;

  const t = target(s.view);
  useEffect(() => {
    const run = (value: Animated.Value, toValue: number) =>
      Animated.timing(value, { toValue, duration: still ? 10 : MOVE_MS, easing: MOVE_EASING, useNativeDriver: false });
    const both = Animated.parallel([run(height, t.height), run(radius, t.radius)]);
    both.start();
    return () => both.stop();
  }, [height, radius, t.height, t.radius, still]);

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
  const top = Animated.multiply(Animated.subtract(plateHeight, height), 0.5);
  const contentHeight = isHalf(shown) ? HALF_HEIGHT : FULL_HEIGHT;
  const contentTop = Animated.multiply(Animated.subtract(height, contentHeight), 0.5);

  return (
    <Animated.View
      style={[
        styles.screen,
        { [side]: inset, top, height, borderRadius: radius, transform: [{ translateX: shake }] },
      ]}
    >
      {/* A tap anywhere that no row takes moves a result on, hides a request, or leaves a session view (K-5). */}
      <Pressable style={StyleSheet.absoluteFill} onPress={island.tapIsland} accessible={false}>
        <Animated.View style={[styles.content, { [side]: 0, height: contentHeight, top: contentTop, opacity: fadeIn }]}>
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
    width: OPEN_WIDTH,
    backgroundColor: '#000000',
    overflow: 'hidden',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 18px 44px rgba(0,0,0,0.6)',
  },
  content: {
    position: 'absolute',
    width: OPEN_WIDTH,
  },
});
