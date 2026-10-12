/**
 * Reachability planner for the hero graph.
 *
 * Given a focus node, it walks the graph in both directions: upstream to
 * find everything the node is built from, downstream to find everything it
 * feeds. Only edges that sit on a path through the focus stay active. It is
 * a small cousin of the dependency/reachability planning behind
 * ImagineArt's “Build App”, rebuilt here for the portfolio.
 */

export interface GraphEdge {
  from: string;
  to: string;
}

export interface Plan {
  focus: string;
  upstream: ReadonlySet<string>;
  downstream: ReadonlySet<string>;
  activeEdges: ReadonlySet<string>;
}

export function edgeKey(edge: GraphEdge): string {
  return `${edge.from}->${edge.to}`;
}

type Adjacency = Map<string, string[]>;

function buildAdjacency(edges: readonly GraphEdge[]): { out: Adjacency; in: Adjacency } {
  const out: Adjacency = new Map();
  const incoming: Adjacency = new Map();
  for (const { from, to } of edges) {
    out.set(from, [...(out.get(from) ?? []), to]);
    incoming.set(to, [...(incoming.get(to) ?? []), from]);
  }
  return { out, in: incoming };
}

function reach(adjacency: Adjacency, start: string): Set<string> {
  const seen = new Set<string>();
  const queue = [...(adjacency.get(start) ?? [])];
  while (queue.length > 0) {
    const id = queue.shift() as string;
    if (seen.has(id) || id === start) continue;
    seen.add(id);
    queue.push(...(adjacency.get(id) ?? []));
  }
  return seen;
}

export function plan(edges: readonly GraphEdge[], focus: string): Plan {
  const adjacency = buildAdjacency(edges);
  const upstream = reach(adjacency.in, focus);
  const downstream = reach(adjacency.out, focus);

  const activeEdges = new Set<string>();
  for (const edge of edges) {
    const feedsFocus = upstream.has(edge.from) && (edge.to === focus || upstream.has(edge.to));
    const leavesFocus = downstream.has(edge.to) && (edge.from === focus || downstream.has(edge.from));
    if (feedsFocus || leavesFocus) activeEdges.add(edgeKey(edge));
  }

  return { focus, upstream, downstream, activeEdges };
}

/** Nearest neighbours, used for arrow-key movement along edges. */
export function neighbours(edges: readonly GraphEdge[], id: string): { up: string[]; down: string[] } {
  return {
    up: edges.filter((edge) => edge.to === id).map((edge) => edge.from),
    down: edges.filter((edge) => edge.from === id).map((edge) => edge.to),
  };
}
