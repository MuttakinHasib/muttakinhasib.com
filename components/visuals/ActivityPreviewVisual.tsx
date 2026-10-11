import { Dots, type Pt, VizFrame } from './primitives';

/**
 * The six states of cocoding.ai's live activity preview, reconstructed after
 * the frontend. The tool an agent is using picks the animation; the message
 * underneath names the agent's context and the action, as the app writes it.
 */

const Scene = {
  ORBITAL: 'orbital',
  FILE_GRID: 'file-grid',
  CODE_EDITOR: 'code-editor',
  WIREFRAME: 'wireframe',
  TERMINAL: 'terminal',
  COMPLETION: 'completion',
} as const;
type Scene = (typeof Scene)[keyof typeof Scene];

interface Box extends Pt {
  w: number;
  h: number;
}

interface SceneSpec {
  scene: Scene;
  trigger: string;
  context?: string;
  action: string;
}

interface CellProps extends Box {
  spec: SceneSpec;
}

interface WindowProps extends Box {
  title?: string;
  beam?: boolean;
}

const CANVAS = '#0f0f0f';
const NODE = '#1b1b1a';
const BAR = '#1f1f1d';
const WELL = '#151514';
const STROKE = '#30302c';
const PAPER = '#f4f1e8';
const FOG = '#a9a79c';
const SIGNAL = '#c7f36b';
const STREAM = '#8ab4ff';
const LEDGER = '#e6a03a';
const TAG = '#f0c2d4';
const MONO = { fontFamily: 'var(--font-mono)' } as const;

const specs: SceneSpec[] = [
  { scene: Scene.ORBITAL, trigger: 'thinking · task hand-off', context: 'Planning:', action: 'Delegating to Frontend Developer...' },
  { scene: Scene.FILE_GRID, trigger: 'read_file · discover_project', context: 'Crafting interface:', action: 'Reading page.tsx' },
  { scene: Scene.CODE_EDITOR, trigger: 'file_operations · any file', context: 'Building backend:', action: 'Creating todos.ts utility' },
  { scene: Scene.WIREFRAME, trigger: 'file_operations · component or page', context: 'Crafting interface:', action: 'Creating TodoList.tsx component' },
  { scene: Scene.TERMINAL, trigger: 'bash_tool_pod · shadcn_install', context: 'Crafting interface:', action: 'Installing UI components...' },
  { scene: Scene.COMPLETION, trigger: 'final', action: 'Your project is ready to run.' },
];

/** Skeleton code lines, as the code window draws them before content arrives. */
const SKELETON = [
  { indent: 0, width: 0.55, color: 'rgba(138,180,255,0.32)' },
  { indent: 0, width: 0.7, color: 'rgba(138,180,255,0.28)' },
  { indent: 0, width: 0.12, color: 'rgba(244,241,232,0.06)' },
  { indent: 0, width: 0.42, color: 'rgba(199,243,107,0.24)' },
  { indent: 1, width: 0.52, color: 'rgba(244,241,232,0.14)' },
  { indent: 1, width: 0.65, color: 'rgba(244,241,232,0.14)' },
  { indent: 2, width: 0.48, color: 'rgba(199,243,107,0.2)' },
  { indent: 2, width: 0.35, color: 'rgba(244,241,232,0.12)' },
  { indent: 1, width: 0.28, color: 'rgba(244,241,232,0.1)' },
  { indent: 0, width: 0.14, color: 'rgba(244,241,232,0.09)' },
];

const FILES = ['page.tsx', 'layout.tsx', 'globals.css', 'TodoList.tsx', 'todos.ts', 'package.json'];

/** A window frame with traffic lights, and optionally the beam that travels its border. */
function Window({ x, y, w, h, title, beam }: WindowProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={WELL} stroke={STROKE} />
      <path d={`M${x + 8} ${y}h${w - 16}a8 8 0 0 1 8 8v14H${x}V${y + 8}a8 8 0 0 1 8-8Z`} fill={BAR} />
      <line x1={x} y1={y + 22} x2={x + w} y2={y + 22} stroke={STROKE} />
      {[0, 1, 2].map((index) => (
        <circle key={index} cx={x + 12 + index * 11} cy={y + 11} r={3.5} fill={STROKE} />
      ))}
      {title ? (
        <text x={x + 50} y={y + 14.5} style={MONO} fontSize={9.5} fill={FOG}>
          {title}
        </text>
      ) : null}
      {beam ? (
        <>
          <path d={`M${x + w - 110} ${y}h60`} stroke={STREAM} strokeWidth="1.5" strokeLinecap="round" opacity={0.7} />
          <path d={`M${x + w - 50} ${y}h42a8 8 0 0 1 8 8v40`} fill="none" stroke={SIGNAL} strokeWidth="1.5" strokeLinecap="round" opacity={0.85} />
        </>
      ) : null}
    </g>
  );
}

