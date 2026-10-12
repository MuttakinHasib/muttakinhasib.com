import { useId } from 'react';
import {
  ColumnKey,
  foreignKeys,
  type LayoutOptions,
  layoutSchema,
  type SchemaTable,
  relationships,
  type TablePosition,
  tableHeight,
  todoSchema,
} from '../demos/schema-model';
import { type EditorGlyph, EditorIcon } from './editor-icons';
import { FileTypeIcon } from './file-icons';
import { Lucide } from './lucide-icons';
import { type Pt, VizFrame } from './primitives';

/**
 * The cocoding.ai workspace just after a build, in the product's own theme:
 * the app sidebar, the chat with the finished agent timeline, the explorer
 * collapsed to its activity bar with Database picked, and the Database
 * Explorer's schema open as an editor tab. The schema view is my own design
 * rather than the product's: a React Flow diagram laid out in layers, tracing
 * one table's foreign keys in both directions, with crow's-foot relations, a
 * floating toolbar, zoom controls, and a minimap.
 */

interface WidthProps extends Pt {
  w: number;
}

interface AgentRowProps extends Pt {
  name: string;
  open?: boolean;
}

interface FileRowProps extends Pt {
  name: string;
  path: string;
}

interface GroupHeaderProps extends Pt {
  glyph: EditorGlyph;
  title: string;
}

interface EditorTabProps extends Pt {
  w: number;
  name: string;
  /** A database view's icon in place of the file-type icon. */
  glyph?: EditorGlyph;
  active?: boolean;
}

interface ToggleProps extends Pt {
  codeActive?: boolean;
}

interface ActivityBarProps extends Pt {
  h: number;
}

interface TableNodeProps {
  table: SchemaTable;
  at: TablePosition;
}

interface RelationProps {
  from: Pt;
  to: Pt;
  role: Role;
}

interface DiagramProps extends Pt {
  scale: number;
}

interface CanvasProps extends Pt {
  w: number;
  h: number;
  /** The diagram's zoom inside the canvas. */
  scale: number;
  /** Narrow canvases drop Organize and the trace summary, and shrink the minimap. */
  compact?: boolean;
}

interface ToolbarProps extends Pt {
  compact?: boolean;
}

interface MiniMapProps extends Pt {
  w: number;
  h: number;
}

const BG = '#0c0224';
const PANEL = '#150a30';
const RAIL = '#160f2c';
const LINE = 'rgba(255,255,255,0.1)';
const WHITE = '#f5f5f5';
const GRAY = '#d1d5db';
const ASH_400 = '#9c9c9c';
const ASH_500 = '#838383';
const PURPLE = '#9b66e1';
const PURPLE_500 = '#5c21a8';
const PURPLE_900 = '#1f1736';
const AMBER = 'rgba(251,191,36,0.55)';
const GREEN = '#266a40';
const ON_GRAY = '#070113';
const MONO = { fontFamily: 'var(--font-mono)' } as const;

const Role = {
  FOCUS: 'focus',
  REFERENCES: 'references',
  REFERENCED_BY: 'referenced-by',
  DIM: 'dim',
} as const;
type Role = (typeof Role)[keyof typeof Role];

/** My own schema view in the workspace's purple: glass table nodes, amber primary keys, sky foreign keys, a violet focus. */
const SCHEMA = {
  node: '#140a2c',
  header: '#1c0f3c',
  line: 'rgba(255,255,255,0.09)',
  text: '#f5f3ff',
  column: '#ddd6fe',
  muted: '#a49cbd',
  faint: '#6f6889',
  primary: '#fbbf24',
  primaryText: '#fde68a',
  foreign: '#38bdf8',
  foreignText: '#bae6fd',
  focus: '#a78bfa',
  edge: 'rgba(196,181,253,0.3)',
  glass: 'rgba(20,10,44,0.9)',
  dots: 'rgba(196,181,253,0.16)',
} as const;

const ROLE_COLOR: Record<Role, string> = {
  [Role.FOCUS]: SCHEMA.focus,
  [Role.REFERENCES]: SCHEMA.foreign,
  [Role.REFERENCED_BY]: SCHEMA.primary,
  [Role.DIM]: SCHEMA.muted,
};

