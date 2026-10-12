import { type EditorGlyph, EditorIcon } from './editor-icons';
import { Lucide } from './lucide-icons';
import { Dots, type Pt, VizFrame, wirePath } from './primitives';

/**
 * iGOT.ai Studio's agent builder, reconstructed after the live product: the
 * workspace bar, the rail of task types, and an assistant's workflow on the
 * canvas. Agent tasks wear the green header and their avatar, tool tasks the
 * blue outline, and every card carries its place in the execution order, which
 * the graph engine keeps in step with the edges. Edges take the colour of the
 * task they leave, and the minimap and the zoom and Auto Layout controls sit in
 * the corner.
 */

const NodeKind = {
  AGENT: 'agent',
  TOOL: 'tool',
} as const;
type NodeKind = (typeof NodeKind)[keyof typeof NodeKind];

interface Section {
  title: string;
  lines: readonly string[];
}

interface FlowNode {
  id: string;
  order: number;
  kind: NodeKind;
  title: string;
  subtitle?: string;
  glyph?: EditorGlyph;
  task: Section;
  goal: readonly string[];
  authorize?: boolean;
  /** The task's colour: its outgoing edges and its block in the minimap. */
  color: string;
}

type Layout = Record<string, Pt>;

interface CardProps extends Pt {
  node: FlowNode;
  w: number;
}

interface GraphProps {
  layout: Layout;
  w: number;
}

interface MiniMapProps extends Pt {
  w: number;
  h: number;
  layout: Layout;
  nodeWidth: number;
}

interface ControlsProps extends Pt {
  w: number;
}

interface RailTileProps extends Pt {
  glyph?: EditorGlyph;
}

interface ButtonProps extends Pt {
  w: number;
  label: string;
  glyph?: EditorGlyph;
  filled?: string;
  trailing?: EditorGlyph;
}

interface LinesProps extends Pt {
  lines: readonly string[];
}

interface RailLabelProps extends Pt {
  label: string;
}

const INK = '#111827';
const TEXT = '#374151';
const MUTED = '#4b5563';
const FAINT = '#6b7280';
const LINE = '#e5e7eb';
const SOFT = '#f9fafb';
const GREEN = '#17994f';
const PUBLIC = '#1e8a3c';
const TOOL_EDGE = '#93b4f6';
const INFO = '#2563eb';
const GOAL = '#7c3aed';
const AUTHORIZE = '#a51c1c';
const ADD = '#1d4ed8';

const AGENT_HEIGHT = 126;
const TOOL_HEIGHT = 162;
const AUTHORIZE_HEIGHT = 30;

