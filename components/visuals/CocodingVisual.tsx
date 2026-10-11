import { useId } from 'react';
import { type EditorGlyph, EditorIcon } from './editor-icons';
import { Lucide } from './lucide-icons';
import { type Pt, VizFrame } from './primitives';

/**
 * The cocoding.ai workspace mid-generation, reconstructed after the frontend's
 * release branch: chat with the streamed agent timeline (agent blocks with
 * their instructions, a Bash group, a file group), the activity bar of the
 * collapsed explorer, and the preview area's live activity animation, where a
 * code window types out the file being written above the activity message.
 */

interface CodeToken {
  text: string;
  color?: string;
}

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
  streaming?: boolean;
}

interface CodeWindowProps extends Pt {
  w: number;
  h: number;
  lines: CodeToken[][];
  beamId: string;
}

interface ToggleProps extends Pt {
  compact?: boolean;
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
const SHIMMER = '#b794f6';
const AMBER = 'rgba(251,191,36,0.55)';
const GREEN = '#266a40';
const INK = '#070113';
const MONO = { fontFamily: 'var(--font-mono)' } as const;
/** Measured advance of one 11px mono character, for placing the typing cursor. */
const MONO_CHAR = 7.7;

/** vs2015, the theme the placeholder's code stream renders with. */
const VS = {
  keyword: '#569cd6',
  string: '#d69d85',
  attr: '#9cdcfe',
  fn: '#dcdcaa',
  type: '#4ec9b0',
  text: '#dcdcdc',
} as const;

const todoList: CodeToken[][] = [
  [{ text: 'import', color: VS.keyword }, { text: ' { useState } ' }, { text: 'from', color: VS.keyword }, { text: " 'react'", color: VS.string }],
  [{ text: 'import', color: VS.keyword }, { text: ' { TodoItem } ' }, { text: 'from', color: VS.keyword }, { text: " './TodoItem'", color: VS.string }],
  [],
  [{ text: 'export function', color: VS.keyword }, { text: ' TodoList', color: VS.fn }, { text: '({ todos }) {' }],
  [{ text: '  const', color: VS.keyword }, { text: ' [show, setShow] = ' }, { text: 'useState', color: VS.fn }, { text: '(' }, { text: "'all'", color: VS.string }, { text: ')' }],
  [{ text: '  const', color: VS.keyword }, { text: ' items = ' }, { text: 'filterBy', color: VS.fn }, { text: '(todos, show)' }],
  [{ text: '  return', color: VS.keyword }, { text: ' (' }],
  [{ text: '    <', color: ASH_500 }, { text: 'ul', color: VS.keyword }, { text: ' className', color: VS.attr }, { text: '=' }, { text: '"space-y-2"', color: VS.string }, { text: '>', color: ASH_500 }],
  [{ text: '      {items.' }, { text: 'map', color: VS.fn }, { text: '((todo) => (' }],
];

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
  const [first, ...rest] = name.split(' ');
  return (
    <g opacity={open ? 1 : 0.7}>
      <AgentAvatar x={x + 9} y={y} />
      <text x={x + 26} y={y + 4.5} className="v-small" fontWeight={600} fill={WHITE}>
        {open ? (
          <>
            {first} <tspan fill={SHIMMER}>{rest.join(' ')}</tspan>
          </>
        ) : (
          name
        )}
      </text>
    </g>
  );
}

/** A file or Bash group's header: operation icon, then a title that shimmers while it streams. */
function GroupHeader({ x, y, glyph, title, streaming }: GroupHeaderProps) {
  const [first, ...rest] = title.split(' ');
  return (
    <g>
      <EditorIcon x={x} y={y - 12} glyph={glyph} size={15} color={WHITE} />
      <text x={x + 22} y={y} className="v-small" fontWeight={600} fill={WHITE}>
        {streaming ? (
          <>
            {first} <tspan fill={SHIMMER}>{rest.join(' ')}</tspan>
          </>
        ) : (
          title
        )}
      </text>
    </g>
  );
}

