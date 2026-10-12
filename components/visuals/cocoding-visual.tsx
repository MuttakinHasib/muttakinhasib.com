import { type EditorGlyph, EditorIcon } from './editor-icons';
import { FOLDER_TWOTONE, FileTypeIcon } from './file-icons';
import { Lucide } from './lucide-icons';
import { type Pt, VizFrame } from './primitives';
import {
  agentSteps,
  app,
  chat,
  chrome,
  componentFiles,
  componentGroup,
  installCommand,
  operationGlyph,
  outputLog,
  sources,
  starterTodos,
  tree,
  type SourceToken,
  type TokenKind,
  type TreeEntry,
} from '@/components/cocoding/scene';

/**
 * The cocoding.ai workspace just after a build, reconstructed after the
 * frontend's main branch in the product's own theme: the app sidebar, the chat
 * with the finished agent timeline, the explorer's file tree, the Monaco editor
 * with its Output panel running the dev server, and the preview of the
 * generated app. In the product Code and Preview are tabs; here they sit side
 * by side so one picture shows the whole IDE. Every word on the canvas — the
 * script rows, the code tokens, the tree, the todos, the chrome — flows from
 * components/cocoding/scene.ts; this file is the Wide and Narrow layouts.
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
  w?: number;
  active?: boolean;
}

interface GroupHeaderProps extends Pt {
  glyph: EditorGlyph;
  title: string;
}

interface TreeProps extends Pt {
  w: number;
  entries: readonly TreeEntry[];
}

interface EditorTabProps extends Pt {
  w: number;
  name: string;
  active?: boolean;
}

interface CodeProps extends Pt {
  w: number;
  lines: readonly (readonly SourceToken[])[];
  highlight: number;
}

interface ToggleProps extends Pt {
  codeActive?: boolean;
}

interface AppProps extends Pt {
  w: number;
  rows: number;
}

interface TodoRowProps extends Pt {
  w: number;
  label: string;
  done?: boolean;
}

const BG = '#0c0224';
const PANEL = '#150a30';
const RAIL = '#160f2c';
const TERMINAL = '#0c081a';
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
/** Measured advance of one 11px mono character, for placing the cursor. */
const MONO_CHAR = 7.7;

/** Monaco's vs-dark base under the editor's codeeditor-dark theme. */
const CODE = {
  text: '#d6d3d3',
  keyword: '#569cd6',
  string: '#ce9178',
  lineNumber: '#858585',
  highlight: 'rgba(121,77,225,0.13)',
  cursor: '#794de1',
} as const;

/** The generated app, in the light shadcn look the agents build with. */
const APP = {
  text: '#09090b',
  muted: '#71717a',
  faint: '#a1a1aa',
  border: '#e4e4e7',
  surface: '#f4f4f5',
  primary: '#18181b',
} as const;

/** The scene's token kinds, painted in the editor's colours. */
const TOKEN_COLOR: Record<TokenKind, string> = {
  text: CODE.text,
  keyword: CODE.keyword,
  string: CODE.string,
};

/** Greedy word wrap for the fixed chat column widths. */
function wrapWords(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && next.length > max) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The explorer's folder: line-md's two-tone folder. */
function FolderIcon({ x, y }: Pt) {
  return (
    <svg
      x={x - 7}
      y={y - 7}
      width={14}
      height={14}
      viewBox={`0 0 ${FOLDER_TWOTONE.box} ${FOLDER_TWOTONE.box}`}
      fill="none"
      stroke={ASH_400}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={FOLDER_TWOTONE.body} fill={ASH_400} fillOpacity={0.3} />
      <path d={FOLDER_TWOTONE.tab} />
    </svg>
  );
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

/** A file in a file group; clicking one opens it in the editor, as TodoList.tsx is here. */
function FileRow({ x, y, name, path, w = 0, active }: FileRowProps) {
  return (
    <g>
      {active ? <rect x={x - 4} y={y - 15} width={w} height={21} rx={4} fill="rgba(255,255,255,0.06)" /> : null}
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
      {chrome.wordmark.name}
      <tspan fill={PURPLE}>{chrome.wordmark.suffix}</tspan>
    </text>
  );
}

function UserBubble({ x, y, w }: WidthProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={30} rx={8} fill="#241c3e" />
      <text x={x + 12} y={y + 19.5} className="v-small" fill={WHITE}>
        {chat.prompt}
      </text>
    </g>
  );
}

