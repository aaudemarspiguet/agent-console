import type { ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { SkiaKey } from './SkiaKey';
import { dotStyle, GREEN, glowStyle, type Light, shared, WHITE } from './shared';

/**
 * TEMPORARY (handoff task T5). The same lit number key drawn five ways, each
 * lit green and white, so the user can pick a material from phone screenshots.
 * Shown instead of the deck while `SCREEN` in App.tsx is 'materials'.
 */

type Sample = { id: string; title: string; note: string; render: (light: Light) => ReactNode };

/** The light and number, on top of whatever the cap is made of. */
function Legend({ light }: { light: Light }) {
  return (
    <View style={shared.centre} pointerEvents="none">
      <View style={[shared.dot, dotStyle(light)]} />
      <Text style={shared.number}>2</Text>
    </View>
  );
}

const SAMPLES: Sample[] = [
  {
    id: 'A',
    title: 'A · Plain',
    note: 'Gradient glow, see-through cap, no blur. Any phone.',
    render: (light) => (
      <View style={shared.well}>
        <View style={glowStyle(light)} />
        <View style={[shared.capBox, shared.capShadow, shared.capFace]} />
        <Legend light={light} />
      </View>
    ),
  },
  {
    id: 'B',
    title: 'B · expo-blur',
    note: 'Cap blurs the glow under it. Android needs extra setup.',
    render: (light) => (
      <View style={shared.well}>
        <View style={glowStyle(light)} />
        <View style={[shared.capBox, shared.capShadow]}>
          <BlurView intensity={40} tint="default" style={[StyleSheet.absoluteFill, styles.clip]} />
          <View style={[StyleSheet.absoluteFill, shared.capFace]} />
        </View>
        <Legend light={light} />
      </View>
    ),
  },
  {
    id: 'C1',
    title: 'C1 · Glass regular',
    note: "Apple's Liquid Glass. iOS 26 only.",
    render: (light) => (
      <View style={shared.well}>
        <View style={glowStyle(light)} />
        <View style={[shared.capBox, shared.capShadow]}>
          <GlassView glassEffectStyle="regular" colorScheme="dark" style={[StyleSheet.absoluteFill, styles.clip]} />
        </View>
        <Legend light={light} />
      </View>
    ),
  },
  {
    id: 'C2',
    title: 'C2 · Glass clear',
    note: 'Clearer Liquid Glass. iOS 26 only.',
    render: (light) => (
      <View style={shared.well}>
        <View style={glowStyle(light)} />
        <View style={[shared.capBox, shared.capShadow]}>
          <GlassView glassEffectStyle="clear" colorScheme="dark" style={[StyleSheet.absoluteFill, styles.clip]} />
        </View>
        <Legend light={light} />
      </View>
    ),
  },
  ...[0.25, 0.45, 0.65].map((alpha, i) => ({
    id: `T${i + 1}`,
    title: `C2 · tint ${Math.round(alpha * 100)}%`,
    note: `Clear glass tinted black at ${Math.round(alpha * 100)}%, for a darker backdrop behind the legend.`,
    render: (light: Light) => (
      <View style={shared.well}>
        <View style={glowStyle(light)} />
        <View style={[shared.capBox, shared.capShadow]}>
          <GlassView
            glassEffectStyle="clear"
            colorScheme="dark"
            tintColor={`rgba(0,0,0,${alpha})`}
            style={[StyleSheet.absoluteFill, styles.clip]}
          />
        </View>
        <Legend light={light} />
      </View>
    ),
  })),
  {
    id: 'D',
    title: 'D · Skia',
    note: 'Real blurred glow and backdrop blur, drawn by Skia.',
    render: (light) => (
      <View style={shared.well}>
        <View style={[StyleSheet.absoluteFill, shared.capShadow, styles.skiaShadow]} />
        <SkiaKey light={light} />
        <Legend light={light} />
      </View>
    ),
  },
];

/** The screen fits five columns. Round 2 compares the glass options for legibility; round 1 was A, B, C1, C2, D. */
const SHOWN = ['C1', 'C2', 'T1', 'T2', 'T3'];

function glassStatus(): string {
  if (Platform.OS !== 'ios') return `glass: not on ${Platform.OS} (C1 and C2 show a plain view)`;
  return `glass API ${isGlassEffectAPIAvailable() ? 'available' : 'missing'}, Liquid Glass ${isLiquidGlassAvailable() ? 'on' : 'off'}`;
}

export function Materials() {
  return (
    <View style={styles.plate}>
      <Text style={styles.heading}>T5 · materials (temporary) · {glassStatus()}</Text>
      <View style={styles.columns}>
        {SAMPLES.filter((s) => SHOWN.includes(s.id)).map((s) => (
          <View key={s.id} style={styles.column}>
            <Text style={styles.title}>{s.title}</Text>
            {s.render(GREEN)}
            {s.render(WHITE)}
            <Text style={styles.note}>{s.note}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    flex: 1,
    paddingHorizontal: 62,
    paddingTop: 16,
    gap: 14,
    backgroundColor: '#232326',
    backgroundImage: 'linear-gradient(180deg, #2C2C30, #19191B)',
  },
  heading: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  columns: { flexDirection: 'row', gap: 9 },
  column: { width: 143, gap: 12 },
  title: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  note: { color: 'rgba(235,235,245,0.6)', fontSize: 11, lineHeight: 14 },
  /** expo-blur and GlassView ignore borderRadius unless they clip. */
  clip: { borderRadius: 10, overflow: 'hidden' },
  /** Skia draws the cap, so its lift shadow sits on a view the cap's size. */
  skiaShadow: { left: 3, top: 3, right: 3, bottom: 6, borderRadius: 10 },
});
