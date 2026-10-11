import { EditorIcon, Glyph } from './editor-icons';
import type { Pt } from './primitives';

/**
 * The toolbar that floats over a multi-selection, as the editor draws it:
 * Tidy, Download, Align, and Wrap in Section, then Build App and Run Selected,
 * each behind a divider.
 */

interface SelectionToolbarProps extends Pt {
  /** Narrow layout, where labels set larger and buttons widen to fit. */
  compact?: boolean;
}

interface ToolbarLayoutRequest {
  x: number;
  compact?: boolean;
}

export interface SelectionToolbarLayout {
  width: number;
  buildX: number;
  buildW: number;
  runX: number;
  runW: number;
}

const NODE = '#1b1b1a';
const STROKE = '#30302c';
const BUTTON = '#2c2c29';
const PAPER = '#f4f1e8';
const FOG = '#a9a79c';
const CELL = 34;

export function selectionToolbarLayout({ x, compact }: ToolbarLayoutRequest): SelectionToolbarLayout {
  const buildX = x + 6 + CELL * 2 + 48 + CELL + 14;
  const buildW = compact ? 138 : 124;
  const runX = buildX + buildW + 14;
  const runW = compact ? 142 : 124;
  return { width: runX + runW + 6 - x, buildX, buildW, runX, runW };
}

export function SelectionToolbar({ x, y, compact }: SelectionToolbarProps) {
  const { width, buildX, buildW, runX, runW } = selectionToolbarLayout({ x, compact });
  const iconY = y + 12;
  const alignX = x + 6 + CELL * 2;
  const wrapX = alignX + 48;
  return (
    <g>
      <rect x={x} y={y} width={width} height={44} rx={14} fill={NODE} stroke={STROKE} />
      <EditorIcon x={x + 14} y={iconY} glyph={Glyph.TIDY} size={20} color={FOG} />
      <EditorIcon x={x + 14 + CELL} y={iconY} glyph={Glyph.DOWNLOAD} size={20} color={FOG} />
      <EditorIcon x={alignX + 6} y={iconY} glyph={Glyph.ALIGN_LEFT} size={20} color={FOG} />
      <EditorIcon x={alignX + 30} y={iconY + 6} glyph={Glyph.CHEVRON_DOWN} size={9} color={FOG} strokeWidth={2} />
      <EditorIcon x={wrapX + 7} y={iconY} glyph={Glyph.WRAP_IN_SECTION} size={20} color={FOG} />
      <line x1={buildX - 7} y1={y + 14} x2={buildX - 7} y2={y + 30} stroke={STROKE} />
      <rect x={buildX} y={y + 6} width={buildW} height={32} rx={10} fill={BUTTON} />
      <EditorIcon x={buildX + 12} y={y + 14} glyph={Glyph.APPS} size={16} color={PAPER} strokeWidth={2} />
      <text x={buildX + 34} y={y + 27} className="v-label" fill={PAPER}>
        Build App
      </text>
      <line x1={runX - 7} y1={y + 14} x2={runX - 7} y2={y + 30} stroke={STROKE} />
      <rect x={runX} y={y + 6} width={runW} height={32} rx={10} fill={BUTTON} />
      <text x={runX + runW / 2} y={y + 27} textAnchor="middle" className="v-label" fill={PAPER}>
        Run Selected
      </text>
    </g>
  );
}