function FileGroup({ x, y, w }: WidthProps) {
  // The agent's files, with the one the editor opens drawn last, as the product does.
  const rows = [componentFiles[1], componentFiles[2], componentFiles[0]];
  return (
    <g>
      <rect x={x} y={y} width={w} height={102} rx={4} fill="none" stroke={LINE} />
      <GroupHeader x={x + 10} y={y + 23} glyph={operationGlyph[componentGroup.operation]} title={componentGroup.title} />
      <FileRow x={x + 8} y={y + 48} name={rows[0].name} path={rows[0].path} />
      <FileRow x={x + 8} y={y + 70} name={rows[1].name} path={rows[1].path} />
      <FileRow x={x + 8} y={y + 92} name={rows[2].name} path={rows[2].path} w={w - 8} active />
    </g>
  );
}

function BashGroup({ x, y, w }: WidthProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={86} rx={4} fill="none" stroke={LINE} />
      <GroupHeader x={x + 10} y={y + 23} glyph={Lucide.TERMINAL} title="Bash" />
      <text x={x + 10} y={y + 49} className="v-small" fontWeight={700} fill={ASH_400}>
        {installCommand.entry.description}
      </text>
      <rect x={x + 10} y={y + 58} width={w - 20} height={20} rx={3} fill="#1b1330" />
      <text x={x + 18} y={y + 72} style={MONO} fontSize={11} fill={ASH_400}>
        {`$ ${installCommand.entry.command}`}
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
        {chrome.chatPlaceholder}
      </text>
      <EditorIcon x={x + 14} y={y + 56} glyph={Lucide.IMAGE_PLUS} size={15} color="#8b8696" />
      <text x={x + 36} y={y + 68} className="v-small" fill="#8b8696">
        {chrome.image}
      </text>
      <rect x={x + w - 80} y={y + 50} width={70} height={28} rx={6} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.25)" />
      <EditorIcon x={x + w - 69} y={y + 57} glyph={Lucide.SEND} size={14} color={GRAY} />
      <text x={x + w - 49} y={y + 68.5} className="v-small" fill={GRAY}>
        {chrome.send}
      </text>
    </g>
  );
}

/** The explorer tree: folders open, guides under each folder, the open file selected. */
function Tree({ x, y, w, entries }: TreeProps) {
  const row = 22;
  return (
    <g>
      {entries.map((entry, index) => {
        if (entry.kind !== 'folder') return null;
        const last = entries.findIndex((other, at) => at > index && other.depth <= entry.depth);
        const end = last === -1 ? entries.length : last;
        if (end - index < 2) return null;
        const gx = x + entry.depth * 12 + 7;
        return <line key={entry.name} x1={gx} y1={y + index * row + 18} x2={gx} y2={y + (end - 1) * row + 14} stroke="rgba(255,255,255,0.08)" />;
      })}
      {entries.map((entry, index) => {
        const cy = y + index * row + 11;
        const ix = x + entry.depth * 12 + 7;
        return (
          <g key={entry.name}>
            {entry.selected ? <rect x={x - 6} y={cy - 10} width={w} height={20} rx={4} fill="rgba(255,255,255,0.1)" /> : null}
            {entry.kind === 'folder' ? <FolderIcon x={ix} y={cy} /> : <FileTypeIcon x={ix - 7} y={cy - 7} name={entry.name} />}
            <text x={ix + 13} y={cy + 4} fontSize={12.5} fill={entry.selected ? WHITE : GRAY}>
              {entry.name}
            </text>
            {entry.kind === 'folder' ? <path d={`M${x + w - 18} ${cy - 2}h7l-3.5 4.5z`} fill={ASH_400} /> : null}
          </g>
        );
      })}
    </g>
  );
}

function ExplorerHeader({ x, y, w }: WidthProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={44} rx={10} fill="rgba(255,255,255,0.03)" stroke={LINE} />
      <rect x={x + 6} y={y + 6} width={82} height={32} rx={8} fill={PURPLE_500} />
      <EditorIcon x={x + 14} y={y + 15} glyph={Lucide.FOLDER_TREE} size={14} color={WHITE} />
      <text x={x + 33} y={y + 26.5} fontSize={12} fontWeight={500} fill={WHITE}>
        {chrome.explorer}
      </text>
      <EditorIcon x={x + 100} y={y + 14} glyph={Lucide.DATABASE} size={16} color={ASH_400} />
      <EditorIcon x={x + w - 26} y={y + 14} glyph={Lucide.ARROW_LEFT_TO_LINE} size={16} color={ASH_400} />
    </g>
  );
}