function ReactFileIcon({ x, y }: Pt) {
  return (
    <g fill="none" stroke="#61dafb" strokeWidth="1">
      <ellipse cx={x} cy={y} rx={6.5} ry={2.4} />
      <ellipse cx={x} cy={y} rx={6.5} ry={2.4} transform={`rotate(60 ${x} ${y})`} />
      <ellipse cx={x} cy={y} rx={6.5} ry={2.4} transform={`rotate(120 ${x} ${y})`} />
      <circle cx={x} cy={y} r={1.2} fill="#61dafb" stroke="none" />
    </g>
  );
}

function FileRow({ x, y, name, path }: FileRowProps) {
  return (
    <g>
      <ReactFileIcon x={x + 7} y={y - 4} />
      <text x={x + 22} y={y} className="v-small" fill={WHITE}>
        {name}
        <tspan dx={8} fill={ASH_500} fontSize={11.5}>
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
      <rect x={x} y={y} width={w} height={32} rx={8} fill="#241c3e" />
      <text x={x + 14} y={y + 20.5} className="v-small" fill={WHITE}>
        build a todo app
      </text>
    </g>
  );
}

/** The Bash group: a description over the command, as the timeline renders it. */
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

/** The file group still streaming: each written file links to the editor. */
function FileGroup({ x, y, w }: WidthProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={102} rx={4} fill="none" stroke={LINE} />
      <GroupHeader x={x + 10} y={y + 23} glyph={Lucide.FILE_PLUS} title="Creating components" streaming />
      <FileRow x={x + 8} y={y + 48} name="TodoItem.tsx" path="src/components" />
      <FileRow x={x + 8} y={y + 70} name="AddTodo.tsx" path="src/components" />
      <FileRow x={x + 8} y={y + 92} name="TodoList.tsx" path="src/components" />
    </g>
  );
}

function ChatInput({ x, y, w }: WidthProps) {
  return (
    <g>
      <rect x={x - 3} y={y - 3} width={w + 6} height={94} rx={14} fill="none" stroke="#7a32d7" strokeOpacity={0.18} strokeWidth="6" />
      <rect x={x} y={y} width={w} height={88} rx={12} fill="#1a1233" stroke="#7a32d7" strokeOpacity={0.6} />
      <text x={x + 18} y={y + 28} className="v-small" fill="#8b8696">
        Your message here...
      </text>
      <EditorIcon x={x + 16} y={y + 56} glyph={Lucide.IMAGE_PLUS} size={15} color="#8b8696" />
      <text x={x + 38} y={y + 68} className="v-small" fill="#8b8696">
        Image
      </text>
      <rect x={x + w - 82} y={y + 50} width={70} height={28} rx={6} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.25)" />
      <EditorIcon x={x + w - 71} y={y + 57} glyph={Lucide.SEND} size={14} color={GRAY} />
      <text x={x + w - 51} y={y + 68.5} className="v-small" fill={GRAY}>
        Send
      </text>
    </g>
  );
}

/** Code / Preview, with Preview selected: the release opens on the preview. */
function ModeToggle({ x, y, compact }: ToggleProps) {
  return (
    <g>
      <rect x={x} y={y} width={164} height={26} rx={13} fill="rgba(12,2,36,0.6)" stroke="rgba(255,255,255,0.06)" />
      <EditorIcon x={x + 12} y={y + 6} glyph={Lucide.CODE} size={14} color="#9ca3af" />
      <text x={x + 32} y={y + 17.5} className="v-small" fill="#9ca3af">
        Code
      </text>
      <rect x={x + 72} y={y + 2} width={90} height={22} rx={11} fill="rgba(20,10,40,0.5)" stroke={ASH_500} />
      <EditorIcon x={x + 82} y={y + 6} glyph={Lucide.EYE} size={14} color={GRAY} />
      <text x={x + 102} y={y + 17.5} className="v-small" fill={GRAY}>
        Preview
      </text>
      {compact ? null : (
        <>
          <EditorIcon x={x + 178} y={y + 5} glyph={Lucide.DOWNLOAD} size={16} color={GRAY} />
          <EditorIcon x={x + 204} y={y + 5} glyph={Lucide.SHARE} size={16} color={GRAY} />
        </>
      )}
    </g>
  );
}