const nodes: FlowNode[] = [
  {
    id: 'collect',
    order: 1,
    kind: NodeKind.TOOL,
    title: 'Follow-up',
    subtitle: 'Engage with a specific message',
    glyph: Lucide.MESSAGES_SQUARE,
    task: { title: 'Engagement Message', lines: ['Hi! Send the candidate’s', 'name, role, and start date.'] },
    goal: ['Collect the details the', 'offer letter needs.'],
    color: '#93c5fd',
  },
  {
    id: 'ocr',
    order: 2,
    kind: NodeKind.TOOL,
    title: 'File upload (OCR)',
    subtitle: 'Import your data',
    glyph: Lucide.UPLOAD,
    task: { title: 'Task Description', lines: ['Read the job description', 'the recruiter uploads.'] },
    goal: ['Extract the role, salary,', 'and benefits.'],
    color: '#38bdf8',
  },
  {
    id: 'search',
    order: 3,
    kind: NodeKind.AGENT,
    title: 'Search online',
    task: { title: 'Task Description', lines: ['Find the company’s letter', 'template and brand tone.'] },
    goal: ['Layout and tone rules', 'for the draft.'],
    color: '#c084fc',
  },
  {
    id: 'write',
    order: 4,
    kind: NodeKind.AGENT,
    title: 'Start Writing',
    task: { title: 'Task Description', lines: ['Draft the offer letter from', 'tasks 1 to 3, on brand.'] },
    goal: ['A complete, personalized', 'offer letter draft.'],
    color: '#f43f7a',
  },
  {
    id: 'review',
    order: 5,
    kind: NodeKind.TOOL,
    title: 'Follow-up',
    subtitle: 'Engage with a specific message',
    glyph: Lucide.MESSAGES_SQUARE,
    task: { title: 'Engagement Message', lines: ['Please review the draft.', 'Any changes? (Yes/No)'] },
    goal: ['Human review before the', 'letter goes out.'],
    color: '#f59e0b',
  },
  {
    id: 'mail',
    order: 6,
    kind: NodeKind.TOOL,
    title: 'Send Mail Assistant',
    glyph: Lucide.MAIL,
    task: { title: 'Task Description', lines: ['Email the final letter as', 'a PDF to the new hire.'] },
    goal: ['Deliver the offer letter', 'to the new hire’s inbox.'],
    authorize: true,
    color: '#e879f9',
  },
  {
    id: 'meeting',
    order: 7,
    kind: NodeKind.TOOL,
    title: 'Meeting Assistant',
    glyph: Lucide.CALENDAR,
    task: { title: 'Task Description', lines: ['Book a welcome call for', 'the new hire’s first day.'] },
    goal: ['Onboarding on the', 'calendar.'],
    authorize: true,
    color: '#818cf8',
  },
];

const edges: [string, string][] = [
  ['collect', 'ocr'],
  ['collect', 'search'],
  ['ocr', 'write'],
  ['search', 'write'],
  ['write', 'review'],
  ['review', 'mail'],
  ['review', 'meeting'],
];

const wideLayout: Layout = {
  collect: { x: 116, y: 279 },
  ocr: { x: 332, y: 194 },
  search: { x: 332, y: 400 },
  write: { x: 548, y: 297 },
  review: { x: 764, y: 279 },
  mail: { x: 980, y: 150 },
  meeting: { x: 980, y: 378 },
};

const narrowLayout: Layout = {
  collect: { x: 26, y: 249 },
  ocr: { x: 216, y: 164 },
  search: { x: 216, y: 370 },
  write: { x: 406, y: 267 },
};

const nodeById = new Map(nodes.map((node) => [node.id, node]));

function heightOf(node: FlowNode): number {
  if (node.kind === NodeKind.AGENT) return AGENT_HEIGHT;
  return TOOL_HEIGHT + (node.authorize ? AUTHORIZE_HEIGHT : 0);
}

/** An original robot avatar standing in for the product's agent portraits. */
function Avatar({ x, y }: Pt) {
  return (
    <g>
      <circle cx={x} cy={y} r={17} fill="#ecfdf5" stroke="#fff" strokeWidth={2} />
      <circle cx={x} cy={y} r={18} fill="none" stroke="#a7f3d0" />
      <line x1={x} y1={y - 12} x2={x} y2={y - 8} stroke="#94a3b8" strokeWidth={1.2} />
      <circle cx={x} cy={y - 12.5} r={1.6} fill="#14b8a6" />
      <rect x={x - 8} y={y - 8} width={16} height={12} rx={4} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={0.8} />
      <rect x={x - 6} y={y - 6} width={12} height={7} rx={2.5} fill="#1e293b" />
      <circle cx={x - 3} cy={y - 2.5} r={1.3} fill="#5eead4" />
      <circle cx={x + 3} cy={y - 2.5} r={1.3} fill="#5eead4" />
      <rect x={x - 6} y={y + 5} width={12} height={7} rx={3} fill="#cbd5e1" />
      <rect x={x + 5} y={y - 13} width={9} height={7} rx={2} fill="#14b8a6" />
      <path d={`M${x + 7} ${y - 6}l-1.5 2.5 3-2.5z`} fill="#14b8a6" />
    </g>
  );
}

