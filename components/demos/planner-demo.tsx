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
  type ReactFlowInstance,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useElementWidth } from '@/lib/use-element-width';
import { type AppPlan, planApp, type WorkflowEdgeSpec, WorkflowKind, type WorkflowNodeSpec } from './app-plan';
import { Glyph } from '../visuals/editor-icons';
import { DemoFrame } from './demo-frame';

const PreviewRole = {
  INPUT: 'input',
  OUTPUT: 'output',
  DIM: 'dim',
} as const;
type PreviewRole = (typeof PreviewRole)[keyof typeof PreviewRole];

const DataType = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
} as const;
type DataType = (typeof DataType)[keyof typeof DataType];

interface WorkflowData extends Record<string, unknown> {
  label: string;
  kind: WorkflowKind;
  role: PreviewRole | null;
  /** Top to bottom with compact cards, on a narrow canvas. */
  vertical: boolean;
}

type WorkflowNode = Node<WorkflowData, 'workflow'>;

interface PositionedSpec extends WorkflowNodeSpec {
  x: number;
  y: number;
}

interface AppPreviewProps {
  plan: AppPlan;
  byId: Map<string, WorkflowNodeSpec>;
}

const KIND_LABEL: Record<WorkflowKind, string> = {
  [WorkflowKind.TEXT_INPUT]: 'prompt',
  [WorkflowKind.IMAGE_INPUT]: 'image',
  [WorkflowKind.IMAGE]: 'generate image',
  [WorkflowKind.EDIT]: 'edit image',
  [WorkflowKind.VIDEO]: 'image to video',
  [WorkflowKind.TEXT]: 'generate text',
  [WorkflowKind.AUDIO]: 'sound effects',
};

/** What each kind emits, which colours its output port and outgoing wires. */
const OUTPUT_TYPE: Record<WorkflowKind, DataType> = {
  [WorkflowKind.TEXT_INPUT]: DataType.TEXT,
  [WorkflowKind.IMAGE_INPUT]: DataType.IMAGE,
  [WorkflowKind.IMAGE]: DataType.IMAGE,
  [WorkflowKind.EDIT]: DataType.IMAGE,
  [WorkflowKind.VIDEO]: DataType.VIDEO,
  [WorkflowKind.TEXT]: DataType.TEXT,
  [WorkflowKind.AUDIO]: DataType.AUDIO,
};