/**
 * The placeholder's code-editor animation: a window titled with the file being
 * written, a tab bar, the code typing in, and a beam travelling the border.
 */
function CodeWindow({ x, y, w, h, lines, beamId }: CodeWindowProps) {
  const lineHeight = 17;
  const codeTop = y + 72;
  const lastLine = lines.length - 1;
  const lastLineLength = (lines[lastLine] ?? []).reduce((sum, token) => sum + token.text.length, 0);
  return (
    <g>
      <defs>
        <linearGradient id={beamId} x1="0" x2="1">
          <stop offset="0" stopColor="#a855f7" stopOpacity="0" />
          <stop offset="0.5" stopColor="#a855f7" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
      <rect x={x + 0.5} y={y + 0.5} width={w - 1} height={27.5} rx={8} fill="rgba(255,255,255,0.03)" />
      <line x1={x} y1={y + 28} x2={x + w} y2={y + 28} stroke="rgba(255,255,255,0.1)" />
      {['#ff5f57', '#febc2e', '#28c840'].map((color, index) => (
        <circle key={color} cx={x + 16 + index * 14} cy={y + 14} r={4.5} fill={color} opacity={0.6} />
      ))}
      <text x={x + 62} y={y + 18} style={MONO} fontSize={11} fill="rgba(255,255,255,0.4)">
        TodoList.tsx
      </text>
      <line x1={x} y1={y + 50} x2={x + w} y2={y + 50} stroke="rgba(255,255,255,0.06)" />
      <text x={x + 12} y={y + 43} style={MONO} fontSize={9} fill="rgba(255,255,255,0.3)">
        TodoList.tsx
      </text>
      <line x1={x} y1={y + 49.5} x2={x + 84} y2={y + 49.5} stroke="rgba(192,132,252,0.3)" />
      <rect x={x + 98} y={y + 35} width={48} height={8} rx={2} fill="rgba(255,255,255,0.04)" />
      {lines.map((tokens, index) => (
        <g key={index}>
          <text x={x + 26} y={codeTop + index * lineHeight} textAnchor="end" style={MONO} fontSize={9} fill="rgba(255,255,255,0.15)">
            {index + 1}
          </text>
          <text x={x + 36} y={codeTop + index * lineHeight} style={MONO} fontSize={11} fill={VS.text} xmlSpace="preserve">
            {tokens.map((token, tokenIndex) => (
              <tspan key={tokenIndex} fill={token.color ?? VS.text}>
                {token.text}
              </tspan>
            ))}
          </text>
        </g>
      ))}
      <rect x={x + 37 + lastLineLength * MONO_CHAR} y={codeTop + lastLine * lineHeight - 10} width={6} height={13} fill="#794de1" />
      <path d={`M${x + w - 170} ${y}h162a8 8 0 0 1 8 8v70`} fill="none" stroke={`url(#${beamId})`} strokeWidth="1.5" strokeLinecap="round" />
    </g>
  );
}

function ActivityMessage({ x, y }: Pt) {
  return (
    <text x={x} y={y} textAnchor="middle" className="v-label" fill={WHITE}>
      Crafting interface: <tspan fill={SHIMMER}>Creating TodoList.tsx</tspan> component
    </text>
  );
}

