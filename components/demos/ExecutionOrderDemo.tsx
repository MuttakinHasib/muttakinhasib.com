'use client';

import {
  applyNodeChanges,
  Background,
  BackgroundVariant,
  BaseEdge,
  type Connection,
  type Edge,
  type EdgeChange,
  EdgeLabelRenderer,
  type EdgeProps,
  type FinalConnectionState,
  getBezierPath,
  Handle,
  type Node,
  type NodeChange,
  type NodeProps,
  Position,
  ReactFlow,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMediaQuery } from '@/lib/use-media-query';
import type { EditorGlyph } from '../visuals/editor-icons';
import { Lucide } from '../visuals/lucide-icons';
import { DemoFrame } from './DemoFrame';
import {
  autoLayout,
  createsCycle,
  type DagEdge,
  type ExecutionPlan,
  executionPlan,
  type LayoutOptions,
  layersOf,
} from './execution-order';

/**
 * The agent builder's graph engine, rebuilt on React Flow: the edges are the
 * program. Connecting, disconnecting, or adding a task recomputes the run
 * order and the auto-layout; a connection that would loop back is refused,
 * and a task added with + is on the canvas at once, dashed while it saves.
 */

const Kind = {
  AGENT: 'agent',
  TOOL: 'tool',
} as const;
type Kind = (typeof Kind)[keyof typeof Kind];

interface Task {
  id: string;
  kind: Kind;
  name: string;
  detail: string;
  glyph: EditorGlyph;
  /** Its outgoing edges. */
  color: string;
}

interface TaskNodeData extends Record<string, unknown> {
  task: Task;
  order: number;
  pending: boolean;
  vertical: boolean;
  canAdd: boolean;
  onAdd: (id: string) => void;
}

type TaskNode = Node<TaskNodeData, 'task'>;

interface TaskEdgeData extends Record<string, unknown> {
  label: string;
  onRemove: (id: string) => void;
}

type TaskEdge = Edge<TaskEdgeData, 'task'>;

interface IconProps {
  glyph: EditorGlyph;
  className?: string;
}

interface Graph {
  tasks: Task[];
  edges: DagEdge[];
}

const starterTasks: Task[] = [
  { id: 'collect', kind: Kind.TOOL, name: 'Follow-up', detail: 'Ask the recruiter for the details', glyph: Lucide.MESSAGES_SQUARE, color: '#8ab4ff' },
  { id: 'ocr', kind: Kind.TOOL, name: 'File upload (OCR)', detail: 'Read the job description PDF', glyph: Lucide.UPLOAD, color: '#e6a03a' },
  { id: 'search', kind: Kind.AGENT, name: 'Search online', detail: 'Find the letter template and tone', glyph: Lucide.BOT, color: '#b4a2ff' },
  { id: 'write', kind: Kind.AGENT, name: 'Start Writing', detail: 'Draft the letter from tasks 1 to 3', glyph: Lucide.BOT, color: '#94cc7a' },
  { id: 'mail', kind: Kind.TOOL, name: 'Send Mail', detail: 'Email the letter as a PDF', glyph: Lucide.MAIL, color: '#8ab4ff' },
  { id: 'meeting', kind: Kind.TOOL, name: 'Meeting', detail: 'Book a welcome call for day one', glyph: Lucide.CALENDAR, color: '#f08fbf' },
];

/** What + adds, in turn. */
const extraTasks: Task[] = [
  { id: 'telegram', kind: Kind.TOOL, name: 'Telegram', detail: 'Tell the recruiter it has gone out', glyph: Lucide.SEND, color: '#8ab4ff' },
  { id: 'summary', kind: Kind.AGENT, name: 'Summarize', detail: 'Brief the hiring manager in a line', glyph: Lucide.BOT, color: '#c7f36b' },
  { id: 'review', kind: Kind.TOOL, name: 'Review', detail: 'Ask the recruiter to approve it', glyph: Lucide.MESSAGES_SQUARE, color: '#8ab4ff' },
];

const starterEdges: DagEdge[] = [
  { from: 'collect', to: 'ocr' },
  { from: 'collect', to: 'search' },
  { from: 'ocr', to: 'write' },
  { from: 'search', to: 'write' },
  { from: 'write', to: 'mail' },
  { from: 'write', to: 'meeting' },
];

