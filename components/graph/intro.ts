/**
 * Single source for the first-load intro timeline, in milliseconds from
 * first paint. intro.ts owns the beats: the hero passes them to CSS as
 * custom properties, and the canvas mirrors them for the wires it draws
 * imperatively. The CSS fallbacks in globals.css quote the first beat of
 * each animation and would only show if a component forgot its delay.
 */

import { NodeKind } from './types';

export const INTRO = {
  /** Headline lines rise one after another from behind their mask. */
  headlineLine: 80,
  headlineLineStagger: 110,
  /** The availability line, then the focus line under the headline. */
  availability: 400,
  focusLine: 300,
  /** The lead paragraph, then the call-to-action row. */
  lead: 520,
  actions: 640,
  /** The wire that drops from the headline's port into the root node. */
  headlineWire: 650,
  root: 950,
  rootEdges: 1150,
  capability: 1250,
  capabilityEdges: 1450,
  project: 1550,
  /** The output card and the footer hint. */
  inspector: 1800,
  /** The dashed project→output feed wires. */
  inspectorWire: 1950,
  /** The signal pulse that runs the default plan once the map is up. */
  pulse: 2250,
  /**
   * The whole intro is over; routes kept alive by <Activity> don't replay it.
   * Outlasts the last default pulse (pulse, one 170ms column step, and the
   * 1100ms run in globals.css), which would otherwise be cut mid-wire.
   */
  done: 3600,
} as const;

/** When each column of nodes appears. */
export const NODE_DELAY: Record<NodeKind, number> = {
  [NodeKind.ROOT]: INTRO.root,
  [NodeKind.CAPABILITY]: INTRO.capability,
  [NodeKind.PROJECT]: INTRO.project,
};

/** Within a column, each node follows the previous one. */
export const NODE_STAGGER = 70;

/** Intro delay for a node: its column's beat plus its place in the column. */
export function nodeDelay(kind: NodeKind, index: number): number {
  return NODE_DELAY[kind] + index * NODE_STAGGER;
}

/** Intro delay for a headline line: the first line rises, the rest follow. */
export function headlineLineDelay(index: number): number {
  return INTRO.headlineLine + index * INTRO.headlineLineStagger;
}
