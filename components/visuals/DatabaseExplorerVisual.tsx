import { useId } from 'react';
import { EditorIcon } from './editor-icons';
import { Lucide } from './lucide-icons';
import { Dots, type Pt, VizFrame } from './primitives';

/**
 * The cocoding.ai Database Explorer on its Schema view, reconstructed after the
 * frontend: the explorer's database tab (selector, Tables / Query / Schema, the
 * table list) and the schema editor tab, where ELK lays tables out top-down,
 * foreign keys leave from blue handles, and primary keys take yellow ones.
 */

const ColumnKey = {
  PRIMARY: 'primary',
  FOREIGN: 'foreign',
} as const;
type ColumnKey = (typeof ColumnKey)[keyof typeof ColumnKey];

interface Column {
  name: string;
  type: string;
  key?: ColumnKey;
}

interface TableNodeProps extends Pt {
  w: number;
  name: string;
  columns: readonly Column[];
}

interface EdgeProps {
  from: Pt;
  to: Pt;
}

interface CanvasProps extends Pt {
  w: number;
  h: number;
  dotsId: string;
}

interface WidthProps extends Pt {
  w: number;
}

interface SchemaDiagramProps extends Pt {
  /** Node width. */
  w: number;
  /** Horizontal distance between layers. */
  step: number;
}

const CANVAS = '#0f0f0f';
const CARD = '#1b1b1a';
const RAISED = '#262624';
const WELL = '#151514';
const LINE = '#30302c';
const PAPER = '#f4f1e8';
const FOG = '#a9a79c';
const MUTED = '#7a796f';
const NODE = '#1b1b1a';
const NODE_HEAD = '#232321';
const NODE_STROKE = '#3a3a35';
const PK = '#e6a03a';
const PK_TEXT = '#f0b961';
const FK = '#8ab4ff';
const FK_TEXT = '#b8d0ff';

const ROW = 24;
const HEAD = 40;

const tables = {
  todos: [
    { name: 'id', type: 'uuid', key: ColumnKey.PRIMARY },
    { name: 'list_id', type: 'uuid', key: ColumnKey.FOREIGN },
    { name: 'title', type: 'text' },
    { name: 'done', type: 'boolean' },
  ],
  lists: [
    { name: 'id', type: 'uuid', key: ColumnKey.PRIMARY },
    { name: 'user_id', type: 'uuid', key: ColumnKey.FOREIGN },
    { name: 'name', type: 'text' },
  ],
  sessions: [
    { name: 'id', type: 'uuid', key: ColumnKey.PRIMARY },
    { name: 'user_id', type: 'uuid', key: ColumnKey.FOREIGN },
  ],
  users: [
    { name: 'id', type: 'uuid', key: ColumnKey.PRIMARY },
    { name: 'email', type: 'text' },
    { name: 'name', type: 'text' },
  ],
} as const satisfies Record<string, readonly Column[]>;

/** Centre of a column's row on the node's left or right edge, where its handle sits. */
function rowY(top: number, index: number): number {
  return top + HEAD + index * ROW + ROW / 2 + 4;
}

function TableNode({ x, y, w, name, columns }: TableNodeProps) {
  const h = HEAD + columns.length * ROW + 8;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={NODE} stroke={NODE_STROKE} />
      <path d={`M${x + 8} ${y}h${w - 16}a8 8 0 0 1 8 8v${HEAD - 8}H${x}V${y + 8}a8 8 0 0 1 8-8Z`} fill={NODE_HEAD} />
      <line x1={x} y1={y + HEAD} x2={x + w} y2={y + HEAD} stroke={NODE_STROKE} />
      <EditorIcon x={x + 12} y={y + 12} glyph={Lucide.TABLE} size={16} color={FOG} />
      <text x={x + 36} y={y + 19} fontSize={13} fontWeight={600} fill={PAPER}>
        {name}
      </text>
      <text x={x + 36} y={y + 33} fontSize={10.5} fill={FOG}>
        public
      </text>
      {columns.map((column, index) => {
        const cy = rowY(y, index);
        const color = column.key === ColumnKey.PRIMARY ? PK_TEXT : column.key === ColumnKey.FOREIGN ? FK_TEXT : PAPER;
        return (
          <g key={column.name}>
            {column.key === ColumnKey.PRIMARY ? <EditorIcon x={x + 10} y={cy - 6} glyph={Lucide.KEY} size={12} color={PK} /> : null}
            {column.key === ColumnKey.FOREIGN ? <EditorIcon x={x + 10} y={cy - 6} glyph={Lucide.LINK} size={12} color={FK} /> : null}
            <text x={x + 28} y={cy + 4} fontSize={12} fill={color}>
              {column.name}
            </text>
            <text x={x + w - 10} y={cy + 4} textAnchor="end" fontSize={10} fill={FOG}>
              {column.type}
            </text>
            {column.key === ColumnKey.PRIMARY ? (
              <circle cx={x} cy={cy} r={4.5} fill={PK} stroke={CANVAS} strokeWidth="2" />
            ) : null}
            {column.key === ColumnKey.FOREIGN ? (
              <circle cx={x + w} cy={cy} r={4.5} fill={FK} stroke={CANVAS} strokeWidth="2" />
            ) : null}
          </g>
        );
      })}
    </g>
  );
}

