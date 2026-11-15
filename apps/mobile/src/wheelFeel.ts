import * as Haptics from 'expo-haptics';

/**
 * How the effort wheel feels when turned (E-1, handoff T12): how far the finger
 * travels for one level, how strongly each step's groove holds the wheel, how
 * hard the ends resist, and which haptics mark a step and an end stop.
 *
 * `expo-haptics` (SDK 58 docs) has `selectionAsync()`, "used to let a user know
 * when a selection change has been registered", and five fixed impact styles
 * (Light, Medium, Heavy, Rigid, Soft) with no intensity setting.
 */
export interface WheelFeel {
  name: string;
  /** Finger travel for one level, in points. */
  stepPts: number;
  /**
   * How strongly each groove holds the wheel while dragging, 0 to 1. At 0 the
   * wheel follows the finger exactly; at 1 it lingers at each step and jumps
   * between them. Kept at or below 1 so the wheel never moves against the finger.
   */
  detent: number;
  /**
   * Rubber banding past either end, as in iOS scroll views: the wheel moves
   * `band * (1 - 1 / (over * give / band + 1))` points for `over` points of finger
   * travel, so it never goes further than `band`.
   */
  band: number;
  give: number;
  /** Finger travel past an end, in points, at which the end-stop haptic fires. */
  stopAt: number;
  tick: () => void;
  stop: () => void;
  /** The spring that settles the wheel into the nearest groove on release. */
  spring: { stiffness: number; damping: number; mass: number };
}

/** A haptic that fails (none on this device or browser) must not raise an unhandled rejection. */
const impact = (style: Haptics.ImpactFeedbackStyle) => () => {
  Haptics.impactAsync(style).catch(() => {});
};

/**
 * The chosen feel, "C notch" (the user, 2026-11-14, by feel on the phone, from
 * three tried in handoff T12; the other two are listed there): a long throw,
 * a groove that holds firmly, a Medium tick, a Heavy end stop, and a settle
 * with one small rebound (damping ratio about 0.66).
 */
export const WHEEL_FEEL: WheelFeel = {
  name: 'C notch',
  stepPts: 34,
  detent: 1,
  band: 16,
  give: 0.45,
  stopAt: 2,
  tick: impact(Haptics.ImpactFeedbackStyle.Medium),
  stop: impact(Haptics.ImpactFeedbackStyle.Heavy),
  spring: { stiffness: 520, damping: 30, mass: 1 },
};

/** The groove: where the wheel shows for a finger position `p`, in levels. */
export function groove(p: number, k: number): number {
  const n = Math.floor(p);
  const t = p - n;
  return n + t - (k * Math.sin(2 * Math.PI * t)) / (2 * Math.PI);
}

/** The inverse of `groove`, by bisection (groove is monotonic for k <= 1). */
export function ungroove(d: number, k: number): number {
  const n = Math.floor(d);
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (groove(n + mid, k) < d) lo = mid;
    else hi = mid;
  }
  return n + (lo + hi) / 2;
}

export function band(over: number, feel: WheelFeel): number {
  return feel.band * (1 - 1 / ((over * feel.give) / feel.band + 1));
}

export function unband(shown: number, feel: WheelFeel): number {
  const b = Math.min(shown, feel.band * 0.999);
  return (feel.band / feel.give) * (b / (feel.band - b));
}

/**
 * Where the wheel shows, in levels, for a finger position `raw` in levels, with
 * levels 0 to `last`.
 */
export function shownFor(raw: number, last: number, feel: WheelFeel): number {
  if (raw < 0) return -band(-raw * feel.stepPts, feel) / feel.stepPts;
  if (raw > last) return last + band((raw - last) * feel.stepPts, feel) / feel.stepPts;
  return groove(raw, feel.detent);
}

/** The finger position that shows the wheel at `shown`: the inverse of `shownFor`. */
export function rawFor(shown: number, last: number, feel: WheelFeel): number {
  if (shown < 0) return -unband(-shown * feel.stepPts, feel) / feel.stepPts;
  if (shown > last) return last + unband((shown - last) * feel.stepPts, feel) / feel.stepPts;
  return ungroove(shown, feel.detent);
}
