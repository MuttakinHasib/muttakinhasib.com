import type { EditorGlyph } from '@/components/visuals/editor-icons';
import { Lucide } from '@/components/visuals/lucide-icons';

/**
 * The cocoding.ai reconstruction scene — single source for the live workspace
 * and the SVG visual. Pure data: no React, no DOM. Both renderers derive their
 * (deliberately different) layouts from these exports instead of hand-typing
 * the same narrative twice.
 */

export const Scene = {
  ORBITAL: 'orbital',
  FILE_GRID: 'file-grid',
  CODE_EDITOR: 'code-editor',
  WIREFRAME: 'wireframe',
  TERMINAL: 'terminal',
  COMPLETION: 'completion',
} as const;
export type Scene = (typeof Scene)[keyof typeof Scene];

export const Operation = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
} as const;
export type Operation = (typeof Operation)[keyof typeof Operation];

export interface Activity {
  scene: Scene;
  message: string;
  /** File or command the animation shows. */
  subject?: string;
}

export interface FileEntry {
  name: string;
  path: string;
}

export interface CommandEntry {
  description: string;
  command: string;
}

export interface ThinkingStep {
  kind: 'thinking';
  activity: Activity;
}

export interface AgentStep {
  kind: 'agent';
  agent: string;
  instructions: string;
  activity: Activity;
}

export interface FileGroupStep {
  kind: 'file-group';
  title: string;
  operation: Operation;
  file: FileEntry;
  activity: Activity;
}

export interface FileStep {
  kind: 'file';
  file: FileEntry;
  activity: Activity;
}

export interface CommandStep {
  kind: 'command';
  entry: CommandEntry;
  output: string;
  activity: Activity;
}

export interface FinalStep {
  kind: 'final';
  activity: Activity;
}

export type BuildStep = ThinkingStep | AgentStep | FileGroupStep | FileStep | CommandStep | FinalStep;

/** The stage's idle message before, between, and after builds. */
export const IDLE_MESSAGE = 'Our agents are working on your project...';

