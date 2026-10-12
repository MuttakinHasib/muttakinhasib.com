/**
 * Simplified reconstruction of "Build App" planning. Given a workflow graph
 * and a selection, decide which selected nodes become the app's inputs and
 * outputs; everything else in the selection is an internal step.
 *
 * Only edges with both ends in the selection count. Outputs are the
 * selection's leaves that depend on something inside it. Inputs are entry
 * nodes of an input kind that feed the selection and reach a planned output
 * along a wired path; an input that reaches no output would promise a field
 * the app never uses.
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

interface ReachRequest {
  start: string;
  targets: ReadonlySet<string>;
  edges: readonly WorkflowEdgeSpec[];
}

export interface AppPlan {
  inputs: string[];
  outputs: string[];
  internal: string[];
  disabledReason: string | null;
}

export const INPUT_KINDS = new Set<WorkflowKind>([WorkflowKind.TEXT_INPUT, WorkflowKind.IMAGE_INPUT]);

function reachesAny({ start, targets, edges }: ReachRequest): boolean {
  const stack = [start];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const id = stack.pop() as string;
    if (targets.has(id)) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const edge of edges) if (edge.source === id) stack.push(edge.target);
  }
  return false;
}

export function planApp({ nodes, edges, selected }: PlanRequest): AppPlan {
  const inside = edges.filter((edge) => selected.has(edge.source) && selected.has(edge.target));
  const hasIncoming = new Set(inside.map((edge) => edge.target));
  const hasOutgoing = new Set(inside.map((edge) => edge.source));
  const ordered = nodes.filter((node) => selected.has(node.id));

  const outputs = ordered
    .filter((node) => !INPUT_KINDS.has(node.kind) && hasIncoming.has(node.id) && !hasOutgoing.has(node.id))
    .map((node) => node.id);
  const outputSet = new Set(outputs);

  const inputs = ordered
    .filter(
      (node) =>
        INPUT_KINDS.has(node.kind) &&
        !hasIncoming.has(node.id) &&
        hasOutgoing.has(node.id) &&
        reachesAny({ start: node.id, targets: outputSet, edges: inside }),
    )
    .map((node) => node.id);
  const inputSet = new Set(inputs);

  const internal = ordered.map((node) => node.id).filter((id) => !inputSet.has(id) && !outputSet.has(id));

  let disabledReason: string | null = null;
  if (selected.size < 2) disabledReason = 'Select at least two connected nodes.';
  else if (outputs.length === 0) disabledReason = 'Nothing in the selection produces a result.';
  else if (inputs.length === 0) disabledReason = 'No prompt or image in the selection feeds a result.';

  return { inputs, outputs, internal, disabledReason };
}
