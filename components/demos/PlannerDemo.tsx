'use client';

import {
  applyNodeChanges,
  Background,
  BackgroundVariant,
  type Edge,
  Handle,
  type Node,
  type NodeChange,
  type NodeProps,
  Position,
  ReactFlow,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import { useCallback, useMemo, useState } from 'react';
import { type AppPlan, planApp, type WorkflowEdgeSpec, WorkflowKind, type WorkflowNodeSpec } from './app-plan';
import { DemoFrame } from './DemoFrame';

type Role = 'input' | 'output' | 'internal' | 'external' | null;

interface WorkflowData extends Record<string, unknown> {
  label: string;
  kind: WorkflowKind;
  role: Role;
}

type WorkflowNode = Node<WorkflowData, 'workflow'>;

interface PositionedSpec extends WorkflowNodeSpec {
  x: number;
  y: number;
}

interface PreviewProps {
  plan: AppPlan;
  byId: Map<string, WorkflowNodeSpec>;
}

const KIND_LABEL: Record<WorkflowKind, string> = {
  [WorkflowKind.TEXT_INPUT]: 'input / text',
  [WorkflowKind.IMAGE_INPUT]: 'input / image',
  [WorkflowKind.IMAGE]: 'generate / image',
  [WorkflowKind.EDIT]: 'edit / image',
  [WorkflowKind.VIDEO]: 'generate / video',
  [WorkflowKind.TEXT]: 'generate / text',
  [WorkflowKind.AUDIO]: 'generate / audio',
};

const specs: PositionedSpec[] = [
  { id: 'prompt', label: 'Prompt', kind: WorkflowKind.TEXT_INPUT, x: 0, y: 0 },
  { id: 'reference', label: 'Reference image', kind: WorkflowKind.IMAGE_INPUT, x: 0, y: 130 },
  { id: 'style', label: 'Style preset', kind: WorkflowKind.TEXT_INPUT, x: 0, y: 260 },
  { id: 'image', label: 'Image model', kind: WorkflowKind.IMAGE, x: 240, y: 130 },
  { id: 'sound', label: 'Sound effects', kind: WorkflowKind.AUDIO, x: 240, y: 330 },
  { id: 'upscale', label: 'Upscale', kind: WorkflowKind.EDIT, x: 480, y: 50 },
  { id: 'caption', label: 'Caption', kind: WorkflowKind.TEXT, x: 480, y: 230 },
  { id: 'video', label: 'Image to video', kind: WorkflowKind.VIDEO, x: 720, y: 50 },
];

const edgeSpecs: WorkflowEdgeSpec[] = [
  { source: 'prompt', target: 'image' },
  { source: 'reference', target: 'image' },
  { source: 'style', target: 'image' },
  { source: 'prompt', target: 'sound' },
  { source: 'image', target: 'upscale' },
  { source: 'image', target: 'caption' },
  { source: 'upscale', target: 'video' },
];

const DEFAULT_SELECTION = new Set(['prompt', 'reference', 'image', 'upscale', 'video']);

function WorkflowNodeView({ data, selected }: NodeProps<WorkflowNode>) {
  return (
    <div className="pd-node" data-selected={selected || undefined} data-role={data.role ?? undefined}>
      <Handle type="target" position={Position.Left} className="pd-handle" isConnectable={false} />
      <div className="pd-node-meta">
        <span>{KIND_LABEL[data.kind]}</span>
        {data.role ? <span className="pd-role">{data.role}</span> : null}
      </div>
      <div className="pd-node-title">{data.label}</div>
      <Handle type="source" position={Position.Right} className="pd-handle" isConnectable={false} />
    </div>
  );
}

const nodeTypes = { workflow: WorkflowNodeView };

function roleFor(id: string, plan: AppPlan): Role {
  if (plan.inputs.includes(id)) return 'input';
  if (plan.outputs.includes(id)) return 'output';
  if (plan.internal.includes(id)) return 'internal';
  if (plan.external.includes(id)) return 'external';
  return null;
}

function AppPreview({ plan, byId }: PreviewProps) {
  if (plan.inputs.length === 0 && plan.outputs.length === 0) {
    return (
      <p className="type-small text-graphite">
        Select at least one node to preview an app. Try Prompt, Image model, and Upscale.
      </p>
    );
  }
  return (
    <div className="pd-app">
      <p className="type-mono text-graphite">app preview</p>
      <div className="mt-3 grid gap-3">
        {plan.inputs.map((id) => {
          const spec = byId.get(id);
          if (!spec) return null;
          if (spec.kind === WorkflowKind.IMAGE_INPUT) {
            return (
              <div key={id} className="pd-field pd-field-upload">
                <span className="pd-field-label">{spec.label}</span>
                <span className="type-small text-graphite">Upload an image</span>
              </div>
            );
          }
          if (spec.kind === WorkflowKind.TEXT_INPUT) {
            return (
              <div key={id} className="pd-field">
                <span className="pd-field-label">{spec.label}</span>
                <span className="pd-field-input">Describe it…</span>
              </div>
            );
          }
          return (
            <div key={id} className="pd-field pd-field-fixed">
              <span className="pd-field-label">{spec.label}</span>
              <span className="type-small text-graphite">Runs with its saved settings</span>
            </div>
          );
        })}
        <span className="pd-run" aria-hidden="true">
          Run app
        </span>
        {plan.outputs.map((id) => {
          const spec = byId.get(id);
          if (!spec) return null;
          return (
            <div key={id} className="pd-result" data-kind={spec.kind}>
              <span className="type-mono">{spec.kind === WorkflowKind.VIDEO ? 'video result' : `${spec.kind} result`}</span>
              <span className="pd-field-label">{spec.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PlannerDemo() {
  const [nodes, setNodes] = useState<WorkflowNode[]>(() =>
    specs.map((spec) => ({
      id: spec.id,
      type: 'workflow',
      position: { x: spec.x, y: spec.y },
      selected: DEFAULT_SELECTION.has(spec.id),
      data: { label: spec.label, kind: spec.kind, role: null },
    })),
  );

  const byId = useMemo(() => new Map(specs.map((spec) => [spec.id, spec])), []);
  const selected = useMemo(() => new Set(nodes.filter((node) => node.selected).map((node) => node.id)), [nodes]);
  const plan = useMemo(() => planApp({ nodes: specs, edges: edgeSpecs, selected }), [selected]);

  const viewNodes = useMemo(
    () => nodes.map((node) => ({ ...node, data: { ...node.data, role: roleFor(node.id, plan) } })),
    [nodes, plan],
  );

  const edges = useMemo<Edge[]>(
    () =>
      edgeSpecs.map((edge) => {
        const inside = selected.has(edge.source) && selected.has(edge.target);
        const feeding = !selected.has(edge.source) && selected.has(edge.target);
        return {
          id: `${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          selectable: false,
          className: inside ? 'pd-edge-inside' : feeding ? 'pd-edge-feeding' : 'pd-edge-idle',
        };
      }),
    [selected],
  );

  const onNodesChange = useCallback((changes: NodeChange<WorkflowNode>[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const toggle = (id: string) => {
    setNodes((current) => current.map((node) => (node.id === id ? { ...node, selected: !node.selected } : node)));
  };

  const name = (id: string) => byId.get(id)?.label ?? id;
  const list = (ids: string[]) => (ids.length > 0 ? ids.map(name).join(', ') : 'none');

  return (
    <DemoFrame
      title="Try the planner"
      instructions="Select nodes on the canvas: click, Shift-drag to box-select, or Cmd/Ctrl-click to add. The checklist does the same. The plan and the app preview update with every change."
      note="A simplified reconstruction of the planning idea, rebuilt for this portfolio. It is not ImagineArt’s production code."
    >
      <div className="pd-layout">
        <div className="pd-canvas">
          <ReactFlow
            nodes={viewNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            selectionOnDrag
            selectionMode={SelectionMode.Partial}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnDoubleClick={false}
            preventScrolling={false}
            nodesConnectable={false}
            minZoom={0.4}
            maxZoom={1.4}
            aria-label="Workflow canvas"
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="rgba(23,24,21,0.22)" />
          </ReactFlow>
        </div>

        <div className="pd-panel">
          <fieldset className="pd-checklist">
            <legend className="type-small font-[600]">Selection</legend>
            <div className="mt-2 grid grid-cols-2 gap-x-3">
              {specs.map((spec) => (
                <label key={spec.id} className="pd-check">
                  <input type="checkbox" checked={selected.has(spec.id)} onChange={() => toggle(spec.id)} />
                  {spec.label}
                </label>
              ))}
            </div>
          </fieldset>

          <dl className="pd-plan" aria-live="polite">
            <div>
              <dt>Inputs</dt>
              <dd>{list(plan.inputs)}</dd>
            </div>
            <div>
              <dt>Results</dt>
              <dd>{list(plan.outputs)}</dd>
            </div>
            <div>
              <dt>Internal steps</dt>
              <dd>{list(plan.internal)}</dd>
            </div>
            {plan.external.length > 0 ? (
              <div data-warning>
                <dt>Needs from outside</dt>
                <dd>
                  {list(plan.external)}. Add {plan.external.length === 1 ? 'it' : 'them'} to the selection, or the app
                  can’t run.
                </dd>
              </div>
            ) : null}
            {plan.flows > 1 ? (
              <div data-warning>
                <dt>Separate flows</dt>
                <dd>This selection contains {plan.flows} unconnected flows.</dd>
              </div>
            ) : null}
          </dl>

          <AppPreview plan={plan} byId={byId} />
        </div>
      </div>
    </DemoFrame>
  );
}
