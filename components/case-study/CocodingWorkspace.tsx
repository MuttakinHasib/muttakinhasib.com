'use client';

import { type CSSProperties, type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import type { EditorGlyph } from '../visuals/editor-icons';
import { FOLDER_TWOTONE, fileTypeFor } from '../visuals/file-icons';
import { Lucide } from '../visuals/lucide-icons';

/**
 * The cocoding.ai workspace as a live reconstruction, rebuilt after the
 * frontend's main branch in the product's own theme. It first renders a
 * finished build, then streams one when it loads: agent blocks with their file
 * and Bash groups arrive in the chat, new files land in the explorer, the
 * editor follows the file being written, and the preview animates each step
 * until the generated app is ready to use. Send replays the build.
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

const Operation = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
} as const;
type Operation = (typeof Operation)[keyof typeof Operation];

const RunStatus = {
  STREAMING: 'streaming',
  DONE: 'done',
} as const;
type RunStatus = (typeof RunStatus)[keyof typeof RunStatus];

const Mode = {
  CODE: 'code',
  PREVIEW: 'preview',
} as const;
type Mode = (typeof Mode)[keyof typeof Mode];

const Filter = {
  ALL: 'all',
  ACTIVE: 'active',
  DONE: 'done',
} as const;
type Filter = (typeof Filter)[keyof typeof Filter];

interface Activity {
  scene: Scene;
  message: string;
  /** File or command the animation shows. */
  subject?: string;
}

interface FileEntry {
  name: string;
  path: string;
}

interface CommandEntry {
  description: string;
  command: string;
}

interface ThinkingStep {
  kind: 'thinking';
  activity: Activity;
}

interface AgentStep {
  kind: 'agent';
  agent: string;
  instructions: string;
  activity: Activity;
}

interface FileGroupStep {
  kind: 'file-group';
  title: string;
  operation: Operation;
  file: FileEntry;
  activity: Activity;
}

interface FileStep {
  kind: 'file';
  file: FileEntry;
  activity: Activity;
}

interface CommandStep {
  kind: 'command';
  entry: CommandEntry;
  output: string;
  activity: Activity;
}

interface FinalStep {
  kind: 'final';
  activity: Activity;
}

type Step = ThinkingStep | AgentStep | FileGroupStep | FileStep | CommandStep | FinalStep;

interface FileGroupState {
  kind: 'file';
  title: string;
  operation: Operation;
  files: FileEntry[];
}

interface BashGroupState {
  kind: 'bash';
  commands: CommandEntry[];
}

type GroupState = FileGroupState | BashGroupState;

interface AgentState {
  agent: string;
  instructions: string;
  groups: GroupState[];
}

interface Transcript {
  thinking: boolean;
  agents: AgentState[];
  final: boolean;
}

interface TerminalLine {
  id: number;
  text: string;
  tone?: 'command' | 'ok';
}

interface Todo {
  id: number;
  label: string;
  done: boolean;
}

interface Workspace {
  transcript: Transcript;
  files: string[];
  terminal: TerminalLine[];
  activity: Activity | null;
  openFile: string;
}

interface IconProps {
  glyph: EditorGlyph;
  className?: string;
}

interface WindowProps {
  title?: string;
  children: ReactNode;
}

interface SceneProps {
  activity: Activity;
}

interface FileIconProps {
  path: string;
}

interface ChatTranscriptProps {
  transcript: Transcript;
  streaming: boolean;
  onOpen: (path: string) => void;
}

interface ExplorerProps {
  files: readonly string[];
  open: string;
  fresh: string | null;
  onOpen: (path: string) => void;
}

interface CodeViewProps {
  path: string;
  terminal: readonly TerminalLine[];
}

const STEP_INTERVAL = 1300;
const AUTOPLAY_DELAY = 500;

