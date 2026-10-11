import { useId } from 'react';
import { type EditorGlyph, EditorIcon } from './editor-icons';
import { Lucide } from './lucide-icons';
import { Dots, type Pt, VizFrame } from './primitives';

/**
 * The cocoding.ai workspace mid-generation, reconstructed after the frontend's
 * main branch and drawn in this portfolio's mock palette: chat with the
 * streamed agent timeline (agent blocks with their instructions, a Bash group,
 * a file group), the preview with the explorer collapsed to its activity bar,
 * and the live activity animation typing the file being written above the
 * activity message.
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

interface InstructionsProps extends Pt {
  lines: readonly string[];
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

interface LegendItemProps extends Pt {
  color: string;
  label: string;
  dim?: boolean;
}

const CANVAS = '#0f0f0f';
const NODE = '#1b1b1a';
const RAISED = '#262624';
const WELL = '#151514';
const STROKE = '#30302c';
const PAPER = '#f4f1e8';
const FOG = '#a9a79c';
const MUTED = '#7a796f';
const INK = '#171815';
const SIGNAL = '#c7f36b';
const STREAM = '#8ab4ff';
const LEDGER = '#e6a03a';
const TAG = '#f0c2d4';
const MONO = { fontFamily: 'var(--font-mono)' } as const;
/** Measured advance of one 11px mono character, for placing the typing cursor. */
const MONO_CHAR = 7.7;

const todoList: CodeToken[][] = [
  [{ text: 'import', color: STREAM }, { text: ' { useState } ' }, { text: 'from', color: STREAM }, { text: " 'react'", color: SIGNAL }],
  [{ text: 'import', color: STREAM }, { text: ' { TodoItem } ' }, { text: 'from', color: STREAM }, { text: " './TodoItem'", color: SIGNAL }],
  [],
  [{ text: 'export function', color: STREAM }, { text: ' TodoList({ todos }) {' }],
  [{ text: '  const', color: STREAM }, { text: ' [show, setShow] = useState(' }, { text: "'all'", color: SIGNAL }, { text: ')' }],
  [{ text: '  const', color: STREAM }, { text: ' items = filterBy(todos, show)' }],
  [{ text: '  return', color: STREAM }, { text: ' (' }],
  [{ text: '    <ul', color: TAG }, { text: ' className=' }, { text: '"space-y-2"', color: SIGNAL }, { text: '>', color: TAG }],
  [{ text: '      {items.map((todo) => (' }],
];

function AgentAvatar({ x, y }: Pt) {
  return (
    <g>
      <circle cx={x} cy={y} r={9} fill={RAISED} stroke={STROKE} />
      <circle cx={x} cy={y - 2.5} r={3} fill={FOG} />
      <path d={`M${x - 5} ${y + 6}a5 4 0 0 1 10 0`} fill={FOG} />
    </g>
  );
}