function EditorTab({ x, y, w, name, active }: EditorTabProps) {
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
      <FileTypeIcon x={x + 6} y={y + 7} name={name} />
      <text x={x + 26} y={y + 18.5} fontSize={12.5} fill={GRAY}>
        {name}
      </text>
      <EditorIcon x={x + w - 20} y={y + 8} glyph={Lucide.X} size={12} color={GRAY} />
    </g>
  );
}

/** Monaco: line numbers, the code in the editor's colours, the current line highlighted with the cursor. */
function Code({ x, y, w, lines, highlight }: CodeProps) {
  const lineHeight = 18;
  const current = lines[highlight] ?? [];
  const currentLength = current.reduce((sum, token) => sum + token.text.length, 0);
  return (
    <g>
      <rect x={x} y={y + highlight * lineHeight - 13} width={w} height={lineHeight} fill={CODE.highlight} />
      {lines.map((tokens, index) => (
        <g key={index}>
          <text
            x={x + 38}
            y={y + index * lineHeight}
            textAnchor="end"
            style={MONO}
            fontSize={10.5}
            fill={index === highlight ? '#c6c6c6' : CODE.lineNumber}
          >
            {index + 1}
          </text>
          <text x={x + 50} y={y + index * lineHeight} style={MONO} fontSize={11} fill={CODE.text} xmlSpace="preserve">
            {tokens.map((token, tokenIndex) => (
              <tspan key={tokenIndex} fill={TOKEN_COLOR[token.kind]}>
                {token.text}
              </tspan>
            ))}
          </text>
        </g>
      ))}
      <rect x={x + 51 + currentLength * MONO_CHAR} y={y + highlight * lineHeight - 11} width={2} height={14} fill={CODE.cursor} />
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
        {chrome.code}
      </text>
      <EditorIcon x={x + 82} y={y + 6} glyph={Lucide.EYE} size={14} color={codeActive ? '#9ca3af' : GRAY} />
      <text x={x + 102} y={y + 17.5} className="v-small" fill={codeActive ? '#9ca3af' : GRAY}>
        {chrome.preview}
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
        {chrome.publish}
      </text>
      <rect x={x + 90} y={y} width={76} height={26} rx={13} fill={GRAY} />
      <EditorIcon x={x + 100} y={y + 6} glyph={Lucide.GITHUB} size={14} color={ON_GRAY} />
      <text x={x + 120} y={y + 17.5} className="v-small" fill={ON_GRAY}>
        {chrome.github}
      </text>
      <EditorIcon x={x + 174} y={y + 5} glyph={Lucide.SETTINGS_2} size={16} color={GRAY} />
    </g>
  );
}

/** The Output and Terminal panel under the editor, with the build's output. */
function OutputPanel({ x, y, w }: WidthProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={744 - y} fill={TERMINAL} />
      <line x1={x} y1={y} x2={x + w} y2={y} stroke={LINE} />
      <rect x={x + 12} y={y + 10} width={56} height={26} rx={8} fill="rgba(255,255,255,0.05)" stroke={ASH_500} />
      <text x={x + 40} y={y + 27} textAnchor="middle" fontSize={12} fill={GRAY}>
        Output
      </text>
      <rect x={x + 74} y={y + 10} width={66} height={26} rx={8} fill={PURPLE_900} stroke={LINE} />
      <text x={x + 107} y={y + 27} textAnchor="middle" fontSize={12} fill={GRAY}>
        Terminal
      </text>
      <rect x={x + w - 214} y={y + 10} width={118} height={26} rx={6} fill="none" stroke="rgba(255,255,255,0.25)" />
      <EditorIcon x={x + w - 205} y={y + 17} glyph={Lucide.FLAG} size={12} color="#fbbf24" />
      <text x={x + w - 188} y={y + 27} fontSize={11.5} fill={GRAY}>
        Request feature
      </text>
      <rect x={x + w - 90} y={y + 10} width={80} height={26} rx={6} fill="none" stroke="rgba(255,255,255,0.25)" />
      <EditorIcon x={x + w - 81} y={y + 17} glyph={Lucide.MESSAGE_SQUARE_TEXT} size={12} color={GRAY} />
      <text x={x + w - 64} y={y + 27} fontSize={11.5} fill={GRAY}>
        Feedback
      </text>
      <circle cx={x + w - 74} cy={y + 52} r={3} fill="#22c55e" />
      <text x={x + w - 10} y={y + 56} textAnchor="end" fontSize={11} fill={ASH_400}>
        {chrome.connected}
      </text>
      {outputLog.map(([text, tone], index) => (
        <text
          key={index}
          x={x + 16}
          y={y + 78 + index * 18}
          style={MONO}
          fontSize={11}
          fill={tone === 'command' ? WHITE : tone === 'ok' ? '#4ade80' : ASH_400}
          xmlSpace="preserve"
        >
          {text}
        </text>
      ))}
    </g>
  );
}