const script: Step[] = [
  { kind: 'thinking', activity: { scene: Scene.ORBITAL, message: 'Our agents are working on your project...' } },
  {
    kind: 'agent',
    agent: 'Backend Developer',
    instructions: 'Add a todos table and a typed data layer for it.',
    activity: { scene: Scene.ORBITAL, message: 'Planning: Delegating to Backend Developer...' },
  },
  {
    kind: 'file-group',
    title: 'Reading pages',
    operation: Operation.READ,
    file: { name: 'page.tsx', path: 'src/app' },
    activity: { scene: Scene.FILE_GRID, message: 'Building backend: Reading page.tsx', subject: 'page.tsx' },
  },
  {
    kind: 'file-group',
    title: 'Setting up utilities',
    operation: Operation.CREATE,
    file: { name: 'todos.ts', path: 'src/lib' },
    activity: { scene: Scene.CODE_EDITOR, message: 'Building backend: Creating todos.ts utility', subject: 'todos.ts' },
  },
  {
    kind: 'command',
    entry: { description: 'Install dependencies', command: 'npm install' },
    output: 'dependencies installed',
    activity: { scene: Scene.TERMINAL, message: 'Building backend: Install dependencies', subject: 'npm install' },
  },
  {
    kind: 'agent',
    agent: 'Frontend Developer',
    instructions: 'Build the todo UI: a list, an add form, and done and active filters.',
    activity: { scene: Scene.ORBITAL, message: 'Planning: Delegating to Frontend Developer...' },
  },
  {
    kind: 'file-group',
    title: 'Creating components',
    operation: Operation.CREATE,
    file: { name: 'TodoList.tsx', path: 'src/components' },
    activity: { scene: Scene.WIREFRAME, message: 'Crafting interface: Creating TodoList.tsx component', subject: 'TodoList.tsx' },
  },
  {
    kind: 'file',
    file: { name: 'TodoItem.tsx', path: 'src/components' },
    activity: { scene: Scene.WIREFRAME, message: 'Crafting interface: Creating TodoItem.tsx component', subject: 'TodoItem.tsx' },
  },
  {
    kind: 'file',
    file: { name: 'AddTodo.tsx', path: 'src/components' },
    activity: { scene: Scene.WIREFRAME, message: 'Crafting interface: Creating AddTodo.tsx component', subject: 'AddTodo.tsx' },
  },
  {
    kind: 'command',
    entry: { description: 'Install UI components', command: 'npx shadcn add checkbox' },
    output: '✓ added checkbox',
    activity: { scene: Scene.TERMINAL, message: 'Crafting interface: Installing UI components...', subject: 'npx shadcn add checkbox' },
  },
  {
    kind: 'file-group',
    title: 'Updating pages',
    operation: Operation.UPDATE,
    file: { name: 'page.tsx', path: 'src/app' },
    activity: { scene: Scene.WIREFRAME, message: 'Crafting interface: Updating page.tsx page', subject: 'page.tsx' },
  },
  { kind: 'final', activity: { scene: Scene.COMPLETION, message: 'Your project is ready to run.' } },
];

const OPERATION_GLYPH: Record<Operation, EditorGlyph> = {
  [Operation.READ]: Lucide.EYE,
  [Operation.CREATE]: Lucide.FILE_PLUS,
  [Operation.UPDATE]: Lucide.FILE_PEN,
};

/** The template every project starts from, before the agents write anything. */
const TEMPLATE_FILES = ['src/app/layout.tsx', 'src/app/page.tsx', 'package.json'];
const FIRST_FILE = 'src/app/page.tsx';