function Orbital({ x, y, w, h }: Box) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const scale = Math.min(w, h) / 240;
  const rings = [
    { r: 50, opacity: 0.18, dot: 3, color: STREAM, angle: -40 },
    { r: 80, opacity: 0.12, dot: 2.5, color: PAPER, angle: 150 },
    { r: 110, opacity: 0.08, dot: 2.2, color: 'rgba(138,180,255,0.6)', angle: 290 },
  ];
  return (
    <g>
      {rings.map((ring) => {
        const radius = ring.r * scale;
        const radians = (ring.angle * Math.PI) / 180;
        return (
          <g key={ring.r}>
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke={`rgba(244,241,232,${ring.opacity})`} />
            <circle cx={cx + radius * Math.cos(radians)} cy={cy + radius * Math.sin(radians)} r={ring.dot} fill={ring.color} />
          </g>
        );
      })}
    </g>
  );
}

function FileGrid({ x, y, w, h }: Box) {
  const pad = 14;
  const chipW = (w - pad * 3) / 2;
  return (
    <g>
      <Window x={x} y={y} w={w} h={h} title="src/app" />
      {FILES.map((file, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        const cx = x + pad + column * (chipW + pad);
        const cy = y + 36 + row * 32;
        const active = index === 0;
        return (
          <g key={file}>
            <rect
              x={cx}
              y={cy}
              width={chipW}
              height={24}
              rx={6}
              fill={active ? 'rgba(138,180,255,0.14)' : 'rgba(244,241,232,0.04)'}
              stroke={active ? 'rgba(138,180,255,0.55)' : 'none'}
            />
            <rect x={cx + 8} y={cy + 8} width={8} height={8} rx={2} fill={file.endsWith('.css') ? TAG : file.endsWith('.json') ? LEDGER : STREAM} opacity={0.85} />
            <text x={cx + 22} y={cy + 15.5} style={MONO} fontSize={9.5} fill={active ? PAPER : FOG}>
              {file}
            </text>
          </g>
        );
      })}
      <rect x={x + 1} y={y + h - 3} width={w * 0.38} height={1.5} fill={STREAM} opacity={0.8} />
    </g>
  );
}

function CodeEditor({ x, y, w, h }: Box) {
  const top = y + 46;
  const lineHeight = Math.min(13, (h - 54) / SKELETON.length);
  return (
    <g>
      <Window x={x} y={y} w={w} h={h} title="todos.ts" beam />
      <text x={x + 10} y={y + 35} style={MONO} fontSize={8} fill={FOG}>
        todos.ts
      </text>
      <line x1={x} y1={y + 40.5} x2={x + 56} y2={y + 40.5} stroke={STREAM} strokeOpacity={0.6} />
      <rect x={x + 70} y={y + 29} width={40} height={6} rx={2} fill={STROKE} />
      {SKELETON.map((line, index) => (
        <g key={index}>
          <text x={x + 20} y={top + index * lineHeight + 5} textAnchor="end" style={MONO} fontSize={7} fill="rgba(244,241,232,0.25)">
            {index + 1}
          </text>
          <rect
            x={x + 28 + line.indent * 12}
            y={top + index * lineHeight}
            width={(w - 44) * line.width}
            height={5}
            rx={2}
            fill={line.color}
          />
        </g>
      ))}
    </g>
  );
}

function Wireframe({ x, y, w, h }: Box) {
  const inner = w - 28;
  const dashed = { fill: 'none', stroke: 'rgba(244,241,232,0.22)', strokeDasharray: '4 3' } as const;
  return (
    <g>
      <Window x={x} y={y} w={w} h={h} />
      <rect x={x + 50} y={y + 6} width={w - 64} height={10} rx={3} fill={STROKE} />
      <rect x={x + 14} y={y + 34} width={inner} height={16} rx={3} {...dashed} />
      <rect x={x + 14} y={y + 60} width={inner * 0.62} height={10} rx={3} fill="rgba(244,241,232,0.08)" />
      <rect x={x + 14} y={y + 80} width={inner - 84} height={h - 130} rx={3} {...dashed} />
      <rect x={x + w - 84} y={y + 80} width={70} height={h - 130} rx={3} {...dashed} />
      <rect x={x + 14} y={y + h - 40} width={inner} height={26} rx={3} {...dashed} />
    </g>
  );
}