/** Node anatomy: a 44px header, 6px above the rows, 22px rows 4px apart, 8px below. */
const NODE: LayoutOptions = { nodeWidth: 152, headerHeight: 50, rowHeight: 26, gapX: 42, gapY: 28 };
const ROWS_TOP = 50;
/** The table being traced: what it references lights up sky, what references it lights up amber. */
const FOCUS = 'todos';
const trace = relationships(todoSchema, FOCUS);
const positions = layoutSchema(todoSchema, NODE);
const keys = foreignKeys(todoSchema);
const placed = todoSchema.map((table) => ({ table, at: positions.get(table.name) ?? { x: 0, y: 0, layer: 0 } }));
const DIAGRAM = {
  width: Math.max(...placed.map(({ at }) => at.x)) + NODE.nodeWidth,
  top: Math.min(...placed.map(({ at }) => at.y)),
  bottom: Math.max(...placed.map(({ table, at }) => at.y + tableHeight(table, NODE))),
};

function roleOf(name: string): Role {
  if (name === FOCUS) return Role.FOCUS;
  if (trace.references.includes(name)) return Role.REFERENCES;
  if (trace.referencedBy.includes(name)) return Role.REFERENCED_BY;
  return Role.DIM;
}

function placeOf(name: string): TablePosition {
  return positions.get(name) ?? { x: 0, y: 0, layer: 0 };
}

/** React Flow's default bezier from a right-hand source handle to a left-hand target handle. */
function flowBezier(from: Pt, to: Pt): string {
  const dx = to.x - from.x;
  const offset = dx >= 0 ? dx * 0.5 : 0.25 * 25 * Math.sqrt(-dx);
  return `M${from.x} ${from.y}C${from.x + offset} ${from.y} ${to.x - offset} ${to.y} ${to.x} ${to.y}`;
}

/** The vertical centre of a column's row, where its handle sits. */
function rowCentre(table: string, column: string): number {
  const index = todoSchema.find((candidate) => candidate.name === table)?.columns.findIndex((entry) => entry.name === column) ?? 0;
  return placeOf(table).y + ROWS_TOP + index * NODE.rowHeight + 11;
}

function AgentAvatar({ x, y }: Pt) {
  return (
    <g>
      <circle cx={x} cy={y} r={9} fill="#2d2350" />
      <circle cx={x} cy={y - 2.5} r={3} fill="#c4b5fd" />
      <path d={`M${x - 5} ${y + 6}a5 4 0 0 1 10 0`} fill="#c4b5fd" />
    </g>
  );
}

function AgentRow({ x, y, name, open }: AgentRowProps) {
  return (
    <g opacity={open ? 1 : 0.7}>
      <AgentAvatar x={x + 9} y={y} />
      <text x={x + 26} y={y + 4.5} className="v-small" fontWeight={600} fill={WHITE}>
        {name}
      </text>
    </g>
  );
}

function GroupHeader({ x, y, glyph, title }: GroupHeaderProps) {
  return (
    <g>
      <EditorIcon x={x} y={y - 12} glyph={glyph} size={15} color={WHITE} />
      <text x={x + 22} y={y} className="v-small" fontWeight={600} fill={WHITE}>
        {title}
      </text>
    </g>
  );
}

/** A file in a file group; clicking one opens it in the editor. */
function FileRow({ x, y, name, path }: FileRowProps) {
  return (
    <g>
      <FileTypeIcon x={x} y={y - 11} name={name} />
      <text x={x + 22} y={y} className="v-small" fill={WHITE}>
        {name}
        <tspan dx={7} fill={ASH_500} fontSize={10.5}>
          {path}
        </tspan>
      </text>
    </g>
  );
}

function Wordmark({ x, y }: Pt) {
  return (
    <text x={x} y={y} className="v-label" fontWeight={800} fill={WHITE}>
      cocoding<tspan fill={PURPLE}>.ai</tspan>
    </text>
  );
}

