import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import type { KeyId } from '@deck/protocol';
import type { KeyDef } from './layout';
import { LIGHT_COLOURS, type SessionLight } from './lights';
import { PRESS_DROP, pressDown, pressUp } from './pressFeel';
import { Glyph } from './Glyph';

/**
 * Number keys are Apple's Liquid Glass, "clear" tinted 25% black (handoff T5,
 * brief N-5). It needs iOS 26, and the docs say to check for the API before
 * using it. Elsewhere (the web, older iPhones, Android) the cap gets the
 * mockup's gradient finish instead, a stand-in until the fallback is decided.
 */
const GLASS = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

/** How far the glow's soft edge reaches past its ellipse (the mockup blurs it by 14). */
const GLOW_SPREAD = 14;

interface KeyProps {
  def: KeyDef;
  left: number;
  top: number;
  width: number;
  height: number;
  /** The session light on a number key; none means unlit. */
  light?: SessionLight;
  /** The key does nothing right now, so its legend is unlit (K-3). */
  unlit?: boolean;
  onPress: (id: KeyId) => void;
}

/**
 * The glow a lit number key throws onto the well under its cap. iOS has no blur
 * filter for views, so a radial gradient draws the soft falloff of the
 * mockup's blurred ellipse, grown by the blur.
 *
 * Under Liquid Glass the glow is tuned down from the mockup (T6, chosen by the
 * user from phone screenshots on 2026-11-13): the glass spreads what is under it
 * to the cap's edges and rim, so the mockup's full glow turned a key into a lit
 * tile. It is 0.7 as strong, a smaller ellipse, and centred on the cap, which
 * sits 1.5 points above the well's middle (3 points of well above it, 6 below).
 * Without glass the cap keeps the mockup's glow (20% in from each side, 32%
 * down to 16% up, blurred by 14).
 */
const GLOW = GLASS
  ? { side: 0.28, top: 0.28, bottom: 0.32, spread: 10, strength: 0.7 }
  : { side: 0.2, top: 0.32, bottom: 0.16, spread: GLOW_SPREAD, strength: 1 };

function Glow({ light, width, height }: { light: SessionLight; width: number; height: number }) {
  const { rgb, glow } = LIGHT_COLOURS[light];
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: width * GLOW.side - GLOW.spread,
        right: width * GLOW.side - GLOW.spread,
        top: height * GLOW.top - GLOW.spread,
        bottom: height * GLOW.bottom - GLOW.spread,
        backgroundImage: `radial-gradient(ellipse closest-side, rgba(${rgb},${glow * GLOW.strength}) 35%, rgba(${rgb},0) 100%)`,
      }}
    />
  );
}

/**
 * One key: a cap sitting in a recessed well. The cap moves down and the phone
 * gives a haptic on press (K-4). Values match the design boards' key styles.
 */
export function Key({ def, left, top, width, height, light, unlit = false, onPress }: KeyProps) {
  const isNumber = def.look === 'number';
  const look = def.look === 'primary' && unlit ? lookStyles.primaryUnlit : lookStyles[def.look];
  const lightColour = light ? `rgb(${LIGHT_COLOURS[light].rgb})` : undefined;
  const right = def.legendSide === 'right';
  // Legend, glyph and hint share one ink, dimmed when the key does nothing (K-3).
  const inkColour = !unlit ? '#FFFFFF' : def.look === 'primary' ? INK_UNLIT_PRIMARY : INK_UNLIT;

  // How far the cap is down, in points. The cap's lift shadow switches to its
  // pressed form while the cap is more than halfway down.
  const travel = useRef(new Animated.Value(0)).current;
  const [down, setDown] = useState(false);
  useEffect(() => {
    const id = travel.addListener(({ value }) => setDown(value > PRESS_DROP / 2));
    return () => travel.removeListener(id);
  }, [travel]);

  return (
    <View style={[styles.well, { left, top, width, height }]}>
      {isNumber && light ? <Glow light={light} width={width} height={height} /> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={def.spoken ?? def.legend}
        accessibilityState={{ disabled: unlit }}
        onPressIn={() => pressDown(travel)}
        onPressOut={() => pressUp(travel)}
        onPress={() => onPress(def.id)}
        style={styles.press}
      >
        <Animated.View style={[styles.cap, down ? look.down : look.up, { transform: [{ translateY: travel }] }]}>
        {isNumber && GLASS ? (
          <>
            {/* The mockup's pale face under the glass, so an unlit glass key is grey, not black (T6). */}
            <View style={styles.glassBase} />
            <GlassView glassEffectStyle="clear" colorScheme="dark" tintColor="rgba(0,0,0,0.25)" style={styles.glass} />
          </>
        ) : null}
        {isNumber ? (
          <>
            {/* Status light for the session (A-3). */}
            <View
              style={[styles.dot, lightColour ? { backgroundColor: lightColour, boxShadow: `0 0 7px ${lightColour}` } : null]}
            />
            <Text style={styles.number}>{def.legend}</Text>
          </>
        ) : (
          <>
            {/* Wide keys carry a glyph above the legend and may have a hint opposite it (T7). */}
            {def.glyph ? (
              <View style={[styles.glyph, right ? styles.glyphRight : styles.glyphLeft]}>
                <Glyph name={def.glyph} size={15} color={inkColour} />
              </View>
            ) : null}
            {def.hint ? (
              <Text style={[styles.hint, right ? styles.hintLeft : styles.hintRight, { color: inkColour }]}>
                {def.hint}
              </Text>
            ) : null}
            <Text
              style={[styles.legend, right ? styles.legendRight : styles.legendLeft, { color: inkColour }]}
              numberOfLines={2}
            >
              {def.legend}
            </Text>
          </>
        )}
        </Animated.View>
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
  press: {
    flex: 1,
  },
  /** The glass fills the cap. It ignores borderRadius unless it clips. */
  glass: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 10,
    overflow: 'hidden',
  },
  glassBase: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 10,
    backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
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
  /** Glyph and hint values match the boards' `.gl` and `.alt` (gen-flow.ps1). */
  glyph: {
    position: 'absolute',
    top: 9,
    opacity: 0.85,
  },
  glyphLeft: {
    left: 10,
  },
  glyphRight: {
    right: 10,
  },
  hint: {
    position: 'absolute',
    top: 9,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400',
    letterSpacing: 0.06,
    opacity: 0.55,
  },
  hintLeft: {
    left: 11,
  },
  hintRight: {
    right: 11,
  },
});

