import { VizFrame } from './primitives';

interface Token {
  text: string;
  tone?: 'keyword' | 'string' | 'tag' | 'muted';
}

interface CodeBlockProps {
  x: number;
  y: number;
  lines: Token[][];
  highlight?: number;
  highlightWidth?: number;
  lineHeight?: number;
  start?: number;
}

interface TimelineProps {
  x: number;
  y: number;
  step: number;
  entries: TimelineEntry[];
}

interface TimelineEntry {
  title: string;
  detail: string;
  running?: boolean;
}

interface ChannelsProps {
  x: number;
  y: number;
}

const BG = '#101317';
const BAR = '#0b0e11';
const LINE = '#262a30';
const PANEL = '#161a20';
const PAPER = '#f4f1e8';
const FOG = '#8f939b';
const STREAM = '#8ab4ff';
const SIGNAL = '#c7f36b';
const INK = '#171815';

const TONE_FILL: Record<NonNullable<Token['tone']>, string> = {
  keyword: STREAM,
  string: SIGNAL,
  tag: '#f0c2d4',
  muted: FOG,
};

const code: Token[][] = [
  [{ text: 'import', tone: 'keyword' }, { text: ' { getSlots } ' }, { text: 'from', tone: 'keyword' }, { text: " '@/lib/db'", tone: 'string' }],
  [{ text: 'import', tone: 'keyword' }, { text: ' { Checkout } ' }, { text: 'from', tone: 'keyword' }, { text: " './checkout'", tone: 'string' }],
  [],
  [{ text: 'export default async function', tone: 'keyword' }, { text: ' Page() {' }],
  [{ text: '  const', tone: 'keyword' }, { text: ' slots = ' }, { text: 'await', tone: 'keyword' }, { text: ' getSlots()' }],
  [{ text: '  return', tone: 'keyword' }, { text: ' (' }],
  [{ text: '    <main', tone: 'tag' }, { text: ' className=' }, { text: '"booking"', tone: 'string' }, { text: '>', tone: 'tag' }],
  [{ text: '      <h1>', tone: 'tag' }, { text: 'Book a session' }, { text: '</h1>', tone: 'tag' }],
  [{ text: '      <SlotGrid', tone: 'tag' }, { text: ' slots={slots} ' }, { text: '/>', tone: 'tag' }],
  [{ text: '      <Checkout', tone: 'tag' }, { text: ' provider=' }, { text: '"stripe"', tone: 'string' }, { text: ' />', tone: 'tag' }],
  [{ text: '    </main>', tone: 'tag' }],
  [{ text: '  )' }],
  [{ text: '}' }],
];

const timeline: TimelineEntry[] = [
  { title: 'Planner', detail: 'drafted 6 tasks' },
  { title: 'create_file', detail: 'app/booking/page.tsx' },
  { title: 'edit_file', detail: 'lib/stripe.ts' },
  { title: 'run', detail: 'pnpm add stripe' },
  { title: 'create_file', detail: 'db/schema.sql' },
  { title: 'preview', detail: 'ready on :3000' },
  { title: 'Reviewer', detail: 'streaming', running: true },
];

function CodeBlock({ x, y, lines, highlight, highlightWidth = 380, lineHeight = 23, start = 1 }: CodeBlockProps) {
  return (
    <g className="v-code">
      {highlight !== undefined ? (
        <rect x={x - 16} y={y + (highlight - 1) * lineHeight - 16} width={highlightWidth} height={lineHeight} fill="rgba(138,180,255,0.1)" />
      ) : null}
      {lines.map((tokens, index) => (
        <g key={index}>
          <text x={x} y={y + index * lineHeight} fill="#4a4f57" textAnchor="end">
            {index + start}
          </text>
          <text x={x + 18} y={y + index * lineHeight} fill={PAPER} xmlSpace="preserve">
            {tokens.map((token, tokenIndex) => (
              <tspan key={tokenIndex} fill={token.tone ? TONE_FILL[token.tone] : PAPER}>
                {token.text}
              </tspan>
            ))}
          </text>
        </g>
      ))}
    </g>
  );
}