function BrowserBar({ x, y, w }: WidthProps) {
  return (
    <g>
      <EditorIcon x={x + 8} y={y + 6} glyph={Lucide.ARROW_LEFT} size={14} color={ASH_400} />
      <EditorIcon x={x + 30} y={y + 6} glyph={Lucide.ROTATE_CW} size={14} color={ASH_400} />
      <rect x={x + 52} y={y} width={w - 82} height={26} rx={13} fill="rgba(255,255,255,0.05)" stroke={LINE} />
      <EditorIcon x={x + 63} y={y + 7.5} glyph={Lucide.LOCK} size={11} color="#4ade80" />
      <text x={x + 80} y={y + 17} fontSize={11} fill={GRAY}>
        {chrome.url}
      </text>
      <EditorIcon x={x + w - 20} y={y + 6} glyph={Lucide.SHARE} size={14} color={ASH_400} />
    </g>
  );
}

function TodoRow({ x, y, w, label, done }: TodoRowProps) {
  return (
    <g>
      <line x1={x} y1={y + 40} x2={x + w} y2={y + 40} stroke={APP.surface} />
      <rect x={x} y={y + 12} width={16} height={16} rx={4} fill={done ? APP.primary : '#fff'} stroke={APP.primary} />
      {done ? <EditorIcon x={x + 2} y={y + 14} glyph={Lucide.CHECK} size={12} color="#fff" strokeWidth={3} /> : null}
      <text x={x + 28} y={y + 25} fontSize={13} fill={done ? APP.faint : APP.text}>
        {label}
      </text>
      {done ? <line x1={x + 28} y1={y + 21} x2={x + 28 + label.length * 6.2} y2={y + 21} stroke={APP.faint} /> : null}
      <EditorIcon x={x + w - 12} y={y + 14} glyph={Lucide.X} size={12} color={APP.faint} />
    </g>
  );
}

/** The generated todo app, rendered in the preview. */
function TodoApp({ x, y, w, rows }: AppProps) {
  return (
    <g>
      <text x={x} y={y + 22} fontSize={20} fontWeight={700} fill={APP.text}>
        {app.title}
      </text>
      <text x={x} y={y + 42} fontSize={12} fill={APP.muted}>
        {starterTodos.length} tasks, {starterTodos.filter((todo) => todo.done).length} done
      </text>
      <rect x={x} y={y + 58} width={w - 58} height={34} rx={6} fill="#fff" stroke={APP.border} />
      <text x={x + 12} y={y + 79.5} fontSize={13} fill={APP.faint}>
        {app.placeholder}
      </text>
      <rect x={x + w - 52} y={y + 58} width={52} height={34} rx={6} fill={APP.primary} />
      <text x={x + w - 26} y={y + 79.5} textAnchor="middle" fontSize={13} fontWeight={500} fill="#fff">
        {app.add}
      </text>
      <rect x={x} y={y + 106} width={180} height={30} rx={6} fill={APP.surface} />
      <rect x={x + 3} y={y + 109} width={56} height={24} rx={4} fill="#fff" stroke={APP.border} />
      {app.filters.map((label, index) => (
        <text key={label} x={x + 31 + index * 60} y={y + 125.5} textAnchor="middle" fontSize={12} fontWeight={500} fill={index === 0 ? APP.text : APP.muted}>
          {label}
        </text>
      ))}
      {starterTodos.slice(0, rows).map((todo, index) => (
        <TodoRow key={todo.label} x={x} y={y + 146 + index * 42} w={w} label={todo.label} done={todo.done} />
      ))}
    </g>
  );
}