/** The schema's animated dashed bezier, from a foreign key to the key it references. */
function Edge({ from, to }: EdgeProps) {
  const bend = (to.x - from.x) / 2;
  return (
    <path
      d={`M${from.x + 4} ${from.y}C${from.x + bend} ${from.y} ${to.x - bend} ${to.y} ${to.x - 4} ${to.y}`}
      fill="none"
      stroke={MUTED}
      strokeWidth="2"
      strokeDasharray="5 5"
    />
  );
}

function Canvas({ x, y, w, h, dotsId }: CanvasProps) {
  return (
    <g>
      <defs>
        <pattern id={dotsId} width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="rgba(244,241,232,0.08)" />
        </pattern>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={CANVAS} stroke={LINE} />
      <rect x={x} y={y} width={w} height={h} rx={8} fill={`url(#${dotsId})`} />
    </g>
  );
}

function Controls({ x, y }: Pt) {
  const icons = [Lucide.ZOOM_IN, Lucide.ZOOM_OUT, Lucide.SCAN, Lucide.WORKFLOW];
  return (
    <g>
      <rect x={x} y={y} width={36} height={104} rx={8} fill={NODE} stroke={NODE_STROKE} />
      {icons.map((glyph, index) => (
        <EditorIcon key={index} x={x + 10} y={y + 8 + index * 24} glyph={glyph} size={16} color={PAPER} />
      ))}
    </g>
  );
}

function DatabaseSelector({ x, y, w }: WidthProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={34} rx={8} fill={WELL} stroke={LINE} />
      <EditorIcon x={x + 12} y={y + 9} glyph={Lucide.DATABASE} size={15} color={FOG} />
      <text x={x + 36} y={y + 21.5} fontSize={13} fill={PAPER}>
        todo_app
      </text>
      <EditorIcon x={x + w - 26} y={y + 10} glyph={Lucide.CHEVRON_DOWN} size={14} color={FOG} />
    </g>
  );
}

/** Tables, Query, and Schema, icon-only with tooltips, Schema selected. */
function ViewTabs({ x, y }: Pt) {
  const tabs = [Lucide.TABLE, Lucide.CODE_XML, Lucide.NETWORK];
  return (
    <g>
      {tabs.map((glyph, index) => {
        const active = index === 2;
        return (
          <g key={index}>
            <rect
              x={x + index * 38}
              y={y}
              width={32}
              height={30}
              rx={6}
              fill={active ? RAISED : 'none'}
              stroke={active ? FOG : 'none'}
            />
            <EditorIcon x={x + index * 38 + 8} y={y + 7} glyph={glyph} size={16} color={active ? PAPER : FOG} />
          </g>
        );
      })}
    </g>
  );
}

function SearchField({ x, y, w }: WidthProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={34} rx={8} fill={WELL} stroke={LINE} />
      <EditorIcon x={x + 12} y={y + 10} glyph={Lucide.SEARCH} size={14} color={MUTED} />
      <text x={x + 34} y={y + 21.5} fontSize={13} fill={MUTED}>
        Search tables or columns...
      </text>
    </g>
  );
}

function SchemaDiagram({ x, y, w, step }: SchemaDiagramProps) {
  const todos: Pt = { x, y };
  const lists: Pt = { x: x + step, y: y + 142 };
  const sessions: Pt = { x, y: y + 204 };
  const users: Pt = { x: x + step * 2, y: y + 292 };
  return (
    <g>
      <Edge from={{ x: todos.x + w, y: rowY(todos.y, 1) }} to={{ x: lists.x, y: rowY(lists.y, 0) }} />
      <Edge from={{ x: lists.x + w, y: rowY(lists.y, 1) }} to={{ x: users.x, y: rowY(users.y, 0) }} />
      <Edge from={{ x: sessions.x + w, y: rowY(sessions.y, 1) }} to={{ x: users.x, y: rowY(users.y, 0) }} />
      <TableNode x={todos.x} y={todos.y} w={w} name="todos" columns={tables.todos} />
      <TableNode x={lists.x} y={lists.y} w={w} name="lists" columns={tables.lists} />
      <TableNode x={sessions.x} y={sessions.y} w={w} name="sessions" columns={tables.sessions} />
      <TableNode x={users.x} y={users.y} w={w} name="users" columns={tables.users} />
    </g>
  );
}