/** The streamed build, one step per tick: the narrative source of truth. */
export const buildScript: readonly BuildStep[] = [
  { kind: 'thinking', activity: { scene: Scene.ORBITAL, message: IDLE_MESSAGE } },
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

/** The agents the build delegates to, in order. */
export const agentSteps: readonly AgentStep[] = buildScript.filter((step): step is AgentStep => step.kind === 'agent');

const commands = buildScript.filter((step): step is CommandStep => step.kind === 'command');
/** The dependency install the Bash group narrates. */
export const installCommand = commands[0];

const lastAgent = buildScript.findLastIndex((step) => step.kind === 'agent');
/** The files the component-writing agent produces, in write order. */
export const componentFiles: readonly FileEntry[] = buildScript
  .slice(lastAgent + 1)
  .flatMap((step) =>
    step.kind === 'file' || (step.kind === 'file-group' && step.operation === Operation.CREATE) ? [step.file] : [],
  );

const fileGroups = buildScript.filter((step): step is FileGroupStep => step.kind === 'file-group');
const createGroups = fileGroups.filter((step) => step.operation === Operation.CREATE);
/** The chat group the components land under: 'Creating components'. */
export const componentGroup = createGroups[createGroups.length - 1];

/** Which glyph a file group's operation draws. */
export const operationGlyph: Record<Operation, EditorGlyph> = {
  [Operation.READ]: Lucide.EYE,
  [Operation.CREATE]: Lucide.FILE_PLUS,
  [Operation.UPDATE]: Lucide.FILE_PEN,
};

/** One Output-panel line: the text and, when it is one, its tone. */
export type OutputLine = readonly [text: string, tone?: 'command' | 'ok'];

/** What a step prints in the Output panel: the command, then its result. */
export function outputFor(step: BuildStep): OutputLine[] {
  if (step.kind === 'command') return [[`$ ${step.entry.command}`, 'command'], [step.output]];
  if (step.kind === 'final') return [['$ npm run dev', 'command'], ['✓ Ready on http://localhost:3000', 'ok']];
  return [];
}

/** The finished build's whole Output log: every command, then the dev server. */
export const outputLog: readonly OutputLine[] = buildScript.flatMap(outputFor);

export type TokenKind = 'text' | 'keyword' | 'string';

export interface SourceToken {
  kind: TokenKind;
  text: string;
}

export const txt = (text: string): SourceToken => ({ kind: 'text', text });
export const kw = (text: string): SourceToken => ({ kind: 'keyword', text });
export const str = (text: string): SourceToken => ({ kind: 'string', text });

/** Each file's lines as tokens, so both renderers share the code and its syntax kinds. */
export const sources: Record<string, readonly (readonly SourceToken[])[]> = {
  'src/app/layout.tsx': [
    [kw('import'), txt(' '), str("'./globals.css'")],
    [],
    [kw('export default function'), txt(' RootLayout({')],
    [txt('  children,')],
    [txt('}: { children: React.ReactNode }) {')],
    [kw('  return'), txt(' (')],
    [txt('    <html lang='), str('"en"'), txt('>')],
    [txt('      <body>{children}</body>')],
    [txt('    </html>')],
    [txt('  )')],
    [txt('}')],
  ],
  'src/app/page.tsx': [
    [kw('import'), txt(' { TodoList } '), kw('from'), txt(' '), str("'@/components/TodoList'")],
    [],
    [kw('export default function'), txt(' Page() {')],
    [kw('  return'), txt(' (')],
    [txt('    <main className='), str('"mx-auto max-w-md p-6"'), txt('>')],
    [txt('      <TodoList />')],
    [txt('    </main>')],
    [txt('  )')],
    [txt('}')],
  ],
  'package.json': [
    [txt('{')],
    [txt('  '), str('"name"'), txt(': '), str('"todo-app"'), txt(',')],
    [txt('  '), str('"private"'), txt(': true,')],
    [txt('  '), str('"scripts"'), txt(': {')],
    [txt('    '), str('"dev"'), txt(': '), str('"next dev"')],
    [txt('  }')],
    [txt('}')],
  ],
  'src/lib/todos.ts': [
    [kw('export interface'), txt(' Todo {')],
    [txt('  id: number')],
    [txt('  label: string')],
    [txt('  done: boolean')],
    [txt('}')],
    [],
    [kw('export type'), txt(' Show = '), str("'all'"), txt(' | '), str("'active'"), txt(' | '), str("'done'")],
    [],
    [kw('export function'), txt(' filterBy(todos: Todo[], show: Show) {')],
    [kw('  if'), txt(' (show === '), str("'all'"), txt(')'), kw(' return'), txt(' todos')],
    [kw('  return'), txt(' todos.filter((t) => t.done === (show === '), str("'done'"), txt('))')],
    [txt('}')],
  ],
  'src/components/TodoList.tsx': [
    [str("'use client'")],
    [],
    [kw('import'), txt(' { useState } '), kw('from'), txt(' '), str("'react'")],
    [kw('import'), txt(' { AddTodo } '), kw('from'), txt(' '), str("'./AddTodo'")],
    [kw('import'), txt(' { TodoItem } '), kw('from'), txt(' '), str("'./TodoItem'")],
    [],
    [kw('export function'), txt(' TodoList() {')],
    [kw('  const'), txt(' [todos, setTodos] = useState([])')],
    [kw('  const'), txt(' [show, setShow] = useState('), str("'all'"), txt(')')],
    [kw('  const'), txt(' items = filterBy(todos, show)')],
    [],
    [kw('  return'), txt(' (')],
    [txt('    <section className='), str('"space-y-3"'), txt('>')],
    [txt('      <AddTodo onAdd={add} />')],
    [txt('      {items.map((todo) => (')],
    [txt('        <TodoItem key={todo.id} todo={todo} />')],
    [txt('      ))}')],
    [txt('    </section>')],
    [txt('  )')],
    [txt('}')],
  ],
  'src/components/TodoItem.tsx': [
    [kw('import'), txt(' { Checkbox } '), kw('from'), txt(' '), str("'@/components/ui/checkbox'")],
    [],
    [kw('export function'), txt(' TodoItem({ todo, onToggle }) {')],
    [kw('  return'), txt(' (')],
    [txt('    <li className='), str('"flex items-center gap-3"'), txt('>')],
    [txt('      <Checkbox checked={todo.done} onCheckedChange={onToggle} />')],
    [txt('      <span>{todo.label}</span>')],
    [txt('    </li>')],
    [txt('  )')],
    [txt('}')],
  ],
  'src/components/AddTodo.tsx': [
    [kw('import'), txt(' { Button } '), kw('from'), txt(' '), str("'@/components/ui/button'")],
    [],
    [kw('export function'), txt(' AddTodo({ onAdd }) {')],
    [kw('  return'), txt(' (')],
    [txt('    <form action={onAdd} className='), str('"flex gap-2"'), txt('>')],
    [txt('      <input name='), str('"label"'), txt(' placeholder='), str('"Add a todo…"'), txt(' />')],
    [txt('      <Button type='), str('"submit"'), txt('>Add</Button>')],
    [txt('    </form>')],
    [txt('  )')],
    [txt('}')],
  ],
};

/** A file's lines as plain strings, for renderers that highlight on their own. */
export function sourceText(path: string): string[] {
  return (sources[path] ?? []).map((line) => line.map((token) => token.text).join(''));
}

/** The template every project starts from, before the agents write anything. */
export const templateFiles = ['src/app/layout.tsx', 'src/app/page.tsx', 'package.json'];

/** The file the editor opens before the stream starts. */
export const firstFile = 'src/app/page.tsx';

/** The todos the generated app starts with. */
export const starterTodos = [
  { label: 'Buy oat milk', done: true },
  { label: 'Write release notes', done: false },
  { label: 'Book the dentist', done: false },
] as const;

/** The chat exchange around the build. */
export const chat = {
  prompt: 'build a todo app',
  thinking: {
    title: 'Thinking and designing',
    body: 'Our agents are thinking of solutions and designing structure for your idea.',
  },
  final: 'Your todo app is ready. Open the preview to try it, or ask for a change.',
} as const;

/** The generated app's own UI strings. */
export const app = {
  title: 'Todos',
  placeholder: 'Add a todo…',
  add: 'Add',
  filters: ['All', 'Active', 'Done'],
} as const;

/** The workspace chrome both renderers draw around the scene. */
export const chrome = {
  url: 'cocoding.app/app/37bc7619',
  openFile: 'src/components/TodoList.tsx',
  wordmark: { name: 'cocoding', suffix: '.ai' },
  watermarkPrefix: 'Built with ',
  explorer: 'Explorer',
  publish: 'Publish',
  github: 'Github',
  image: 'Image',
  send: 'Send',
  code: 'Code',
  preview: 'Preview',
  chatPlaceholder: 'Your message here...',
  connected: 'Connected',
  rail: {
    chip: 'To…',
    glyphs: [Lucide.PANEL_LEFT, Lucide.SQUARE_PLUS, Lucide.MESSAGE_SQUARE, Lucide.LAYOUT_GRID, Lucide.SETTINGS],
  },
} as const;

export type TreeKind = 'folder' | 'file';

export interface TreeEntry {
  depth: number;
  kind: TreeKind;
  name: string;
  selected?: boolean;
}

const createdFiles = buildScript.flatMap((step) =>
  step.kind === 'file' || (step.kind === 'file-group' && step.operation === Operation.CREATE)
    ? [`${step.file.path}/${step.file.name}`]
    : [],
);

/** The explorer tree grouped by folder the way the workspace lays it out. */
function buildTree(files: readonly string[], selected: string): TreeEntry[] {
  const entries: TreeEntry[] = [
    { depth: 0, kind: 'folder', name: 'Workspace' },
    { depth: 1, kind: 'folder', name: 'src' },
  ];
  const folders = Array.from(
    new Set(files.filter((file) => file.includes('/')).map((file) => file.split('/').slice(0, -1).join('/'))),
  ).sort();
  for (const folder of folders) {
    entries.push({ depth: 2, kind: 'folder', name: folder.split('/').at(-1) ?? folder });
    for (const file of files.filter((candidate) => candidate.startsWith(`${folder}/`)).sort()) {
      entries.push({ depth: 3, kind: 'file', name: file.split('/').at(-1) ?? file, selected: file === selected });
    }
  }
  for (const file of files.filter((candidate) => !candidate.includes('/')).sort()) {
    entries.push({ depth: 1, kind: 'file', name: file, selected: file === selected });
  }
  return entries;
}

/** The finished build's explorer tree, with the open file selected. */
export const tree: readonly TreeEntry[] = buildTree([...templateFiles, ...createdFiles], chrome.openFile);