function Watermark({ x, y }: Pt) {
  return (
    <g>
      <rect x={x} y={y} width={134} height={24} rx={6} fill="#1a1230" />
      <circle cx={x + 14} cy={y + 12} r={6} fill="#7a32d7" />
      <circle cx={x + 14} cy={y + 12} r={2.2} fill="#fff" />
      <text x={x + 26} y={y + 16} fontSize={10.5} fill={GRAY}>
        {chrome.watermarkPrefix}
        <tspan fontWeight={700} fill="#fff">
          {chrome.wordmark.name}
          {chrome.wordmark.suffix}
        </tspan>
      </text>
    </g>
  );
}

function Wide() {
  const [backend, frontend] = agentSteps;
  const [panelLeft, squarePlus, messageSquare, layoutGrid, settings] = chrome.rail.glyphs;
  const openName = chrome.openFile.split('/').at(-1) ?? chrome.openFile;
  return (
    <>
      <rect x={8} y={8} width={1184} height={744} rx={12} fill={BG} stroke="rgba(255,255,255,0.08)" />

      {/* App sidebar */}
      <rect x={16} y={16} width={40} height={728} rx={10} fill={RAIL} stroke="rgba(255,255,255,0.05)" />
      <EditorIcon x={26} y={30} glyph={panelLeft} size={20} color={GRAY} />
      <line x1={24} y1={62} x2={48} y2={62} stroke={LINE} />
      <EditorIcon x={27} y={76} glyph={squarePlus} size={18} color={GRAY} />
      <EditorIcon x={27} y={108} glyph={messageSquare} size={18} color={GRAY} />
      <rect x={19} y={138} width={34} height={22} rx={6} fill="rgba(255,255,255,0.1)" />
      <text x={36} y={153} textAnchor="middle" fontSize={10} fill={GRAY}>
        {chrome.rail.chip}
      </text>
      <EditorIcon x={27} y={176} glyph={layoutGrid} size={18} color={GRAY} />
      <line x1={24} y1={680} x2={48} y2={680} stroke={LINE} />
      <EditorIcon x={27} y={692} glyph={settings} size={18} color={GRAY} />
      <circle cx={36} cy={728} r={10} fill={PURPLE_500} />

      {/* Chat: the finished agent timeline */}
      <Wordmark x={76} y={46} />
      <EditorIcon x={302} y={32} glyph={Lucide.ARROW_LEFT_FROM_LINE} size={16} color={GRAY} />
      <UserBubble x={196} y={66} w={124} />
      <circle cx={78} cy={122} r={8} fill="#8b5cf6" />
      <AgentRow x={92} y={122} name={backend.agent} />
      <AgentRow x={92} y={154} name={frontend.agent} open />
      <EditorIcon x={240} y={148} glyph={Lucide.CHEVRON_DOWN} size={13} color={WHITE} />
      <line x1={101} y1={170} x2={101} y2={446} stroke={LINE} />
      <text x={114} y={190} fontSize={10} fontWeight={700} fontStyle="italic" letterSpacing="0.08em" fill={AMBER}>
        INSTRUCTIONS
      </text>
      {wrapWords(frontend.instructions, 35).map((line, index) => (
        <text key={index} x={114} y={208 + index * 18} className="v-small" fill={ASH_400}>
          {line}
        </text>
      ))}
      <BashGroup x={114} y={240} w={206} />
      <FileGroup x={114} y={338} w={206} />
      {wrapWords(chat.final, 32).map((line, index) => (
        <text key={index} x={92} y={474 + index * 18} className="v-small" fill={WHITE}>
          {line}
        </text>
      ))}
      <ChatInput x={70} y={652} w={252} />

      {/* Explorer */}
      <rect x={336} y={8} width={180} height={744} fill={PANEL} />
      <ExplorerHeader x={344} y={20} w={164} />
      <Tree x={350} y={82} w={162} entries={tree} />

      {/* Workspace toolbar */}
      <rect x={524} y={18} width={660} height={42} rx={10} fill="rgba(255,255,255,0.025)" stroke={LINE} />
      <ModeToggle x={534} y={26} codeActive />
      <EditorIcon x={712} y={30} glyph={Lucide.MAXIMIZE} size={17} color={GRAY} />
      <EditorIcon x={740} y={30} glyph={Lucide.DOWNLOAD} size={17} color={GRAY} />
      <EditorIcon x={768} y={30} glyph={Lucide.SHARE} size={17} color={GRAY} />
      <PublishActions x={990} y={26} />

      {/* Editor */}
      <EditorTab x={526} y={70} w={130} name={openName} active />
      <EditorTab x={662} y={70} w={106} name="page.tsx" />
      <rect x={526} y={106} width={232} height={22} rx={3} fill="rgba(255,255,255,0.1)" />
      <EditorIcon x={534} y={110} glyph={Lucide.FILE} size={14} color={GRAY} />
      <text x={554} y={121} fontSize={11.5} fill={GRAY}>
        {chrome.openFile.split('/').join(' › ')}
      </text>
      <Code x={516} y={154} w={384} lines={sources[chrome.openFile]} highlight={8} />
      <OutputPanel x={516} y={530} w={384} />

      {/* Preview of the generated app */}
      <line x1={900} y1={64} x2={900} y2={752} stroke={LINE} />
      <BrowserBar x={906} y={72} w={276} />
      <rect x={908} y={106} width={272} height={636} rx={6} fill="#fff" />
      <TodoApp x={924} y={120} w={240} rows={4} />
      <text x={924} y={460} fontSize={12} fill={APP.muted}>
        {starterTodos.filter((todo) => !todo.done).length} items left
      </text>
      <text x={1164} y={460} textAnchor="end" fontSize={12} fill={APP.muted}>
        Clear completed
      </text>
      <Watermark x={1038} y={706} />
    </>
  );
}