function UserBubble({ x, y, w }: WidthProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={30} rx={8} fill="#241c3e" />
      <text x={x + 12} y={y + 19.5} className="v-small" fill={WHITE}>
        build a todo app
      </text>
    </g>
  );
}

function FileGroup({ x, y, w }: WidthProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={102} rx={4} fill="none" stroke={LINE} />
      <GroupHeader x={x + 10} y={y + 23} glyph={Lucide.FILE_PLUS} title="Creating components" />
      <FileRow x={x + 8} y={y + 48} name="TodoItem.tsx" path="src/components" />
      <FileRow x={x + 8} y={y + 70} name="AddTodo.tsx" path="src/components" />
      <FileRow x={x + 8} y={y + 92} name="TodoList.tsx" path="src/components" />
    </g>
  );
}

function BashGroup({ x, y, w }: WidthProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={86} rx={4} fill="none" stroke={LINE} />
      <GroupHeader x={x + 10} y={y + 23} glyph={Lucide.TERMINAL} title="Bash" />
      <text x={x + 10} y={y + 49} className="v-small" fontWeight={700} fill={ASH_400}>
        Install dependencies
      </text>
      <rect x={x + 10} y={y + 58} width={w - 20} height={20} rx={3} fill="#1b1330" />
      <text x={x + 18} y={y + 72} style={MONO} fontSize={11} fill={ASH_400}>
        $ npm install
      </text>
    </g>
  );
}

function ChatInput({ x, y, w }: WidthProps) {
  return (
    <g>
      <rect x={x - 3} y={y - 3} width={w + 6} height={94} rx={14} fill="none" stroke="#7a32d7" strokeOpacity={0.18} strokeWidth="6" />
      <rect x={x} y={y} width={w} height={88} rx={12} fill="#1a1233" stroke="#7a32d7" strokeOpacity={0.6} />
      <text x={x + 16} y={y + 28} className="v-small" fill="#8b8696">
        Your message here...
      </text>
      <EditorIcon x={x + 14} y={y + 56} glyph={Lucide.IMAGE_PLUS} size={15} color="#8b8696" />
      <text x={x + 36} y={y + 68} className="v-small" fill="#8b8696">
        Image
      </text>
      <rect x={x + w - 80} y={y + 50} width={70} height={28} rx={6} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.25)" />
      <EditorIcon x={x + w - 69} y={y + 57} glyph={Lucide.SEND} size={14} color={GRAY} />
      <text x={x + w - 49} y={y + 68.5} className="v-small" fill={GRAY}>
        Send
      </text>
    </g>
  );
}

/** Code / Preview, the editor's two modes. */
function ModeToggle({ x, y, codeActive }: ToggleProps) {
  return (
    <g>
      <rect x={x} y={y} width={164} height={26} rx={13} fill="rgba(12,2,36,0.6)" stroke="rgba(255,255,255,0.06)" />
      <rect x={codeActive ? x + 2 : x + 72} y={y + 2} width={codeActive ? 68 : 90} height={22} rx={11} fill="rgba(20,10,40,0.5)" stroke={ASH_500} />
      <EditorIcon x={x + 12} y={y + 6} glyph={Lucide.CODE} size={14} color={codeActive ? GRAY : '#9ca3af'} />
      <text x={x + 32} y={y + 17.5} className="v-small" fill={codeActive ? GRAY : '#9ca3af'}>
        Code
      </text>
      <EditorIcon x={x + 82} y={y + 6} glyph={Lucide.EYE} size={14} color={codeActive ? '#9ca3af' : GRAY} />
      <text x={x + 102} y={y + 17.5} className="v-small" fill={codeActive ? '#9ca3af' : GRAY}>
        Preview
      </text>
    </g>
  );
}

