import { type EditorGlyph, EditorIcon } from './editor-icons';
import { Lucide } from './lucide-icons';
import { Cursor, Dots, wirePath, type Pt, VizFrame } from './primitives';
import { VIZ_CANVAS as CANVAS, VIZ_FOG as FOG, VIZ_INK as INK, VIZ_NODE as NODE, VIZ_PAPER as PAPER, VIZ_SIGNAL as SIGNAL, VIZ_STROKE as STROKE } from './palette';

/**
 * iGOT.ai Studio's agent builder, reconstructed around what the graph engine
 * does: the canvas is the program. An offer-letter assistant runs left to
 * right; agent tasks ring green, tool tasks blue, and every card carries its
 * place in the run order. Clicking + on Start Writing adds a task at once,
 * dashed while it saves, and the Run order panel, derived from the edges layer
 * by layer, already lists it.
 */

const Kind = {
  AGENT: 'agent',
  TOOL: 'tool',
} as const;
type Kind = (typeof Kind)[keyof typeof Kind];

interface Task {
  id: string;
  order: number;
  layer: number;
  kind: Kind;
  name: string;
  glyph: EditorGlyph;
  lines: readonly [string, string];
  /** Its outgoing wires. */
  color: string;
  /** Added optimistically: on the canvas before the server confirms it. */
  saving?: boolean;
}

type Layout = Record<string, Pt>;

interface CardProps extends Pt {
  task: Task;
  w: number;
}

interface GraphProps {
  layout: Layout;
  w: number;
}

interface WireProps {
  from: Pt;
  to: Pt;
  color: string;
  dashed?: boolean;
}

interface PanelProps extends Pt {
  w: number;
  h: number;
  columns?: number;
}

interface RowProps extends Pt {
  w: number;
  task: Task;
}

interface KindStyle {
  stroke: string;
  fill: string;
}

interface PillProps extends Pt {
  w: number;
  label: string;
  glyph?: EditorGlyph;
}

const KIND_STYLE: Record<Kind, KindStyle> = {
  [Kind.AGENT]: { stroke: '#3fbf7f', fill: '#13231a' },
  [Kind.TOOL]: { stroke: '#8ab4ff', fill: '#141b29' },
};

const CARD_HEIGHT = 96;

const tasks: Task[] = [
  {
    id: 'collect',
    order: 1,
    layer: 1,
    kind: Kind.TOOL,
    name: 'Follow-up',
    glyph: Lucide.MESSAGES_SQUARE,
    lines: ['Ask the recruiter', 'for the details'],
    color: '#8ab4ff',
  },
  {
    id: 'ocr',
    order: 2,
    layer: 2,
    kind: Kind.TOOL,
    name: 'File upload (OCR)',
    glyph: Lucide.UPLOAD,
    lines: ['Read the job', 'description PDF'],
    color: '#e6a03a',
  },
  {
    id: 'search',
    order: 3,
    layer: 2,
    kind: Kind.AGENT,
    name: 'Search online',
    glyph: Lucide.BOT,
    lines: ['Find the letter', 'template and tone'],
    color: '#b4a2ff',
  },
  {
    id: 'write',
    order: 4,
    layer: 3,
    kind: Kind.AGENT,
    name: 'Start Writing',
    glyph: Lucide.BOT,
    lines: ['Draft the letter', 'from tasks 1 to 3'],
    color: '#94cc7a',
  },
  {
    id: 'mail',
    order: 5,
    layer: 4,
    kind: Kind.TOOL,
    name: 'Send Mail',
    glyph: Lucide.MAIL,
    lines: ['Email the letter', 'as a PDF'],
    color: '#8ab4ff',
  },
  {
    id: 'meeting',
    order: 6,
    layer: 4,
    kind: Kind.TOOL,
    name: 'Meeting',
    glyph: Lucide.CALENDAR,
    lines: ['Book a welcome', 'call for day one'],
    color: '#8ab4ff',
  },
  {
    id: 'telegram',
    order: 7,
    layer: 4,
    kind: Kind.TOOL,
    name: 'Telegram',
    glyph: Lucide.SEND,
    lines: ['Tell the recruiter', 'it has gone out'],
    color: '#8ab4ff',
    saving: true,
  },
];

const edges: [string, string][] = [
  ['collect', 'ocr'],
  ['collect', 'search'],
  ['ocr', 'write'],
  ['search', 'write'],
  ['write', 'mail'],
  ['write', 'meeting'],
  ['write', 'telegram'],
];

const wideLayout: Layout = {
  collect: { x: 56, y: 352 },
  ocr: { x: 262, y: 277 },
  search: { x: 262, y: 427 },
  write: { x: 468, y: 352 },
  mail: { x: 674, y: 210 },
  meeting: { x: 674, y: 352 },
  telegram: { x: 674, y: 494 },
};

