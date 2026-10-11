'use client';

import { useEffect, useRef, useState } from 'react';
import { DemoFrame } from './DemoFrame';

const Channel = {
  CHAT: 'chat',
  CODE: 'code',
  FILES: 'files',
  TERMINAL: 'terminal',
} as const;
type Channel = (typeof Channel)[keyof typeof Channel];

const Status = {
  IDLE: 'idle',
  STREAMING: 'streaming',
  RECONNECTING: 'reconnecting',
  DONE: 'done',
} as const;
type Status = (typeof Status)[keyof typeof Status];

interface StreamEvent {
  channel: Channel;
  label: string;
  detail: string;
}

interface ChannelPulse {
  channel: Channel;
  tick: number;
}

interface ReceivedEvent extends StreamEvent {
  seq: number;
  resynced: boolean;
}

/** One build, as the four channels report it, using the app's own message types. */
const script: StreamEvent[] = [
  { channel: Channel.CHAT, label: 'chat_message', detail: 'build a todo app' },
  { channel: Channel.CODE, label: 'generation_started', detail: 'todo-app' },
  { channel: Channel.CODE, label: 'file_generated', detail: 'src/components/TodoList.tsx' },
  { channel: Channel.FILES, label: 'explorer_created', detail: 'src/components/TodoList.tsx' },
  { channel: Channel.CODE, label: 'file_generated', detail: 'src/components/AddTodo.tsx' },
  { channel: Channel.FILES, label: 'explorer_created', detail: 'src/components/AddTodo.tsx' },
  { channel: Channel.TERMINAL, label: 'shell_command', detail: 'npm install' },
  { channel: Channel.TERMINAL, label: 'shell_output', detail: 'dependencies installed' },
  { channel: Channel.TERMINAL, label: 'shell_command', detail: 'npm run dev' },
  { channel: Channel.CODE, label: 'generation_completed', detail: 'todo-app' },
  { channel: Channel.CHAT, label: 'streaming_chunk', detail: 'Your todo app is ready.' },
];

/** What the server sends back once a dropped channel reconnects. */
const resync: StreamEvent[] = [
  { channel: Channel.FILES, label: 'file_list', detail: 'file tree resynced' },
  { channel: Channel.TERMINAL, label: 'history', detail: 'terminal output restored' },
];

const EVENT_INTERVAL = 600;
/** Retries come at a steady pace, not a growing backoff, and stop after 5. */
const RETRY_DELAY = 700;
const MAX_ATTEMPTS = 5;
const SUCCEEDS_ON = 2;
const channels = Object.values(Channel);