function AgentRow({ x, y, name, open }: AgentRowProps) {
  const [first, ...rest] = name.split(' ');
  return (
    <g opacity={open ? 1 : 0.6}>
      <AgentAvatar x={x + 9} y={y} />
      <text x={x + 26} y={y + 4.5} className="v-small" fontWeight={600} fill={PAPER}>
        {open ? (
          <>
            {first} <tspan fill={STREAM}>{rest.join(' ')}</tspan>
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
      <EditorIcon x={x} y={y - 12} glyph={glyph} size={15} color={PAPER} />
      <text x={x + 22} y={y} className="v-small" fontWeight={600} fill={PAPER}>
        {streaming ? (
          <>
            {first} <tspan fill={STREAM}>{rest.join(' ')}</tspan>
          </>
        ) : (
          title
        )}
      </text>
    </g>
  );
}

function FileRow({ x, y, name, path }: FileRowProps) {
  const cx = x + 7;
  const cy = y - 4;
  return (
    <g>
      {[0, 60, 120].map((angle) => (
        <ellipse key={angle} cx={cx} cy={cy} rx={6} ry={2.3} fill="none" stroke={STREAM} transform={`rotate(${angle} ${cx} ${cy})`} />
      ))}
      <text x={x + 22} y={y} className="v-small" fill={PAPER}>
        {name}
        <tspan dx={8} fill={MUTED} fontSize={11.5}>
          {path}
        </tspan>
      </text>
    </g>
  );
}

function Wordmark({ x, y }: Pt) {
  return (
    <text x={x} y={y} className="v-label" fontWeight={800} fill={PAPER}>
      cocoding<tspan fill={STREAM}>.ai</tspan>
    </text>
  );
}

function UserBubble({ x, y, w }: WidthProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={32} rx={8} fill={RAISED} />
      <text x={x + 14} y={y + 20.5} className="v-small" fill={PAPER}>
        build a todo app
      </text>
    </g>
  );
}

function Instructions({ x, y, lines }: InstructionsProps) {
  return (
    <g>
      <text x={x} y={y} fontSize={10} fontWeight={700} fontStyle="italic" letterSpacing="0.08em" fill={LEDGER}>
        INSTRUCTIONS
      </text>
      {lines.map((line, index) => (
        <text key={line} x={x} y={y + 20 + index * 18} className="v-small" fill={FOG}>
          {line}
        </text>
      ))}
    </g>
  );
}

/** The Bash group: a description over the command, as the timeline renders it. */
function BashGroup({ x, y, w }: WidthProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={86} rx={4} fill="none" stroke={STROKE} />
      <GroupHeader x={x + 10} y={y + 23} glyph={Lucide.TERMINAL} title="Bash" />
      <text x={x + 10} y={y + 49} className="v-small" fontWeight={700} fill={FOG}>
        Install dependencies
      </text>
      <rect x={x + 10} y={y + 58} width={w - 20} height={20} rx={3} fill={WELL} />
      <text x={x + 18} y={y + 72} style={MONO} fontSize={11} fill={FOG}>
        $ npm install
      </text>
    </g>
  );
}

/** The file group still streaming: each written file links to the editor. */
function FileGroup({ x, y, w }: WidthProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={102} rx={4} fill="none" stroke={STREAM} strokeOpacity={0.45} />
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
      <rect x={x} y={y} width={w} height={88} rx={12} fill={WELL} stroke={STROKE} />
      <text x={x + 18} y={y + 28} className="v-small" fill={MUTED}>
        Your message here...
      </text>
      <EditorIcon x={x + 16} y={y + 56} glyph={Lucide.IMAGE_PLUS} size={15} color={MUTED} />
      <text x={x + 38} y={y + 68} className="v-small" fill={MUTED}>
        Image
      </text>
      <rect x={x + w - 82} y={y + 50} width={70} height={28} rx={6} fill={RAISED} stroke={STROKE} />
      <EditorIcon x={x + w - 71} y={y + 57} glyph={Lucide.SEND} size={14} color={PAPER} />
      <text x={x + w - 51} y={y + 68.5} className="v-small" fill={PAPER}>
        Send
      </text>
    </g>
  );
}

/** Code / Preview, with Preview selected: the release opens on the preview. */
function ModeToggle({ x, y, compact }: ToggleProps) {
  return (
    <g>
      <rect x={x} y={y} width={164} height={26} rx={13} fill={WELL} stroke={STROKE} />
      <EditorIcon x={x + 12} y={y + 6} glyph={Lucide.CODE} size={14} color={MUTED} />
      <text x={x + 32} y={y + 17.5} className="v-small" fill={MUTED}>
        Code
      </text>
      <rect x={x + 72} y={y + 2} width={90} height={22} rx={11} fill={RAISED} stroke={FOG} />
      <EditorIcon x={x + 82} y={y + 6} glyph={Lucide.EYE} size={14} color={PAPER} />
      <text x={x + 102} y={y + 17.5} className="v-small" fill={PAPER}>
        Preview
      </text>
      {compact ? null : (
        <>
          <EditorIcon x={x + 178} y={y + 5} glyph={Lucide.DOWNLOAD} size={16} color={FOG} />
          <EditorIcon x={x + 204} y={y + 5} glyph={Lucide.SHARE} size={16} color={FOG} />
        </>
      )}
    </g>
  );
}

