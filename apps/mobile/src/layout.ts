import type { KeyId } from '@deck/protocol';

/** The key grid from product-brief.md, K-11: five columns by four rows. */
export const COLUMNS = 5;
export const ROWS = 4;

/**
 * How a key cap is finished, as on the design boards:
 * number keys are clear glass, action keys are solid, and Allow is the one tinted key.
 */
export type KeyLook = 'number' | 'action' | 'primary';

export interface KeyDef {
  id: KeyId;
  /** Fixed legend. It never changes during use (K-2). */
  legend: string;
  /** What a screen reader says, when the legend alone is not enough. */
  spoken?: string;
  look: KeyLook;
  column: number;
  row: number;
  /** Cells covered. Both default to 1. */
  wide?: number;
  high?: number;
  /** Corner the legend sits in. Defaults to the left. */
  legendSide?: 'left' | 'right';
  /**
   * Small plain glyph above the legend, on the same side. Only wide keys have
   * one; on single-cell keys the word alone is clearer (T7, chosen 2026-11-13).
   */
  glyph?: Glyph;
  /** Small label in the corner opposite the glyph, for a gesture the legend can't show. */
  hint?: string;
}

/** The glyphs drawn on keys. Paths are in `Glyph.tsx`. */
export type Glyph = 'cross' | 'check' | 'mic' | 'arrowUp';

export const DEFAULT_KEYS: KeyDef[] = [
  { id: 'session1', legend: '1', spoken: 'Session 1', look: 'number', column: 0, row: 0 },
  { id: 'session2', legend: '2', spoken: 'Session 2', look: 'number', column: 1, row: 0 },
  { id: 'session3', legend: '3', spoken: 'Session 3', look: 'number', column: 2, row: 0 },
  { id: 'deny', legend: 'deny', look: 'action', column: 3, row: 0, wide: 2, glyph: 'cross' },

  { id: 'session4', legend: '4', spoken: 'Session 4', look: 'number', column: 0, row: 1 },
  { id: 'session5', legend: '5', spoken: 'Session 5', look: 'number', column: 1, row: 1 },
  { id: 'session6', legend: '6', spoken: 'Session 6', look: 'number', column: 2, row: 1 },
  { id: 'allow', legend: 'allow', look: 'primary', column: 3, row: 1, wide: 2, high: 2, legendSide: 'right', glyph: 'check' },

  // The two saved replies are examples. The real ones are written on the PC (R-1).
  { id: 'reply1', legend: 'run tests', spoken: 'Saved reply: run tests', look: 'action', column: 0, row: 2 },
  { id: 'reply2', legend: 'explain', spoken: 'Saved reply: explain', look: 'action', column: 1, row: 2 },
  { id: 'alwaysAllow', legend: 'always allow', spoken: 'Always allow for this session', look: 'action', column: 2, row: 2 },

  { id: 'redirect', legend: 'redirect', spoken: 'Redirect, hold to talk', look: 'action', column: 0, row: 3, wide: 2, glyph: 'mic', hint: 'hold to talk' },
  { id: 'cancel', legend: 'cancel', look: 'action', column: 2, row: 3 },
  { id: 'send', legend: 'send', look: 'action', column: 3, row: 3, wide: 2, legendSide: 'right', glyph: 'arrowUp' },
];