function AddButton({ x, y }: Pt) {
  return (
    <g>
      <circle cx={x} cy={y} r={8} fill={ADD} />
      <path d={`M${x - 4} ${y}h8M${x} ${y - 4}v8`} stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
}

function Lines({ x, y, lines }: LinesProps) {
  return (
    <>
      {lines.map((line, index) => (
        <text key={line} x={x} y={y + index * 12} fontSize={9} fill={MUTED}>
          {line}
        </text>
      ))}
    </>
  );
}

/** An agent task: the green header with its avatar and order, then the task and its goal. */
function AgentCard({ x, y, node, w }: CardProps) {
  const h = AGENT_HEIGHT;
  return (
    <g>
      <rect x={x} y={y + 3} width={w} height={h} rx={8} fill="rgba(15,23,42,0.06)" />
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#fff" stroke={LINE} />
      <path d={`M${x} ${y + 28}V${y + 8}a8 8 0 0 1 8-8h${w - 16}a8 8 0 0 1 8 8V${y + 28}Z`} fill={GREEN} />
      <text x={x + 42 + (w - 76) / 2} y={y + 18.5} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff">
        {node.title}
      </text>
      <rect x={x + w - 31} y={y + 7} width={23} height={14} rx={7} fill="#fff" />
      <text x={x + w - 19.5} y={y + 17.5} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={GREEN}>
        #{node.order}
      </text>
      <Avatar x={x + 24} y={y + 2} />
      <text x={x + 12} y={y + 46} fontSize={9.5} fontWeight={700} fill={INK}>
        {node.task.title}
      </text>
      <Lines x={x + 12} y={y + 59} lines={node.task.lines} />
      <text x={x + 12} y={y + 89} fontSize={9.5} fontWeight={700} fill={INK}>
        Outcome goals
      </text>
      <Lines x={x + 12} y={y + 102} lines={node.goal} />
    </g>
  );
}

/** A tool task: the blue outline, its icon and order, the task and goal in an inset, and Authorize where it needs Google. */
function ToolCard({ x, y, node, w }: CardProps) {
  const h = heightOf(node);
  return (
    <g>
      <rect x={x} y={y + 3} width={w} height={h} rx={8} fill="rgba(15,23,42,0.06)" />
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#fff" stroke={TOOL_EDGE} strokeWidth={1.5} />
      {node.glyph ? <EditorIcon x={x + 11} y={y + 10} glyph={node.glyph} size={13} color={INK} /> : null}
      <text x={x + 30} y={y + 20} fontSize={10} fontWeight={700} fill={INK}>
        {node.title}
      </text>
      {node.subtitle ? (
        <text x={x + 30} y={y + 31} fontSize={8} fill={MUTED}>
          {node.subtitle}
        </text>
      ) : null}
      <text x={x + w - 12} y={y + 20} textAnchor="end" fontSize={8.5} fill={FAINT}>
        #{node.order}
      </text>
      <rect x={x + 8} y={y + 40} width={w - 16} height={112} rx={6} fill={SOFT} stroke="#eef0f4" />
      <circle cx={x + 19} cy={y + 55} r={5} fill={INFO} />
      <text x={x + 19} y={y + 57.8} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#fff">
        i
      </text>
      <text x={x + 29} y={y + 58} fontSize={9.5} fontWeight={700} fill={INK}>
        {node.task.title}
      </text>
      <Lines x={x + 29} y={y + 71} lines={node.task.lines} />
      <line x1={x + 16} y1={y + 94} x2={x + w - 16} y2={y + 94} stroke="#eef0f4" />
      <EditorIcon x={x + 13} y={y + 101} glyph={Lucide.TROPHY} size={11} color={GOAL} />
      <text x={x + 29} y={y + 110} fontSize={9.5} fontWeight={700} fill={INK}>
        Outcome goals
      </text>
      <Lines x={x + 29} y={y + 123} lines={node.goal} />
      {node.authorize ? (
        <g>
          <rect x={x + 8} y={y + 158} width={w - 16} height={24} rx={4} fill={AUTHORIZE} />
          <text x={x + w / 2} y={y + 173.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#fff">
            <tspan fontWeight={800}>G</tspan>
            {'  Authorize'}
          </text>
        </g>
      ) : null}
    </g>
  );
}

/** The workflow: edges coloured by the task they leave, with a handle dot at each end, under the cards. */
function Graph({ layout, w }: GraphProps) {
  const placed = nodes.filter((node) => layout[node.id]);
  return (
    <g>
      {edges.map(([sourceId, targetId]) => {
        const source = nodeById.get(sourceId);
        const target = nodeById.get(targetId);
        const from = layout[sourceId];
        const to = layout[targetId];
        if (!source || !target || !from || !to) return null;
        const start = { x: from.x + w, y: from.y + heightOf(source) / 2 };
        const end = { x: to.x, y: to.y + heightOf(target) / 2 };
        return (
          <g key={`${sourceId}-${targetId}`}>
            <path d={wirePath(start, end)} fill="none" stroke={source.color} strokeWidth={2} />
            <circle cx={start.x + 2} cy={start.y} r={3.5} fill={source.color} />
            <circle cx={end.x - 2} cy={end.y} r={3.5} fill={source.color} />
          </g>
        );
      })}
      {placed.map((node) => {
        const at = layout[node.id] ?? { x: 0, y: 0 };
        const Card = node.kind === NodeKind.AGENT ? AgentCard : ToolCard;
        return (
          <g key={node.id}>
            <Card x={at.x} y={at.y} node={node} w={w} />
            <AddButton x={at.x + w + 12} y={at.y + heightOf(node) - 4} />
          </g>
        );
      })}
    </g>
  );
}

/** The minimap: every task as a block in its colour, inside the viewport. */
function MiniMap({ x, y, w, h, layout, nodeWidth }: MiniMapProps) {
  const placed = nodes.flatMap((node) => {
    const at = layout[node.id];
    return at ? [{ node, at }] : [];
  });
  const left = Math.min(...placed.map(({ at }) => at.x));
  const right = Math.max(...placed.map(({ at }) => at.x + nodeWidth));
  const top = Math.min(...placed.map(({ at }) => at.y));
  const bottom = Math.max(...placed.map(({ node, at }) => at.y + heightOf(node)));
  const scale = Math.min((w - 36) / (right - left), (h - 32) / (bottom - top));
  const offsetX = x + (w - (right - left) * scale) / 2;
  const offsetY = y + (h - (bottom - top) * scale) / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill="#f3f4f6" stroke={LINE} />
      <rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} fill="#fff" />
      {placed.map(({ node, at }) => (
        <rect
          key={node.id}
          x={offsetX + (at.x - left) * scale}
          y={offsetY + (at.y - top) * scale}
          width={nodeWidth * scale}
          height={heightOf(node) * scale}
          fill={node.color}
        />
      ))}
    </g>
  );
}