const SOURCES: Record<string, readonly string[]> = {
  'src/app/layout.tsx': [
    "import './globals.css'",
    '',
    'export default function RootLayout({',
    '  children,',
    '}: { children: React.ReactNode }) {',
    '  return (',
    '    <html lang="en">',
    '      <body>{children}</body>',
    '    </html>',
    '  )',
    '}',
  ],
  'src/app/page.tsx': [
    "import { TodoList } from '@/components/TodoList'",
    '',
    'export default function Page() {',
    '  return (',
    '    <main className="mx-auto max-w-md p-6">',
    '      <TodoList />',
    '    </main>',
    '  )',
    '}',
  ],
  'package.json': ['{', '  "name": "todo-app",', '  "private": true,', '  "scripts": {', '    "dev": "next dev"', '  }', '}'],
  'src/lib/todos.ts': [
    'export interface Todo {',
    '  id: number',
    '  label: string',
    '  done: boolean',
    '}',
    '',
    "export type Show = 'all' | 'active' | 'done'",
    '',
    'export function filterBy(todos: Todo[], show: Show) {',
    "  if (show === 'all') return todos",
    "  return todos.filter((t) => t.done === (show === 'done'))",
    '}',
  ],
  'src/components/TodoList.tsx': [
    "'use client'",
    '',
    "import { useState } from 'react'",
    "import { AddTodo } from './AddTodo'",
    "import { TodoItem } from './TodoItem'",
    '',
    'export function TodoList() {',
    '  const [todos, setTodos] = useState([])',
    "  const [show, setShow] = useState('all')",
    '  const items = filterBy(todos, show)',
    '',
    '  return (',
    '    <section className="space-y-3">',
    '      <AddTodo onAdd={add} />',
    '      {items.map((todo) => (',
    '        <TodoItem key={todo.id} todo={todo} />',
    '      ))}',
    '    </section>',
    '  )',
    '}',
  ],
  'src/components/TodoItem.tsx': [
    "import { Checkbox } from '@/components/ui/checkbox'",
    '',
    'export function TodoItem({ todo, onToggle }) {',
    '  return (',
    '    <li className="flex items-center gap-3">',
    '      <Checkbox checked={todo.done} onCheckedChange={onToggle} />',
    '      <span>{todo.label}</span>',
    '    </li>',
    '  )',
    '}',
  ],
  'src/components/AddTodo.tsx': [
    "import { Button } from '@/components/ui/button'",
    '',
    'export function AddTodo({ onAdd }) {',
    '  return (',
    '    <form action={onAdd} className="flex gap-2">',
    '      <input name="label" placeholder="Add a todo…" />',
    '      <Button type="submit">Add</Button>',
    '    </form>',
    '  )',
    '}',
  ],
};

const GRID_FILES = ['page.tsx', 'layout.tsx', 'globals.css', 'TodoList.tsx', 'todos.ts', 'package.json'];
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const EMPTY: Transcript = { thinking: false, agents: [], final: false };
const KEYWORDS = /^(import|from|export|default|function|const|return|if|interface|type)$/;
const STARTER_TODOS: Todo[] = [
  { id: 1, label: 'Buy oat milk', done: true },
  { id: 2, label: 'Write release notes', done: false },
  { id: 3, label: 'Book the dentist', done: false },
];

/** Folds one streamed step into the transcript, the way the SSE store appends blocks. */
function applyStep(transcript: Transcript, step: Step): Transcript {
  const agents = transcript.agents.map((agent) => ({ ...agent, groups: [...agent.groups] }));
  const current = agents.at(-1);
  switch (step.kind) {
    case 'thinking':
      return { ...transcript, thinking: true };
    case 'agent':
      return {
        ...transcript,
        thinking: false,
        agents: [...agents, { agent: step.agent, instructions: step.instructions, groups: [] }],
      };
    case 'file-group':
      current?.groups.push({ kind: 'file', title: step.title, operation: step.operation, files: [step.file] });
      return { ...transcript, agents };
    case 'file': {
      const group = current?.groups.at(-1);
      if (current && group?.kind === 'file') current.groups.splice(-1, 1, { ...group, files: [...group.files, step.file] });
      return { ...transcript, agents };
    }
    case 'command': {
      const group = current?.groups.at(-1);
      if (current && group?.kind === 'bash') current.groups.splice(-1, 1, { ...group, commands: [...group.commands, step.entry] });
      else current?.groups.push({ kind: 'bash', commands: [step.entry] });
      return { ...transcript, agents };
    }
    case 'final':
      return { ...transcript, final: true };
  }
}

