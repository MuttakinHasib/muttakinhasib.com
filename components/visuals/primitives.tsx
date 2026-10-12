import { type ReactNode, useId } from 'react';
import { VIZ_FOG, VIZ_GRAPHITE, VIZ_INK, VIZ_PAPER, VIZ_SIGNAL } from './palette';

/**
 * SVG building blocks for the project reconstructions. Every visual ships a
 * wide and a narrow composition; these keep their node/wire vocabulary in sync
 * with the hero graph.
 */

export const VizTheme = {
  DARK: 'dark',
  LIGHT: 'light',
  SURFACE: 'surface',
} as const;
export type VizTheme = (typeof VizTheme)[keyof typeof VizTheme];

export const VizState = {
  NORMAL: 'normal',
  ACTIVE: 'active',
  DIM: 'dim',
  PENDING: 'pending',
} as const;
export type VizState = (typeof VizState)[keyof typeof VizState];

export interface Pt {
  x: number;
  y: number;
}

interface VizFrameProps {
  label: string;
  wide: ReactNode;
  narrow: ReactNode;
  wideBox?: string;
  narrowBox?: string;
  className?: string;
}

interface DotsProps {
  width: number;
  height: number;
  color: string;
  background: string;
}

interface VizNodeProps {
  x: number;
  y: number;
  w: number;
  h: number;
  kicker: string;
  title: string;
  theme?: VizTheme;
  state?: VizState;
  ports?: NodePorts;
  /** Colour for the active outline and ports; defaults to signal. */
  accent?: string;
  children?: ReactNode;
}

interface WireProps {
  from: Pt;
  to: Pt;
  state?: VizState;
  color?: string;
  vertical?: boolean;
  dashed?: boolean;
}

interface NodePorts {
  in?: boolean;
  out?: boolean;
  inActive?: boolean;
  outActive?: boolean;
}

interface PortProps extends Pt {
  fill: string;
  stroke: string;
}

interface BarProps extends Pt {
  w: number;
  fill: string;
  h?: number;
}

interface TagProps {
  x: number;
  y: number;
  label: string;
  fill: string;
  color: string;
  stroke?: string;
}

const NODE_FILL: Record<VizTheme, { fill: string; stroke: string; title: string; kicker: string }> = {
  [VizTheme.DARK]: { fill: '#20211d', stroke: '#45463f', title: VIZ_PAPER, kicker: VIZ_FOG },
  [VizTheme.LIGHT]: { fill: VIZ_PAPER, stroke: VIZ_INK, title: VIZ_INK, kicker: VIZ_GRAPHITE },
  [VizTheme.SURFACE]: { fill: '#fbfaf6', stroke: VIZ_INK, title: VIZ_INK, kicker: VIZ_GRAPHITE },
};

export function VizFrame({
  label,
  wide,
  narrow,
  wideBox = '0 0 1200 760',
  narrowBox = '0 0 600 760',
  className,
}: VizFrameProps) {
  return (
    <figure className={`viz ${className ?? ''}`} role="img" aria-label={label}>
      <svg className="viz-wide" viewBox={wideBox} aria-hidden="true" focusable="false">
        {wide}
      </svg>
      <svg className="viz-narrow" viewBox={narrowBox} aria-hidden="true" focusable="false">
        {narrow}
      </svg>
    </figure>
  );
}

export function Dots({ width, height, color, background }: DotsProps) {
  const id = useId();
  return (
    <>
      <defs>
        <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.2" fill={color} />
        </pattern>
      </defs>
      <rect width={width} height={height} fill={background} />
      <rect width={width} height={height} fill={`url(#${id})`} />
    </>
  );
}

/**
 * The horizontal cubic-bezier wire the editor draws between ports. `k` is the
 * control-point offset; scenes with their own minimum bend pass it explicitly.
 */
export function wirePath(from: Pt, to: Pt, k?: number): string {
  const bend = k ?? Math.max(30, Math.abs(to.x - from.x) * 0.5);
  return `M${from.x} ${from.y}C${from.x + bend} ${from.y} ${to.x - bend} ${to.y} ${to.x} ${to.y}`;
}

