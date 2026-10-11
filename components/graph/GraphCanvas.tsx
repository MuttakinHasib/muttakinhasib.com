'use client';

import Link from 'next/link';
import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { vars } from '@/lib/css';
import { type Box, busWire, clamp, horizontalWire, Port, portPoint, verticalWire } from './geometry';
import { edgeKey, neighbours, plan } from './planner';
import { type GraphModel, type GraphNodeModel, NodeKind } from './types';

interface GraphCanvasProps {
  model: GraphModel;
  children: ReactNode;
}

interface GraphNodeProps {
  node: GraphNodeModel;
  state: NodeState;
  delay: number;
  register: (element: HTMLButtonElement | null) => void;
  handlers: NodeHandlers;
}

interface NodeState {
  selected: boolean;
  dimmed: boolean;
  linked: boolean;
}

interface NodeHandlers {
  onSelect: (id: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, node: GraphNodeModel) => void;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>, id: string) => void;
  onPointerMove: (event: PointerEvent<HTMLButtonElement>, id: string) => void;
  onPointerEnd: (event: PointerEvent<HTMLButtonElement>, id: string) => void;
}

interface TraceListProps {
  label: string;
  items: GraphNodeModel[];
  onSelect: (id: string) => void;
}

interface DragState {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
}

interface Offset {
  x: number;
  y: number;
}

const DESKTOP_QUERY = '(min-width: 64rem)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const DRAG_THRESHOLD = 4;
const PULSE_STEP = 170;
const ZERO: Offset = { x: 0, y: 0 };
const HEADLINE_WIRE = 'headline';
const INSPECTOR_WIRE = 'inspector';

/** Milliseconds from first paint. Node delays here mirror the CSS intro. */
const INTRO = {
  headlineWire: 650,
  root: 950,
  rootEdges: 1150,
  capability: 1250,
  capabilityEdges: 1450,
  project: 1550,
  inspector: 1800,
  inspectorWire: 1950,
  pulse: 2250,
  done: 3000,
} as const;

const NODE_DELAY: Record<NodeKind, number> = {
  [NodeKind.ROOT]: INTRO.root,
  [NodeKind.CAPABILITY]: INTRO.capability,
  [NodeKind.PROJECT]: INTRO.project,
};

const COLUMN: Record<NodeKind, number> = {
  [NodeKind.ROOT]: 0,
  [NodeKind.CAPABILITY]: 1,
  [NodeKind.PROJECT]: 2,
};

const KIND_LABEL: Record<NodeKind, string> = {
  [NodeKind.ROOT]: 'person',
  [NodeKind.CAPABILITY]: 'capability',
  [NodeKind.PROJECT]: 'project',
};

const listFormat = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

/** Ref callbacks are cached per key so React doesn't detach/reattach them each render. */
function createNodeRegistry() {
  const elements = new Map<string, HTMLButtonElement>();
  const callbacks = new Map<string, (element: HTMLButtonElement | null) => void>();
  const register = (id: string) => {
    const cached = callbacks.get(id);
    if (cached) return cached;
    const callback = (element: HTMLButtonElement | null) => {
      if (element) elements.set(id, element);
      else elements.delete(id);
    };
    callbacks.set(id, callback);
    return callback;
  };
  return { elements, register };
}

/** Wires are written imperatively (per frame while dragging); several paths can share one key. */
function createWireRegistry() {
  const paths = new Map<string, Set<SVGPathElement>>();
  const last = new Map<string, string>();
  const callbacks = new Map<string, (element: SVGPathElement | null) => () => void>();
  const set = (key: string, d: string) => {
    last.set(key, d);
    paths.get(key)?.forEach((path) => path.setAttribute('d', d));
  };
  const register = (key: string) => {
    const cached = callbacks.get(key);
    if (cached) return cached;
    const callback = (element: SVGPathElement | null) => {
      if (!element) return () => {};
      const group = paths.get(key) ?? new Set<SVGPathElement>();
      group.add(element);
      paths.set(key, group);
      const d = last.get(key);
      if (d) element.setAttribute('d', d);
      return () => {
        group.delete(element);
      };
    };
    callbacks.set(key, callback);
    return callback;
  };
  return { set, register };
}