function Wide() {
  const beam = useId();
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
      <circle cx={36} cy={728} r={10} fill="#5c21a8" />

      {/* Chat with the streamed agent timeline */}
      <Wordmark x={76} y={50} />
      <EditorIcon x={336} y={36} glyph={Lucide.ARROW_LEFT_FROM_LINE} size={18} color={GRAY} />
      <UserBubble x={228} y={74} w={128} />
      <circle cx={82} cy={132} r={9} fill="#8b5cf6" />
      <AgentRow x={100} y={132} name="Backend Developer" />
      <AgentRow x={100} y={166} name="Frontend Developer" open />
      <EditorIcon x={250} y={160} glyph={Lucide.CHEVRON_DOWN} size={13} color={WHITE} />
      <line x1={109} y1={182} x2={109} y2={470} stroke={LINE} />
      <text x={124} y={202} fontSize={10} fontWeight={700} fontStyle="italic" letterSpacing="0.08em" fill={AMBER}>
        INSTRUCTIONS
      </text>
      <text x={124} y={222} className="v-small" fill={ASH_400}>
        Build the todo UI: a list, an add
      </text>
      <text x={124} y={240} className="v-small" fill={ASH_400}>
        form, and done and active filters.
      </text>
      <BashGroup x={124} y={256} w={232} />
      <FileGroup x={124} y={354} w={232} />
      <ChatInput x={72} y={652} w={284} />

      {/* Explorer collapsed to its activity bar */}
      <rect x={372} y={8} width={48} height={744} fill={PANEL} />
      <line x1={420} y1={8} x2={420} y2={752} stroke="rgba(75,85,99,0.2)" />
      <rect x={380} y={40} width={32} height={32} rx={6} fill="rgba(255,255,255,0.08)" />
      <EditorIcon x={386} y={46} glyph={Lucide.FOLDER_TREE} size={20} color={WHITE} />
      <EditorIcon x={386} y={86} glyph={Lucide.DATABASE} size={20} color={ASH_400} />

      {/* Workspace toolbar */}
      <rect x={432} y={18} width={748} height={42} rx={10} fill="rgba(255,255,255,0.025)" stroke={LINE} />
      <ModeToggle x={444} y={26} />
      <rect x={986} y={26} width={84} height={26} rx={13} fill={GREEN} />
      <EditorIcon x={996} y={32} glyph={Lucide.GLOBE} size={14} color={GRAY} />
      <text x={1016} y={43.5} className="v-small" fill={GRAY}>
        Publish
      </text>
      <rect x={1076} y={26} width={76} height={26} rx={13} fill={GRAY} />
      <EditorIcon x={1086} y={32} glyph={Lucide.GITHUB} size={14} color={INK} />
      <text x={1106} y={43.5} className="v-small" fill={INK}>
        Github
      </text>
      <EditorIcon x={1158} y={31} glyph={Lucide.SLIDERS} size={16} color={GRAY} />

      {/* Preview area while agents write: the live activity animation */}
      <CodeWindow x={616} y={226} w={380} h={240} lines={todoList} beamId={beam} />
      <ActivityMessage x={806} y={508} />
    </>
  );
}

function Narrow() {
  const beam = useId();
  return (
    <>
      <rect x={8} y={8} width={584} height={744} rx={12} fill={BG} stroke="rgba(255,255,255,0.08)" />
      <Wordmark x={26} y={46} />
      <ModeToggle x={410} y={26} compact />
      <line x1={8} y1={66} x2={592} y2={66} stroke={LINE} />

      <UserBubble x={430} y={80} w={146} />
      <AgentRow x={24} y={134} name="Backend Developer" />
      <AgentRow x={24} y={166} name="Frontend Developer" open />
      <line x1={33} y1={182} x2={33} y2={320} stroke={LINE} />
      <text x={48} y={202} fontSize={10} fontWeight={700} fontStyle="italic" letterSpacing="0.08em" fill={AMBER}>
        INSTRUCTIONS
      </text>
      <text x={48} y={222} className="v-small" fill={ASH_400}>
        Build the todo UI: a list, an add form, and filters.
      </text>
      <FileGroup x={48} y={236} w={300} />

      <CodeWindow x={110} y={346} w={380} h={200} lines={todoList.slice(0, 7)} beamId={beam} />
      <ActivityMessage x={300} y={584} />
      <ChatInput x={24} y={640} w={552} />
    </>
  );
}

export function CocodingVisual() {
  return (
    <VizFrame
      label="Reconstruction of the cocoding.ai workspace mid-generation. The chat shows the streamed agent timeline: a finished Backend Developer block and a streaming Frontend Developer block with its instructions, a Bash group running npm install, and a Creating components file group listing TodoItem.tsx, AddTodo.tsx, and TodoList.tsx. The explorer is collapsed to its Files and Database activity bar, Preview is selected next to Publish and Github, and the preview area shows a code window typing TodoList.tsx above the message Crafting interface: Creating TodoList.tsx component."
      wide={<Wide />}
      narrow={<Narrow />}
    />
  );
}