const narrowLayout: Layout = {
  collect: { x: 24, y: 176 },
  ocr: { x: 214, y: 106 },
  search: { x: 214, y: 246 },
  write: { x: 404, y: 176 },
};

const taskById = new Map(tasks.map((task) => [task.id, task]));

function Wire({ from, to, color, dashed }: WireProps) {
  return (
    <path
      d={wirePath(from, to, Math.max(36, Math.abs(to.x - from.x) * 0.5))}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeDasharray={dashed ? '6 6' : undefined}
      opacity={dashed ? 0.6 : 0.95}
    />
  );
}

/** A task: its name and run-order number above the card, the kind disc and the instruction inside. */
function TaskCard({ x, y, task, w }: CardProps) {
  const style = KIND_STYLE[task.kind];
  const stroke = task.saving ? PAPER : style.stroke;
  return (
    <g opacity={task.saving ? 0.72 : 1}>
      <text x={x + 2} y={y - 10} className="v-small" fill={PAPER}>
        {task.name}
      </text>
      <text x={x + w} y={y - 10} textAnchor="end" className="v-kicker" fill={task.saving ? FOG : style.stroke}>
        #{task.order}
      </text>
      <rect
        x={x}
        y={y}
        width={w}
        height={CARD_HEIGHT}
        rx={12}
        fill={task.saving ? NODE : style.fill}
        stroke={stroke}
        strokeWidth={1.5}
        strokeDasharray={task.saving ? '6 5' : undefined}
      />
      <circle cx={x + 24} cy={y + 26} r={14} fill={style.stroke} fillOpacity={0.16} />
      <EditorIcon x={x + 16} y={y + 18} glyph={task.glyph} size={16} color={style.stroke} />
      <text x={x + 46} y={y + 31} className="v-kicker" fill={FOG}>
        {task.saving ? 'saving…' : task.kind}
      </text>
      <text x={x + 14} y={y + 62} className="v-small" fill={PAPER}>
        {task.lines[0]}
      </text>
      <text x={x + 14} y={y + 81} className="v-small" fill={FOG}>
        {task.lines[1]}
      </text>
    </g>
  );
}

/** The workflow: wires in the colour of the task they leave, ports at both ends, then the cards. */
function Graph({ layout, w }: GraphProps) {
  return (
    <g>
      {edges.map(([sourceId, targetId]) => {
        const source = taskById.get(sourceId);
        const target = taskById.get(targetId);
        const from = layout[sourceId];
        const to = layout[targetId];
        if (!source || !target || !from || !to) return null;
        const start = { x: from.x + w, y: from.y + CARD_HEIGHT / 2 };
        const end = { x: to.x, y: to.y + CARD_HEIGHT / 2 };
        return (
          <g key={`${sourceId}-${targetId}`}>
            <Wire from={start} to={end} color={source.color} dashed={target.saving} />
            <circle cx={start.x} cy={start.y} r={5.5} fill={source.color} />
            <circle cx={end.x} cy={end.y} r={5.5} fill={CANVAS} stroke={source.color} strokeWidth={2} opacity={target.saving ? 0.6 : 1} />
          </g>
        );
      })}
      {tasks.map((task) => {
        const at = layout[task.id];
        return at ? <TaskCard key={task.id} x={at.x} y={at.y} task={task} w={w} /> : null;
      })}
    </g>
  );
}

/** The + under a card, mid-click. */
function AddClick({ x, y }: Pt) {
  return (
    <g>
      <circle cx={x} cy={y} r={15} fill="none" stroke={SIGNAL} strokeOpacity={0.4} strokeWidth={6} />
      <circle cx={x} cy={y} r={11} fill={SIGNAL} />
      <path d={`M${x - 5} ${y}h10M${x} ${y - 5}v10`} stroke={INK} strokeWidth={2} strokeLinecap="round" />
      <Cursor x={x + 4} y={y + 6} />
    </g>
  );
}

function RunRow({ x, y, w, task }: RowProps) {
  return (
    <g opacity={task.saving ? 0.75 : 1}>
      <circle
        cx={x + 14}
        cy={y}
        r={13}
        fill={task.saving ? 'none' : PAPER}
        stroke={task.saving ? PAPER : 'none'}
        strokeWidth={1.5}
        strokeDasharray={task.saving ? '4 3' : undefined}
      />
      <text x={x + 14} y={y + 4.5} textAnchor="middle" className="v-kicker" fill={task.saving ? PAPER : INK}>
        {task.order}
      </text>
      <circle cx={x + 40} cy={y} r={4} fill={KIND_STYLE[task.kind].stroke} />
      <text x={x + 52} y={y + 4.5} className="v-small" fill={task.saving ? FOG : PAPER}>
        {task.name}
      </text>
      <text x={x + w} y={y + 4.5} textAnchor="end" className="v-kicker" fill={FOG}>
        {task.saving ? 'saving' : `layer ${task.layer}`}
      </text>
    </g>
  );
}

