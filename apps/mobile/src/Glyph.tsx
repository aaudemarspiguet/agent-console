import Svg, { Path } from 'react-native-svg';
import type { Glyph as GlyphName } from './layout';

/**
 * The small plain glyphs on the wide keys (brief K-2, handoff T7). The paths are
 * the design boards' own, drawn on a 24-unit grid with a 2.2 stroke.
 */
const PATHS: Record<GlyphName, string> = {
  cross: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  mic: 'M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21',
  arrowUp: 'M12 20V5M5 12l7-7 7 7',
};

export function Glyph({ name, size, color }: { name: GlyphName; size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none">
      <Path
        d={PATHS[name]}
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
