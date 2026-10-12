export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface BusWire {
  from: Point;
  to: Point;
  /** Where the shared trunk runs down, left of the target column. */
  trunkX: number;
}

export const Port = {
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  BOTTOM: 'bottom',
} as const;
export type Port = (typeof Port)[keyof typeof Port];

export function portPoint(box: Box, port: Port): Point {
  switch (port) {
    case Port.LEFT:
      return { x: box.x, y: box.y + box.h / 2 };
    case Port.RIGHT:
      return { x: box.x + box.w, y: box.y + box.h / 2 };
    case Port.TOP:
      return { x: box.x + box.w / 2, y: box.y };
    case Port.BOTTOM:
      return { x: box.x + box.w / 2, y: box.y + box.h };
    default: {
      const exhaustive: never = port;
      throw new Error(`Unknown port: ${exhaustive}`);
    }
  }
}

const round = (value: number) => Math.round(value * 10) / 10;

/** Horizontal S-curve, the default wire between columns. */
export function horizontalWire(from: Point, to: Point): string {
  const k = Math.max(36, Math.abs(to.x - from.x) * 0.5);
  return `M${round(from.x)} ${round(from.y)}C${round(from.x + k)} ${round(from.y)} ${round(to.x - k)} ${round(to.y)} ${round(to.x)} ${round(to.y)}`;
}

/** Vertical S-curve, used when the graph stacks on small screens. */
export function verticalWire(from: Point, to: Point): string {
  const k = Math.max(24, Math.abs(to.y - from.y) * 0.5);
  return `M${round(from.x)} ${round(from.y)}C${round(from.x)} ${round(from.y + k)} ${round(to.x)} ${round(to.y - k)} ${round(to.x)} ${round(to.y)}`;
}

/** Every elbow on the bus turns on the same radius. */
const BUS_RADIUS = 8;
/** How far a wire drops before turning onto the rail: half the stacked row gap. */
const BUS_DROP = 14;

/**
 * Bus wire: drops from a port onto a rail, runs along it to a shared trunk,
 * down the trunk, and turns into a left-side port. Every wire uses the same
 * rail and trunk, so a stacked graph reads as one bus rather than a bundle,
 * and each turn is the same rounded elbow.
 */
export function busWire({ from, to, trunkX }: BusWire): string {
  const railY = from.y + BUS_DROP;
  const r = Math.max(0, Math.min(BUS_RADIUS, BUS_DROP, (from.x - trunkX) / 2, (to.y - railY) / 2, to.x - trunkX));
  return [
    `M${round(from.x)} ${round(from.y)}`,
    `V${round(railY - r)}`,
    `A${r} ${r} 0 0 1 ${round(from.x - r)} ${round(railY)}`,
    `H${round(trunkX + r)}`,
    `A${r} ${r} 0 0 0 ${round(trunkX)} ${round(railY + r)}`,
    `V${round(to.y - r)}`,
    `A${r} ${r} 0 0 0 ${round(trunkX + r)} ${round(to.y)}`,
    `H${round(to.x)}`,
  ].join('');
}

/**
 * Split wire: drops from a bottom port onto a rail halfway down the gap, runs
 * along it, and drops into a top port, turning on the same elbows as the bus.
 */
export function splitWire(from: Point, to: Point): string {
  const dx = to.x - from.x;
  const railY = from.y + (to.y - from.y) / 2;
  const r = Math.max(0, Math.min(BUS_RADIUS, Math.abs(dx) / 2, (to.y - from.y) / 2));
  if (r === 0) return `M${round(from.x)} ${round(from.y)}V${round(to.y)}`;
  const dir = Math.sign(dx);
  // Turning right off a downward run sweeps counter-clockwise; turning left, clockwise.
  const turnOff = dir > 0 ? 0 : 1;
  const turnDown = dir > 0 ? 1 : 0;
  return [
    `M${round(from.x)} ${round(from.y)}`,
    `V${round(railY - r)}`,
    `A${r} ${r} 0 0 ${turnOff} ${round(from.x + dir * r)} ${round(railY)}`,
    `H${round(to.x - dir * r)}`,
    `A${r} ${r} 0 0 ${turnDown} ${round(to.x)} ${round(railY + r)}`,
    `V${round(to.y)}`,
  ].join('');
}

export function clamp(value: number, range: readonly [number, number]): number {
  return Math.min(Math.max(value, range[0]), range[1]);
}
