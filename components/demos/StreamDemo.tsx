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
  replayed: boolean;
}

const script: StreamEvent[] = [
  { channel: Channel.CHAT, label: 'Planner', detail: 'Drafted 5 tasks for a booking app' },
  { channel: Channel.CODE, label: 'create_file', detail: 'app/booking/page.tsx' },
  { channel: Channel.FILES, label: 'tree', detail: '+ app/booking/page.tsx' },
  { channel: Channel.CODE, label: 'edit_file', detail: 'lib/stripe.ts' },
  { channel: Channel.TERMINAL, label: 'run', detail: 'pnpm add stripe' },
  { channel: Channel.TERMINAL, label: 'stdout', detail: 'added 1 package' },
  { channel: Channel.CODE, label: 'create_file', detail: 'db/schema.sql' },
  { channel: Channel.FILES, label: 'tree', detail: '+ db/schema.sql' },
  { channel: Channel.TERMINAL, label: 'run', detail: 'pnpm dev' },
  { channel: Channel.CHAT, label: 'Reviewer', detail: 'Checked types and routes' },
  { channel: Channel.CHAT, label: 'Done', detail: 'Preview is ready' },
];

const EVENT_INTERVAL = 600;
const MAX_ATTEMPTS = 5;
const channels = Object.values(Channel);

export default function StreamDemo() {
  const [status, setStatus] = useState<Status>(Status.IDLE);
  const [received, setReceived] = useState<ReceivedEvent[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [lastChannel, setLastChannel] = useState<ChannelPulse | null>(null);
  const cursor = useRef(0);
  const [droppedAt, setDroppedAt] = useState<number | null>(null);

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
      const replayed = droppedAt !== null && index < droppedAt + 2;
      setReceived((current) => [...current, { ...event, seq: index + 1, replayed }]);
      setLastChannel({ channel: event.channel, tick: index });
      if (index + 1 === script.length) setStatus(Status.DONE);
    }, EVENT_INTERVAL);
    return () => window.clearInterval(timer);
  }, [status, droppedAt]);

  // Reconnect with growing delays, then resume from the last acknowledged event.
  useEffect(() => {
    if (status !== Status.RECONNECTING) return;
    const succeedsOn = 2;
    const timer = window.setTimeout(
      () => {
        if (attempt >= succeedsOn) {
          setStatus(Status.STREAMING);
          return;
        }
        setAttempt((value) => value + 1);
      },
      400 * 2 ** attempt,
    );
    return () => window.clearTimeout(timer);
  }, [status, attempt]);

  const run = () => {
    cursor.current = 0;
    setDroppedAt(null);
    setReceived([]);
    setAttempt(0);
    setStatus(Status.STREAMING);
  };

  const drop = () => {
    setDroppedAt(cursor.current);
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
    status === Status.DONE && droppedAt !== null
      ? `Stream complete. Resumed after event ${droppedAt} with nothing lost.`
      : status === Status.DONE
        ? 'Stream complete. All 11 events arrived in order.'
        : status === Status.RECONNECTING
          ? 'Connection dropped. Retrying with backoff; events are held until it returns.'
          : '';

  return (
    <DemoFrame
      title="Try the stream"
      instructions="Run a prompt to stream agent events across the four real-time channels. Drop the connection mid-stream to see it reconnect with backoff and resume without losing events."
      note="A simulation for this portfolio: events are scripted and the network drop is fake. The behaviours (channels, capped auto-reconnect, resume) mirror the WebSocket layer described above."
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
          <p>Build a booking app with Stripe checkout and an admin.</p>
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
                {event.replayed ? <span className="sd-resumed type-mono">after reconnect</span> : null}
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
