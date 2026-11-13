import { useEffect, useState } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useCameraSide } from './useCameraSide';

/**
 * TEMPORARY (handoff task T1). Shows the phone's own screen size and safe-area
 * insets, and draws a 5-point grid along both short edges so the camera
 * cutout's position can be read off by eye. Remove once the figures are in
 * docs/HANDOFF.md.
 */

/** Width of the measuring grid at each end of the screen, in points. */
const STRIP = 70;
const STEP = 5;

const ORIENTATION_NAMES: Record<number, string> = {
  [ScreenOrientation.Orientation.UNKNOWN]: 'UNKNOWN',
  [ScreenOrientation.Orientation.PORTRAIT_UP]: 'PORTRAIT_UP',
  [ScreenOrientation.Orientation.PORTRAIT_DOWN]: 'PORTRAIT_DOWN',
  [ScreenOrientation.Orientation.LANDSCAPE_LEFT]: 'LANDSCAPE_LEFT',
  [ScreenOrientation.Orientation.LANDSCAPE_RIGHT]: 'LANDSCAPE_RIGHT',
};

function useOrientationName(): string {
  const [name, setName] = useState('?');
  useEffect(() => {
    let mounted = true;
    const apply = (o: ScreenOrientation.Orientation) => mounted && setName(ORIENTATION_NAMES[o] ?? String(o));
    void ScreenOrientation.getOrientationAsync().then(apply);
    const sub = ScreenOrientation.addOrientationChangeListener((e) => apply(e.orientationInfo.orientation));
    return () => {
      mounted = false;
      ScreenOrientation.removeOrientationChangeListener(sub);
    };
  }, []);
  return name;
}

/** Grid lines across one end strip. `side` is the screen edge the strip touches. */
function EdgeGrid({ side, height }: { side: 'left' | 'right'; height: number }) {
  const lines = [];
  // Vertical lines: distance in from the edge.
  for (let d = 0; d <= STRIP; d += STEP) {
    const major = d % 10 === 0;
    lines.push(
      <View
        key={`v${d}`}
        style={[styles.vLine, { [side]: d, opacity: major ? 0.7 : 0.3 }]}
      />,
    );
    if (d % 20 === 0 && d > 0) {
      for (const y of [height / 2 - 100, height / 2 + 88]) {
        lines.push(
          <Text key={`vl${d}-${y}`} style={[styles.tick, styles.tickX, { top: y, [side]: d - 8 }]}>
            {d}
          </Text>,
        );
      }
    }
  }
  // Horizontal lines: distance down from the top.
  for (let y = 0; y <= height; y += STEP) {
    const major = y % 10 === 0;
    lines.push(
      <View
        key={`h${y}`}
        style={[styles.hLine, { top: y, [side]: 0, opacity: major ? 0.7 : 0.3 }]}
      />,
    );
    if (y % 20 === 0) {
      lines.push(
        <Text key={`hl${y}`} style={[styles.tick, styles.tickY, { top: y - 6, [side]: STRIP + 3 }]}>
          {y}
        </Text>,
      );
    }
  }
  return <>{lines}</>;
}

export function Measure() {
  const win = useWindowDimensions();
  const screen = Dimensions.get('screen');
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  const orientation = useOrientationName();
  const cameraSide = useCameraSide();
  const [lock, setLock] = useState('none (tap to force a side)');

  /** Forces the other landscape direction, for phones whose rotation lock keeps the app on one side. */
  const flip = () => {
    const next =
      orientation === 'LANDSCAPE_LEFT'
        ? ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
        : ScreenOrientation.OrientationLock.LANDSCAPE_LEFT;
    const name = next === ScreenOrientation.OrientationLock.LANDSCAPE_LEFT ? 'LANDSCAPE_LEFT' : 'LANDSCAPE_RIGHT';
    ScreenOrientation.lockAsync(next).then(
      () => setLock(`asked for ${name}`),
      (error: unknown) => setLock(`lock ${name} failed: ${String(error)}`),
    );
  };

  const rows: [string, string][] = [
    ['os', `${Platform.OS} ${Platform.Version}`],
    ['window', `${win.width} x ${win.height}`],
    ['screen', `${screen.width} x ${screen.height}`],
    ['scale', `${win.scale}   fontScale ${win.fontScale}`],
    ['insets', `top ${insets.top}  right ${insets.right}  bottom ${insets.bottom}  left ${insets.left}`],
    ['safe frame', `x ${frame.x}  y ${frame.y}  ${frame.width} x ${frame.height}`],
    ['orientation', orientation],
    ['camera side', `${cameraSide} (as the app guesses it)`],
    ['lock', lock],
  ];

  useEffect(() => {
    console.log(
      '[T1 measure]',
      JSON.stringify({ os: Platform.Version, window: win, screen, insets, frame, orientation, cameraSide, lock }),
    );
  }, [win, screen.width, screen.height, insets, frame, orientation, cameraSide, lock]);

  return (
    <Pressable style={styles.root} onPress={flip}>
      <EdgeGrid side="left" height={win.height} />
      <EdgeGrid side="right" height={win.height} />
      <View style={[styles.safe, { top: insets.top, right: insets.right, bottom: insets.bottom, left: insets.left }]} />
      <View style={styles.panel}>
        <Text style={styles.title}>T1 · measure (temporary)</Text>
        {rows.map(([label, value]) => (
          <Text key={label} style={styles.row}>
            <Text style={styles.label}>{label.padEnd(12)}</Text>
            {value}
          </Text>
        ))}
        <Text style={styles.note}>
          Grid: lines every 5 pt, brighter every 10 pt, numbered every 20 pt (in from the edge, and down from the top).
          Dashed box: the safe area. Tap anywhere to flip to the other landscape side.
        </Text>
      </View>
    </Pressable>
  );
}

const mono = Platform.select({ ios: 'Menlo', default: 'monospace' });

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#101012' },
  vLine: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: '#5AC8FA' },
  hLine: { position: 'absolute', width: STRIP, height: StyleSheet.hairlineWidth, backgroundColor: '#5AC8FA' },
  tick: { position: 'absolute', fontFamily: mono, fontSize: 8, color: '#9FD8F5' },
  /** Distance-in labels, every 20 pt so two-digit numbers do not touch. */
  tickX: { width: 16, textAlign: 'center' },
  /** Down-from-top labels, wide enough that three digits stay on one line. */
  tickY: { width: 24, textAlign: 'left' },
  safe: { position: 'absolute', borderWidth: 1, borderStyle: 'dashed', borderColor: '#FF9F0A' },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: STRIP + 30,
    right: STRIP + 30,
    justifyContent: 'center',
    gap: 4,
  },
  title: { fontFamily: mono, fontSize: 13, color: '#FFFFFF', marginBottom: 6 },
  row: { fontFamily: mono, fontSize: 12, color: '#FFFFFF' },
  label: { color: '#8E8E93' },
  note: { fontFamily: mono, fontSize: 10, color: '#8E8E93', marginTop: 8 },
});