/** The order the backend runs, derived from the edges layer by layer, with the new task already in place. */
function RunOrder({ x, y, w, h, columns = 1 }: PanelProps) {
  const inner = w - 40;
  const column = (inner - (columns - 1) * 28) / columns;
  const perColumn = Math.ceil(tasks.length / columns);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} fill="#171716" stroke={STROKE} />
      <text x={x + 20} y={y + 34} className="v-label" fill={PAPER}>
        Run order
      </text>
      <text x={x + w - 20} y={y + 34} textAnchor="end" className="v-kicker" fill={FOG}>
        from the edges
      </text>
      {tasks.map((task, index) => {
        const col = Math.floor(index / perColumn);
        const row = index % perColumn;
        const rx = x + 20 + col * (column + 28);
        const ry = y + 82 + row * 48;
        const previous = tasks[index - 1];
        const newLayer = row > 0 && previous && previous.layer !== task.layer;
        return (
          <g key={task.id}>
            {newLayer ? <line x1={rx} y1={ry - 24} x2={rx + column} y2={ry - 24} stroke={STROKE} /> : null}
            <RunRow x={rx} y={ry} w={column} task={task} />
          </g>
        );
      })}
      <rect x={x + 20} y={y + h - 62} width={inner} height={42} rx={21} fill="#262624" />
      <circle cx={x + 42} cy={y + h - 41} r={10} fill={SIGNAL} />
      <path d={`M${x + 37} ${y + h - 41}l3.5 3.5 6.5-7`} fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <text x={x + 62} y={y + h - 36} className="v-small" fill={PAPER}>
        Matches the edges on the canvas
      </text>
    </g>
  );
}

function Pill({ x, y, w, label, glyph }: PillProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={40} rx={20} fill={NODE} stroke={STROKE} />
      {glyph ? <EditorIcon x={x + 16} y={y + 12} glyph={glyph} size={16} color={FOG} /> : null}
      <text x={x + (glyph ? 42 : 20)} y={y + 25} className="v-label" fill={PAPER}>
        {label}
      </text>
    </g>
  );
}

function Legend({ x, y }: Pt) {
  return (
    <g>
      <rect x={x} y={y} width={14} height={14} rx={4} fill={KIND_STYLE[Kind.AGENT].fill} stroke={KIND_STYLE[Kind.AGENT].stroke} strokeWidth={2} />
      <text x={x + 22} y={y + 12} className="v-kicker" fill={PAPER}>
        agent task
      </text>
      <rect x={x + 130} y={y} width={14} height={14} rx={4} fill={KIND_STYLE[Kind.TOOL].fill} stroke={KIND_STYLE[Kind.TOOL].stroke} strokeWidth={2} />
      <text x={x + 152} y={y + 12} className="v-kicker" fill={PAPER}>
        tool task
      </text>
      <rect x={x + 250} y={y} width={14} height={14} rx={4} fill="none" stroke={PAPER} strokeWidth={1.5} strokeDasharray="3 3" />
      <text x={x + 272} y={y + 12} className="v-kicker" fill={FOG}>
        added, saving
      </text>
    </g>
  );
}

function Wide() {
  return (
    <>
      <Dots width={1200} height={760} color="rgba(244,241,232,0.08)" background={CANVAS} />

      {/* Studio chrome */}
      <Pill x={40} y={22} w={272} label="Offer Letter Creation VA" />
      <Pill x={324} y={22} w={154} label="Auto Layout" glyph={Lucide.LAYOUT_GRID} />

      <Graph layout={wideLayout} w={150} />
      <AddClick x={604} y={468} />

      <Legend x={40} y={716} />
      <RunOrder x={850} y={130} w={320} h={480} />
    </>
  );
}

function Narrow() {
  return (
    <>
      <Dots width={600} height={760} color="rgba(244,241,232,0.08)" background={CANVAS} />
      <Pill x={24} y={22} w={272} label="Offer Letter Creation VA" />

      <Graph layout={narrowLayout} w={160} />
      <AddClick x={576} y={284} />

      <RunOrder x={24} y={388} w={552} h={316} columns={2} />
      <Legend x={24} y={724} />
    </>
  );
}

export function IgotVisual() {
  return (
    <VizFrame
      label="Reconstruction of iGOT.ai Studio's agent builder for an offer-letter assistant. A Follow-up collects the details, File upload OCR and a Search online agent run next, Start Writing drafts the letter, and Send Mail and Meeting tasks follow. Agent tasks ring green and tool tasks blue, and each card shows its number in the run order. A click on the plus under Start Writing adds a Telegram task at once, dashed while it saves. A Run order panel, derived from the edges layer by layer, lists all seven tasks with the new one already in place and confirms it matches the edges on the canvas."
      wide={<Wide />}
      narrow={<Narrow />}
    />
  );
}