function Wide() {
  const dots = useId();
  return (
    <>
      <Dots width={1200} height={600} color="rgba(244,241,232,0.07)" background={CANVAS} />
      <rect x={8} y={8} width={1184} height={584} rx={14} fill={CARD} stroke={LINE} />

      {/* Explorer on its database tab */}
      <path d="M22 8h278v584H22a14 14 0 0 1-14-14V22A14 14 0 0 1 22 8Z" fill={WELL} />
      <line x1={300} y1={8} x2={300} y2={592} stroke={LINE} />
      <rect x={20} y={20} width={268} height={44} rx={10} fill={CARD} stroke={LINE} />
      <EditorIcon x={32} y={34} glyph={Lucide.FOLDER_TREE} size={16} color={FOG} />
      <text x={54} y={46.5} fontSize={13} fill={FOG}>
        Explorer
      </text>
      <rect x={130} y={28} width={40} height={28} rx={8} fill={RAISED} stroke={FOG} />
      <EditorIcon x={142} y={34} glyph={Lucide.DATABASE} size={16} color={PAPER} />
      <DatabaseSelector x={20} y={78} w={268} />
      <ViewTabs x={20} y={124} />
      <EditorIcon x={262} y={131} glyph={Lucide.PLUG} size={16} color={FOG} />
      <line x1={20} y1={168} x2={288} y2={168} stroke={LINE} />
      {Object.keys(tables)
        .sort()
        .map((name, index) => (
          <g key={name}>
            <EditorIcon x={28} y={186 + index * 34} glyph={Lucide.TABLE} size={15} color={FOG} />
            <text x={52} y={198 + index * 34} fontSize={13} fill={PAPER}>
              {name}
            </text>
            <text x={280} y={198 + index * 34} textAnchor="end" fontSize={11} fill={MUTED}>
              Table
            </text>
          </g>
        ))}

      {/* Editor tabs: a table tab, and the schema tab in front */}
      <rect x={316} y={20} width={104} height={30} rx={6} fill={WELL} stroke={LINE} />
      <EditorIcon x={326} y={27} glyph={Lucide.TABLE} size={15} color={PAPER} />
      <text x={348} y={39.5} fontSize={13} fill={PAPER}>
        todos
      </text>
      <rect x={428} y={20} width={116} height={30} rx={6} fill={RAISED} stroke={FOG} />
      <EditorIcon x={438} y={27} glyph={Lucide.NETWORK} size={15} color={PAPER} />
      <text x={460} y={39.5} fontSize={13} fill={PAPER}>
        Schema
      </text>

      {/* Schema toolbar */}
      <SearchField x={316} y={62} w={300} />
      <rect x={990} y={62} width={86} height={34} rx={8} fill={RAISED} stroke={LINE} />
      <EditorIcon x={1002} y={72} glyph={Lucide.REFRESH} size={14} color={PAPER} />
      <text x={1024} y={83.5} fontSize={13} fill={PAPER}>
        Reset
      </text>
      <rect x={1084} y={62} width={92} height={34} rx={8} fill={RAISED} stroke={LINE} />
      <EditorIcon x={1096} y={72} glyph={Lucide.DOWNLOAD} size={14} color={PAPER} />
      <text x={1118} y={83.5} fontSize={13} fill={PAPER}>
        Export
      </text>

      <Canvas x={312} y={108} w={872} h={476} dotsId={dots} />
      <SchemaDiagram x={380} y={126} w={190} step={260} />
      <Controls x={324} y={470} />
    </>
  );
}

function Narrow() {
  const dots = useId();
  return (
    <>
      <Dots width={600} height={660} color="rgba(244,241,232,0.07)" background={CANVAS} />
      <rect x={8} y={8} width={584} height={644} rx={14} fill={CARD} stroke={LINE} />
      <DatabaseSelector x={20} y={20} w={300} />
      <ViewTabs x={336} y={22} />
      <EditorIcon x={556} y={29} glyph={Lucide.PLUG} size={16} color={FOG} />
      <SearchField x={20} y={66} w={560} />
      <Canvas x={16} y={112} w={568} h={532} dotsId={dots} />
      <SchemaDiagram x={30} y={128} w={160} step={190} />
      <Controls x={30} y={528} />
    </>
  );
}

export function DatabaseExplorerVisual() {
  return (
    <VizFrame
      label="Reconstruction of the cocoding.ai Database Explorer on its Schema view. The explorer panel shows the todo_app database, Tables, Query, and Schema tabs with Schema selected, and the tables lists, sessions, todos, and users. The Schema editor tab, next to a todos table tab, has a search field, Reset and Export, and an ER diagram laid out top-down: todos.list_id points to lists.id, and lists.user_id and sessions.user_id point to users.id, with key icons on primary keys and link icons on foreign keys."
      wide={<Wide />}
      narrow={<Narrow />}
      wideBox="0 0 1200 600"
      narrowBox="0 0 600 660"
    />
  );
}
