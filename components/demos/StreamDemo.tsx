'use client';

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import type { EditorGlyph } from '../visuals/editor-icons';
import { Lucide } from '../visuals/lucide-icons';
import { DemoFrame } from './DemoFrame';

/**
 * A scripted build streamed into a small cocoding.ai workspace, rebuilt after
 * the frontend's main branch: the chat renders agent blocks with their file and
 * Bash groups as they arrive over SSE, and the empty preview animates the step
 * in progress. Dropping the connection takes the four WebSocket channels down;
 * they retry, then resync the file tree and terminal, while SSE keeps going.
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

const Channel = {
  CHAT: 'chat',
  CODE: 'code',
  FILES: 'files',
  TERMINAL: 'terminal',
} as const;
type Channel = (typeof Channel)[keyof typeof Channel];

const Operation = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
} as const;
type Operation = (typeof Operation)[keyof typeof Operation];

const RunStatus = {
  IDLE: 'idle',
  STREAMING: 'streaming',
  DONE: 'done',
} as const;
type RunStatus = (typeof RunStatus)[keyof typeof RunStatus];

const SocketStatus = {
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
} as const;
type SocketStatus = (typeof SocketStatus)[keyof typeof SocketStatus];

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

interface LogLine {
  id: number;
  text: string;
}

interface ChannelPulse {
  channel: Channel;
  tick: number;
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

interface ChatTranscriptProps {
  transcript: Transcript;
  streaming: boolean;
}

const STEP_INTERVAL = 1300;
const RETRY_DELAY = 700;
const MAX_ATTEMPTS = 5;
const SUCCEEDS_ON = 2;
const channels = Object.values(Channel);

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

/** Which WebSocket channel carries a step's side effects in the live app. */
const STEP_CHANNEL: Record<Step['kind'], Channel> = {
  thinking: Channel.CHAT,
  agent: Channel.CHAT,
  'file-group': Channel.FILES,
  file: Channel.FILES,
  command: Channel.TERMINAL,
  final: Channel.CODE,
};

const OPERATION_GLYPH: Record<Operation, EditorGlyph> = {
  [Operation.READ]: Lucide.EYE,
  [Operation.CREATE]: Lucide.FILE_PLUS,
  [Operation.UPDATE]: Lucide.FILE_PEN,
};

/** How the "Now" panel names the animation on screen. */
const SCENE_LABEL: Record<Scene, string> = {
  [Scene.ORBITAL]: 'orbital, while agents think or hand off',
  [Scene.FILE_GRID]: 'file grid, while files are read',
  [Scene.CODE_EDITOR]: 'code window typing the file',
  [Scene.WIREFRAME]: 'wireframe of the component or page',
  [Scene.TERMINAL]: 'terminal running the command',
  [Scene.COMPLETION]: 'completion check',
};

const GRID_FILES = ['page.tsx', 'layout.tsx', 'globals.css', 'TodoList.tsx', 'todos.ts', 'package.json'];
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const EMPTY: Transcript = { thinking: false, agents: [], final: false };

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
                {file}
              </li>
            ))}
          </ul>
        </Window>
      );
    case Scene.CODE_EDITOR:
      return (
        <Window title={activity.subject}>
          <div className="cw-code" aria-hidden="true">
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

function ChatTranscript({ transcript, streaming }: ChatTranscriptProps) {
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
                        <li key={file.name} className="cw-file">
                          <span className="cw-react" aria-hidden="true" />
                          {file.name}
                          <span className="cw-path">{file.path}</span>
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
      {transcript.final ? <p className="cw-final">Your todo app is ready. Open the preview to try it.</p> : null}
    </>
  );
}

