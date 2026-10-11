/**
 * Simplified reconstruction of “Build App” planning: given a workflow graph
 * and a selection, derive which selected nodes become the app's inputs, which
 * become its results, and what the selection still depends on from outside.
 */

export const WorkflowKind = {
  TEXT_INPUT: 'text-input',
  IMAGE_INPUT: 'image-input',
  IMAGE: 'image',
  EDIT: 'edit',
  VIDEO: 'video',
  TEXT: 'text',
  AUDIO: 'audio',
} as const;
export type WorkflowKind = (typeof WorkflowKind)[keyof typeof WorkflowKind];

export interface WorkflowNodeSpec {
  id: string;
  label: string;
  kind: WorkflowKind;
}

export interface WorkflowEdgeSpec {
  source: string;
  target: string;
}

export interface PlanRequest {
  nodes: readonly WorkflowNodeSpec[];
  edges: readonly WorkflowEdgeSpec[];
  selected: ReadonlySet<string>;
}

export interface AppPlan {
  inputs: string[];
  outputs: string[];
  internal: string[];
  external: string[];
  flows: number;
}

export const INPUT_KINDS = new Set<WorkflowKind>([WorkflowKind.TEXT_INPUT, WorkflowKind.IMAGE_INPUT]);

function countFlows(edges: readonly WorkflowEdgeSpec[], selected: ReadonlySet<string>): number {
  const parent = new Map([...selected].map((id) => [id, id]));
  const find = (id: string): string => {
    const next = parent.get(id) ?? id;
    if (next === id) return id;
    const root = find(next);
    parent.set(id, root);
    return root;
  };
  for (const { source, target } of edges) {
    if (selected.has(source) && selected.has(target)) parent.set(find(source), find(target));
  }
  return new Set([...selected].map(find)).size;
}

export function planApp({ nodes, edges, selected }: PlanRequest): AppPlan {
  const inside = edges.filter((edge) => selected.has(edge.source) && selected.has(edge.target));
  const hasUpstream = new Set(inside.map((edge) => edge.target));
  const hasDownstream = new Set(inside.map((edge) => edge.source));
  const kindOf = new Map(nodes.map((node) => [node.id, node.kind]));
  const ordered = nodes.filter((node) => selected.has(node.id)).map((node) => node.id);

  const inputs: string[] = [];
  const outputs: string[] = [];
  const internal: string[] = [];
  for (const id of ordered) {
    const isSource = !hasUpstream.has(id);
    const isSink = !hasDownstream.has(id);
    const isInputKind = INPUT_KINDS.has(kindOf.get(id) ?? WorkflowKind.IMAGE);
    if (isSource && (isInputKind || !isSink)) inputs.push(id);
    if (isSink && !isInputKind) outputs.push(id);
    if (!isSource && !isSink) internal.push(id);
  }

  const external = [
    ...new Set(
      edges.filter((edge) => !selected.has(edge.source) && selected.has(edge.target)).map((edge) => edge.source),
    ),
  ];

  return { inputs, outputs, internal, external, flows: selected.size === 0 ? 0 : countFlows(edges, selected) };
}