function PublishActions({ x, y }: Pt) {
  return (
    <g>
      <rect x={x} y={y} width={84} height={26} rx={13} fill={GREEN} />
      <EditorIcon x={x + 10} y={y + 6} glyph={Lucide.GLOBE} size={14} color={GRAY} />
      <text x={x + 30} y={y + 17.5} className="v-small" fill={GRAY}>
        Publish
      </text>
      <rect x={x + 90} y={y} width={76} height={26} rx={13} fill={GRAY} />
      <EditorIcon x={x + 100} y={y + 6} glyph={Lucide.GITHUB} size={14} color={ON_GRAY} />
      <text x={x + 120} y={y + 17.5} className="v-small" fill={ON_GRAY}>
        Github
      </text>
      <EditorIcon x={x + 174} y={y + 5} glyph={Lucide.SETTINGS_2} size={16} color={GRAY} />
    </g>
  );
}

/** The explorer collapsed to its activity bar, with the Database view picked. */
function ActivityBar({ x, y, h }: ActivityBarProps) {
  return (
    <g>
      <rect x={x} y={y} width={48} height={h} fill={PANEL} />
      <line x1={x + 48} y1={y} x2={x + 48} y2={y + h} stroke="rgba(107,119,137,0.2)" />
      <EditorIcon x={x + 14} y={y + 48} glyph={Lucide.FOLDER_TREE} size={20} color="#afb6c0" />
      <rect x={x} y={y + 80} width={48} height={44} fill="rgba(74,27,136,0.2)" />
      <rect x={x} y={y + 80} width={2} height={44} fill="#7a32d7" />
      <EditorIcon x={x + 14} y={y + 92} glyph={Lucide.DATABASE} size={20} color={WHITE} />
    </g>
  );
}

function EditorTab({ x, y, w, name, glyph, active }: EditorTabProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={28}
        rx={6}
        fill={active ? 'rgba(3,7,18,0.5)' : PURPLE_900}
        stroke={active ? ASH_500 : LINE}
        strokeWidth={active ? 1.5 : 1}
      />
      {glyph ? <EditorIcon x={x + 7} y={y + 7} glyph={glyph} size={14} color={GRAY} /> : <FileTypeIcon x={x + 6} y={y + 7} name={name} />}
      <text x={x + 26} y={y + 18.5} fontSize={12.5} fill={GRAY}>
        {name}
      </text>
      <EditorIcon x={x + w - 20} y={y + 8} glyph={Lucide.X} size={12} color={GRAY} />
    </g>
  );
}