/** Zoom in, zoom out, and Auto Layout. */
function Controls({ x, y, w }: ControlsProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={40} rx={8} fill="#fff" stroke={LINE} />
      <circle cx={x + 20} cy={y + 20} r={12} fill="#fff" stroke="#d1d5db" />
      <EditorIcon x={x + 13} y={y + 13} glyph={Lucide.PLUS} size={14} color={INK} />
      <circle cx={x + 50} cy={y + 20} r={12} fill="#fff" stroke="#d1d5db" />
      <EditorIcon x={x + 43} y={y + 13} glyph={Lucide.MINUS} size={14} color={INK} />
      <EditorIcon x={x + 72} y={y + 12} glyph={Lucide.LAYOUT_GRID} size={16} color={INK} />
      <text x={x + 94} y={y + 24.5} fontSize={11.5} fill={INK}>
        Auto Layout
      </text>
    </g>
  );
}

/** Google's four-colour G, for the rail tile. */
function GoogleMark({ x, y }: Pt) {
  const r = 7;
  const point = (degrees: number) => {
    const angle = (degrees * Math.PI) / 180;
    return `${x + r * Math.cos(angle)} ${y - r * Math.sin(angle)}`;
  };
  const arc = (from: number, to: number) => `M${point(from)}A${r} ${r} 0 0 0 ${point(to)}`;
  return (
    <g fill="none" strokeWidth={3}>
      <path d={arc(45, 150)} stroke="#ea4335" />
      <path d={arc(150, 210)} stroke="#fbbc05" />
      <path d={arc(210, 320)} stroke="#34a853" />
      <path d={`${arc(320, 360)}H${x + 0.5}`} stroke="#4285f4" />
    </g>
  );
}