/** The file a step writes or reads, which the editor follows while streaming. */
function stepFile(step: Step): string | null {
  if (step.kind === 'file' || step.kind === 'file-group') return `${step.file.path}/${step.file.name}`;
  return null;
}

function createsFile(step: Step): boolean {
  return step.kind === 'file' || (step.kind === 'file-group' && step.operation === Operation.CREATE);
}

/** What a step prints in the Output panel. */
function outputFor(step: Step): string[][] {
  if (step.kind === 'command') return [[`$ ${step.entry.command}`, 'command'], [step.output]];
  if (step.kind === 'final') return [['$ npm run dev', 'command'], ['✓ Ready on http://localhost:3000', 'ok']];
  return [];
}

/** Appends a step's effects to the workspace, as the SSE and file streams do. */
function advance(workspace: Workspace, step: Step): Workspace {
  const file = stepFile(step);
  const files = file && createsFile(step) && !workspace.files.includes(file) ? [...workspace.files, file] : workspace.files;
  const terminal = [
    ...workspace.terminal,
    ...outputFor(step).map(([text, tone], index) => ({
      id: workspace.terminal.length + index + 1,
      text: text ?? '',
      tone: tone as TerminalLine['tone'],
    })),
  ];
  return {
    transcript: applyStep(workspace.transcript, step),
    files,
    terminal,
    activity: step.activity,
    openFile: file ?? workspace.openFile,
  };
}

const START: Workspace = { transcript: EMPTY, files: TEMPLATE_FILES, terminal: [], activity: null, openFile: FIRST_FILE };
/** The finished build, rendered first so the page never opens on an empty workspace. */
const FINISHED: Workspace = { ...script.reduce(advance, START), openFile: 'src/components/TodoList.tsx' };