/** A table node: an accent chip, the name, and a column count in the header, one row per column, keys tinted, handles on the edges. */
function TableNode({ table, at }: TableNodeProps) {
  const { x, y } = at;
  const w = NODE.nodeWidth;
  const h = tableHeight(table, NODE);
  const role = roleOf(table.name);
  const accent = ROLE_COLOR[role];
  return (
    <g opacity={role === Role.DIM ? 0.55 : 1}>
      {role === Role.FOCUS ? (
        <>
          <rect x={x - 8} y={y - 8} width={w + 16} height={h + 16} rx={19} fill={SCHEMA.focus} opacity={0.08} />
          <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={15} fill="none" stroke={SCHEMA.focus} strokeOpacity={0.35} />
        </>
      ) : null}
      <rect x={x} y={y} width={w} height={h} rx={12} fill={SCHEMA.node} />
      <path d={`M${x} ${y + 44}V${y + 12}a12 12 0 0 1 12-12h${w - 24}a12 12 0 0 1 12 12V${y + 44}Z`} fill={SCHEMA.header} />
      <line x1={x} y1={y + 44} x2={x + w} y2={y + 44} stroke={SCHEMA.line} />
      <rect x={x + 10} y={y + 11} width={22} height={22} rx={6} fill={accent} fillOpacity={0.16} />
      <EditorIcon x={x + 14} y={y + 15} glyph={Lucide.TABLE} size={14} color={accent} />
      <text x={x + 40} y={y + 26.5} fontSize={13} fontWeight={600} fill={SCHEMA.text}>
        {table.name}
      </text>
      <rect x={x + w - 32} y={y + 13} width={22} height={18} rx={9} fill="rgba(255,255,255,0.06)" />
      <text x={x + w - 21} y={y + 25.5} textAnchor="middle" style={MONO} fontSize={9.5} fill={SCHEMA.muted}>
        {table.columns.length}
      </text>
      {table.columns.map((column, index) => {
        const top = y + ROWS_TOP + index * NODE.rowHeight;
        const primary = column.key === ColumnKey.PRIMARY;
        const foreign = column.key === ColumnKey.FOREIGN;
        const tint = primary ? SCHEMA.primary : SCHEMA.foreign;
        return (
          <g key={column.name}>
            {primary || foreign ? <rect x={x + 6} y={top} width={w - 12} height={22} rx={6} fill={tint} fillOpacity={0.09} /> : null}
            {primary ? <EditorIcon x={x + 12} y={top + 5} glyph={Lucide.KEY} size={12} color={SCHEMA.primary} /> : null}
            {foreign ? <EditorIcon x={x + 12} y={top + 5} glyph={Lucide.LINK} size={12} color={SCHEMA.foreign} /> : null}
            {primary || foreign ? null : <circle cx={x + 18} cy={top + 11} r={1.6} fill={SCHEMA.faint} />}
            <text
              x={x + 30}
              y={top + 15}
              fontSize={11}
              fontWeight={primary || foreign ? 600 : 400}
              fill={primary ? SCHEMA.primaryText : foreign ? SCHEMA.foreignText : SCHEMA.column}
            >
              {column.name}
            </text>
            <text x={x + w - 12} y={top + 15} textAnchor="end" style={MONO} fontSize={8.5} fill={SCHEMA.faint}>
              {column.type}
            </text>
            {primary || foreign ? (
              <circle cx={primary ? x : x + w} cy={top + 11} r={3.5} fill={tint} stroke={SCHEMA.node} strokeWidth={2} />
            ) : null}
          </g>
        );
      })}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={12}
        fill="none"
        stroke={role === Role.DIM ? SCHEMA.line : accent}
        strokeOpacity={role === Role.DIM ? 1 : 0.85}
        strokeWidth={role === Role.DIM ? 1 : 1.5}
      />
    </g>
  );
}

/**
 * One foreign key: React Flow's bezier from the key to the column it references,
 * with crow's-foot notation, many at the referencing table and exactly one at
 * the referenced key. Edges on the trace take its colour and carry a pulse.
 */
function Relation({ from, to, role }: RelationProps) {
  const traced = role !== Role.DIM;
  const color = traced ? ROLE_COLOR[role] : SCHEMA.edge;
  const d = flowBezier(from, to);
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={traced ? 2 : 1.5} />
      {traced ? <path d={d} className="v-pulse" pathLength={1} fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" /> : null}
      <path
        d={`M${from.x + 4} ${from.y - 5}L${from.x + 13} ${from.y}L${from.x + 4} ${from.y + 5}M${from.x + 4} ${from.y}H${from.x + 13}`}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d={`M${to.x - 7} ${to.y - 5}V${to.y + 5}M${to.x - 11} ${to.y - 5}V${to.y + 5}`} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </g>
  );
}

/** The diagram: edges under the nodes, as React Flow layers them. */
function SchemaDiagram({ x, y, scale }: DiagramProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {keys.map((key) => (
        <Relation
          key={`${key.table}.${key.column}`}
          from={{ x: placeOf(key.table).x + NODE.nodeWidth, y: rowCentre(key.table, key.column) }}
          to={{ x: placeOf(key.references.table).x, y: rowCentre(key.references.table, key.references.column) }}
          role={key.table === FOCUS ? Role.REFERENCES : key.references.table === FOCUS ? Role.REFERENCED_BY : Role.DIM}
        />
      ))}
      {placed.map(({ table, at }) => (
        <TableNode key={table.name} table={table} at={at} />
      ))}
    </g>
  );
}

