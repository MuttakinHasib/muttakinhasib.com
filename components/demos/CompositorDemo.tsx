'use client';

import { type KeyboardEvent, type PointerEvent, useEffect, useId, useRef, useState } from 'react';
import { DemoFrame } from './DemoFrame';

const BlendMode = {
  NORMAL: 'normal',
  MULTIPLY: 'multiply',
  SCREEN: 'screen',
  OVERLAY: 'overlay',
  DARKEN: 'darken',
  LIGHTEN: 'lighten',
  COLOR_DODGE: 'color-dodge',
} as const;
type BlendMode = (typeof BlendMode)[keyof typeof BlendMode];

const LayerKind = {
  SUN: 'sun',
  VASE: 'vase',
  TEXT: 'text',
  FILL: 'fill',
} as const;
type LayerKind = (typeof LayerKind)[keyof typeof LayerKind];

interface Layer {
  id: string;
  name: string;
  kind: LayerKind;
  x: number;
  y: number;
  w: number;
  h: number;
  blend: BlendMode;
  pending?: boolean;
}

interface History {
  past: Layer[][];
  present: Layer[];
  future: Layer[][];
}

interface Guides {
  x: number[];
  y: number[];
}

interface SnapRequest {
  layer: Layer;
  others: Layer[];
}

interface SnapResult {
  layer: Layer;
  guides: Guides;
}

interface Delta {
  dx: number;
  dy: number;
}

interface MoveRequest {
  id: string;
  delta: Delta;
  base: Layer[];
}

interface MoveResult {
  next: Layer[];
  guides: Guides;
}

interface LayerArtProps {
  kind: LayerKind;
  pending?: boolean;
}

const STAGE_W = 640;
const STAGE_H = 400;
const SNAP = 7;
const FILL_DELAY = 1400;

const initialLayers: Layer[] = [
  { id: 'sun', name: 'Sun', kind: LayerKind.SUN, x: 430, y: 52, w: 128, h: 128, blend: BlendMode.SCREEN },
  { id: 'vase', name: 'Vase', kind: LayerKind.VASE, x: 236, y: 120, w: 150, h: 220, blend: BlendMode.NORMAL },
  { id: 'text', name: 'Soft light (AI text)', kind: LayerKind.TEXT, x: 40, y: 40, w: 250, h: 56, blend: BlendMode.MULTIPLY },
];

/** Snap a layer's edges and centre to the stage and to other layers, returning guides to draw. */
function snapLayer({ layer, others }: SnapRequest): SnapResult {
  const xTargets = [0, STAGE_W / 2, STAGE_W, ...others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w])];
  const yTargets = [0, STAGE_H / 2, STAGE_H, ...others.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h])];
  const xPoints = [layer.x, layer.x + layer.w / 2, layer.x + layer.w];
  const yPoints = [layer.y, layer.y + layer.h / 2, layer.y + layer.h];

  let best = { dx: 0, dy: 0, gx: [] as number[], gy: [] as number[] };
  let bestX = SNAP + 1;
  let bestY = SNAP + 1;
  for (const target of xTargets) {
    for (const point of xPoints) {
      const distance = Math.abs(target - point);
      if (distance < bestX) {
        bestX = distance;
        best = { ...best, dx: target - point, gx: [target] };
      }
    }
  }
  for (const target of yTargets) {
    for (const point of yPoints) {
      const distance = Math.abs(target - point);
      if (distance < bestY) {
        bestY = distance;
        best = { ...best, dy: target - point, gy: [target] };
      }
    }
  }
  return {
    layer: { ...layer, x: layer.x + (bestX <= SNAP ? best.dx : 0), y: layer.y + (bestY <= SNAP ? best.dy : 0) },
    guides: { x: bestX <= SNAP ? best.gx : [], y: bestY <= SNAP ? best.gy : [] },
  };
}

function moveLayer({ id, delta, base }: MoveRequest): MoveResult {
  const target = base.find((layer) => layer.id === id);
  if (!target) return { next: base, guides: { x: [], y: [] } };
  const others = base.filter((layer) => layer.id !== id);
  const snapped = snapLayer({ layer: { ...target, x: target.x + delta.dx, y: target.y + delta.dy }, others });
  return { next: base.map((layer) => (layer.id === id ? snapped.layer : layer)), guides: snapped.guides };
}