function RailTile({ x, y, glyph }: RailTileProps) {
  return (
    <g>
      <rect x={x} y={y} width={44} height={44} rx={8} fill="#fff" stroke={LINE} />
      {glyph ? <EditorIcon x={x + 12} y={y + 12} glyph={glyph} size={20} color={INK} /> : <GoogleMark x={x + 22} y={y + 22} />}
    </g>
  );
}

function RailLabel({ x, y, label }: RailLabelProps) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={12} fontWeight={500} fill={FAINT}>
      {label}
    </text>
  );
}

function Button({ x, y, w, label, glyph, filled, trailing }: ButtonProps) {
  const color = filled ? '#fff' : INK;
  return (
    <g>
      <rect x={x} y={y} width={w} height={34} rx={8} fill={filled ?? '#fff'} stroke={filled ? 'none' : '#d1d5db'} />
      {glyph ? <EditorIcon x={x + 12} y={y + 10} glyph={glyph} size={14} color={color} /> : null}
      <text x={x + (glyph ? 32 : 16)} y={y + 21.5} fontSize={12.5} fontWeight={filled ? 600 : 500} fill={color}>
        {label}
      </text>
      {trailing ? <EditorIcon x={x + w - 22} y={y + 11} glyph={trailing} size={12} color={color} /> : null}
    </g>
  );
}

/** The assistant's mark beside its name. */
function Sparkle({ x, y }: Pt) {
  return (
    <path
      d={`M${x} ${y - 11}C${x + 1.5} ${y - 2} ${x + 2} ${y - 1.5} ${x + 11} ${y}C${x + 2} ${y + 1.5} ${x + 1.5} ${y + 2} ${x} ${y + 11}C${x - 1.5} ${y + 2} ${x - 2} ${y + 1.5} ${x - 11} ${y}C${x - 2} ${y - 1.5} ${x - 1.5} ${y - 2} ${x} ${y - 11}Z`}
      fill="#6d83f2"
    />
  );
}