const INK_UNLIT = 'rgba(255,255,255,0.3)';
const INK_UNLIT_PRIMARY = 'rgba(255,255,255,0.42)';

/** Cap finish for each look, at rest and pressed. */
const lookStyles = {
  // With Liquid Glass the cap is the glass alone plus its lift shadow, as in the
  // sample the user chose (T5, sample T1). Without it, the mockup's gradient finish.
  number: StyleSheet.create(
    GLASS
      ? {
          up: { borderWidth: 0, boxShadow: '0 3px 0 #1A1A1D, 0 5px 8px rgba(0,0,0,0.6)' },
          down: { borderWidth: 0, boxShadow: '0 1px 0 #1A1A1D, 0 1px 3px rgba(0,0,0,0.6)' },
        }
      : {
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
        },
  ),
  // Action keys and Allow are matte, like a Mac keyboard's keys (chosen by the
  // user on 2026-11-13 over bead-blasted aluminium and a PBT keycap): nearly flat
  // colour, no gloss, only a faint edge. The earlier glossy gradient read as glass.
  action: StyleSheet.create({
    up: {
      borderColor: 'rgba(255,255,255,0.05)',
      backgroundImage: 'linear-gradient(180deg, #2D2D30, #29292C)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 3px 0 #111113, 0 5px 8px rgba(0,0,0,0.6)',
    },
    down: {
      borderColor: 'rgba(255,255,255,0.05)',
      backgroundImage: 'linear-gradient(180deg, #2A2A2D, #27272A)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 1px 0 #111113, 0 1px 3px rgba(0,0,0,0.6)',
    },
  }),
  primary: StyleSheet.create({
    up: {
      borderColor: 'rgba(255,255,255,0.08)',
      backgroundImage: 'linear-gradient(180deg, #1A88F7, #1480EE)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 3px 0 #0A4FA3, 0 5px 8px rgba(0,0,0,0.6)',
    },
    down: {
      borderColor: 'rgba(255,255,255,0.08)',
      backgroundImage: 'linear-gradient(180deg, #1683F0, #127BE6)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 0 #0A4FA3, 0 1px 3px rgba(0,0,0,0.6)',
    },
  }),
  /** Allow with nothing to answer: the mockup's darker blue, also matte (K-3). */
  primaryUnlit: StyleSheet.create({
    up: {
      borderColor: 'rgba(255,255,255,0.05)',
      backgroundImage: 'linear-gradient(180deg, #1F4573, #1B3F69)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 3px 0 #0C2748, 0 5px 8px rgba(0,0,0,0.6)',
    },
    down: {
      borderColor: 'rgba(255,255,255,0.05)',
      backgroundImage: 'linear-gradient(180deg, #1D426E, #1A3C64)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 1px 0 #0C2748, 0 1px 3px rgba(0,0,0,0.6)',
    },
  }),
};