function Terminal({ x, y, w, h }: Box) {
  return (
    <g>
      <Window x={x} y={y} w={w} h={h} title="Terminal" beam />
      <text x={x + 14} y={y + 46} style={MONO} fontSize={10.5} fill={PAPER}>
        <tspan fill={SIGNAL}>$</tspan> npx shadcn add checkbox
      </text>
      <text x={x + 14} y={y + 68} style={MONO} fontSize={10.5} fill={FOG}>
        <tspan fill={STREAM}>⠋</tspan> Running...
      </text>
    </g>
  );
}

function Completion({ x, y, w, h }: Box) {
  const size = Math.min(w, h) * 0.6;
  const k = size / 100;
  const left = x + (w - size) / 2;
  const top = y + (h - size) / 2;
  return (
    <g transform={`translate(${left} ${top}) scale(${k})`}>
      <circle cx={50} cy={50} r={58} fill="rgba(199,243,107,0.06)" />
      <circle cx={50} cy={50} r={44} fill="none" stroke={SIGNAL} strokeOpacity={0.75} strokeWidth={2 / k} />
      <path d="M30 52 L44 66 L70 36" fill="none" stroke={SIGNAL} strokeWidth={3 / k} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function SceneArt({ spec, ...box }: CellProps) {
  switch (spec.scene) {
    case Scene.ORBITAL:
      return <Orbital {...box} />;
    case Scene.FILE_GRID:
      return <FileGrid {...box} />;
    case Scene.CODE_EDITOR:
      return <CodeEditor {...box} />;
    case Scene.WIREFRAME:
      return <Wireframe {...box} />;
    case Scene.TERMINAL:
      return <Terminal {...box} />;
    case Scene.COMPLETION:
      return <Completion {...box} />;
  }
}

/** One state: its animation, the tools that trigger it, and the message it shows. */
function Cell({ x, y, w, h, spec }: CellProps) {
  const artH = h - 110;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} fill={NODE} stroke={STROKE} />
      <SceneArt x={x + 18} y={y + 16} w={w - 36} h={artH} spec={spec} />
      <text x={x + 18} y={y + artH + 42} style={MONO} fontSize={11} fill={FOG}>
        {spec.trigger}
      </text>
      {spec.context ? (
        <>
          <text x={x + 18} y={y + artH + 66} fontSize={14} fontWeight={600} fill={PAPER}>
            {spec.context}
          </text>
          <text x={x + 18} y={y + artH + 86} fontSize={14} fontWeight={500} fill={STREAM}>
            {spec.action}
          </text>
        </>
      ) : (
        <text x={x + 18} y={y + artH + 66} fontSize={14} fontWeight={600} fill={PAPER}>
          {spec.action}
        </text>
      )}
    </g>
  );
}

function Wide() {
  const w = 376;
  const h = 300;
  return (
    <>
      <Dots width={1200} height={636} color="rgba(244,241,232,0.07)" background={CANVAS} />
      {specs.map((spec, index) => (
        <Cell key={spec.scene} x={12 + (index % 3) * (w + 12)} y={12 + Math.floor(index / 3) * (h + 12)} w={w} h={h} spec={spec} />
      ))}
    </>
  );
}

function Narrow() {
  const w = 282;
  const h = 300;
  return (
    <>
      <Dots width={600} height={948} color="rgba(244,241,232,0.07)" background={CANVAS} />
      {specs.map((spec, index) => (
        <Cell key={spec.scene} x={12 + (index % 2) * (w + 12)} y={12 + Math.floor(index / 2) * (h + 12)} w={w} h={h} spec={spec} />
      ))}
    </>
  );
}

export function ActivityPreviewVisual() {
  return (
    <VizFrame
      label="Reconstruction of the six states of cocoding.ai’s live activity preview. Thinking or a task hand-off shows orbiting rings with Planning: Delegating to Frontend Developer. Reading files shows a file grid with Reading page.tsx. Writing a file shows a code window filling with lines, Building backend: Creating todos.ts utility. Writing a component or page shows a wireframe, Crafting interface: Creating TodoList.tsx component. Running commands shows a terminal installing UI components. The final state shows a green check with Your project is ready to run."
      wide={<Wide />}
      narrow={<Narrow />}
      wideBox="0 0 1200 636"
      narrowBox="0 0 600 948"
    />
  );
}
