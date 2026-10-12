/**
 * Execution order for a no-code agent graph: edges on the canvas decide what
 * runs first. Kahn's algorithm gives the order; longest-path depth gives the
 * auto-layout column. Cycles are rejected before they reach the graph.
 */

export interface DagEdge {
  from: string;
  to: string;
}

export interface ExecutionPlan {
  order: string[];
  depth: Map<string, number>;
}

export interface LayoutOptions {
  nodeWidth: number;
  nodeHeight: number;
  /** Space between layers, along the direction the graph runs. */
  gapMain: number;
  /** Space between tasks in the same layer. */
  gapCross: number;
  /** Top to bottom instead of left to right, for narrow screens. */
  vertical: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface LayoutRequest {
  plan: ExecutionPlan;
  options: LayoutOptions;
}

export function executionPlan(nodes: readonly string[], edges: readonly DagEdge[]): ExecutionPlan {
  const indegree = new Map(nodes.map((id) => [id, 0]));
  const outgoing = new Map<string, string[]>(nodes.map((id) => [id, []]));
  for (const { from, to } of edges) {
    if (!indegree.has(from) || !indegree.has(to)) continue;
    indegree.set(to, (indegree.get(to) ?? 0) + 1);
    outgoing.get(from)?.push(to);
  }

  const depth = new Map(nodes.map((id) => [id, 0]));
  const ready = nodes.filter((id) => indegree.get(id) === 0);
  const visited: string[] = [];
  while (ready.length > 0) {
    const id = ready.shift() as string;
    visited.push(id);
    for (const next of outgoing.get(id) ?? []) {
      depth.set(next, Math.max(depth.get(next) ?? 0, (depth.get(id) ?? 0) + 1));
      const remaining = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, remaining);
      if (remaining === 0) ready.push(next);
    }
  }

  const rank = new Map(nodes.map((id, index) => [id, index]));
  const order = [...visited].sort(
    (a, b) => (depth.get(a) ?? 0) - (depth.get(b) ?? 0) || (rank.get(a) ?? 0) - (rank.get(b) ?? 0),
  );
  return { order, depth };
}

/** True when adding `candidate` would let execution loop back on itself. */
export function createsCycle(edges: readonly DagEdge[], candidate: DagEdge): boolean {
  if (candidate.from === candidate.to) return true;
  const stack = [candidate.to];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const id = stack.pop() as string;
    if (id === candidate.from) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const edge of edges) if (edge.from === id) stack.push(edge.to);
  }
  return false;
}

/** The run order grouped by layer: tasks in the same layer have no edge between them. */
export function layersOf(plan: ExecutionPlan): string[][] {
  const layers: string[][] = [];
  for (const id of plan.order) {
    const depth = plan.depth.get(id) ?? 0;
    (layers[depth] ??= []).push(id);
  }
  return layers.filter((layer) => layer.length > 0);
}

/**
 * Auto-layout: one column per layer, left to right (or one row per layer, top
 * to bottom), each layer centred on the same line, tasks in run order.
 */
export function autoLayout({ plan, options }: LayoutRequest): Map<string, Position> {
  const { nodeWidth, nodeHeight, gapMain, gapCross, vertical } = options;
  const along = vertical ? nodeHeight : nodeWidth;
  const across = vertical ? nodeWidth : nodeHeight;
  const positions = new Map<string, Position>();
  layersOf(plan).forEach((layer, index) => {
    const main = index * (along + gapMain);
    const span = layer.length * across + (layer.length - 1) * gapCross;
    layer.forEach((id, slot) => {
      const cross = -span / 2 + slot * (across + gapCross);
      positions.set(id, vertical ? { x: cross, y: main } : { x: main, y: cross });
    });
  });
  return positions;
}