export default function StreamDemo() {
  const [run, setRun] = useState<RunStatus>(RunStatus.IDLE);
  const [socket, setSocket] = useState<SocketStatus>(SocketStatus.CONNECTED);
  const [attempt, setAttempt] = useState(0);
  const [transcript, setTranscript] = useState<Transcript>(EMPTY);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [pulse, setPulse] = useState<ChannelPulse | null>(null);
  const [log, setLog] = useState<LogLine[]>([]);
  const cursor = useRef(0);
  const chatRef = useRef<HTMLDivElement>(null);

  // SSE: one step per tick, whatever the WebSocket channels are doing.
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
      setTranscript((current) => applyStep(current, step));
      setActivity(step.activity);
      setPulse({ channel: STEP_CHANNEL[step.kind], tick: index });
      if (index + 1 === script.length) setRun(RunStatus.DONE);
    }, STEP_INTERVAL);
    return () => window.clearInterval(timer);
  }, [run]);

  // WebSockets: steady retries, then the server resyncs the tree and terminal.
  useEffect(() => {
    if (socket !== SocketStatus.RECONNECTING) return;
    const timer = window.setTimeout(() => {
      if (attempt >= SUCCEEDS_ON) {
        setSocket(SocketStatus.CONNECTED);
        setLog((current) => [
          ...current,
          { id: current.length + 1, text: `Reconnected on attempt ${attempt} of ${MAX_ATTEMPTS}.` },
          { id: current.length + 2, text: 'files: file_list resynced the file tree.' },
          { id: current.length + 3, text: 'terminal: history restored the terminal output.' },
        ]);
        return;
      }
      setAttempt((value) => value + 1);
    }, RETRY_DELAY);
    return () => window.clearTimeout(timer);
  }, [socket, attempt]);

  // Follow the stream, as the chat does.
  useEffect(() => {
    const chat = chatRef.current;
    if (chat) chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
  }, [transcript]);

  const start = () => {
    cursor.current = 0;
    setTranscript(EMPTY);
    setActivity(null);
    setPulse(null);
    setLog([]);
    setSocket(SocketStatus.CONNECTED);
    setAttempt(0);
    setRun(RunStatus.STREAMING);
  };

  const drop = () => {
    setAttempt(1);
    setSocket(SocketStatus.RECONNECTING);
    setLog((current) => [...current, { id: current.length + 1, text: 'WebSockets dropped. The SSE timeline keeps streaming.' }]);
  };

  const offline = socket === SocketStatus.RECONNECTING;
  const streaming = run === RunStatus.STREAMING;
  const status = offline
    ? `Reconnecting, attempt ${attempt} of ${MAX_ATTEMPTS}`
    : streaming
      ? 'Streaming'
      : run === RunStatus.DONE
        ? 'Stream complete'
        : 'Idle';

  return (
    <DemoFrame
      title="Try the stream"
      instructions="Run the prompt and watch a build stream into the workspace: agent blocks with their file and Bash groups in the chat, and the preview animating each step. Drop the connection mid-build to see the WebSocket channels retry while the SSE timeline keeps going."
      note="A simulation for this portfolio, rebuilt after cocoding.ai’s main branch. The block types, messages, preview states, the 5-attempt cap, and the file_list and history resync mirror the app; the events are scripted and the drop is fake."
    >
      <div className="cw">
        <div className="cw-canvas" data-theme="dark">
          <div className="cw-toolbar-pill">
            <button type="button" className="cw-run" onClick={start} disabled={streaming}>
              <Icon glyph={Lucide.SEND} className="cw-icon" />
              {run === RunStatus.IDLE ? 'Run prompt' : 'Run again'}
            </button>
            <span className="cw-run-hint" data-state={offline ? 'offline' : run}>
              {status}
            </span>
          </div>

          <div className="cw-workspace">
            <section className="cw-chat" aria-label="Chat">
              <div className="cw-chat-scroll" ref={chatRef}>
                <p className="cw-wordmark">
                  cocoding<span>.ai</span>
                </p>
                <p className="cw-bubble">build a todo app</p>
                {run === RunStatus.IDLE ? <p className="cw-muted cw-hint">Run the prompt to start the build.</p> : null}
                <ChatTranscript transcript={transcript} streaming={streaming} />
              </div>
              <div className="cw-input" aria-hidden="true">
                <span className="cw-muted">Your message here...</span>
                <span className="cw-input-row">
                  <span className="cw-ghost">
                    <Icon glyph={Lucide.IMAGE_PLUS} className="cw-icon" /> Image
                  </span>
                  <span className="cw-send">
                    <Icon glyph={Lucide.SEND} className="cw-icon" /> Send
                  </span>
                </span>
              </div>
            </section>

            <section className="cw-preview" aria-label="Preview">
              <div className="cw-toolbar" aria-hidden="true">
                <span className="cw-toggle">
                  <span>
                    <Icon glyph={Lucide.CODE} className="cw-icon" /> Code
                  </span>
                  <span data-active>
                    <Icon glyph={Lucide.EYE} className="cw-icon" /> Preview
                  </span>
                </span>
                <span className="cw-publish">
                  <Icon glyph={Lucide.GLOBE} className="cw-icon" /> Publish
                </span>
              </div>
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
                <p className={streaming ? 'cw-message cw-shimmer' : 'cw-message'} aria-live="polite">
                  {activity?.message ?? 'Tell cocoding.ai what you want to build'}
                </p>
              </div>
            </section>
          </div>
        </div>

        <div className="cw-panel">
          <div className="cw-connections">
            <p className="type-small font-[600]">Connections</p>
            <ul aria-label="Connections">
              <li data-state={streaming ? 'live' : undefined}>
                <span>SSE</span>
                <span className="type-mono">agent timeline</span>
              </li>
              {channels.map((channel) => (
                <li
                  key={`${channel}-${pulse?.channel === channel ? pulse.tick : 'idle'}`}
                  data-state={offline ? 'offline' : pulse?.channel === channel && streaming ? 'pulse' : undefined}
                >
                  <span>{channel}</span>
                  <span className="type-mono">{offline ? 'retrying' : 'WebSocket'}</span>
                </li>
              ))}
            </ul>
            <button type="button" className="demo-button" onClick={drop} disabled={!streaming || offline}>
              Drop the connection
            </button>
          </div>

          <dl className="cw-now" aria-live="polite">
            <div>
              <dt>Status</dt>
              <dd>{status}</dd>
            </div>
            <div>
              <dt>Preview</dt>
              <dd>{activity ? SCENE_LABEL[activity.scene] : 'cocoding.ai logo'}</dd>
            </div>
            <div>
              <dt>Message</dt>
              <dd>{activity?.message ?? '—'}</dd>
            </div>
          </dl>

          <div className="cw-log-card">
            <p className="type-mono text-graphite">connection log</p>
            {log.length > 0 ? (
              <ol aria-label="Connection log">
                {log.map((line) => (
                  <li key={line.id}>{line.text}</li>
                ))}
              </ol>
            ) : (
              <p className="type-small text-graphite">Nothing dropped yet. Drop the connection mid-build to see the retry.</p>
            )}
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}
