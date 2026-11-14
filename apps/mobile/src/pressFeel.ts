import { Animated, Easing, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * How a key press feels: the haptics and the cap's travel (K-4). The user asked
 * for a deep, heavy press, like a glass key that goes down firmly and comes back
 * slowly (handoff T6b), and chose this one by feel on the phone (2026-11-13,
 * variant "A heavy" of four; the others are recorded in docs/HANDOFF.md):
 *
 * - a Heavy impact as the finger lands, and a Soft one as it lifts;
 * - the cap goes down 3 points over 60 ms;
 * - it springs back in about 0.7 s, rising about 0.4 points past rest once.
 *
 * `expo-haptics` (SDK 58) has five fixed impact styles and no intensity setting,
 * so the feel comes from the styles chosen. The travel uses React Native's
 * `Animated` on `transform`, which the native driver supports.
 */
const PRESS_IN = Haptics.ImpactFeedbackStyle.Heavy;
const RELEASE = Haptics.ImpactFeedbackStyle.Soft;
/** How far the cap goes down, in points. */
export const PRESS_DROP = 3;
const DOWN_MS = 60;
const SPRING = { stiffness: 140, damping: 16, mass: 1.6 };

/** The native driver does not exist on the web. */
const NATIVE = Platform.OS !== 'web';

export function pressDown(travel: Animated.Value): void {
  void Haptics.impactAsync(PRESS_IN);
  travel.stopAnimation();
  Animated.timing(travel, {
    toValue: PRESS_DROP,
    duration: DOWN_MS,
    easing: Easing.out(Easing.quad),
    useNativeDriver: NATIVE,
  }).start();
}

export function pressUp(travel: Animated.Value): void {
  void Haptics.impactAsync(RELEASE);
  travel.stopAnimation();
  Animated.spring(travel, { toValue: 0, ...SPRING, useNativeDriver: NATIVE }).start();
}