function Wide() {
  const rail = [
    { label: 'Info', y: 104, tiles: [Lucide.INFO] },
    { label: 'Message', y: 180, tiles: [Lucide.MESSAGES_SQUARE, Lucide.UPLOAD] },
    {
      label: 'Agents',
      y: 308,
      tiles: [Lucide.APP_WINDOW, undefined, Lucide.FILE_TEXT, Lucide.HEADPHONES, Lucide.IMAGE, Lucide.WEBHOOK, Lucide.COPY, Lucide.SEND],
    },
  ];
  return (
    <>
      <rect x={8} y={8} width={1184} height={744} rx={14} fill="#fff" />
      <g transform="translate(92 72)">
        <Dots width={1100} height={680} color="#d4d4d8" background="none" />
      </g>

      {/* Rail of task types */}
      <path d="M22 8H92V752H22a14 14 0 0 1-14-14V22a14 14 0 0 1 14-14Z" fill={SOFT} />
      <line x1={92} y1={8} x2={92} y2={752} stroke={LINE} />
      <EditorIcon x={38} y={30} glyph={Lucide.CHEVRONS_RIGHT} size={20} color={INK} strokeWidth={2.5} />
      {rail.map((group) => (
        <g key={group.label}>
          <RailLabel x={50} y={group.y} label={group.label} />
          {group.tiles.map((glyph, index) => (
            <RailTile key={index} x={28} y={group.y + 10 + index * 52} glyph={glyph} />
          ))}
        </g>
      ))}

      {/* Workspace bar */}
      <line x1={92} y1={72} x2={1192} y2={72} stroke={LINE} />
      <EditorIcon x={112} y={33} glyph={Lucide.HOUSE} size={14} color={MUTED} />
      <text x={132} y={45} fontSize={13} fill={TEXT}>
        Workspace
      </text>
      <EditorIcon x={206} y={34} glyph={Lucide.CHEVRON_RIGHT} size={12} color="#9ca3af" />
      <EditorIcon x={226} y={33} glyph={Lucide.BOT} size={14} color={MUTED} />
      <text x={246} y={45} fontSize={13} fill={TEXT}>
        Assistant Studio
      </text>
      <Sparkle x={374} y={40} />
      <text x={394} y={46} fontSize={15} fill={FAINT}>
        /
      </text>
      <text x={408} y={46} fontSize={15} fontWeight={700} fill={INK}>
        Offer Letter Creation VA
      </text>
      <EditorIcon x={630} y={32} glyph={Lucide.USER_PLUS} size={16} color={INK} />
      <text x={658} y={45} fontSize={13} fill={INK}>
        More
      </text>
      <EditorIcon x={694} y={35} glyph={Lucide.CHEVRON_DOWN} size={12} color={INK} />
      <Button x={746} y={23} w={96} label="New Bot" glyph={Lucide.PLUS} />
      <Button x={852} y={23} w={96} label="Public" filled={PUBLIC} trailing={Lucide.CHEVRON_DOWN} />
      <Button x={958} y={23} w={104} label="Settings" glyph={Lucide.SETTINGS} />
      <Button x={1072} y={23} w={104} label="Preview" glyph={Lucide.PLAY} filled="#1f2937" />

      {/* The workflow */}
      <Graph layout={wideLayout} w={176} />
      <MiniMap x={1004} y={586} w={172} h={106} layout={wideLayout} nodeWidth={176} />
      <Controls x={1004} y={702} w={172} />

      <rect x={8} y={8} width={1184} height={744} rx={14} fill="none" stroke={LINE} />
    </>
  );
}

function Narrow() {
  return (
    <>
      <rect x={8} y={8} width={584} height={744} rx={14} fill="#fff" />
      <g transform="translate(8 64)">
        <Dots width={584} height={688} color="#d4d4d8" background="none" />
      </g>

      <Sparkle x={34} y={36} />
      <text x={54} y={41} fontSize={14} fontWeight={700} fill={INK}>
        Offer Letter Creation VA
      </text>
      <Button x={478} y={19} w={100} label="Preview" glyph={Lucide.PLAY} filled="#1f2937" />
      <line x1={8} y1={64} x2={592} y2={64} stroke={LINE} />

      <Graph layout={narrowLayout} w={164} />
      <MiniMap x={420} y={590} w={156} h={96} layout={wideLayout} nodeWidth={176} />
      <Controls x={420} y={696} w={156} />

      <rect x={8} y={8} width={584} height={744} rx={14} fill="none" stroke={LINE} />
    </>
  );
}

export function IgotVisual() {
  return (
    <VizFrame
      label="Reconstruction of iGOT.ai Studio's agent builder with the Offer Letter Creation VA workflow. A rail lists task types under Info, Message, and Agents. On a dotted canvas, a Follow-up collects the candidate's details, then fans out to a File upload OCR task that reads the job description and a Search online agent that finds the company's letter template. Both feed a Start Writing agent, a second Follow-up asks for review, and the flow ends in a Send Mail Assistant and a Meeting Assistant, each with an Authorize button for Google. Agent tasks have green headers and avatars, tool tasks blue outlines; each card shows its number in the execution order, edges take the colour of the task they leave, and a minimap and zoom and Auto Layout controls sit in the corner."
      wide={<Wide />}
      narrow={<Narrow />}
    />
  );
}
