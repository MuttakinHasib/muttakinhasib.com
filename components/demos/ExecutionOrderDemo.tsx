'use client';

import { domAnimation, LazyMotion, MotionConfig, m } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMediaQuery } from '@/lib/use-media-query';
import { DemoFrame } from './DemoFrame';
import { createsCycle, type DagEdge, executionPlan } from './execution-order';

interface AgentNode {
  id: string;
  label: string;
  short: string;
  kind: string;
}

interface Candidate extends DagEdge {
  key: string;
}

interface Point {
  x: number;
  y: number;
}

interface LayoutSpace {
  width: number;
  height: number;
  nodeW: number;
  nodeH: number;
  vertical: boolean;
}

interface EdgeRequest {
  from: Point;
  to: Point;
  space: LayoutSpace;
}

interface LayoutRequest {
  nodes: AgentNode[];
  depth: Map<string, number>;
  space: LayoutSpace;
}

const baseNodes: AgentNode[] = [
  { id: 'trigger', label: 'New message', short: 'Trigger', kind: 'trigger' },
  { id: 'kb', label: 'Knowledge base', short: 'Knowledge', kind: 'knowledge base' },
  { id: 'search', label: 'Online search', short: 'Search', kind: 'online search' },
  { id: 'llm', label: 'Draft answer', short: 'LLM', kind: 'llm' },
  { id: 'follow', label: 'Follow-up', short: 'Follow-up', kind: 'follow-up' },
  { id: 'telegram', label: 'Telegram', short: 'Telegram', kind: 'social' },
];

const summarize: AgentNode = { id: 'summary', label: 'Summarize', short: 'Summary', kind: 'text generation' };

const candidates: Candidate[] = [
  { key: 'trigger-kb', from: 'trigger', to: 'kb' },
  { key: 'trigger-search', from: 'trigger', to: 'search' },
  { key: 'kb-llm', from: 'kb', to: 'llm' },
  { key: 'search-llm', from: 'search', to: 'llm' },
  { key: 'llm-follow', from: 'llm', to: 'follow' },
  { key: 'llm-telegram', from: 'llm', to: 'telegram' },
  { key: 'follow-telegram', from: 'follow', to: 'telegram' },
  { key: 'telegram-kb', from: 'telegram', to: 'kb' },
];

const INITIAL = new Set(['trigger-kb', 'trigger-search', 'kb-llm', 'search-llm', 'llm-follow', 'llm-telegram']);
const SAVE_DELAY = 900;

const wideSpace: LayoutSpace = { width: 760, height: 340, nodeW: 150, nodeH: 58, vertical: false };
const narrowSpace: LayoutSpace = { width: 360, height: 560, nodeW: 104, nodeH: 52, vertical: true };

/** Places nodes by dependency depth: columns on wide screens, rows on narrow ones. */
function layout({ nodes, depth, space }: LayoutRequest): Map<string, Point> {
  const layers = new Map<number, AgentNode[]>();
  for (const node of nodes) {
    const d = depth.get(node.id) ?? 0;
    layers.set(d, [...(layers.get(d) ?? []), node]);
  }
  const maxDepth = Math.max(0, ...layers.keys());
  const positions = new Map<string, Point>();
  const mainSpan = (space.vertical ? space.height - space.nodeH : space.width - space.nodeW) - 32;
  const crossSize = space.vertical ? space.width : space.height;
  const crossNode = space.vertical ? space.nodeW : space.nodeH;
  for (const [d, members] of layers) {
    const main = 16 + (maxDepth === 0 ? 0 : (d / maxDepth) * mainSpan);
    members.forEach((node, index) => {
      const slot = crossSize / members.length;
      const cross = slot * index + (slot - crossNode) / 2;
      positions.set(node.id, space.vertical ? { x: cross, y: main } : { x: main, y: cross });
    });
  }
  return positions;
}

function edgePath({ from, to, space }: EdgeRequest): string {
  if (space.vertical) {
    const sx = from.x + space.nodeW / 2;
    const sy = from.y + space.nodeH;
    const tx = to.x + space.nodeW / 2;
    const ty = to.y;
    const k = Math.max(20, (ty - sy) / 2);
    return `M${sx} ${sy}C${sx} ${sy + k} ${tx} ${ty - k} ${tx} ${ty}`;
  }
  const sx = from.x + space.nodeW;
  const sy = from.y + space.nodeH / 2;
  const tx = to.x;
  const ty = to.y + space.nodeH / 2;
  const k = Math.max(24, (tx - sx) / 2);
  return `M${sx} ${sy}C${sx + k} ${sy} ${tx - k} ${ty} ${tx} ${ty}`;
}