const specs: PositionedSpec[] = [
  { id: 'prompt', label: 'Prompt', kind: WorkflowKind.TEXT_INPUT, x: 0, y: 0 },
  { id: 'reference', label: 'Reference image', kind: WorkflowKind.IMAGE_INPUT, x: 0, y: 130 },
  { id: 'style', label: 'Style preset', kind: WorkflowKind.TEXT_INPUT, x: 0, y: 260 },
  { id: 'image', label: 'Image model', kind: WorkflowKind.IMAGE, x: 250, y: 130 },
  { id: 'sound', label: 'Sound effects', kind: WorkflowKind.AUDIO, x: 250, y: 330 },
  { id: 'upscale', label: 'Upscale', kind: WorkflowKind.EDIT, x: 500, y: 50 },
  { id: 'caption', label: 'Caption', kind: WorkflowKind.TEXT, x: 500, y: 230 },
  { id: 'video', label: 'Animate', kind: WorkflowKind.VIDEO, x: 750, y: 50 },
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

/** On a narrow canvas: three columns running top to bottom, so every wire points down and the labels stay legible. */
const NARROW_POSITIONS: Record<string, { x: number; y: number }> = {
  prompt: { x: 0, y: 0 },
  reference: { x: 122, y: 0 },
  style: { x: 244, y: 0 },
  sound: { x: 0, y: 92 },
  image: { x: 122, y: 92 },
  upscale: { x: 61, y: 184 },
  caption: { x: 183, y: 184 },
  video: { x: 61, y: 276 },
};
const NARROW_CANVAS = 640;
const FIT = { padding: 0.26 } as const;

const positionOf = (spec: PositionedSpec, narrow: boolean) => (narrow ? (NARROW_POSITIONS[spec.id] ?? spec) : { x: spec.x, y: spec.y });

const DEFAULT_SELECTION = new Set(['prompt', 'reference', 'image', 'upscale', 'video']);

/** The editor's Build App icon, drawn from its own path data. */
function AppsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {Glyph.APPS.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

function WorkflowNodeView({ data, selected }: NodeProps<WorkflowNode>) {
  const outputType = OUTPUT_TYPE[data.kind];
  const isSource = data.kind === WorkflowKind.TEXT_INPUT || data.kind === WorkflowKind.IMAGE_INPUT;
  return (
    <div className="pd-node" data-selected={selected || undefined} data-role={data.role ?? undefined} data-compact={data.vertical || undefined}>
      <div className="pd-node-label">
        <span>{data.label}</span>
        <span className="pd-node-kind">{KIND_LABEL[data.kind]}</span>
      </div>
      <div className="pd-node-card">
        {!isSource ? (
          <Handle type="target" position={data.vertical ? Position.Top : Position.Left} className="pd-handle" data-type="any" isConnectable={false} />
        ) : null}
        <div className="pd-node-body" data-kind={data.kind}>
          {data.kind === WorkflowKind.TEXT_INPUT ? <span>ceramic vase, soft light…</span> : null}
        </div>
        <Handle
          type="source"
          position={data.vertical ? Position.Bottom : Position.Right}
          className="pd-handle"
          data-type={outputType}
          isConnectable={false}
        />
      </div>
    </div>
  );
}

const nodeTypes = { workflow: WorkflowNodeView };

function roleFor(id: string, plan: AppPlan): PreviewRole {
  if (plan.inputs.includes(id)) return PreviewRole.INPUT;
  if (plan.outputs.includes(id)) return PreviewRole.OUTPUT;
  return PreviewRole.DIM;
}

function AppPreview({ plan, byId }: AppPreviewProps) {
  if (plan.disabledReason) {
    return (
      <div className="pd-app pd-app-empty">
        <p className="type-small text-graphite">{plan.disabledReason}</p>
      </div>
    );
  }
  return (
    <div className="pd-app">
      <p className="type-mono text-graphite">the app it would build</p>
      <div className="mt-3 grid gap-3">
        {plan.inputs.map((id) => {
          const spec = byId.get(id);
          if (!spec) return null;
          return (
            <div key={id} className={`pd-field ${spec.kind === WorkflowKind.IMAGE_INPUT ? 'pd-field-upload' : ''}`}>
              <span className="pd-field-label">{spec.label}</span>
              <span className="pd-field-input">
                {spec.kind === WorkflowKind.IMAGE_INPUT ? 'Upload an image' : 'Describe it…'}
              </span>
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
            <div key={id} className="pd-result" data-type={OUTPUT_TYPE[spec.kind]}>
              <span className="type-mono">{OUTPUT_TYPE[spec.kind]} result</span>
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
      data: { label: spec.label, kind: spec.kind, role: null, vertical: false },
    })),
  );
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasWidth = useElementWidth(canvasRef);
  const narrow = canvasWidth > 0 && canvasWidth < NARROW_CANVAS;
  const [flow, setFlow] = useState<ReactFlowInstance<WorkflowNode> | null>(null);

  // Rearrange when the canvas crosses between wide and narrow (adjusting state during render, not in an effect)...
  const [arranged, setArranged] = useState(narrow);
  if (arranged !== narrow) {
    setArranged(narrow);
    setNodes((current) =>
      current.map((node) => {
        const spec = specs.find((candidate) => candidate.id === node.id);
        return spec ? { ...node, position: positionOf(spec, narrow) } : node;
      }),
    );
  }

  // ...then frame the graph again once React Flow has the new positions.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => flow?.fitView(FIT));
    return () => window.cancelAnimationFrame(frame);
  }, [arranged, flow]);
  const [hovering, setHovering] = useState(false);
  const [pinned, setPinned] = useState(false);

  const byId = useMemo(() => new Map(specs.map((spec) => [spec.id, spec])), []);
  const selected = useMemo(() => new Set(nodes.filter((node) => node.selected).map((node) => node.id)), [nodes]);
  const plan = useMemo(() => planApp({ nodes: specs, edges: edgeSpecs, selected }), [selected]);
  const previewing = (hovering || pinned) && plan.disabledReason === null;

  const viewNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: { ...node.data, role: previewing && selected.has(node.id) ? roleFor(node.id, plan) : null, vertical: narrow },
      })),
    [nodes, plan, previewing, selected, narrow],
  );

  const edges = useMemo<Edge[]>(
    () =>
      edgeSpecs.map((edge) => {
        const sourceKind = byId.get(edge.source)?.kind ?? WorkflowKind.IMAGE;
        const inside = selected.has(edge.source) && selected.has(edge.target);
        return {
          id: `${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          selectable: false,
          className: `pd-edge pd-edge-${OUTPUT_TYPE[sourceKind]} ${inside ? 'pd-edge-inside' : ''}`,
        };
      }),
    [byId, selected],
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
      title="Try Build App"
      instructions="Select nodes: click, Shift-drag to box-select, Cmd/Ctrl-click to add, or use the checklist. Then hover or focus Build App to preview the plan on the canvas: violet for inputs, amber for outputs, everything else dims. Click it to keep the preview on."
      note="A simplified reconstruction of the planning rules, rebuilt for this portfolio."
    >
      <div className="pd-layout">
        <div className="pd-canvas" ref={canvasRef}>
          <div className="pd-toolbar">
            <button
              type="button"
              className="pd-build"
              aria-pressed={pinned}
              aria-describedby="pd-build-hint"
              disabled={plan.disabledReason !== null}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              onFocus={() => setHovering(true)}
              onBlur={() => setHovering(false)}
              onClick={() => setPinned((value) => !value)}
            >
              <AppsIcon />
              Build App
            </button>
            <span id="pd-build-hint" className="pd-build-hint">
              {plan.disabledReason ?? (pinned ? 'Preview pinned' : 'Hover to preview')}
            </span>
          </div>
          <ReactFlow
            nodes={viewNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onInit={setFlow}
            fitView
            fitViewOptions={FIT}
            selectionOnDrag
            selectionMode={SelectionMode.Partial}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnDoubleClick={false}
            preventScrolling={false}
            nodesConnectable={false}
            minZoom={0.3}
            maxZoom={1.4}
            aria-label="Workflow canvas"
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="rgba(244,241,232,0.1)" />
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
            <div data-role="input">
              <dt>Inputs</dt>
              <dd>{list(plan.inputs)}</dd>
            </div>
            <div data-role="output">
              <dt>Outputs</dt>
              <dd>{list(plan.outputs)}</dd>
            </div>
            <div>
              <dt>Dimmed</dt>
              <dd>{list(plan.internal)}</dd>
            </div>
          </dl>

          <AppPreview plan={plan} byId={byId} />
        </div>
      </div>
    </DemoFrame>
  );
}