/** The floating toolbar, centred on x: search over tables and columns, and Organize to re-run the layout. */
function SchemaToolbar({ x, y, compact }: ToolbarProps) {
  const search = compact ? 204 : 236;
  const organize = 112;
  const w = 10 + search + (compact ? 0 : 6 + organize);
  const left = x - w / 2;
  return (
    <g>
      <rect x={left} y={y} width={w} height={44} rx={22} fill={SCHEMA.glass} stroke={SCHEMA.line} />
      <rect x={left + 5} y={y + 5} width={search} height={34} rx={17} fill="rgba(255,255,255,0.04)" />
      <EditorIcon x={left + 19} y={y + 15} glyph={Lucide.SEARCH} size={14} color={SCHEMA.muted} />
      <text x={left + 42} y={y + 26} fontSize={12} fill={SCHEMA.faint}>
        Search tables or columns…
      </text>
      {compact ? null : (
        <g>
          <rect x={left + search + 11} y={y + 5} width={organize} height={34} rx={17} fill={SCHEMA.focus} fillOpacity={0.18} />
          <EditorIcon x={left + search + 27} y={y + 15} glyph={Lucide.WORKFLOW} size={14} color="#c4b5fd" />
          <text x={left + search + 49} y={y + 26} fontSize={12} fontWeight={600} fill="#ede9fe">
            Organize
          </text>
        </g>
      )}
    </g>
  );
}

/** Zoom in, zoom out, and fit, in one pill. */
function SchemaControls({ x, y }: Pt) {
  return (
    <g>
      <rect x={x} y={y} width={108} height={36} rx={18} fill={SCHEMA.glass} stroke={SCHEMA.line} />
      {[Lucide.ZOOM_IN, Lucide.ZOOM_OUT, Lucide.SCAN].map((glyph, index) => (
        <g key={index}>
          {index > 0 ? <line x1={x + index * 36} y1={y + 9} x2={x + index * 36} y2={y + 27} stroke={SCHEMA.line} /> : null}
          <EditorIcon x={x + index * 36 + 11} y={y + 11} glyph={glyph} size={14} color={SCHEMA.muted} />
        </g>
      ))}
    </g>
  );
}

/** React Flow's MiniMap: every table in its trace colour inside the viewport frame. */
function SchemaMiniMap({ x, y, w, h }: MiniMapProps) {
  const fit = Math.min((w - 28) / DIAGRAM.width, (h - 24) / (DIAGRAM.bottom - DIAGRAM.top));
  const left = x + (w - DIAGRAM.width * fit) / 2;
  const top = y + (h - (DIAGRAM.bottom - DIAGRAM.top) * fit) / 2 - DIAGRAM.top * fit;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={SCHEMA.glass} stroke={SCHEMA.line} />
      {placed.map(({ table, at }) => {
        const role = roleOf(table.name);
        return (
          <rect
            key={table.name}
            x={left + at.x * fit}
            y={top + at.y * fit}
            width={NODE.nodeWidth * fit}
            height={tableHeight(table, NODE) * fit}
            rx={2}
            fill={role === Role.DIM ? 'rgba(255,255,255,0.18)' : ROLE_COLOR[role]}
            fillOpacity={role === Role.DIM ? 1 : 0.7}
          />
        );
      })}
      <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} rx={6} fill={SCHEMA.focus} fillOpacity={0.05} stroke={SCHEMA.focus} strokeOpacity={0.45} />
    </g>
  );
}

/** What the trace found, in words. */
function TraceSummary({ x, y }: Pt) {
  return (
    <g>
      <rect x={x - 186} y={y} width={372} height={32} rx={16} fill={SCHEMA.glass} stroke={SCHEMA.line} />
      <text x={x} y={y + 20.5} textAnchor="middle" fontSize={11.5} fill={SCHEMA.muted}>
        Tracing{' '}
        <tspan fontWeight={600} fill={SCHEMA.focus}>
          todos
        </tspan>
        : references{' '}
        <tspan fontWeight={600} fill={SCHEMA.foreign}>
          {trace.references.join(', ')}
        </tspan>
        {' · '}referenced by{' '}
        <tspan fontWeight={600} fill={SCHEMA.primary}>
          {trace.referencedBy.join(', ')}
        </tspan>
      </text>
    </g>
  );
}