export function verticalPath(from: Pt, to: Pt): string {
  const k = Math.max(24, Math.abs(to.y - from.y) * 0.5);
  return `M${from.x} ${from.y}C${from.x} ${from.y + k} ${to.x} ${to.y - k} ${to.x} ${to.y}`;
}

export function Wire({ from, to, state = VizState.NORMAL, color = VIZ_INK, vertical, dashed }: WireProps) {
  return (
    <path
      d={vertical ? verticalPath(from, to) : wirePath(from, to)}
      fill="none"
      stroke={color}
      strokeWidth={state === VizState.ACTIVE ? 2 : 1.5}
      strokeDasharray={dashed ? '5 6' : undefined}
      opacity={state === VizState.DIM ? 0.28 : 1}
    />
  );
}

export function Port({ x, y, fill, stroke }: PortProps) {
  return <circle cx={x} cy={y} r={5.5} fill={fill} stroke={stroke} strokeWidth={1.75} />;
}

export function VizNode({
  x,
  y,
  w,
  h,
  kicker,
  title,
  theme = VizTheme.LIGHT,
  state = VizState.NORMAL,
  ports = {},
  accent = VIZ_SIGNAL,
  children,
}: VizNodeProps) {
  const colors = NODE_FILL[theme];
  const signal = accent;
  return (
    <g opacity={state === VizState.DIM ? 0.4 : 1}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={7}
        fill={colors.fill}
        stroke={state === VizState.ACTIVE ? signal : colors.stroke}
        strokeWidth={state === VizState.ACTIVE ? 2.5 : 1.25}
        strokeDasharray={state === VizState.PENDING ? '6 5' : undefined}
      />
      <text x={x + 16} y={y + 26} className="v-kicker" fill={colors.kicker}>
        {kicker}
      </text>
      <text x={x + 16} y={y + 52} className="v-title" fill={colors.title}>
        {title}
      </text>
      {children}
      {ports.in ? (
        <Port x={x} y={y + h / 2} fill={ports.inActive ? signal : colors.fill} stroke={colors.stroke} />
      ) : null}
      {ports.out ? (
        <Port x={x + w} y={y + h / 2} fill={ports.outActive ? signal : colors.fill} stroke={colors.stroke} />
      ) : null}
    </g>
  );
}

export function Tag({ x, y, label, fill, color, stroke }: TagProps) {
  const width = label.length * 8.4 + 18;
  return (
    <g>
      <rect x={x} y={y} width={width} height={22} rx={4} fill={fill} stroke={stroke} strokeWidth={stroke ? 1 : 0} />
      <text x={x + 9} y={y + 15} className="v-kicker" fill={color}>
        {label}
      </text>
    </g>
  );
}

export function Bar({ x, y, w, fill, h = 8 }: BarProps) {
  return <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} />;
}

interface CursorProps extends Pt {
  /** Keep the SVG's default miter joins, where the scene draws the cursor unstyled. */
  miter?: boolean;
}

/** The pointer arrow the editor draws for remote and guided actions. */
export function Cursor({ x, y, miter }: CursorProps) {
  return (
    <path
      transform={`translate(${x} ${y})`}
      d="M0 0L0 22L6 16.5L10.5 26L14.5 24.2L10 14.8L17.5 14.8Z"
      fill={VIZ_PAPER}
      stroke={VIZ_INK}
      strokeWidth="1.4"
      strokeLinejoin={miter ? undefined : 'round'}
    />
  );
}

interface SelectionBoxProps extends Pt {
  w: number;
  h: number;
  /** Omit where the scene draws its own frame and only the corner handles are wanted. */
  frame?: boolean;
}

/** A selection: a faint frame with a paper handle pinned to each corner. */
export function SelectionBox({ x, y, w, h, frame = true }: SelectionBoxProps) {
  const corners: [number, number][] = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ];
  return (
    <g>
      {frame ? <rect x={x} y={y} width={w} height={h} fill="none" stroke="rgba(244,241,232,0.55)" strokeWidth={1} /> : null}
      {corners.map(([cx, cy]) => (
        <rect key={`${cx}-${cy}`} x={cx - 4} y={cy - 4} width={8} height={8} fill={VIZ_PAPER} />
      ))}
    </g>
  );
}