export default function ExecutionOrderDemo() {
  const [active, setActive] = useState<Set<string>>(() => new Set(INITIAL));
  const [extraNode, setExtraNode] = useState<'none' | 'pending' | 'saved'>('none');
  const [message, setMessage] = useState('');
  const vertical = useMediaQuery('(max-width: 39.99rem)');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const space = vertical ? narrowSpace : wideSpace;
  const nodes = useMemo(() => (extraNode === 'none' ? baseNodes : [...baseNodes, summarize]), [extraNode]);
  const edges = useMemo<DagEdge[]>(() => {
    const list: DagEdge[] = candidates.filter((candidate) => active.has(candidate.key));
    if (extraNode !== 'none') list.push({ from: 'llm', to: 'summary' });
    return list;
  }, [active, extraNode]);

  const plan = useMemo(() => executionPlan(nodes.map((node) => node.id), edges), [nodes, edges]);
  const positions = useMemo(() => layout({ nodes, depth: plan.depth, space }), [nodes, plan, space]);
  const orderOf = new Map(plan.order.map((id, index) => [id, index + 1]));
  const labelOf = new Map(nodes.map((node) => [node.id, node.label]));

  const toggle = (candidate: Candidate) => {
    if (active.has(candidate.key)) {
      const next = new Set(active);
      next.delete(candidate.key);
      setActive(next);
      setMessage(`Disconnected ${labelOf.get(candidate.from)} from ${labelOf.get(candidate.to)}. Order and layout updated.`);
      return;
    }
    if (createsCycle(edges, candidate)) {
      setMessage(
        `${labelOf.get(candidate.from)} → ${labelOf.get(candidate.to)} would create a loop, so it wasn’t added. Execution order has to stay acyclic.`,
      );
      return;
    }
    setActive(new Set(active).add(candidate.key));
    setMessage(`Connected ${labelOf.get(candidate.from)} to ${labelOf.get(candidate.to)}. Order and layout updated.`);
  };

  const addNode = () => {
    setExtraNode('pending');
    setMessage('Summarize appears immediately while it saves in the background.');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setExtraNode('saved');
      setMessage('Summarize saved. It runs after Draft answer.');
    }, SAVE_DELAY);
  };

  const reset = () => {
    window.clearTimeout(timer.current);
    setActive(new Set(INITIAL));
    setExtraNode('none');
    setMessage('Reset to the starting graph.');
  };

  const pct = (value: number, total: number) => `${(value / total) * 100}%`;

  return (
    <DemoFrame
      title="Rewire the agent"
      instructions="Connect and disconnect tasks. The execution order and the auto-layout recompute from the edges on every change. Try a connection that would loop back, or add a node optimistically."
      note="A simplified reconstruction for this portfolio. iGOT.ai Studio’s engine syncs these edges with the backend; here the order is computed in the browser."
    >
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user" transition={{ type: 'tween', duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
          <div className="eo-layout">
            <div className="eo-canvas" style={{ aspectRatio: `${space.width} / ${space.height}` }}>
              <svg
                className="eo-edges"
                viewBox={`0 0 ${space.width} ${space.height}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {edges.map((edge) => {
                  const from = positions.get(edge.from);
                  const to = positions.get(edge.to);
                  if (!from || !to) return null;
                  return (
                    <m.path
                      key={`${edge.from}-${edge.to}`}
                      initial={false}
                      animate={{ d: edgePath({ from, to, space }) }}
                      className="eo-edge"
                      data-pending={edge.to === 'summary' && extraNode === 'pending' ? true : undefined}
                    />
                  );
                })}
              </svg>
              {nodes.map((node) => {
                const point = positions.get(node.id) ?? { x: 0, y: 0 };
                const pending = node.id === 'summary' && extraNode === 'pending';
                return (
                  <m.div
                    key={node.id}
                    className="eo-node"
                    data-pending={pending || undefined}
                    initial={node.id === 'summary' ? { opacity: 0, scale: 0.9 } : false}
                    animate={{
                      left: pct(point.x, space.width),
                      top: pct(point.y, space.height),
                      opacity: 1,
                      scale: 1,
                    }}
                    style={{ width: pct(space.nodeW, space.width), height: pct(space.nodeH, space.height) }}
                  >
                    <span className="eo-badge" aria-hidden="true">
                      {orderOf.get(node.id) ?? '…'}
                    </span>
                    <span className="eo-kind type-mono">{pending ? 'saving…' : node.kind}</span>
                    <span className="eo-label">{vertical ? node.short : node.label}</span>
                  </m.div>
                );
              })}
            </div>

            <div className="eo-panel">
              <fieldset>
                <legend className="type-small font-[600]">Connections</legend>
                <ul className="eo-toggles">
                  {candidates.map((candidate) => (
                    <li key={candidate.key}>
                      <label className="pd-check">
                        <input type="checkbox" checked={active.has(candidate.key)} onChange={() => toggle(candidate)} />
                        {labelOf.get(candidate.from)} → {labelOf.get(candidate.to)}
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
              <div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="demo-button demo-button-strong"
                    onClick={addNode}
                    disabled={extraNode !== 'none'}
                  >
                    Add Summarize node
                  </button>
                  <button type="button" className="demo-button" onClick={reset}>
                    Reset
                  </button>
                </div>
                <p className="type-small mt-3 min-h-[3em] text-graphite" aria-live="polite">
                  {message}
                </p>
              </div>
              <div className="eo-order">
                <p className="type-small font-[600]">Execution order</p>
                <ol>
                  {plan.order.map((id) => (
                    <li key={id}>
                      <span className="eo-badge eo-badge-inline" aria-hidden="true">
                        {orderOf.get(id)}
                      </span>
                      {labelOf.get(id)}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </MotionConfig>
      </LazyMotion>
    </DemoFrame>
  );
}