function Timeline({ x, y, step, entries }: TimelineProps) {
  return (
    <g>
      <line x1={x} y1={y - 6} x2={x} y2={y + (entries.length - 1) * step} stroke={LINE} strokeWidth="1.5" />
      {entries.map((entry, index) => {
        const cy = y + index * step;
        return (
          <g key={`${entry.title}-${index}`}>
            <circle cx={x} cy={cy} r={6} fill={entry.running ? BG : STREAM} stroke={STREAM} strokeWidth="1.5" />
            <text x={x + 22} y={cy + 5} className="v-label" fill={PAPER}>
              {entry.title}
            </text>
            <text x={x + 22} y={cy + 26} className="v-code" fill={FOG}>
              {entry.detail}
              {entry.running ? '…' : ''}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Channels({ x, y }: ChannelsProps) {
  const channels = ['chat', 'code', 'files', 'terminal'];
  let cursor = x;
  return (
    <g>
      {channels.map((channel) => {
        const width = channel.length * 8 + 30;
        const left = cursor;
        cursor += width + 8;
        return (
          <g key={channel}>
            <rect x={left} y={y} width={width} height={24} rx={4} fill={PANEL} stroke={LINE} />
            <circle cx={left + 12} cy={y + 12} r={3.5} fill={STREAM} />
            <text x={left + 22} y={y + 16} className="v-kicker" fill={PAPER}>
              {channel}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Wide() {
  return (
    <>
      <rect x={8} y={8} width={1184} height={744} rx={12} fill={BG} stroke={LINE} />
      <rect x={8} y={8} width={1184} height={40} rx={12} fill={BAR} />
      <rect x={8} y={30} width={1184} height={18} fill={BAR} />
      <text x={28} y={33} className="v-kicker" fill={FOG}>
        booking-app
      </text>
      <Channels x={850} y={16} />

      {/* Chat and agent timeline */}
      <line x1={336} y1={48} x2={336} y2={752} stroke={LINE} />
      <text x={28} y={84} className="v-label" fill={PAPER}>
        Chat
      </text>
      <rect x={28} y={102} width={288} height={70} rx={8} fill={PANEL} />
      <text x={44} y={130} className="v-body" fill={PAPER}>
        Build a booking app with
      </text>
      <text x={44} y={152} className="v-body" fill={PAPER}>
        Stripe checkout and an admin.
      </text>
      <Timeline x={44} y={210} step={58} entries={timeline} />
      <rect x={28} y={680} width={288} height={48} rx={8} fill="none" stroke={LINE} />
      <text x={44} y={709} className="v-body" fill={FOG}>
        Ask for a change…
      </text>

      {/* File explorer */}
      <line x1={520} y1={48} x2={520} y2={752} stroke={LINE} />
      <text x={352} y={84} className="v-kicker" fill={FOG}>
        files
      </text>
      <g className="v-code">
        <text x={352} y={116} fill={FOG}>app/</text>
        <text x={368} y={144} fill={FOG}>booking/</text>
        <rect x={337} y={156} width={182} height={26} fill={PANEL} />
        <rect x={337} y={156} width={3} height={26} fill={STREAM} />
        <text x={384} y={173} fill={PAPER}>page.tsx</text>
        <text x={384} y={200} fill={FOG}>checkout.tsx</text>
        <text x={352} y={228} fill={FOG}>lib/</text>
        <text x={368} y={256} fill={PAPER}>stripe.ts</text>
        <circle cx={500} cy={252} r={3.5} fill={STREAM} />
        <text x={352} y={284} fill={FOG}>db/</text>
        <text x={368} y={312} fill={PAPER}>schema.sql</text>
        <text x={500} y={312} fill={SIGNAL} textAnchor="end">A</text>
        <text x={352} y={340} fill={FOG}>package.json</text>
      </g>

      {/* Editor */}
      <rect x={520} y={48} width={380} height={36} fill={BAR} />
      <rect x={520} y={48} width={112} height={36} fill={BG} />
      <text x={538} y={71} className="v-code" fill={PAPER}>
        page.tsx
      </text>
      <text x={650} y={71} className="v-code" fill={FOG}>
        stripe.ts
      </text>
      <CodeBlock x={552} y={116} lines={code} highlight={10} />
      <rect x={838} y={308} width={8} height={18} fill={STREAM} />

      {/* Terminal attached to the container */}
      <line x1={520} y1={470} x2={900} y2={470} stroke={LINE} />
      <rect x={520} y={470} width={380} height={34} fill={BAR} />
      <text x={538} y={492} className="v-code" fill={PAPER}>
        terminal 1
      </text>
      <text x={640} y={492} className="v-code" fill={FOG}>
        terminal 2
      </text>
      <g className="v-code">
        <text x={538} y={534} fill={PAPER}>$ pnpm add stripe</text>
        <text x={538} y={558} fill={FOG}>+ stripe</text>
        <text x={538} y={582} fill={PAPER}>$ pnpm dev</text>
        <text x={538} y={606} fill={SIGNAL}>ready on localhost:3000</text>
        <text x={538} y={630} fill={FOG}>GET /booking 200</text>
        <text x={538} y={654} fill={PAPER}>$</text>
      </g>
      <rect x={556} y={640} width={8} height={18} fill={PAPER} opacity={0.8} />

      {/* Live preview of the generated app */}
      <line x1={900} y1={48} x2={900} y2={752} stroke={LINE} />
      <rect x={914} y={56} width={264} height={24} rx={5} fill={PANEL} />
      <text x={928} y={73} className="v-kicker" fill={FOG}>
        localhost:3000/booking
      </text>
      <rect x={900} y={88} width={292} height={652} fill={PAPER} />
      <rect x={1180} y={88} width={12} height={652} fill={PAPER} />
      <text x={924} y={136} className="v-display" fill={INK}>
        Book a session
      </text>
      <text x={924} y={162} className="v-body" fill="#5c5b54">
        Choose a time that works.
      </text>
      {['Mon 12', 'Tue 13', 'Wed 14'].map((day, index) => (
        <g key={day}>
          <rect x={924 + index * 84} y={186} width={76} height={36} rx={5} fill={index === 2 ? INK : 'none'} stroke={INK} />
          <text x={962 + index * 84} y={209} textAnchor="middle" className="v-label" fill={index === 2 ? PAPER : INK}>
            {day}
          </text>
        </g>
      ))}
      {['09:00', '10:30', '13:00', '14:30', '16:00', '17:30'].map((time, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        const selected = index === 3;
        return (
          <g key={time}>
            <rect x={924 + column * 126} y={246 + row * 56} width={118} height={44} rx={5} fill={selected ? SIGNAL : '#fbfaf6'} stroke={INK} />
            <text x={983 + column * 126} y={274 + row * 56} textAnchor="middle" className="v-label" fill={INK}>
              {time}
            </text>
          </g>
        );
      })}
      <rect x={924} y={432} width={244} height={46} rx={5} fill={INK} />
      <text x={1046} y={461} textAnchor="middle" className="v-label" fill={PAPER}>
        Continue to checkout
      </text>
      <line x1={924} y1={512} x2={1168} y2={512} stroke="rgba(23,24,21,0.15)" />
      <text x={924} y={544} className="v-kicker" fill="#5c5b54">
        rendered from page.tsx
      </text>
      <text x={924} y={568} className="v-kicker" fill="#5c5b54">
        live via the files channel
      </text>
    </>
  );
}

function Narrow() {
  return (
    <>
      <rect x={8} y={8} width={584} height={744} rx={12} fill={BG} stroke={LINE} />
      <rect x={8} y={8} width={584} height={44} rx={12} fill={BAR} />
      <rect x={8} y={30} width={584} height={22} fill={BAR} />
      <Channels x={26} y={18} />
      <text x={28} y={92} className="v-label" fill={PAPER}>
        Chat
      </text>
      <rect x={28} y={106} width={544} height={46} rx={8} fill={PANEL} />
      <text x={44} y={135} className="v-body" fill={PAPER}>
        Build a booking app with Stripe checkout.
      </text>
      <Timeline x={44} y={190} step={52} entries={[timeline[1], timeline[3], timeline[5], timeline[6]]} />
      <line x1={8} y1={380} x2={592} y2={380} stroke={LINE} />
      <rect x={8} y={380} width={584} height={36} fill={BAR} />
      <text x={28} y={403} className="v-code" fill={PAPER}>
        page.tsx
      </text>
      <CodeBlock x={58} y={446} lines={code.slice(3, 11)} highlight={7} highlightWidth={550} lineHeight={25} start={4} />
      <line x1={8} y1={640} x2={592} y2={640} stroke={LINE} />
      <g className="v-code">
        <text x={28} y={672} fill={PAPER}>$ pnpm dev</text>
        <text x={28} y={698} fill={SIGNAL}>ready on localhost:3000</text>
        <text x={28} y={724} fill={FOG}>GET /booking 200</text>
      </g>
    </>
  );
}

export function CocodingVisual() {
  return (
    <VizFrame
      label="Reconstruction of the cocoding.ai workspace: a chat with a live timeline of agent tool calls, a file explorer, a code editor writing page.tsx, a terminal running the dev server, and a live preview of the generated booking app."
      wide={<Wide />}
      narrow={<Narrow />}
    />
  );
}