/** The schema view: a dotted canvas lit from the focused table, the diagram, and the floating chrome. */
function SchemaCanvas({ x, y, w, h, scale, compact }: CanvasProps) {
  const id = useId();
  const left = x + (w - DIAGRAM.width * scale) / 2;
  const middle = y + h * (compact ? 0.5 : 0.47);
  const centre = (DIAGRAM.top + DIAGRAM.bottom) / 2;
  const focus = placeOf(FOCUS);
  const glow = {
    x: left + (focus.x + NODE.nodeWidth / 2) * scale,
    y: middle + (focus.y - centre + tableHeight(todoSchema.find((table) => table.name === FOCUS) ?? todoSchema[0], NODE) / 2) * scale,
  };
  const mini = compact ? { w: 112, h: 70 } : { w: 156, h: 96 };
  return (
    <g>
      <defs>
        <pattern id={`${id}-dots`} x={x} y={y} width={20} height={20} patternUnits="userSpaceOnUse">
          <circle cx={1} cy={1} r={1} fill={SCHEMA.dots} />
        </pattern>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0%" stopColor={SCHEMA.focus} stopOpacity={0.26} />
          <stop offset="100%" stopColor={SCHEMA.focus} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={BG} />
      <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-dots)`} />
      <ellipse cx={glow.x} cy={glow.y} rx={260 * scale} ry={200 * scale} fill={`url(#${id}-glow)`} />
      <SchemaDiagram x={left} y={middle - centre * scale} scale={scale} />
      <SchemaToolbar x={x + w / 2} y={y + 16} compact={compact} />
      <SchemaControls x={x + 16} y={y + h - 52} />
      <SchemaMiniMap x={x + w - mini.w - 16} y={y + h - mini.h - 16} w={mini.w} h={mini.h} />
      {compact ? null : <TraceSummary x={x + w / 2 - 20} y={y + h - 48} />}
    </g>
  );
}

function Wide() {
  return (
    <>
      <rect x={8} y={8} width={1184} height={744} rx={12} fill={BG} stroke="rgba(255,255,255,0.08)" />

      {/* App sidebar */}
      <rect x={16} y={16} width={40} height={728} rx={10} fill={RAIL} stroke="rgba(255,255,255,0.05)" />
      <EditorIcon x={26} y={30} glyph={Lucide.PANEL_LEFT} size={20} color={GRAY} />
      <line x1={24} y1={62} x2={48} y2={62} stroke={LINE} />
      <EditorIcon x={27} y={76} glyph={Lucide.SQUARE_PLUS} size={18} color={GRAY} />
      <EditorIcon x={27} y={108} glyph={Lucide.MESSAGE_SQUARE} size={18} color={GRAY} />
      <rect x={19} y={138} width={34} height={22} rx={6} fill="rgba(255,255,255,0.1)" />
      <text x={36} y={153} textAnchor="middle" fontSize={10} fill={GRAY}>
        To…
      </text>
      <EditorIcon x={27} y={176} glyph={Lucide.LAYOUT_GRID} size={18} color={GRAY} />
      <line x1={24} y1={680} x2={48} y2={680} stroke={LINE} />
      <EditorIcon x={27} y={692} glyph={Lucide.SETTINGS} size={18} color={GRAY} />
      <circle cx={36} cy={728} r={10} fill={PURPLE_500} />

      {/* Chat: the finished agent timeline */}
      <Wordmark x={76} y={46} />
      <EditorIcon x={302} y={32} glyph={Lucide.ARROW_LEFT_FROM_LINE} size={16} color={GRAY} />
      <UserBubble x={196} y={66} w={124} />
      <circle cx={78} cy={122} r={8} fill="#8b5cf6" />
      <AgentRow x={92} y={122} name="Backend Developer" />
      <AgentRow x={92} y={154} name="Frontend Developer" open />
      <EditorIcon x={240} y={148} glyph={Lucide.CHEVRON_DOWN} size={13} color={WHITE} />
      <line x1={101} y1={170} x2={101} y2={446} stroke={LINE} />
      <text x={114} y={190} fontSize={10} fontWeight={700} fontStyle="italic" letterSpacing="0.08em" fill={AMBER}>
        INSTRUCTIONS
      </text>
      <text x={114} y={208} className="v-small" fill={ASH_400}>
        Build the todo UI: a list, an
      </text>
      <text x={114} y={226} className="v-small" fill={ASH_400}>
        add form, and done filters.
      </text>
      <BashGroup x={114} y={240} w={206} />
      <FileGroup x={114} y={338} w={206} />
      <text x={92} y={474} className="v-small" fill={WHITE}>
        Your todo app is ready. Open the
      </text>
      <text x={92} y={492} className="v-small" fill={WHITE}>
        preview to try it, or ask for a
      </text>
      <text x={92} y={510} className="v-small" fill={WHITE}>
        change.
      </text>
      <ChatInput x={70} y={652} w={252} />

      {/* Explorer, collapsed to its activity bar */}
      <ActivityBar x={336} y={8} h={744} />

      {/* Workspace toolbar */}
      <rect x={392} y={18} width={792} height={42} rx={10} fill="rgba(255,255,255,0.025)" stroke={LINE} />
      <ModeToggle x={402} y={26} codeActive />
      <EditorIcon x={580} y={30} glyph={Lucide.MAXIMIZE} size={17} color={GRAY} />
      <EditorIcon x={608} y={30} glyph={Lucide.DOWNLOAD} size={17} color={GRAY} />
      <EditorIcon x={636} y={30} glyph={Lucide.SHARE} size={17} color={GRAY} />
      <PublishActions x={990} y={26} />

      {/* Editor: the Database Explorer's schema view, open as a tab beside the code */}
      <EditorTab x={394} y={70} w={130} name="TodoList.tsx" />
      <EditorTab x={530} y={70} w={106} name="page.tsx" />
      <EditorTab x={642} y={70} w={100} name="Schema" glyph={Lucide.NETWORK} active />
      <SchemaCanvas x={384} y={106} w={800} h={638} scale={1} />
    </>
  );
}