function Narrow() {
  const [backend, frontend] = agentSteps;
  const openName = chrome.openFile.split('/').at(-1) ?? chrome.openFile;
  return (
    <>
      <rect x={8} y={8} width={584} height={744} rx={12} fill={BG} stroke="rgba(255,255,255,0.08)" />

      {/* Chat */}
      <Wordmark x={26} y={44} />
      <UserBubble x={444} y={24} w={132} />
      <AgentRow x={24} y={84} name={backend.agent} />
      <AgentRow x={24} y={114} name={frontend.agent} open />
      <line x1={33} y1={130} x2={33} y2={238} stroke={LINE} />
      <FileGroup x={48} y={134} w={300} />
      {wrapWords(chat.final, 24).map((line, index) => (
        <text key={index} x={370} y={160 + index * 18} className="v-small" fill={WHITE}>
          {line}
        </text>
      ))}

      {/* Explorer and editor */}
      <line x1={8} y1={250} x2={592} y2={250} stroke={LINE} />
      <rect x={8} y={250} width={186} height={272} fill={PANEL} />
      <Tree
        x={20}
        y={262}
        w={170}
        entries={tree.filter((entry) => !['layout.tsx', 'todos.ts'].includes(entry.name))}
      />
      <EditorTab x={204} y={260} w={130} name={openName} active />
      <EditorTab x={340} y={260} w={106} name="page.tsx" />
      <Code x={194} y={316} w={398} lines={sources[chrome.openFile].slice(0, 11)} highlight={8} />

      {/* Preview */}
      <line x1={8} y1={522} x2={592} y2={522} stroke={LINE} />
      <BrowserBar x={14} y={532} w={572} />
      <rect x={16} y={566} width={568} height={178} rx={6} fill="#fff" />
      <TodoApp x={32} y={570} w={536} rows={0} />
      <TodoRow x={300} y={664} w={268} label={starterTodos[0].label} done={starterTodos[0].done} />
      <TodoRow x={300} y={700} w={268} label={starterTodos[1].label} />
    </>
  );
}

export function CocodingVisual() {
  return (
    <VizFrame
      label="Reconstruction of the cocoding.ai workspace just after a build, in the product's own theme. The chat shows the finished agent timeline for the prompt build a todo app: Backend and Frontend Developer blocks, a Bash group running npm install, a Creating components file group with TodoList.tsx opened, and the message that the app is ready. The explorer shows the workspace tree with TodoList.tsx selected. The Monaco editor shows TodoList.tsx with its Output panel running the dev server on localhost:3000, and the preview shows the generated todo app. In the product Code and Preview are tabs; here they sit side by side."
      wide={<Wide />}
      narrow={<Narrow />}
    />
  );
}