export default function StreamDemo() {
  const [status, setStatus] = useState<Status>(Status.IDLE);
  const [received, setReceived] = useState<ReceivedEvent[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [lastChannel, setLastChannel] = useState<ChannelPulse | null>(null);
  const cursor = useRef(0);
  const [dropped, setDropped] = useState(false);

  // Stream one event per tick while connected.
  useEffect(() => {
    if (status !== Status.STREAMING) return;
    const timer = window.setInterval(() => {
      const index = cursor.current;
      const event = script[index];
      if (!event) {
        setStatus(Status.DONE);
        return;
      }
      cursor.current = index + 1;
      setReceived((current) => [...current, { ...event, seq: current.length + 1, resynced: false }]);
      setLastChannel({ channel: event.channel, tick: index });
      if (index + 1 === script.length) setStatus(Status.DONE);
    }, EVENT_INTERVAL);
    return () => window.clearInterval(timer);
  }, [status]);

  // Retry at a steady pace; once connected, the server resyncs files and terminal.
  useEffect(() => {
    if (status !== Status.RECONNECTING) return;
    const timer = window.setTimeout(() => {
      if (attempt >= SUCCEEDS_ON) {
        setReceived((current) => [
          ...current,
          ...resync.map((event, index) => ({ ...event, seq: current.length + index + 1, resynced: true })),
        ]);
        setLastChannel({ channel: Channel.FILES, tick: -attempt });
        setStatus(Status.STREAMING);
        return;
      }
      setAttempt((value) => value + 1);
    }, RETRY_DELAY);
    return () => window.clearTimeout(timer);
  }, [status, attempt]);

  const run = () => {
    cursor.current = 0;
    setDropped(false);
    setReceived([]);
    setAttempt(0);
    setStatus(Status.STREAMING);
  };

  const drop = () => {
    setDropped(true);
    setAttempt(1);
    setStatus(Status.RECONNECTING);
  };

  const statusLabel: Record<Status, string> = {
    [Status.IDLE]: 'Idle',
    [Status.STREAMING]: 'Connected',
    [Status.RECONNECTING]: `Reconnecting, attempt ${attempt} of ${MAX_ATTEMPTS}`,
    [Status.DONE]: 'Connected, stream complete',
  };

  const summary =
    status === Status.DONE && dropped
      ? `Stream complete. Reconnected on attempt ${attempt}, and file_list and history brought the file tree and terminal back.`
      : status === Status.DONE
        ? `Stream complete. All ${script.length} events arrived in order.`
        : status === Status.RECONNECTING
          ? `Connection dropped. Retrying at a steady pace, up to ${MAX_ATTEMPTS} attempts.`
          : '';

  return (
    <DemoFrame
      title="Try the stream"
      instructions="Run the prompt to stream a build across the four WebSocket channels. Drop the connection mid-stream to watch it retry, up to 5 attempts, and resync the file tree and terminal once it’s back."
      note="A simulation for this portfolio: events are scripted and the drop is fake. The message types, the 5-attempt cap, and the file_list and history resync mirror the real WebSocket layer. The agent timeline itself streams over SSE."
    >
      <div className="sd-layout" data-theme="dark">
        <div className="sd-toolbar">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="demo-button demo-button-strong"
              onClick={run}
              disabled={status === Status.STREAMING || status === Status.RECONNECTING}
            >
              {status === Status.IDLE ? 'Run prompt' : 'Run again'}
            </button>
            <button type="button" className="demo-button" onClick={drop} disabled={status !== Status.STREAMING}>
              Drop the connection
            </button>
          </div>
          <p className="sd-status" data-status={status}>
            <span className="sd-status-dot" aria-hidden="true" />
            {statusLabel[status]}
          </p>
        </div>

        <ul className="sd-channels" aria-label="Channels">
          {channels.map((channel) => (
            <li
              key={`${channel}-${lastChannel?.channel === channel ? lastChannel.tick : 'idle'}`}
              className="sd-channel"
              data-active={lastChannel?.channel === channel || undefined}
              data-offline={status === Status.RECONNECTING || undefined}
            >
              <span className="sd-channel-dot" aria-hidden="true" />
              {channel}
            </li>
          ))}
        </ul>

        <div className="sd-prompt">
          <span className="type-mono text-fog">prompt</span>
          <p>build a todo app</p>
        </div>

        <ol className="sd-timeline" aria-label="Agent events">
          {received.length === 0 ? (
            <li className="sd-empty">Nothing streamed yet. Run the prompt to start.</li>
          ) : (
            received.map((event) => (
              <li key={`${event.seq}-${event.label}`} className="sd-event" data-channel={event.channel}>
                <span className="sd-seq type-mono">{String(event.seq).padStart(2, '0')}</span>
                <span className="sd-tag type-mono">{event.channel}</span>
                <span className="sd-label">{event.label}</span>
                <span className="sd-detail type-mono">{event.detail}</span>
                {event.resynced ? <span className="sd-resumed type-mono">after reconnect</span> : null}
              </li>
            ))
          )}
        </ol>
        <p className="type-small sd-summary" aria-live="polite">
          {summary}
        </p>
      </div>
    </DemoFrame>
  );
}