function PublishButton({ x, y }: Pt) {
  return (
    <g>
      <rect x={x} y={y} width={88} height={26} rx={13} fill={SIGNAL} />
      <EditorIcon x={x + 11} y={y + 6} glyph={Lucide.GLOBE} size={14} color={INK} />
      <text x={x + 31} y={y + 17.5} className="v-small" fontWeight={600} fill={INK}>
        Publish
      </text>
    </g>
  );
}

function GithubButton({ x, y }: Pt) {
  return (
    <g>
      <rect x={x} y={y} width={78} height={26} rx={13} fill={PAPER} />
      <EditorIcon x={x + 11} y={y + 6} glyph={Lucide.GITHUB} size={14} color={INK} />
      <text x={x + 31} y={y + 17.5} className="v-small" fontWeight={600} fill={INK}>
        Github
      </text>
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
          <stop offset="0" stopColor={STREAM} stopOpacity="0" />
          <stop offset="0.55" stopColor={STREAM} />
          <stop offset="1" stopColor={SIGNAL} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={WELL} stroke={STROKE} />
      <path d={`M${x + 8} ${y}h${w - 16}a8 8 0 0 1 8 8v20H${x}V${y + 8}a8 8 0 0 1 8-8Z`} fill={NODE} />
      <line x1={x} y1={y + 28} x2={x + w} y2={y + 28} stroke={STROKE} />
      {[0, 1, 2].map((index) => (
        <circle key={index} cx={x + 16 + index * 14} cy={y + 14} r={4.5} fill={STROKE} />
      ))}
      <text x={x + 62} y={y + 18} style={MONO} fontSize={11} fill={FOG}>
        TodoList.tsx
      </text>
      <line x1={x} y1={y + 50} x2={x + w} y2={y + 50} stroke={STROKE} strokeOpacity={0.6} />
      <text x={x + 12} y={y + 43} style={MONO} fontSize={9} fill={MUTED}>
        TodoList.tsx
      </text>
      <line x1={x} y1={y + 49.5} x2={x + 84} y2={y + 49.5} stroke={STREAM} strokeOpacity={0.6} />
      <rect x={x + 98} y={y + 35} width={48} height={8} rx={2} fill={RAISED} />
      {lines.map((tokens, index) => (
        <g key={index}>
          <text x={x + 26} y={codeTop + index * lineHeight} textAnchor="end" style={MONO} fontSize={9} fill={MUTED}>
            {index + 1}
          </text>
          <text x={x + 36} y={codeTop + index * lineHeight} style={MONO} fontSize={11} fill={PAPER} xmlSpace="preserve">
            {tokens.map((token, tokenIndex) => (
              <tspan key={tokenIndex} fill={token.color ?? PAPER}>
                {token.text}
              </tspan>
            ))}
          </text>
        </g>
      ))}
      <rect x={x + 37 + lastLineLength * MONO_CHAR} y={codeTop + lastLine * lineHeight - 10} width={6} height={13} fill={STREAM} />
      <path d={`M${x + w - 170} ${y}h162a8 8 0 0 1 8 8v70`} fill="none" stroke={`url(#${beamId})`} strokeWidth="1.5" strokeLinecap="round" />
    </g>
  );
}

function ActivityMessage({ x, y }: Pt) {
  return (
    <text x={x} y={y} textAnchor="middle" className="v-label" fill={PAPER}>
      Crafting interface: <tspan fill={STREAM}>Creating TodoList.tsx</tspan> component
    </text>
  );
}

function LegendItem({ x, y, color, label, dim }: LegendItemProps) {
  return (
    <g opacity={dim ? 0.6 : 1}>
      <rect x={x} y={y} width={14} height={14} rx={4} fill={CANVAS} stroke={color} strokeWidth="2" />
      <text x={x + 22} y={y + 12} className="v-kicker" fill={PAPER}>
        {label}
      </text>
    </g>
  );
}