function GraphNode({ node, state, delay, register, handlers }: GraphNodeProps) {
  const label =
    node.kind === NodeKind.PROJECT
      ? `${node.title}, project at ${node.meta}`
      : `${node.title}, ${KIND_LABEL[node.kind]}`;

  return (
    <button
      ref={register}
      type="button"
      className="graph-node intro-node"
      data-kind={node.kind}
      data-tone={node.tone}
      data-selected={state.selected || undefined}
      data-dim={state.dimmed || undefined}
      data-linked={state.linked || undefined}
      aria-pressed={state.selected}
      aria-label={label}
      style={vars({ delay: `${delay}ms` })}
      onClick={() => handlers.onSelect(node.id)}
      onKeyDown={(event) => handlers.onKeyDown(event, node)}
      onPointerDown={(event) => handlers.onPointerDown(event, node.id)}
      onPointerMove={(event) => handlers.onPointerMove(event, node.id)}
      onPointerUp={(event) => handlers.onPointerEnd(event, node.id)}
      onPointerCancel={(event) => handlers.onPointerEnd(event, node.id)}
    >
      <span className="graph-node-meta type-mono" aria-hidden="true">
        <span>{KIND_LABEL[node.kind]}</span>
        <span className="graph-node-count">{node.meta}</span>
      </span>
      <span className="graph-node-title" aria-hidden="true">
        <span className="graph-node-full">{node.title}</span>
        <span className="graph-node-short">{node.shortTitle}</span>
      </span>
      <span className="port port-in" aria-hidden="true" />
      <span className="port port-out" aria-hidden="true" />
    </button>
  );
}

