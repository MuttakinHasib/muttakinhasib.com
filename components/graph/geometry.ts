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
  gutterX: number;
}

export interface ChannelWire {
  from: Point;
  to: Point;
  /** The height of the clear lane the wire runs along, above everything it must not cross. */
  channelY: number;
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

/**
 * Bus wire: drops from a port, runs down a shared gutter, then turns into a
 * left-side port. Keeps stacked layouts readable instead of crossing nodes.
 */
export function busWire({ from, to, gutterX }: BusWire): string {
  const drop = from.y + 14;
  const turn = 16;
  return [
    `M${round(from.x)} ${round(from.y)}`,
    `L${round(from.x)} ${round(drop)}`,
    `C${round(from.x)} ${round(drop + turn)} ${round(gutterX)} ${round(drop)} ${round(gutterX)} ${round(drop + turn * 1.5)}`,
    `L${round(gutterX)} ${round(to.y - turn)}`,
    `C${round(gutterX)} ${round(to.y - 4)} ${round(gutterX + 4)} ${round(to.y)} ${round(to.x)} ${round(to.y)}`,
  ].join('');
}

/**
 * Channel wire: rises out of a port into a clear lane, runs along it, and
 * settles into the target. Lets a wire cross a crowded graph without passing
 * behind its nodes.
 */
export function channelWire({ from, to, channelY }: ChannelWire): string {
  const rise = 96;
  const settle = Math.min(96, Math.max(0, (to.x - from.x - rise) / 2));
  return [
    `M${round(from.x)} ${round(from.y)}`,
    `C${round(from.x + rise * 0.6)} ${round(from.y)} ${round(from.x + rise * 0.4)} ${round(channelY)} ${round(from.x + rise)} ${round(channelY)}`,
    `L${round(to.x - settle)} ${round(channelY)}`,
    `C${round(to.x - settle * 0.4)} ${round(channelY)} ${round(to.x - settle * 0.6)} ${round(to.y)} ${round(to.x)} ${round(to.y)}`,
  ].join('');
}

export function clamp(value: number, range: readonly [number, number]): number {
  return Math.min(Math.max(value, range[0]), range[1]);
}