/** Monaco's vs-dark colours for keywords and strings, enough for these snippets. */
function highlight(line: string): ReactNode[] {
  return line.split(/('[^']*'|"[^"]*"|\b[a-z]+\b)/).map((part, index) => {
    if (/^['"]/.test(part)) return <span key={index} className="cw-str">{part}</span>;
    if (KEYWORDS.test(part)) return <span key={index} className="cw-kw">{part}</span>;
    return part;
  });
}

function Icon({ glyph, className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${glyph.box} ${glyph.box}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={glyph.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyph.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** The file-type icon cocoding.ai's FileIcon draws for a name. */
function FileIcon({ path }: FileIconProps) {
  const glyph = fileTypeFor(path);
  return (
    <svg className="cw-file-icon" viewBox={`0 0 ${glyph.box} ${glyph.box}`} aria-hidden="true">
      <path d={glyph.d} fill={glyph.fill} fillRule={glyph.evenOdd ? 'evenodd' : undefined} />
    </svg>
  );
}

/** The explorer's folder: line-md's two-tone folder, in the row's colour. */
function FolderIcon() {
  return (
    <svg
      className="cw-folder-icon"
      viewBox={`0 0 ${FOLDER_TWOTONE.box} ${FOLDER_TWOTONE.box}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={FOLDER_TWOTONE.body} fill="currentColor" fillOpacity={0.3} />
      <path d={FOLDER_TWOTONE.tab} />
    </svg>
  );
}

function Window({ title, children }: WindowProps) {
  return (
    <div className="cw-window">
      <div className="cw-window-bar">
        <span className="cw-lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        {title ? <span className="cw-window-title">{title}</span> : <span className="cw-window-url" />}
      </div>
      {children}
    </div>
  );
}

function TerminalScene({ activity }: SceneProps) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setFrame((value) => (value + 1) % SPINNER.length), 90);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <Window title="Terminal">
      <div className="cw-term">
        <p>
          <span className="cw-cyan">$</span> {activity.subject}
        </p>
        <p className="cw-dim">
          <span className="cw-cyan">{SPINNER[frame]}</span> Running...
        </p>
      </div>
    </Window>
  );
}

/** The preview placeholder's animation for the step in progress. */
function ActivityScene({ activity }: SceneProps) {
  switch (activity.scene) {
    case Scene.ORBITAL:
      return (
        <div className="cw-orbital" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      );
    case Scene.FILE_GRID:
      return (
        <Window title="src/app">
          <ul className="cw-grid">
            {GRID_FILES.map((file) => (
              <li key={file} data-active={file === activity.subject || undefined}>
                <FileIcon path={file} />
                {file}
              </li>
            ))}
          </ul>
        </Window>
      );
    case Scene.CODE_EDITOR:
      return (
        <Window title={activity.subject}>
          <div className="cw-code-lines" aria-hidden="true">
            {Array.from({ length: 9 }, (_, index) => (
              <span key={index} style={{ '--i': index } as CSSProperties} />
            ))}
          </div>
        </Window>
      );
    case Scene.WIREFRAME:
      return (
        <Window>
          <div className="cw-wire" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </Window>
      );
    case Scene.TERMINAL:
      return <TerminalScene activity={activity} />;
    case Scene.COMPLETION:
      return (
        <svg className="cw-done" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="44" />
          <path d="M30 52 L44 66 L70 36" />
        </svg>
      );
  }
}

function ChatTranscript({ transcript, streaming, onOpen }: ChatTranscriptProps) {
  const lastAgent = transcript.agents.length - 1;
  return (
    <>
      {transcript.thinking ? (
        <div className="cw-assistant">
          <span className="cw-avatar" aria-hidden="true" />
          <div>
            <p className="cw-shimmer cw-strong">Thinking and designing</p>
            <p className="cw-muted">Our agents are thinking of solutions and designing structure for your idea.</p>
          </div>
        </div>
      ) : null}
      {transcript.agents.map((agent, agentIndex) => {
        const isLastAgent = agentIndex === lastAgent && !transcript.final;
        const lastGroup = agent.groups.length - 1;
        return (
          <div key={agent.agent} className="cw-agent" data-done={!isLastAgent || undefined}>
            <p className="cw-agent-head">
              <span className="cw-agent-avatar" aria-hidden="true" />
              <span className={isLastAgent && streaming && lastGroup < 0 ? 'cw-shimmer' : undefined}>{agent.agent}</span>
            </p>
            <div className="cw-agent-body">
              <p className="cw-instructions">Instructions</p>
              <p className="cw-muted">{agent.instructions}</p>
              {agent.groups.map((group, groupIndex) => {
                const live = isLastAgent && streaming && groupIndex === lastGroup;
                return group.kind === 'file' ? (
                  <div key={`${group.title}-${groupIndex}`} className="cw-group">
                    <p className="cw-group-head">
                      <Icon glyph={OPERATION_GLYPH[group.operation]} className="cw-icon" />
                      <span className={live ? 'cw-shimmer' : undefined}>{group.title}</span>
                    </p>
                    <ul>
                      {group.files.map((file) => (
                        <li key={file.name}>
                          <button type="button" className="cw-file" onClick={() => onOpen(`${file.path}/${file.name}`)}>
                            <FileIcon path={file.name} />
                            {file.name}
                            <span className="cw-path">{file.path}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div key={`bash-${groupIndex}`} className="cw-group">
                    <p className="cw-group-head">
                      <Icon glyph={Lucide.TERMINAL} className="cw-icon" />
                      <span className={live ? 'cw-shimmer' : undefined}>Bash</span>
                    </p>
                    {group.commands.map((entry) => (
                      <div key={entry.command} className="cw-command">
                        <p className="cw-strong">{entry.description}</p>
                        <code>$ {entry.command}</code>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {transcript.final ? <p className="cw-final">Your todo app is ready. Open the preview to try it, or ask for a change.</p> : null}
    </>
  );
}

/** The explorer's tree, grouped by folder the way the workspace lays it out. */
function Explorer({ files, open, fresh, onOpen }: ExplorerProps) {
  const folders = ['src/app', 'src/components', 'src/lib'];
  const inFolder = (folder: string) => files.filter((file) => file.startsWith(`${folder}/`)).sort();
  const rootFiles = files.filter((file) => !file.includes('/')).sort();
  const fileButton = (path: string, depth: number) => (
    <li key={path} style={{ '--depth': depth } as CSSProperties}>
      <button
        type="button"
        className="cw-tree-file"
        aria-current={open === path || undefined}
        data-fresh={fresh === path || undefined}
        onClick={() => onOpen(path)}
      >
        <FileIcon path={path} />
        {path.split('/').at(-1)}
      </button>
    </li>
  );
  return (
    <section className="cw-explorer" aria-label="Explorer">
      <div className="cw-explorer-head">
        <span className="cw-explorer-tab">
          <Icon glyph={Lucide.FOLDER_TREE} className="cw-icon" /> Explorer
        </span>
        <Icon glyph={Lucide.DATABASE} className="cw-icon cw-muted" />
        <Icon glyph={Lucide.ARROW_LEFT_TO_LINE} className="cw-icon cw-muted cw-push" />
      </div>
      <ul className="cw-tree">
        <li className="cw-folder" style={{ '--depth': 0 } as CSSProperties}>
          <FolderIcon /> Workspace
        </li>
        <li className="cw-folder" style={{ '--depth': 1 } as CSSProperties}>
          <FolderIcon /> src
        </li>
        {folders.map((folder) => {
          const children = inFolder(folder);
          if (children.length === 0) return null;
          return [
            <li key={folder} className="cw-folder" style={{ '--depth': 2 } as CSSProperties}>
              <FolderIcon /> {folder.split('/').at(-1)}
            </li>,
            ...children.map((path) => fileButton(path, 3)),
          ];
        })}
        {rootFiles.map((path) => fileButton(path, 1))}
      </ul>
    </section>
  );
}

/** Code: the open file's tab, its path, the code, and the Output panel. */
function CodeView({ path, terminal }: CodeViewProps) {
  const lines = SOURCES[path] ?? [];
  const name = path.split('/').at(-1) ?? path;
  return (
    <div className="cw-code-view">
      <div className="cw-tabs">
        <span className="cw-tab" data-active>
          <FileIcon path={path} />
          {name}
          <Icon glyph={Lucide.X} className="cw-icon-sm" />
        </span>
      </div>
      <p className="cw-crumbs">
        <Icon glyph={Lucide.FILE} className="cw-icon-sm" />
        {path.split('/').join(' › ')}
      </p>
      <pre key={path} className="cw-editor" aria-label={`${name} source`}>
        {lines.map((line, index) => (
          <span key={index} className="cw-line" style={{ '--i': index } as CSSProperties}>
            <span className="cw-ln" aria-hidden="true">
              {index + 1}
            </span>
            {highlight(line)}
          </span>
        ))}
      </pre>
      <div className="cw-output">
        <div className="cw-output-tabs">
          <span data-active>Output</span>
          <span>Terminal</span>
          <span className="cw-connected">Connected</span>
        </div>
        <div className="cw-output-lines" aria-live="polite">
          {terminal.length === 0 ? <p className="cw-dim">Waiting for the first command...</p> : null}
          {terminal.map((line) => (
            <p key={line.id} data-tone={line.tone}>
              {line.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The generated app in the preview: add, tick off, and filter todos. */
function TodoPreview() {
  const [todos, setTodos] = useState<Todo[]>(STARTER_TODOS);
  const [show, setShow] = useState<Filter>(Filter.ALL);
  const [draft, setDraft] = useState('');
  const visible = todos.filter((todo) => show === Filter.ALL || todo.done === (show === Filter.DONE));
  const add = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const label = draft.trim();
    if (!label) return;
    setTodos((current) => [...current, { id: Date.now(), label, done: false }]);
    setDraft('');
  };
  return (
    <div className="cw-app">
      <p className="cw-app-title">Todos</p>
      <p className="cw-app-sub">
        {todos.length} tasks, {todos.filter((todo) => todo.done).length} done
      </p>
      <form className="cw-app-form" onSubmit={add}>
        <label className="sr-only" htmlFor="cw-todo">
          Add a todo
        </label>
        <input id="cw-todo" value={draft} placeholder="Add a todo…" onChange={(event) => setDraft(event.target.value)} />
        <button type="submit">Add</button>
      </form>
      <div className="cw-app-filters" role="group" aria-label="Show">
        {Object.values(Filter).map((value) => (
          <button key={value} type="button" aria-pressed={show === value} onClick={() => setShow(value)}>
            {value === Filter.ALL ? 'All' : value === Filter.ACTIVE ? 'Active' : 'Done'}
          </button>
        ))}
      </div>
      <ul className="cw-app-list">
        {visible.map((todo) => (
          <li key={todo.id}>
            <label>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() =>
                  setTodos((current) => current.map((item) => (item.id === todo.id ? { ...item, done: !item.done } : item)))
                }
              />
              <span data-done={todo.done || undefined}>{todo.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Rail() {
  return (
    <nav className="cw-rail" aria-hidden="true">
      <Icon glyph={Lucide.PANEL_LEFT} className="cw-icon-lg" />
      <span className="cw-rail-rule" />
      <Icon glyph={Lucide.SQUARE_PLUS} className="cw-icon" />
      <Icon glyph={Lucide.MESSAGE_SQUARE} className="cw-icon" />
      <span className="cw-rail-chip">To…</span>
      <Icon glyph={Lucide.LAYOUT_GRID} className="cw-icon" />
      <span className="cw-rail-fill" />
      <Icon glyph={Lucide.SETTINGS} className="cw-icon" />
      <span className="cw-rail-avatar" />
    </nav>
  );
}

export function CocodingWorkspace() {
  const [run, setRun] = useState<RunStatus>(RunStatus.DONE);
  const [workspace, setWorkspace] = useState<Workspace>(FINISHED);
  const [fresh, setFresh] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(Mode.CODE);
  const cursor = useRef(0);
  const chatRef = useRef<HTMLDivElement>(null);

  const start = () => {
    cursor.current = 0;
    setWorkspace(START);
    setFresh(null);
    setMode(Mode.PREVIEW);
    setRun(RunStatus.STREAMING);
  };

  // Stream a build once the page has loaded, unless motion is reduced.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => {
      cursor.current = 0;
      setWorkspace(START);
      setMode(Mode.PREVIEW);
      setRun(RunStatus.STREAMING);
    }, AUTOPLAY_DELAY);
    return () => window.clearTimeout(timer);
  }, []);

  // SSE: one step per tick.
  useEffect(() => {
    if (run !== RunStatus.STREAMING) return;
    const timer = window.setInterval(() => {
      const index = cursor.current;
      const step = script[index];
      if (!step) {
        setRun(RunStatus.DONE);
        return;
      }
      cursor.current = index + 1;
      setWorkspace((current) => advance(current, step));
      if (createsFile(step)) setFresh(stepFile(step));
      if (index + 1 === script.length) setRun(RunStatus.DONE);
    }, STEP_INTERVAL);
    return () => window.clearInterval(timer);
  }, [run]);

  // Follow the stream, as the chat does.
  useEffect(() => {
    const chat = chatRef.current;
    if (chat) chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
  }, [workspace.transcript]);

  // Opening a file from the chat or the explorer switches to Code, as in the product.
  const open = (path: string) => {
    setWorkspace((current) => ({ ...current, openFile: path }));
    setMode(Mode.CODE);
  };

  const streaming = run === RunStatus.STREAMING;
  const { activity } = workspace;

  return (
    <div className="cw-hero">
      <div className="cw-ide" data-theme="dark" role="region" aria-label="Live reconstruction of the cocoding.ai workspace">
        <Rail />

        <section className="cw-chat" aria-label="Chat">
          <div className="cw-chat-head">
            <p className="cw-wordmark">
              cocoding<span>.ai</span>
            </p>
            <Icon glyph={Lucide.ARROW_LEFT_FROM_LINE} className="cw-icon cw-muted" />
          </div>
          <div className="cw-chat-scroll" ref={chatRef}>
            <p className="cw-bubble">build a todo app</p>
            <ChatTranscript transcript={workspace.transcript} streaming={streaming} onOpen={open} />
          </div>
          <div className="cw-input">
            <span className="cw-placeholder">Your message here...</span>
            <span className="cw-input-row">
              <span className="cw-ghost" aria-hidden="true">
                <Icon glyph={Lucide.IMAGE_PLUS} className="cw-icon" /> Image
              </span>
              <button type="button" className="cw-send" onClick={start} disabled={streaming} aria-label="Send the prompt again to replay the build">
                <Icon glyph={Lucide.SEND} className="cw-icon" /> Send
              </button>
            </span>
          </div>
        </section>

        <Explorer files={workspace.files} open={workspace.openFile} fresh={fresh} onOpen={open} />

        <section className="cw-main" aria-label="Editor">
          <div className="cw-toolbar">
            <div className="cw-toggle" role="group" aria-label="Mode">
              <button type="button" aria-pressed={mode === Mode.CODE} onClick={() => setMode(Mode.CODE)}>
                <Icon glyph={Lucide.CODE} className="cw-icon" /> Code
              </button>
              <button type="button" aria-pressed={mode === Mode.PREVIEW} onClick={() => setMode(Mode.PREVIEW)}>
                <Icon glyph={Lucide.EYE} className="cw-icon" /> Preview
              </button>
            </div>
            <span className="cw-tools" aria-hidden="true">
              <Icon glyph={Lucide.MAXIMIZE} className="cw-icon" />
              <Icon glyph={Lucide.DOWNLOAD} className="cw-icon" />
              <Icon glyph={Lucide.SHARE} className="cw-icon" />
            </span>
            <span className="cw-actions" aria-hidden="true">
              <span className="cw-publish">
                <Icon glyph={Lucide.GLOBE} className="cw-icon" /> Publish
              </span>
              <span className="cw-github">
                <Icon glyph={Lucide.GITHUB} className="cw-icon" /> Github
              </span>
              <Icon glyph={Lucide.SETTINGS_2} className="cw-icon" />
            </span>
          </div>

          <div className="cw-panes">
            <div className="cw-pane" data-active={mode === Mode.CODE || undefined}>
              <CodeView path={workspace.openFile} terminal={workspace.terminal} />
            </div>
            <div className="cw-pane cw-preview" data-active={mode === Mode.PREVIEW || undefined}>
              <div className="cw-browser-bar">
                <Icon glyph={Lucide.ARROW_LEFT} className="cw-icon" />
                <Icon glyph={Lucide.ROTATE_CW} className="cw-icon" />
                <span className="cw-url">
                  <Icon glyph={Lucide.LOCK} className="cw-icon-sm cw-lock" />
                  cocoding.app/app/37bc7619
                </span>
                <Icon glyph={Lucide.SHARE} className="cw-icon" />
              </div>
              {run === RunStatus.DONE ? (
                <div className="cw-browser">
                  <TodoPreview />
                  <p className="cw-watermark">
                    Built with <strong>cocoding.ai</strong>
                  </p>
                </div>
              ) : (
                <div className="cw-stage">
                  {activity ? (
                    <div key={`${activity.scene}-${activity.subject ?? ''}`} className="cw-scene">
                      <ActivityScene activity={activity} />
                    </div>
                  ) : (
                    <p className="cw-logo">
                      cocoding<span>.ai</span>
                    </p>
                  )}
                  <p className="cw-message cw-shimmer" aria-live="polite">
                    {activity?.message ?? 'Our agents are working on your project...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