function Narrow() {
  return (
    <>
      <rect x={8} y={8} width={584} height={744} rx={12} fill={BG} stroke="rgba(255,255,255,0.08)" />

      {/* Chat */}
      <Wordmark x={26} y={44} />
      <UserBubble x={444} y={24} w={132} />
      <AgentRow x={24} y={84} name="Backend Developer" />
      <AgentRow x={24} y={114} name="Frontend Developer" open />
      <line x1={33} y1={130} x2={33} y2={238} stroke={LINE} />
      <FileGroup x={48} y={134} w={300} />
      <text x={370} y={160} className="v-small" fill={WHITE}>
        Your todo app is ready.
      </text>
      <text x={370} y={178} className="v-small" fill={WHITE}>
        Open the preview to try
      </text>
      <text x={370} y={196} className="v-small" fill={WHITE}>
        it, or ask for a change.
      </text>

      {/* The schema view */}
      <line x1={8} y1={250} x2={592} y2={250} stroke={LINE} />
      <EditorTab x={18} y={258} w={130} name="TodoList.tsx" />
      <EditorTab x={154} y={258} w={100} name="Schema" glyph={Lucide.NETWORK} active />
      <SchemaCanvas x={16} y={294} w={568} h={450} scale={0.74} compact />
    </>
  );
}

export function CocodingVisual() {
  return (
    <VizFrame
      label="The cocoding.ai workspace in the product's own theme, with my own design of its database schema view. The chat shows the finished agent timeline for the prompt build a todo app: Backend and Frontend Developer blocks, a Bash group running npm install, a Creating components file group, and the message that the app is ready. The explorer is collapsed to its activity bar with Database selected, and the editor's Schema tab shows a React Flow diagram of the app's six tables laid out in layers. It traces todos: the edge to lists, the table it references, glows sky blue, the edge from todo_tags, which references it, glows amber, and the other tables dim. Relations use crow's-foot notation, under a search and Organize toolbar, zoom controls, a minimap, and a summary of the trace."
      wide={<Wide />}
      narrow={<Narrow />}
    />
  );
}