function LayerArt({ kind, pending }: LayerArtProps) {
  switch (kind) {
    case LayerKind.SUN:
      return <span className="cd-sun" />;
    case LayerKind.VASE:
      return (
        <svg viewBox="0 0 150 220" className="cd-svg" aria-hidden="true">
          <ellipse cx="75" cy="212" rx="62" ry="7" fill="#7d705b" opacity="0.45" />
          <path d="M52 210C14 186 14 106 52 82L52 34L98 34L98 82C136 106 136 186 98 210Z" fill="#f4f1e8" stroke="#171815" strokeWidth="2" />
          <path d="M98 82C136 106 136 186 98 210L84 210C112 186 112 106 84 82Z" fill="#dfdbcf" />
        </svg>
      );
    case LayerKind.TEXT:
      return <span className="cd-text">SOFT LIGHT</span>;
    case LayerKind.FILL:
      return (
        <svg viewBox="0 0 160 120" className="cd-svg" data-pending={pending || undefined} aria-hidden="true">
          <path d="M80 118C76 90 70 64 46 40M80 118C84 86 92 58 116 34M80 118C80 80 80 50 80 18" stroke="#4d6b12" strokeWidth="3" fill="none" />
          <circle cx="46" cy="38" r="16" fill="#ef5b8c" />
          <circle cx="116" cy="32" r="18" fill="#e6a03a" />
          <circle cx="80" cy="18" r="15" fill="#b4a2ff" />
        </svg>
      );
    default: {
      const exhaustive: never = kind;
      throw new Error(`Unknown layer: ${exhaustive}`);
    }
  }
}