function Wide() {
  const beam = useId();
  return (
    <>
      <Dots width={1200} height={760} color="rgba(244,241,232,0.07)" background={CANVAS} />

      {/* Chat with the streamed agent timeline */}
      <rect x={40} y={40} width={380} height={640} rx={16} fill={NODE} stroke={STROKE} />
      <Wordmark x={62} y={78} />
      <EditorIcon x={390} y={64} glyph={Lucide.ARROW_LEFT_FROM_LINE} size={16} color={FOG} />
      <UserBubble x={268} y={100} w={130} />
      <circle cx={70} cy={162} r={8} fill={STREAM} />
      <AgentRow x={86} y={162} name="Backend Developer" />
      <AgentRow x={86} y={196} name="Frontend Developer" open />
      <EditorIcon x={236} y={190} glyph={Lucide.CHEVRON_DOWN} size={13} color={PAPER} />
      <line x1={95} y1={212} x2={95} y2={512} stroke={STROKE} />
      <Instructions x={110} y={232} lines={['Build the todo UI: a list, an add', 'form, and done and active filters.']} />
      <BashGroup x={110} y={288} w={290} />
      <FileGroup x={110} y={388} w={290} />
      <ChatInput x={56} y={576} w={348} />

      {/* Preview, with the explorer collapsed to its activity bar */}
      <rect x={450} y={40} width={710} height={640} rx={16} fill={NODE} stroke={STROKE} />
      <path d="M466 40h32v640h-32a16 16 0 0 1-16-16V56a16 16 0 0 1 16-16Z" fill={WELL} />
      <line x1={498} y1={40} x2={498} y2={680} stroke={STROKE} />
      <rect x={458} y={58} width={32} height={32} rx={6} fill={RAISED} />
      <EditorIcon x={464} y={64} glyph={Lucide.FOLDER_TREE} size={20} color={PAPER} />
      <EditorIcon x={464} y={104} glyph={Lucide.DATABASE} size={20} color={MUTED} />
      <ModeToggle x={514} y={56} />
      <PublishButton x={938} y={56} />
      <GithubButton x={1034} y={56} />
      <EditorIcon x={1126} y={61} glyph={Lucide.SLIDERS} size={16} color={FOG} />
      <line x1={498} y1={98} x2={1160} y2={98} stroke={STROKE} />
      <text x={518} y={130} className="v-kicker" fill={FOG}>
        preview, while the agents work
      </text>
      <CodeWindow x={639} y={226} w={380} h={240} lines={todoList} beamId={beam} />
      <ActivityMessage x={829} y={512} />

      <LegendItem x={40} y={714} color={STREAM} label="streaming now" />
      <LegendItem x={220} y={714} color={LEDGER} label="agent instructions" />
      <LegendItem x={430} y={714} color={FOG} label="finished agent" dim />
    </>
  );
}

function Narrow() {
  const beam = useId();
  return (
    <>
      <Dots width={600} height={760} color="rgba(244,241,232,0.07)" background={CANVAS} />

      <rect x={16} y={16} width={568} height={364} rx={16} fill={NODE} stroke={STROKE} />
      <Wordmark x={36} y={52} />
      <UserBubble x={418} y={30} w={146} />
      <AgentRow x={36} y={98} name="Backend Developer" />
      <AgentRow x={36} y={130} name="Frontend Developer" open />
      <line x1={45} y1={146} x2={45} y2={358} stroke={STROKE} />
      <Instructions x={60} y={166} lines={['Build the todo UI: a list, an add form, and filters.']} />
      <FileGroup x={60} y={204} w={320} />

      <rect x={16} y={396} width={568} height={348} rx={16} fill={NODE} stroke={STROKE} />
      <ModeToggle x={32} y={410} compact />
      <PublishButton x={480} y={410} />
      <line x1={16} y1={450} x2={584} y2={450} stroke={STROKE} />
      <CodeWindow x={110} y={470} w={380} h={196} lines={todoList.slice(0, 7)} beamId={beam} />
      <ActivityMessage x={300} y={712} />
    </>
  );
}

export function CocodingVisual() {
  return (
    <VizFrame
      label="Reconstruction of the cocoding.ai workspace mid-generation. The chat shows the streamed agent timeline: a finished Backend Developer block and a streaming Frontend Developer block with its instructions, a Bash group running npm install, and a Creating components file group listing TodoItem.tsx, AddTodo.tsx, and TodoList.tsx. The preview has the explorer collapsed to its Files and Database activity bar, Preview selected beside Publish and Github, and a code window typing TodoList.tsx above the message Crafting interface: Creating TodoList.tsx component."
      wide={<Wide />}
      narrow={<Narrow />}
    />
  );
}
