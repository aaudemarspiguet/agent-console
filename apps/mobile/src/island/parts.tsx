import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, Text, type TextStyle, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { AgentId, Session } from './demo';
import type { BadgeGlyph, Tone } from './store';

/** Glyph paths, from the mockup generator (`gen-island.ps1`) and the prototype. */
const PATHS: Record<BadgeGlyph | 'arc' | 'dots', string> = {
  arc: 'M12 3a9 9 0 1 0 9 9',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  checks: 'M2 12.5l4 4 8-9M11 15l1.5 1.5 8.5-9',
  bang: 'M12 5v9M12 18.5h.01',
  up: 'M12 20V5M5 12l7-7 7 7',
  pause: 'M9 6v12M15 6v12',
  dots: 'M6 12h.01M12 12h.01M18 12h.01',
  cross: 'M7 7l10 10M17 7L7 17',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  plus: 'M12 5v14M5 12h14',
  mic: 'M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21',
};

export function Icon({ name, size, color, stroke }: { name: keyof typeof PATHS; size: number; color: string; stroke: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={PATHS[name]} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** The native driver does not exist on the web. */
const NATIVE = Platform.OS !== 'web';

/** A glyph that turns once a second: the working arc. Still when Reduce Motion is on. */
export function Spinner({ size, color, stroke, still }: { size: number; color: string; stroke: number; still: boolean }) {
  const turn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return undefined;
    const loop = Animated.loop(Animated.timing(turn, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: NATIVE }));
    loop.start();
    return () => loop.stop();
  }, [turn, still]);
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Icon name="arc" size={size} color={color} stroke={stroke} />
    </Animated.View>
  );
}

/** A dot that pulses to 45% opacity and 80% size: the request dot (1.1 s) and the listening dot (0.9 s). */
export function PulseDot({ size, color, period, glow, still }: { size: number; color: string; period: number; glow: boolean; still: boolean }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return undefined;
    const half = { duration: period / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: NATIVE };
    const loop = Animated.loop(Animated.sequence([Animated.timing(t, { toValue: 1, ...half }), Animated.timing(t, { toValue: 0, ...half })]));
    loop.start();
    return () => loop.stop();
  }, [t, period, still]);
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        boxShadow: glow ? `0 0 10px ${color}` : undefined,
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 0.8] }) }],
      }}
    />
  );
}

/** The transcript's blinking caret. */
export function Caret({ still }: { still: boolean }) {
  const on = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (still) return undefined;
    const step = (v: number) => Animated.timing(on, { toValue: v, duration: 0, useNativeDriver: NATIVE });
    const loop = Animated.loop(Animated.sequence([step(1), Animated.delay(500), step(0), Animated.delay(500)]));
    loop.start();
    return () => loop.stop();
  }, [on, still]);
  return <Animated.View style={[styles.caret, { opacity: on }]} />;
}

const AGENT_IMAGES: Record<AgentId, number> = {
  claudeCode: require('../../assets/agents/claude-code.png'),
  codex: require('../../assets/agents/codex.png'),
  cursor: require('../../assets/agents/cursor.png'),
  gemini: require('../../assets/agents/gemini.png'),
};

/** The agent's own icon (A-11). The user chose the real logos on 2026-11-14; trademark use is theirs to settle before release. */
export function AgentIcon({ agent, size }: { agent: AgentId; size: number }) {
  return <Image source={AGENT_IMAGES[agent]} style={{ width: size, height: size, borderRadius: 7 }} resizeMode="contain" />;
}

export const GREY = 'rgba(235,235,245,0.6)';

/** Each state's label, colour and glyph (A-3), as in the session list board. */
export function statusOf(session: Session, pending: boolean) {
  if (pending) return { label: 'Needs Approval', color: '#FF9F0A', glyph: 'bang' as const };
  switch (session.state) {
    case 'running':
      return { label: session.queued ? 'Running, Follow-Up Queued' : 'Running', color: GREY, glyph: 'arc' as const };
    case 'thinking':
      return { label: session.queued ? 'Thinking, Follow-Up Queued' : 'Thinking', color: '#64D2FF', glyph: 'dots' as const };
    case 'finished':
      return { label: 'Finished', color: '#30D158', glyph: 'check' as const };
    case 'error':
      return { label: 'Error', color: '#FF453A', glyph: 'cross' as const };
    default:
      return { label: 'Idle', color: GREY, glyph: 'pause' as const };
  }
}

/** The glyph at the end of a row or header, in its state's colour and stroke. */
export function StatusGlyph({ session, pending, still }: { session: Session; pending: boolean; still: boolean }) {
  const st = statusOf(session, pending);
  if (st.glyph === 'bang') return <Icon name="bang" size={18} color="#FF9F0A" stroke={2.6} />;
  if (st.glyph === 'arc') return <Spinner size={16} color="#FFFFFF" stroke={2.4} still={still} />;
  if (st.glyph === 'dots') return <Icon name="dots" size={16} color="#64D2FF" stroke={3} />;
  if (st.glyph === 'check') return <Icon name="check" size={16} color="#30D158" stroke={2.8} />;
  if (st.glyph === 'cross') return <Icon name="cross" size={16} color="#FF453A" stroke={2.6} />;
  return <Icon name="pause" size={16} color={GREY} stroke={2.4} />;
}

const BADGES: Record<Tone, { bg: string; fg: string }> = {
  green: { bg: 'rgba(48,209,88,0.18)', fg: '#30D158' },
  red: { bg: 'rgba(255,69,58,0.18)', fg: '#FF453A' },
  blue: { bg: 'rgba(10,132,255,0.2)', fg: '#409CFF' },
  amber: { bg: 'rgba(255,159,10,0.18)', fg: '#FF9F0A' },
  neutral: { bg: 'rgba(235,235,245,0.12)', fg: 'rgba(235,235,245,0.8)' },
};

/** The result badge: a 42-point circle tinted at 18% of its colour, with a 20-point glyph. */
export function Badge({ tone, glyph }: { tone: Tone; glyph: BadgeGlyph }) {
  const b = BADGES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: b.bg }]}>
      <Icon name={glyph} size={20} color={b.fg} stroke={2.6} />
    </View>
  );
}

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace" });

/** Type from the mockups (handoff T13, "Text and parts"). */
export const type = StyleSheet.create({
  title: { color: '#FFFFFF', fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.43 },
  sub: { color: GREY, fontSize: 13, lineHeight: 18, letterSpacing: -0.08 },
  status: { color: GREY, fontSize: 12, lineHeight: 16 },
  row: { color: '#FFFFFF', fontSize: 15, lineHeight: 20, fontWeight: '500', letterSpacing: -0.23 },
  foot: { color: GREY, fontSize: 12, lineHeight: 16 },
  code: { color: '#FFFFFF', fontFamily: MONO, fontSize: 13, lineHeight: 20 },
  say: { color: '#FFFFFF', fontSize: 17, lineHeight: 23, letterSpacing: -0.43 },
  number: { width: 10, color: GREY, fontSize: 13, lineHeight: 18 },
  count: { color: '#FFFFFF', fontSize: 15, lineHeight: 18, fontWeight: '600', fontVariant: ['tabular-nums'] },
}) satisfies Record<string, TextStyle>;

const styles = StyleSheet.create({
  badge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caret: {
    width: 2,
    height: 19,
    marginLeft: 2,
    backgroundColor: '#FF453A',
    transform: [{ translateY: 2 }],
  },
});