function TraceList({ label, items, onSelect }: TraceListProps) {
  return (
    <div className="trace-list">
      <p className="type-small text-graphite">{label}</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <button type="button" className="trace-chip" onClick={() => onSelect(item.id)}>
              <span className="trace-chip-port" aria-hidden="true" />
              {item.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GraphCanvas({ model, children }: GraphCanvasProps) {
  const { nodes, edges, details } = model;
  const [focus, setFocus] = useState(model.defaultFocus);
  const [ready, setReady] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [introElapsed, setIntroElapsed] = useState(Number.POSITIVE_INFINITY);
  const [announcement, setAnnouncement] = useState('');

  const stageRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const inspectorRef = useRef<HTMLDivElement>(null);
  const [nodeRegistry] = useState(createNodeRegistry);
  const [wires] = useState(createWireRegistry);
  const nodeRefs = useRef(nodeRegistry.elements);
  const offsets = useRef(new Map<string, Offset>());
  const dragRef = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const frame = useRef(0);
  const desktop = useRef(false);
  const focusRef = useRef(focus);

  const currentPlan = useMemo(() => plan(edges, focus), [edges, focus]);
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const columns = useMemo(
    () => ({
      [NodeKind.ROOT]: nodes.filter((node) => node.kind === NodeKind.ROOT),
      [NodeKind.CAPABILITY]: nodes.filter((node) => node.kind === NodeKind.CAPABILITY),
      [NodeKind.PROJECT]: nodes.filter((node) => node.kind === NodeKind.PROJECT),
    }),
    [nodes],
  );
  const rootId = columns[NodeKind.ROOT][0]?.id;

  const introActive = Number.isFinite(introElapsed);
  const remaining = (at: number) => Math.max(0, Math.round(at - introElapsed));

  const setPath = wires.set;
  const registerPath = wires.register;
  const registerNode = nodeRegistry.register;

  /** Reads layout once per frame and writes every wire. Offsets come from dragging. */
  const applyGeometry = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const isDesktop = desktop.current;
    const boxes = new Map<string, Box>();
    for (const [id, element] of nodeRefs.current) {
      const offset = offsets.current.get(id) ?? ZERO;
      boxes.set(id, {
        x: element.offsetLeft + offset.x,
        y: element.offsetTop + offset.y,
        w: element.offsetWidth,
        h: element.offsetHeight,
      });
    }

    const capabilityIndex = new Map(columns[NodeKind.CAPABILITY].map((node, index) => [node.id, index]));
    for (const edge of edges) {
      const from = boxes.get(edge.from);
      const to = boxes.get(edge.to);
      if (!from || !to) continue;
      const fromKind = nodeById.get(edge.from)?.kind;
      let d: string;
      if (isDesktop) {
        d = horizontalWire(portPoint(from, Port.RIGHT), portPoint(to, Port.LEFT));
      } else if (fromKind === NodeKind.ROOT) {
        d = verticalWire(portPoint(from, Port.BOTTOM), portPoint(to, Port.TOP));
      } else {
        d = busWire({
          from: portPoint(from, Port.BOTTOM),
          to: portPoint(to, Port.LEFT),
          gutterX: 4 + (capabilityIndex.get(edge.from) ?? 0) * 4,
        });
      }
      setPath(edgeKey(edge), d);
    }

    if (!isDesktop) return;

    const inspector = inspectorRef.current;
    const focusBox = boxes.get(focusRef.current);
    if (inspector && focusBox) {
      setPath(
        INSPECTOR_WIRE,
        horizontalWire(portPoint(focusBox, Port.RIGHT), {
          x: inspector.offsetLeft,
          y: inspector.offsetTop + 30,
        }),
      );
    }

    const headlinePort = stage.querySelector<HTMLElement>('[data-headline-port]');
    const rootBox = rootId ? boxes.get(rootId) : undefined;
    if (headlinePort && rootBox) {
      const stageRect = stage.getBoundingClientRect();
      const portRect = headlinePort.getBoundingClientRect();
      setPath(
        HEADLINE_WIRE,
        verticalWire(
          {
            x: portRect.left - stageRect.left + portRect.width / 2,
            y: portRect.top - stageRect.top + portRect.height / 2,
          },
          { x: rootBox.x + 32, y: rootBox.y },
        ),
      );
    }
  }, [columns, edges, nodeById, rootId, setPath]);

  const scheduleGeometry = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      applyGeometry();
    });
  }, [applyGeometry]);

  const clearOffsets = useCallback(() => {
    for (const id of offsets.current.keys()) {
      const element = nodeRefs.current.get(id);
      if (element) element.style.translate = '';
    }
    offsets.current.clear();
    setHasMoved(false);
  }, []);

  // Measure, observe, and work out where the CSS intro currently is.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const desktopMedia = window.matchMedia(DESKTOP_QUERY);
    desktop.current = desktopMedia.matches;
    applyGeometry();

    const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    const rootElement = rootId ? nodeRefs.current.get(rootId) : undefined;
    const animation = rootElement?.getAnimations?.()[0];
    const elapsed = typeof animation?.currentTime === 'number' ? animation.currentTime : Number.POSITIVE_INFINITY;
    // Syncing with the browser's animation clock has to happen after mount.
    setIntroElapsed(reduced || elapsed >= INTRO.done ? Number.POSITIVE_INFINITY : elapsed);
    setReady(true);

    const onMediaChange = () => {
      desktop.current = desktopMedia.matches;
      clearOffsets();
      applyGeometry();
    };
    desktopMedia.addEventListener('change', onMediaChange);

    const observer = new ResizeObserver(scheduleGeometry);
    observer.observe(stage);
    for (const element of nodeRefs.current.values()) observer.observe(element);
    if (inspectorRef.current) observer.observe(inspectorRef.current);
    const headline = stage.querySelector('[data-headline]');
    if (headline) observer.observe(headline);
    void document.fonts?.ready.then(scheduleGeometry);

    return () => {
      desktopMedia.removeEventListener('change', onMediaChange);
      observer.disconnect();
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [applyGeometry, clearOffsets, rootId, scheduleGeometry]);

  // Re-route the inspector wire whenever the focus moves.
  useLayoutEffect(() => {
    focusRef.current = focus;
    applyGeometry();
  }, [focus, applyGeometry]);

  // Mark the intro finished so routes kept alive by <Activity> don't replay it.
  useEffect(() => {
    if (!introActive) {
      document.documentElement.dataset.intro = 'done';
      return;
    }
    const timer = window.setTimeout(() => {
      document.documentElement.dataset.intro = 'done';
      setIntroElapsed(Number.POSITIVE_INFINITY);
    }, remaining(INTRO.done));
    return () => window.clearTimeout(timer);
    // `remaining` only depends on introElapsed, which `introActive` tracks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introActive]);

  const select = useCallback(
    (id: string) => {
      if (suppressClick.current) {
        suppressClick.current = false;
        return;
      }
      setFocus(id);
      const node = nodeById.get(id);
      if (!node) return;
      const next = plan(edges, id);
      const names = (ids: Iterable<string>, kind: NodeKind) =>
        [...ids].map((nodeId) => nodeById.get(nodeId)).filter((item) => item?.kind === kind).map((item) => item?.title ?? '');
      if (node.kind === NodeKind.PROJECT) {
        setAnnouncement(`${node.title}: built from ${listFormat.format(names(next.upstream, NodeKind.CAPABILITY))}.`);
      } else if (node.kind === NodeKind.CAPABILITY) {
        setAnnouncement(`${node.title}: feeds ${listFormat.format(names(next.downstream, NodeKind.PROJECT))}.`);
      } else {
        setAnnouncement(`${node.title}: feeds ${listFormat.format(names(next.downstream, NodeKind.CAPABILITY))}.`);
      }
    },
    [edges, nodeById],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, node: GraphNodeModel) => {
      const column = columns[node.kind];
      const index = column.findIndex((item) => item.id === node.id);
      const links = neighbours(edges, node.id);
      let target: string | undefined;
      switch (event.key) {
        case 'ArrowDown':
          target = column[(index + 1) % column.length]?.id;
          break;
        case 'ArrowUp':
          target = column[(index - 1 + column.length) % column.length]?.id;
          break;
        case 'ArrowRight':
          target = links.down[0];
          break;
        case 'ArrowLeft':
          target = links.up[0];
          break;
        default:
          return;
      }
      if (!target) return;
      event.preventDefault();
      nodeRefs.current.get(target)?.focus();
    },
    [columns, edges],
  );

  const onPointerDown = useCallback((event: PointerEvent<HTMLButtonElement>, id: string) => {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    const origin = offsets.current.get(id) ?? ZERO;
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin.x,
      originY: origin.y,
      moved: false,
    };
  }, []);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>, id: string) => {
      const drag = dragRef.current;
      const stage = stageRef.current;
      const grid = gridRef.current;
      if (!drag || drag.id !== id || drag.pointerId !== event.pointerId || !stage || !grid) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      const element = event.currentTarget;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        drag.moved = true;
        element.setPointerCapture(event.pointerId);
        element.dataset.dragging = 'true';
      }
      const x = clamp(drag.originX + dx, [
        -element.offsetLeft,
        stage.clientWidth - element.offsetLeft - element.offsetWidth,
      ]);
      const y = clamp(drag.originY + dy, [
        grid.offsetTop - element.offsetTop,
        grid.offsetTop + grid.offsetHeight - element.offsetTop - element.offsetHeight,
      ]);
      offsets.current.set(id, { x, y });
      element.style.translate = `${x}px ${y}px`;
      scheduleGeometry();
    },
    [scheduleGeometry],
  );

  const onPointerEnd = useCallback((event: PointerEvent<HTMLButtonElement>, id: string) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== id) return;
    if (drag.moved) {
      suppressClick.current = true;
      setHasMoved(true);
      delete event.currentTarget.dataset.dragging;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
    dragRef.current = null;
  }, []);

  const resetLayout = useCallback(() => {
    const start = new Map(offsets.current);
    const duration = window.matchMedia(REDUCED_MOTION_QUERY).matches ? 0 : 420;
    const startedAt = performance.now();
    const step = (now: number) => {
      const t = duration === 0 ? 1 : Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - t) ** 3;
      for (const [id, offset] of start) {
        const next = { x: offset.x * (1 - eased), y: offset.y * (1 - eased) };
        offsets.current.set(id, next);
        const element = nodeRefs.current.get(id);
        if (element) element.style.translate = `${next.x}px ${next.y}px`;
      }
      applyGeometry();
      if (t < 1) requestAnimationFrame(step);
      else clearOffsets();
    };
    requestAnimationFrame(step);
  }, [applyGeometry, clearOffsets]);

  const handlers: NodeHandlers = { onSelect: select, onKeyDown, onPointerDown, onPointerMove, onPointerEnd };

  const focusNode = nodeById.get(focus);
  const detail = details[focus];
  const upstreamCapabilities = [...currentPlan.upstream]
    .map((id) => nodeById.get(id))
    .filter((node): node is GraphNodeModel => node?.kind === NodeKind.CAPABILITY);
  const feedsKind = focusNode?.kind === NodeKind.ROOT ? NodeKind.CAPABILITY : NodeKind.PROJECT;
  const downstreamNodes =
    focusNode?.kind === NodeKind.PROJECT
      ? []
      : [...currentPlan.downstream]
          .map((id) => nodeById.get(id))
          .filter((node): node is GraphNodeModel => node?.kind === feedsKind);
  const lastActiveColumn = focusNode ? COLUMN[focusNode.kind] : 0;
  const pulseStart = introActive ? remaining(INTRO.pulse) : 0;

  const renderColumn = (kind: NodeKind) =>
    columns[kind].map((node, index) => {
      const related = node.id === focus || currentPlan.upstream.has(node.id) || currentPlan.downstream.has(node.id);
      return (
        <GraphNode
          key={node.id}
          node={node}
          state={{ selected: node.id === focus, dimmed: !related, linked: related && node.id !== focus }}
          delay={NODE_DELAY[kind] + index * 70}
          register={registerNode(node.id)}
          handlers={handlers}
        />
      );
    });

  return (
    <div ref={stageRef} className="graph-stage">
      <svg className="graph-wires" data-ready={ready || undefined} aria-hidden="true" focusable="false">
        {edges.map((edge) => {
          const key = edgeKey(edge);
          const fromKind = nodeById.get(edge.from)?.kind ?? NodeKind.ROOT;
          return (
            <path
              key={key}
              ref={registerPath(key)}
              className="wire"
              data-active={currentPlan.activeEdges.has(key) || undefined}
              data-draw={introActive || undefined}
              pathLength={1}
              style={vars({
                delay: `${remaining(fromKind === NodeKind.ROOT ? INTRO.rootEdges : INTRO.capabilityEdges)}ms`,
              })}
            />
          );
        })}
        <path
          ref={registerPath(HEADLINE_WIRE)}
          className="wire wire-desktop"
          data-active
          data-draw={introActive || undefined}
          pathLength={1}
          style={vars({ delay: `${remaining(INTRO.headlineWire)}ms` })}
        />
        <path
          ref={registerPath(INSPECTOR_WIRE)}
          className="wire wire-desktop wire-dashed"
          data-active
          data-draw={introActive || undefined}
          pathLength={1}
          style={vars({ delay: `${remaining(INTRO.inspectorWire)}ms` })}
        />
        <g key={focus}>
          {edges
            .filter((edge) => currentPlan.activeEdges.has(edgeKey(edge)))
            .map((edge) => {
              const key = edgeKey(edge);
              const column = COLUMN[nodeById.get(edge.from)?.kind ?? NodeKind.ROOT];
              const style = vars({ delay: `${pulseStart + column * PULSE_STEP}ms` });
              return (
                <g key={key}>
                  <path ref={registerPath(key)} className="pulse pulse-halo" pathLength={1} style={style} />
                  <path ref={registerPath(key)} className="pulse pulse-core" pathLength={1} style={style} />
                </g>
              );
            })}
          <g className="wire-desktop">
            <path
              ref={registerPath(INSPECTOR_WIRE)}
              className="pulse pulse-halo"
              pathLength={1}
              style={vars({ delay: `${pulseStart + (lastActiveColumn + 1) * PULSE_STEP}ms` })}
            />
            <path
              ref={registerPath(INSPECTOR_WIRE)}
              className="pulse pulse-core"
              pathLength={1}
              style={vars({ delay: `${pulseStart + (lastActiveColumn + 1) * PULSE_STEP}ms` })}
            />
          </g>
        </g>
      </svg>

      {children}

      <div className="shell">
        <div
          ref={gridRef}
          className="graph-grid"
          role="group"
          aria-label="Interactive map: how my capabilities feed my selected projects"
          aria-describedby="graph-hint"
        >
          <div className="graph-col graph-col-root">{renderColumn(NodeKind.ROOT)}</div>
          <div className="graph-col graph-col-capability">{renderColumn(NodeKind.CAPABILITY)}</div>
          <div className="graph-col graph-col-project">{renderColumn(NodeKind.PROJECT)}</div>
          <div className="graph-col graph-col-inspector">
            <div
              ref={inspectorRef}
              className="graph-inspector intro-node"
              style={vars({ delay: `${INTRO.inspector}ms` })}
            >
              <span className="port port-in" data-active aria-hidden="true" />
              <div className="flex items-center justify-between gap-4 type-mono text-graphite">
                <span className="flex items-center gap-2">
                  <span className="inline-block size-1.5 rounded-full bg-ink" aria-hidden="true" />
                  output
                </span>
                <span translate="no" className="truncate">
                  trace({focus})
                </span>
              </div>
              {detail ? (
                <div key={focus} className="inspector-swap mt-4">
                  <p className="type-heading">{detail.title}</p>
                  <p className="type-small mt-2 text-graphite">{detail.summary}</p>
                  <div className="mt-4 grid gap-3">
                    {upstreamCapabilities.length > 0 ? (
                      <TraceList label="Built from" items={upstreamCapabilities} onSelect={select} />
                    ) : null}
                    {downstreamNodes.length > 0 ? (
                      <TraceList label="Feeds" items={downstreamNodes} onSelect={select} />
                    ) : null}
                    {detail.outputs.length > 0 ? (
                      <dl className="grid gap-1.5">
                        {detail.outputs.map((output) => (
                          <div key={output.label} className="flex items-baseline gap-3">
                            <dt className="type-figure min-w-[4.5ch] text-[1.35rem]">{output.value}</dt>
                            <dd className="type-small text-graphite">{output.label}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </div>
                  <Link
                    href={detail.link.href}
                    className="wire-link mt-3"
                    transitionTypes={detail.link.href.startsWith('/work/') ? ['nav-forward'] : undefined}
                  >
                    {detail.link.label}
                    <span className="wire" aria-hidden="true" />
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="graph-footer intro-fade" style={vars({ delay: `${INTRO.inspector}ms` })}>
          <p id="graph-hint" className="type-small text-graphite">
            <span className="hint-fine">
              Select a node to trace what it’s built from and what it feeds. Drag nodes to rearrange; arrow
              keys move along the wires.
            </span>
            <span className="hint-coarse">Tap a node to trace what it’s built from and what it feeds.</span>
          </p>
          {hasMoved ? (
            <button type="button" className="graph-reset" onClick={resetLayout}>
              Reset layout
            </button>
          ) : null}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
