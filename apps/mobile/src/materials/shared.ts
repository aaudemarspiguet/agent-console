import { StyleSheet } from 'react-native';

/**
 * TEMPORARY (handoff task T5). Shared sizes and colours for the material
 * samples. Values follow the mockups' number key ("1 · At rest", key 2).
 */

/** One grid cell on the iPhone 17: (874 - 2 * 62 - 4 * 9) / 5 by (402 - 16 - 21 - 36 - 9 - 3 * 9) / 4. */
export const WELL_WIDTH = 143;
export const WELL_HEIGHT = 73;
/** The cap inside the well: the well's padding is 3 at the sides and top, 6 at the bottom. */
export const CAP = { x: 3, y: 3, width: WELL_WIDTH - 6, height: WELL_HEIGHT - 9, radius: 10 };

export type Light = { color: string; strength: number };
/** Lit green (session finished), as key 2 in the mockup. */
export const GREEN: Light = { color: '48,209,88', strength: 0.8 };
/** Lit white (session working), as keys 1, 4 and 6 in the mockup, which draw it at 0.32. */
export const WHITE: Light = { color: '255,255,255', strength: 0.32 };

/**
 * The glow under a lit key. The mockup blurs an ellipse (20% in from each side,
 * 32% down to 16% up) by 14 px. iOS has no blur filter for views, so this draws
 * the same falloff as a radial gradient, grown by the blur radius.
 */
export function glowStyle(light: Light) {
  return {
    position: 'absolute' as const,
    left: WELL_WIDTH * 0.2 - 14,
    right: WELL_WIDTH * 0.2 - 14,
    top: WELL_HEIGHT * 0.32 - 14,
    bottom: WELL_HEIGHT * 0.16 - 14,
    backgroundImage: `radial-gradient(ellipse closest-side, rgba(${light.color},${light.strength}) 35%, rgba(${light.color},0) 100%)`,
  };
}

export const shared = StyleSheet.create({
  well: {
    width: WELL_WIDTH,
    height: WELL_HEIGHT,
    borderRadius: 13,
    backgroundColor: '#040405',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.95), 0 1px 0 rgba(255,255,255,0.10)',
  },
  /** Where the cap sits in the well. */
  capBox: {
    position: 'absolute',
    left: CAP.x,
    top: CAP.y,
    width: CAP.width,
    height: CAP.height,
    borderRadius: CAP.radius,
  },
  /** The cap's lift off the plate, from the mockup's key shadow. */
  capShadow: {
    boxShadow: '0 3px 0 #1A1A1D, 0 5px 8px rgba(0,0,0,0.6)',
  },
  /** The mockup's glass finish over whatever material is underneath. */
  capFace: {
    borderRadius: CAP.radius,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -5px 9px rgba(0,0,0,0.2)',
  },
  number: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  dot: {
    position: 'absolute',
    top: 10,
    left: 11,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  centre: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/** The key's light and number, drawn on top of every material. */
export function dotStyle(light: Light) {
  return { backgroundColor: `rgb(${light.color})`, boxShadow: `0 0 7px rgb(${light.color})` };
}
