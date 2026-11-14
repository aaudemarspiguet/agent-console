import { Animated, Easing, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { soundDown, soundUp } from './keySound';

/**
 * How a key press feels, looks and sounds: the haptics, the cap's travel and the
 * key sound (K-4). The user asked for a deep, heavy press (handoff T6b) and then
 * tuned it on the phone (2026-11-13):
 *
 * - **Press:** the bottom-out sound and haptic fire the moment the finger lands,
 *   with no waiting, and the cap drops fast enough to be seen landing with them.
 * - **Release:** the cap springs back to the top in about 90 ms, as a real key's
 *   stem does, then settles with one small overshoot. The return sound and Soft
 *   haptic fire as it reaches the top, on a timer worked out from the spring, so
 *   they never lag. If the key is pressed again before then, the return sound is
 *   cancelled, as on a real key that never got back up.
 * - **Spamming a key** therefore shows the cap jittering up and down, each press
 *   starting from wherever the cap is, with a sound on every press and none left
 *   over after the last one.
 *
 * An earlier version (same day) waited for the cap's animated value to report
 * reaching the bottom or the top before playing. On the phone those reports came
 * late or not at all: clicks arrived after the user had stopped, spammed keys
 * stayed down and silent. Nothing here waits on the animation any more.
 *
 * **Strength (the user, 2026-11-13):** quick repeated presses should look, feel
 * and sound lighter than a single slam. The screen cannot sense how hard a
 * finger presses (iPhones have had no pressure sensing since 3D Touch was
 * dropped), so strength is taken from how soon a key is pressed again. A lighter
 * press goes less deep, gives a lighter haptic, and sounds quieter and slightly
 * higher.
 *
 * `expo-haptics` (SDK 58) has five fixed impact styles and no intensity setting,
 * so strength picks the style. The travel uses React Native's `Animated` on
 * `transform`, which the native driver supports.
 */
const TOP_OUT = Haptics.ImpactFeedbackStyle.Soft;
/** How far the cap goes down at full strength, in points. */
export const PRESS_DROP = 3;
/** Time to drop to the bottom, in ms. */
const DOWN_MS = 30;

/**
 * The return spring: a damped oscillator, mass 1. Starting from rest, it first
 * reaches the top after `TOP_MS` and overshoots by about 16% (damping ratio 0.5).
 * For a spring released from rest, the time to first reach the top does not
 * depend on how far down it started, so one timer fits every release.
 */
const TOP_MS = 90;
const DAMPING_RATIO = 0.5;
const OMEGA_D = (Math.PI - Math.acos(DAMPING_RATIO)) / (TOP_MS / 1000);
const OMEGA = OMEGA_D / Math.sqrt(1 - DAMPING_RATIO * DAMPING_RATIO);
const SPRING = { stiffness: OMEGA * OMEGA, damping: 2 * DAMPING_RATIO * OMEGA, mass: 1 };

/**
 * Strength from the time since this key was last pressed: full strength after
 * FULL_MS or more, the lightest at QUICK_MS or less, in between linearly.
 */
const QUICK_MS = 90;
const FULL_MS = 450;
const LIGHTEST = 0.45;
/** The lightest press still goes this share of the full depth. */
const SHALLOWEST = 0.6;

function strengthAfter(gapMs: number): number {
  const t = Math.min(1, Math.max(0, (gapMs - QUICK_MS) / (FULL_MS - QUICK_MS)));
  return LIGHTEST + (1 - LIGHTEST) * t;
}

function bottomHaptic(strength: number): Haptics.ImpactFeedbackStyle {
  if (strength >= 0.8) return Haptics.ImpactFeedbackStyle.Heavy;
  if (strength >= 0.6) return Haptics.ImpactFeedbackStyle.Medium;
  return Haptics.ImpactFeedbackStyle.Light;
}

/** The native driver does not exist on the web. */
const NATIVE = Platform.OS !== 'web';

interface CapState {
  lastPressAt: number;
  strength: number;
  /** The pending return sound, if the cap is on its way back up. */
  topTimer?: ReturnType<typeof setTimeout>;
}
const caps = new WeakMap<Animated.Value, CapState>();

function stateOf(travel: Animated.Value): CapState {
  let state = caps.get(travel);
  if (!state) {
    state = { lastPressAt: -Infinity, strength: 1 };
    caps.set(travel, state);
  }
  return state;
}

export function pressDown(travel: Animated.Value): void {
  const state = stateOf(travel);
  if (state.topTimer !== undefined) {
    clearTimeout(state.topTimer);
    state.topTimer = undefined;
  }
  const now = Date.now();
  const strength = strengthAfter(now - state.lastPressAt);
  state.lastPressAt = now;
  state.strength = strength;

  void Haptics.impactAsync(bottomHaptic(strength));
  soundDown(strength);

  travel.stopAnimation();
  Animated.timing(travel, {
    toValue: PRESS_DROP * (SHALLOWEST + (1 - SHALLOWEST) * strength),
    duration: DOWN_MS,
    easing: Easing.out(Easing.quad),
    useNativeDriver: NATIVE,
  }).start();
}

export function pressUp(travel: Animated.Value): void {
  const state = stateOf(travel);
  const { strength } = state;
  if (state.topTimer !== undefined) clearTimeout(state.topTimer);
  state.topTimer = setTimeout(() => {
    state.topTimer = undefined;
    void Haptics.impactAsync(TOP_OUT);
    soundUp(strength);
  }, TOP_MS);

  travel.stopAnimation();
  Animated.spring(travel, { toValue: 0, velocity: 0, ...SPRING, useNativeDriver: NATIVE }).start();
}