const NODE_WIDTH = 196;
const NODE_HEIGHT = 124;
const wideLayout: LayoutOptions = { nodeWidth: NODE_WIDTH, nodeHeight: NODE_HEIGHT, gapMain: 72, gapCross: 28, vertical: false };
const narrowLayout: LayoutOptions = { ...wideLayout, gapMain: 56, gapCross: 20, vertical: true };
const FIT = { padding: 0.14 } as const;
const MOVE_MS = 420;
const SAVE_MS = 900;

const edgeId = (edge: DagEdge) => `${edge.from}->${edge.to}`;

function planOf({ tasks, edges }: Graph): ExecutionPlan {
  return executionPlan(
    tasks.map((task) => task.id),
    edges,
  );
}

function Icon({ glyph, className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${glyph.box} ${glyph.box}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={glyph.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyph.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

function TaskNodeView({ data }: NodeProps<TaskNode>) {
  const { task, order, pending, vertical, canAdd, onAdd } = data;
  return (
    <div className="ag-node" data-kind={task.kind} data-pending={pending || undefined} style={{ '--task': task.color } as CSSProperties}>
      <Handle type="target" position={vertical ? Position.Top : Position.Left} className="ag-handle ag-handle-in" />
      <div className="ag-head">
        <span className="ag-name">{task.name}</span>
        <span className="ag-order">#{order}</span>
      </div>
      <div className="ag-kind">
        <span className="ag-disc">
          <Icon glyph={task.glyph} className="ag-icon" />
        </span>
        {pending ? 'saving…' : task.kind}
      </div>
      <p className="ag-detail">{task.detail}</p>
      <Handle type="source" position={vertical ? Position.Bottom : Position.Right} className="ag-handle ag-handle-out" />
      {canAdd ? (
        <button type="button" className="ag-add nodrag" onClick={() => onAdd(task.id)} aria-label={`Add a task after ${task.name}`}>
          <Icon glyph={Lucide.PLUS} className="ag-icon" />
        </button>
      ) : null}
    </div>
  );
}

/** React Flow's bezier, with a remove button at its middle once the connection is selected. */
function TaskEdgeView({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, selected, data }: EdgeProps<TaskEdge>) {
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  return (
    <>
      <BaseEdge id={id} path={path} style={style} />
      {selected && data ? (
        <EdgeLabelRenderer>
          <button
            type="button"
            className="ag-remove nodrag nopan"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
            onClick={() => data.onRemove(id)}
            aria-label={`Remove ${data.label}`}
          >
            <Icon glyph={Lucide.X} className="ag-icon" />
          </button>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

const nodeTypes = { task: TaskNodeView };
const edgeTypes = { task: TaskEdgeView };

function placeNodes(graph: Graph, options: LayoutOptions): TaskNode[] {
  const positions = autoLayout({ plan: planOf(graph), options });
  return graph.tasks.map((task) => ({
    id: task.id,
    type: 'task',
    position: positions.get(task.id) ?? { x: 0, y: 0 },
    deletable: false,
    data: { task, order: 0, pending: false, vertical: options.vertical, canAdd: false, onAdd: () => undefined },
  }));
}

export default function ExecutionOrderDemo() {
  const vertical = useMediaQuery('(max-width: 39.99rem)');
  const options = vertical ? narrowLayout : wideLayout;
  const [graph, setGraph] = useState<Graph>({ tasks: starterTasks, edges: starterEdges });
  const [nodes, setNodes] = useState<TaskNode[]>(() => placeNodes({ tasks: starterTasks, edges: starterEdges }, wideLayout));
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [flow, setFlow] = useState<ReactFlowInstance<TaskNode, TaskEdge> | null>(null);
  const frame = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const nodesRef = useRef(nodes);
  const graphRef = useRef(graph);

  useEffect(() => {
    nodesRef.current = nodes;
    graphRef.current = graph;
  }, [nodes, graph]);

  const plan = useMemo(() => planOf(graph), [graph]);
  const orderOf = useMemo(() => new Map(plan.order.map((id, index) => [id, index + 1])), [plan]);
  const taskOf = useMemo(() => new Map(graph.tasks.map((task) => [task.id, task])), [graph]);
  const nameOf = useCallback((id: string) => taskOf.get(id)?.name ?? id, [taskOf]);
  const nextExtra = extraTasks.find((task) => !taskOf.has(task.id));

  /** Moves every task to the auto-layout for `next`, new tasks sliding out of `origin`. */
  const settle = useCallback(
    (next: Graph, origin?: string) => {
      const targets = autoLayout({ plan: planOf(next), options });
      const start = new Map(nodesRef.current.map((node) => [node.id, node.position]));
      const spawn = origin ? start.get(origin) : undefined;
      const known = new Set(start.keys());
      setNodes((current) => [
        ...current.filter((node) => next.tasks.some((task) => task.id === node.id)),
        ...next.tasks
          .filter((task) => !known.has(task.id))
          .map<TaskNode>((task) => ({
            id: task.id,
            type: 'task',
            position: spawn ?? targets.get(task.id) ?? { x: 0, y: 0 },
            deletable: false,
            data: { task, order: 0, pending: true, vertical: options.vertical, canAdd: false, onAdd: () => undefined },
          })),
      ]);
      window.cancelAnimationFrame(frame.current);
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const began = performance.now();
      const step = (now: number) => {
        const t = reduce ? 1 : Math.min(1, (now - began) / MOVE_MS);
        const eased = 1 - (1 - t) ** 3;
        setNodes((current) =>
          current.map((node) => {
            const target = targets.get(node.id);
            if (!target) return node;
            const begin = start.get(node.id) ?? spawn ?? target;
            return { ...node, position: { x: begin.x + (target.x - begin.x) * eased, y: begin.y + (target.y - begin.y) * eased } };
          }),
        );
        if (t < 1) frame.current = window.requestAnimationFrame(step);
        else flow?.fitView({ ...FIT, duration: reduce ? 0 : 300 });
      };
      frame.current = window.requestAnimationFrame(step);
    },
    [options, flow],
  );

  // Lay out again when the screen switches between wide and narrow, or the canvas first reports in.
  useEffect(() => {
    settle(graphRef.current);
  }, [settle]);

  useEffect(
    () => () => {
      window.cancelAnimationFrame(frame.current);
      window.clearTimeout(timer.current);
    },
    [],
  );

  const apply = useCallback(
    (next: Graph, origin?: string) => {
      setGraph(next);
      settle(next, origin);
    },
    [settle],
  );

  const connect = useCallback(
    (source: string, target: string) => {
      if (source === target) {
        setMessage(`${nameOf(source)} can’t feed itself.`);
        return;
      }
      if (graph.edges.some((edge) => edge.from === source && edge.to === target)) {
        setMessage(`${nameOf(source)} already feeds ${nameOf(target)}.`);
        return;
      }
      if (createsCycle(graph.edges, { from: source, to: target })) {
        setMessage(`${nameOf(source)} → ${nameOf(target)} would loop back, so it wasn’t added. The run order has to stay acyclic.`);
        return;
      }
      apply({ ...graph, edges: [...graph.edges, { from: source, to: target }] });
      setMessage(`Connected ${nameOf(source)} to ${nameOf(target)}. Run order and layout updated.`);
    },
    [apply, graph, nameOf],
  );

  const remove = useCallback(
    (id: string) => {
      const edge = graph.edges.find((candidate) => edgeId(candidate) === id);
      if (!edge) return;
      apply({ ...graph, edges: graph.edges.filter((candidate) => candidate !== edge) });
      setSelectedEdge(null);
      setMessage(`Disconnected ${nameOf(edge.from)} from ${nameOf(edge.to)}. Run order and layout updated.`);
    },
    [apply, graph, nameOf],
  );

  const add = useCallback(
    (origin: string) => {
      if (!nextExtra || pending) return;
      const next = { tasks: [...graph.tasks, nextExtra], edges: [...graph.edges, { from: origin, to: nextExtra.id }] };
      apply(next, origin);
      setPending(nextExtra.id);
      setMessage(`${nextExtra.name} is on the canvas right away while it saves.`);
      const step = planOf(next).order.indexOf(nextExtra.id) + 1;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setPending(null);
        setMessage(`${nextExtra.name} saved. It runs at step ${step}.`);
      }, SAVE_MS);
    },
    [apply, graph, nextExtra, pending],
  );

  const reset = () => {
    window.clearTimeout(timer.current);
    setPending(null);
    setSelectedEdge(null);
    apply({ tasks: starterTasks, edges: starterEdges });
    setMessage('Back to the starting assistant.');
  };

  const tidy = () => {
    settle(graph);
    setMessage('Laid out again from the edges.');
  };

  const isValidConnection = useCallback(
    (connection: Connection | Edge) =>
      connection.source !== connection.target &&
      !graph.edges.some((edge) => edge.from === connection.source && edge.to === connection.target) &&
      !createsCycle(graph.edges, { from: connection.source, to: connection.target }),
    [graph],
  );

  // A drop the canvas refused still deserves a reason.
  const onConnectEnd = useCallback(
    (_: MouseEvent | TouchEvent, state: FinalConnectionState) => {
      if (state.isValid !== false || !state.fromNode || !state.toNode) return;
      const outward = state.fromHandle?.type === 'source';
      connect(outward ? state.fromNode.id : state.toNode.id, outward ? state.toNode.id : state.fromNode.id);
    },
    [connect],
  );

  const onNodesChange = useCallback((changes: NodeChange<TaskNode>[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const onEdgesChange = useCallback(
    (changes: EdgeChange<TaskEdge>[]) => {
      for (const change of changes) {
        if (change.type === 'select') setSelectedEdge((current) => (change.selected ? change.id : current === change.id ? null : current));
        if (change.type === 'remove') remove(change.id);
      }
    },
    [remove],
  );

  const viewNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          task: taskOf.get(node.id) ?? node.data.task,
          order: orderOf.get(node.id) ?? 0,
          pending: node.id === pending,
          vertical,
          canAdd: Boolean(nextExtra) && !pending,
          onAdd: add,
        },
      })),
    [nodes, taskOf, orderOf, pending, vertical, nextExtra, add],
  );

  const viewEdges = useMemo<TaskEdge[]>(
    () =>
      graph.edges.map((edge) => {
        const id = edgeId(edge);
        const selected = id === selectedEdge;
        return {
          id,
          type: 'task',
          source: edge.from,
          target: edge.to,
          selected,
          data: { label: `${nameOf(edge.from)} → ${nameOf(edge.to)}`, onRemove: remove },
          style: {
            stroke: selected ? '#f4f1e8' : (taskOf.get(edge.from)?.color ?? '#a9a79c'),
            strokeWidth: selected ? 2.75 : 2,
            strokeDasharray: edge.to === pending ? '6 6' : undefined,
          },
        };
      }),
    [graph, selectedEdge, nameOf, remove, taskOf, pending],
  );

  const layers = layersOf(plan);

  return (
    <DemoFrame
      title="Rewire the agent"
      instructions="Drag from a task’s right-hand port to another task to connect them, select a connection to remove it, or press + to add a task. The run order and the layout follow the edges on every change, and a connection that would loop back is refused."
      note="A simplified reconstruction for this portfolio. iGOT.ai Studio’s engine syncs these edges with the backend; here the order is computed in the browser."
    >
      <div className="ag-layout">
        <div className="ag-canvas">
          <div className="ag-toolbar">
            <button type="button" className="ag-chip" onClick={tidy}>
              <Icon glyph={Lucide.LAYOUT_GRID} className="ag-icon" />
              Auto Layout
            </button>
            <button type="button" className="ag-chip" onClick={reset}>
              Reset
            </button>
          </div>
          <ReactFlow
            nodes={viewNodes}
            edges={viewEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={(connection) => connect(connection.source, connection.target)}
            onConnectEnd={onConnectEnd}
            isValidConnection={isValidConnection}
            onPaneClick={() => setSelectedEdge(null)}
            onInit={setFlow}
            connectionLineStyle={{ stroke: '#f4f1e8', strokeWidth: 2, strokeDasharray: '6 6' }}
            fitView
            fitViewOptions={FIT}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnDoubleClick={false}
            preventScrolling={false}
            minZoom={0.2}
            maxZoom={1.25}
            aria-label="Agent workflow canvas"
            style={{ flex: 1, minHeight: 0, height: 'auto' }}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="rgba(244,241,232,0.1)" />
          </ReactFlow>
        </div>

        <div className="ag-panel">
          <p className="type-small font-[600]">Run order</p>
          <ol className="ag-layers">
            {layers.map((layer, layerIndex) => (
              <li key={layer.join()} className="ag-layer">
                <span className="ag-layer-name">Layer {layerIndex + 1}</span>
                <ol className="ag-run">
                  {layer.map((id) => (
                    <li key={id} data-pending={id === pending || undefined}>
                      <span className="ag-run-order" aria-hidden="true">
                        {orderOf.get(id)}
                      </span>
                      <span className="ag-run-dot" data-kind={taskOf.get(id)?.kind} aria-hidden="true" />
                      {nameOf(id)}
                      {id === pending ? <span className="ag-run-saving">saving</span> : null}
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
          <p className="type-small min-h-[1.5em] text-graphite" aria-live="polite">
            {message || 'The run order is worked out from the edges: a task runs once everything feeding it has.'}
          </p>
        </div>
      </div>
    </DemoFrame>
  );
}
