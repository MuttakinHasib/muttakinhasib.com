/**
 * Visual policy for the hero graph, kept apart from the DOM.
 *
 * graph-canvas.tsx owns the stage: refs, rAF loops, and imperative path
 * writes. Everything that is a decision — which projects feed the output
 * card, what a plan means for the inspector, where the arrow keys go,
 * how a wire routes — lives here as plain functions over nodes, edges,
 * and a Plan. Same split as the planner: decide first, then draw.
 */

// Relative imports carry their `.ts` extension: node --test runs this module
// directly (tsconfig sets allowImportingTsExtensions), unlike the bundled app.
import {
  type Box,
  busWire,
  clamp,
  horizontalWire,
  type Point,
  Port,
  portPoint,
  splitWire,
} from './geometry.ts';
import { type GraphEdge, neighbours, type Plan } from './planner.ts';
import { type GraphModel, type GraphNodeModel, NodeKind } from './types.ts';

export interface RouteRequest {
  from: Box;
  to: Box;
  fromKind: NodeKind | undefined;
  /** Columns flow left to right; otherwise the graph stacks. */
  desktop: boolean;
  /** Where the stacked graph's bus trunk runs down, in stage coordinates. */
  trunkX: number;
}

/** Nodes of each kind, in draw and traversal order, keyed by kind. */
export type Columns = Record<NodeKind, readonly GraphNodeModel[]>;

/** The kind a focus feeds: the person feeds capabilities, anything else feeds projects. */
export function feedsKindOf(focusKind: NodeKind | undefined): NodeKind {
  return focusKind === NodeKind.ROOT ? NodeKind.CAPABILITY : NodeKind.PROJECT;
}

/**
 * Every project can feed the output card; only the traced ones are drawn.
 * A project feeds when it is the focus itself or sits downstream of it.
 */
export function feeds(projects: readonly GraphNodeModel[], focus: string, plan: Plan): string[] {
  return projects.filter((node) => node.id === focus || plan.downstream.has(node.id)).map((node) => node.id);
}

function ofKind(nodes: readonly GraphNodeModel[], ids: ReadonlySet<string>, kind: NodeKind): GraphNodeModel[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return [...ids].map((id) => byId.get(id)).filter((node): node is GraphNodeModel => node?.kind === kind);
}

/** Upstream nodes of one kind: what the focus is built from. */
export function upstreamOf(plan: Plan, nodes: readonly GraphNodeModel[], kind: NodeKind): GraphNodeModel[] {
  return ofKind(nodes, plan.upstream, kind);
}

/** Downstream nodes of the kind the focus feeds; a project feeds nothing. */
export function downstreamOf(
  plan: Plan,
  nodes: readonly GraphNodeModel[],
  focusKind: NodeKind | undefined,
): GraphNodeModel[] {
  if (focusKind === NodeKind.PROJECT) return [];
  return ofKind(nodes, plan.downstream, feedsKindOf(focusKind));
}

const listFormat = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

/**
 * The aria-live sentence for a selection: what the node is built from or
 * feeds, in the same words the inspector shows. Takes the plan for the
 * candidate focus, so selecting never has to plan twice.
 */
export function announcementFor(model: Pick<GraphModel, 'nodes'>, plan: Plan): string {
  const focus = model.nodes.find((node) => node.id === plan.focus);
  if (!focus) return '';
  const names = (ids: ReadonlySet<string>, kind: NodeKind) => ofKind(model.nodes, ids, kind).map((node) => node.title);
  if (focus.kind === NodeKind.PROJECT) {
    return `${focus.title}: built from ${listFormat.format(names(plan.upstream, NodeKind.CAPABILITY))}.`;
  }
  if (focus.kind === NodeKind.CAPABILITY) {
    return `${focus.title}: feeds ${listFormat.format(names(plan.downstream, NodeKind.PROJECT))}.`;
  }
  return `${focus.title}: feeds ${listFormat.format(names(plan.downstream, NodeKind.CAPABILITY))}.`;
}

/**
 * Where the arrow keys go from the focused node: Up and Down step through
 * the node's column with wrap-around, Left and Right follow the nearest
 * wire. Any other key leaves the browser's default in place.
 */
export function nextFocus(
  current: GraphNodeModel,
  key: string,
  columns: Columns,
  edges: readonly GraphEdge[],
): string | undefined {
  const column = columns[current.kind];
  const index = column.findIndex((item) => item.id === current.id);
  const links = neighbours(edges, current.id);
  switch (key) {
    case 'ArrowDown':
      return column[(index + 1) % column.length]?.id;
    case 'ArrowUp':
      return column[(index - 1 + column.length) % column.length]?.id;
    case 'ArrowRight':
      return links.down[0];
    case 'ArrowLeft':
      return links.up[0];
    default:
      return undefined;
  }
}

export interface DragFrame {
  /** Pointer travel since the drag started. */
  dx: number;
  dy: number;
  /** The node's own box, in stage coordinates. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** How far the node may travel: the stage horizontally, the grid vertically. */
  stageWidth: number;
  gridTop: number;
  gridHeight: number;
}

/** A dragged node stays inside the stage horizontally and the grid vertically. */
export function clampOffset(origin: Point, drag: DragFrame): Point {
  return {
    x: clamp(origin.x + drag.dx, [-drag.left, drag.stageWidth - drag.left - drag.width]),
    y: clamp(origin.y + drag.dy, [drag.gridTop - drag.top, drag.gridTop + drag.gridHeight - drag.top - drag.height]),
  };
}

/**
 * The route for one edge: a horizontal S-curve between columns on wide
 * screens; when the graph stacks, a split rail from the root and the shared
 * bus for everything else.
 */
export function routeFor({ from, to, fromKind, desktop, trunkX }: RouteRequest): string {
  if (desktop) return horizontalWire(portPoint(from, Port.RIGHT), portPoint(to, Port.LEFT));
  if (fromKind === NodeKind.ROOT) return splitWire(portPoint(from, Port.BOTTOM), portPoint(to, Port.TOP));
  return busWire({ from: portPoint(from, Port.BOTTOM), to: portPoint(to, Port.LEFT), trunkX });
}