export default function CompositorDemo() {
  const [history, setHistory] = useState<History>({ past: [], present: initialLayers, future: [] });
  const [draft, setDraft] = useState<Layer[] | null>(null);
  const [selectedId, setSelectedId] = useState('vase');
  const [guides, setGuides] = useState<Guides>({ x: [], y: [] });
  const [maskUses, setMaskUses] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const stopDrag = useRef<(() => void) | null>(null);
  const fillTimer = useRef<number | undefined>(undefined);
  const blendId = useId();

  const layers = draft ?? history.present;
  const selected = layers.find((layer) => layer.id === selectedId);

  useEffect(
    () => () => {
      window.clearTimeout(fillTimer.current);
      stopDrag.current?.();
    },
    [],
  );

  const commit = (next: Layer[]) => {
    setHistory((current) => ({ past: [...current.past, current.present].slice(-40), present: next, future: [] }));
  };

  const undo = () =>
    setHistory((current) => {
      const previous = current.past.at(-1);
      if (!previous) return current;
      return { past: current.past.slice(0, -1), present: previous, future: [current.present, ...current.future] };
    });

  const redo = () =>
    setHistory((current) => {
      const [next, ...rest] = current.future;
      if (!next) return current;
      return { past: [...current.past, current.present], present: next, future: rest };
    });

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, layer: Layer) => {
    setSelectedId(layer.id);
    const stage = stageRef.current;
    if (event.button !== 0 || !stage) return;
    event.preventDefault();
    stopDrag.current?.();
    const start = { x: event.clientX, y: event.clientY };
    const base = history.present;
    let latest: Layer[] | null = null;

    const move = (moveEvent: globalThis.PointerEvent) => {
      const scale = STAGE_W / stage.clientWidth;
      const delta = { dx: (moveEvent.clientX - start.x) * scale, dy: (moveEvent.clientY - start.y) * scale };
      if (!latest && Math.hypot(delta.dx, delta.dy) < 2) return;
      const result = moveLayer({ id: layer.id, delta, base });
      latest = result.next;
      setDraft(result.next);
      setGuides(result.guides);
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      stopDrag.current = null;
    };
    const end = () => {
      stop();
      if (latest) commit(latest);
      setDraft(null);
      setGuides({ x: [], y: [] });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    stopDrag.current = stop;
  };

  const onLayerKeyDown = (event: KeyboardEvent<HTMLButtonElement>, layer: Layer) => {
    const step = event.shiftKey ? 16 : 4;
    const deltas: Record<string, Delta> = {
      ArrowLeft: { dx: -step, dy: 0 },
      ArrowRight: { dx: step, dy: 0 },
      ArrowUp: { dx: 0, dy: -step },
      ArrowDown: { dx: 0, dy: step },
    };
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();
    const result = moveLayer({ id: layer.id, delta, base: history.present });
    commit(result.next);
    setGuides(result.guides);
  };

  const onDemoKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return;
    event.preventDefault();
    if (event.shiftKey) redo();
    else undo();
  };

  const setBlend = (blend: BlendMode) => {
    commit(history.present.map((layer) => (layer.id === selectedId ? { ...layer, blend } : layer)));
  };

  const generateFill = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fill: Layer = {
      id: 'fill',
      name: 'Generated fill',
      kind: LayerKind.FILL,
      x: 231,
      y: 22,
      w: 160,
      h: 120,
      blend: BlendMode.NORMAL,
      pending: !reduced,
    };
    const without = history.present.filter((layer) => layer.id !== 'fill');
    commit([...without, fill]);
    setSelectedId('fill');
    setMaskUses((count) => count + 1);
    window.clearTimeout(fillTimer.current);
    if (reduced) return;
    fillTimer.current = window.setTimeout(() => {
      setHistory((current) => ({
        ...current,
        present: current.present.map((layer) => (layer.id === 'fill' ? { ...layer, pending: false } : layer)),
      }));
    }, FILL_DELAY);
  };

  const pct = (value: number, total: number) => `${(value / total) * 100}%`;
  const pendingFill = layers.some((layer) => layer.pending);

  return (
    <DemoFrame
      title="Try the compositor"
      instructions="Drag a layer and watch it snap to the centre and to other layers. Arrow keys nudge the selected layer (Shift for bigger steps). Change its blend mode, generate a fill into the mask, then undo with Cmd/Ctrl+Z."
      note="A simplified DOM reconstruction for this portfolio. The production Compositor is built on Konva, and real fills come from an AI model."
    >
      {/* Undo/redo shortcuts are scoped to the demo region. */}
      <div className="cd-layout" role="group" aria-label="Compositor" onKeyDown={onDemoKeyDown}>
        <div ref={stageRef} className="cd-stage">
          <span className="cd-mask" style={{ left: pct(226, STAGE_W), top: pct(14, STAGE_H), width: pct(170, STAGE_W), height: pct(132, STAGE_H) }}>
            <span className="type-mono">mask{maskUses > 1 ? `, reused ×${maskUses - 1}` : ''}</span>
          </span>
          {layers.map((layer) => (
            <button
              key={layer.id}
              type="button"
              className="cd-layer"
              data-selected={layer.id === selectedId || undefined}
              data-pending={layer.pending || undefined}
              aria-pressed={layer.id === selectedId}
              aria-label={`${layer.name} layer, ${layer.blend} blend`}
              style={{
                left: pct(layer.x, STAGE_W),
                top: pct(layer.y, STAGE_H),
                width: pct(layer.w, STAGE_W),
                height: pct(layer.h, STAGE_H),
                mixBlendMode: layer.blend,
              }}
              onPointerDown={(event) => onPointerDown(event, layer)}
              onClick={() => setSelectedId(layer.id)}
              onKeyDown={(event) => onLayerKeyDown(event, layer)}
            >
              <LayerArt kind={layer.kind} pending={layer.pending} />
              {layer.pending ? <span className="cd-pending-label type-mono">preview, generating…</span> : null}
            </button>
          ))}
          {guides.x.map((x) => (
            <span key={`gx-${x}`} className="cd-guide cd-guide-x" style={{ left: pct(x, STAGE_W) }} />
          ))}
          {guides.y.map((y) => (
            <span key={`gy-${y}`} className="cd-guide cd-guide-y" style={{ top: pct(y, STAGE_H) }} />
          ))}
        </div>

        <div className="cd-panel">
          <div className="flex items-center justify-between gap-3">
            <p className="type-small font-[600]">Layers</p>
            <div className="flex gap-2">
              <button type="button" className="demo-button" onClick={undo} disabled={history.past.length === 0}>
                Undo
              </button>
              <button type="button" className="demo-button" onClick={redo} disabled={history.future.length === 0}>
                Redo
              </button>
            </div>
          </div>
          <ol className="cd-layer-list" reversed>
            {[...layers].reverse().map((layer) => (
              <li key={layer.id}>
                <button
                  type="button"
                  className="cd-layer-row"
                  data-selected={layer.id === selectedId || undefined}
                  aria-pressed={layer.id === selectedId}
                  onClick={() => setSelectedId(layer.id)}
                >
                  <span>{layer.name}</span>
                  <span className="type-mono text-graphite">{layer.blend}</span>
                </button>
              </li>
            ))}
            <li>
              <span className="cd-layer-row cd-layer-locked">
                <span>Background</span>
                <span className="type-mono text-graphite">locked</span>
              </span>
            </li>
          </ol>

          <label htmlFor={blendId} className="type-small mt-5 block font-[600]">
            Blend mode{selected ? ` for ${selected.name}` : ''}
          </label>
          <select
            id={blendId}
            className="demo-select mt-2"
            value={selected?.blend ?? BlendMode.NORMAL}
            onChange={(event) => setBlend(event.target.value as BlendMode)}
            disabled={!selected}
          >
            {Object.values(BlendMode).map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>

          <button type="button" className="demo-button demo-button-strong mt-5 w-full" onClick={generateFill} disabled={pendingFill}>
            {maskUses === 0 ? 'Generate fill in mask' : 'Generate again, same mask'}
          </button>
          <p className="type-small mt-2 text-graphite" aria-live="polite">
            {pendingFill
              ? 'Showing an optimistic preview while the fill generates…'
              : maskUses > 0
                ? `Fill placed. The mask has been used ${maskUses} ${maskUses === 1 ? 'time' : 'times'}.`
                : 'The lavender mask marks where a fill will go.'}
          </p>
          <p className="type-mono mt-4 text-graphite">
            history {history.past.length} / redo {history.future.length}
          </p>
        </div>
      </div>
    </DemoFrame>
  );
}
