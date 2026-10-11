import { Dots, type Pt, VizFrame } from './primitives';
import { VaseArt } from './VaseArt';

/**
 * Four more nodes from the same canvas, reconstructed after the live product:
 * Creative Analyzer, Combine Audio & Video, Ad Maker, and Storyboard. Ports
 * keep the editor's type colours: text blue, image amber, video green, audio pink.
 */

const PortType = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
} as const;
type PortType = (typeof PortType)[keyof typeof PortType];

interface CardProps extends Pt {
  w: number;
  h: number;
  name: string;
}

interface PortLabelProps extends Pt {
  type: PortType;
  label?: string;
  side: 'in' | 'out';
}

interface RingProps extends Pt {
  r: number;
  value: number;
  label?: string;
}

interface ChipProps extends Pt {
  label: string;
  active?: boolean;
}

interface CellSize {
  w: number;
  h: number;
}

interface WaveformProps extends Pt {
  w: number;
  h: number;
}

const CANVAS = '#0f0f0f';
const NODE = '#1b1b1a';
const STROKE = '#30302c';
const PAPER = '#f4f1e8';
const FOG = '#a9a79c';
const INK = '#171815';

const TYPE_COLOR: Record<PortType, string> = {
  [PortType.TEXT]: '#8ab4ff',
  [PortType.IMAGE]: '#e6a03a',
  [PortType.VIDEO]: '#94cc7a',
  [PortType.AUDIO]: '#e9499f',
};

/** Score zones as the node shows them: below 33 weak, 33–66 mixed, above 66 strong. */
function zoneColor(value: number): string {
  if (value < 33) return '#f87171';
  if (value <= 66) return '#facc15';
  return '#4ade80';
}

function Card({ x, y, w, h, name }: CardProps) {
  return (
    <g>
      <text x={x + 2} y={y - 9} className="v-small" fill={PAPER}>
        {name}
      </text>
      <rect x={x} y={y} width={w} height={h} rx={14} fill={NODE} stroke={STROKE} />
    </g>
  );
}

function PortLabel({ x, y, type, label, side }: PortLabelProps) {
  return (
    <g>
      <circle cx={x} cy={y} r={5.5} fill={side === 'out' ? TYPE_COLOR[type] : CANVAS} stroke={TYPE_COLOR[type]} strokeWidth="2" />
      {label ? (
        <text x={side === 'in' ? x - 10 : x + 10} y={y + 4} textAnchor={side === 'in' ? 'end' : 'start'} className="v-kicker" fill={TYPE_COLOR[type]}>
          {label}
        </text>
      ) : null}
    </g>
  );
}

function Ring({ x, y, r, value, label }: RingProps) {
  const circumference = 2 * Math.PI * r;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="none" stroke="#2c2c29" strokeWidth={r > 24 ? 6 : 4} />
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="none"
        stroke={zoneColor(value)}
        strokeWidth={r > 24 ? 6 : 4}
        strokeLinecap="round"
        strokeDasharray={`${(circumference * value) / 100} ${circumference}`}
        transform={`rotate(-90 ${x} ${y})`}
      />
      <text x={x} y={y + (r > 24 ? 7 : 4)} textAnchor="middle" className={r > 24 ? 'v-title' : 'v-kicker'} fill={PAPER}>
        {value}
      </text>
      {label ? (
        <text x={x} y={y + r + 18} textAnchor="middle" className="v-kicker" fill={FOG}>
          {label}
        </text>
      ) : null}
    </g>
  );
}

function Chip({ x, y, label, active }: ChipProps) {
  const width = label.length * 8 + 26;
  return (
    <g>
      <rect x={x} y={y} width={width} height={24} rx={12} fill={active ? '#22163d' : '#262624'} stroke={active ? '#9b6dff' : STROKE} />
      <text x={x + 13} y={y + 16} className="v-kicker" fill={PAPER}>
        {label}
      </text>
    </g>
  );
}

function Waveform({ x, y, w, h }: WaveformProps) {
  const bars = Math.floor(w / 5);
  return (
    <g>
      {Array.from({ length: bars }, (_, index) => {
        const amplitude = (Math.sin(index * 0.7) * 0.5 + 0.5) * (Math.cos(index * 0.23) * 0.3 + 0.7);
        const barH = Math.max(3, amplitude * h);
        return <rect key={index} x={x + index * 5} y={y + (h - barH) / 2} width={2.5} height={barH} rx={1} fill={TYPE_COLOR[PortType.AUDIO]} opacity={0.85} />;
      })}
    </g>
  );
}

/** Creative Analyzer: a creative in, an ad-effectiveness read out. */
function CreativeAnalyzer({ x, y }: Pt) {
  const ax = x + 150;
  const score = 71;
  const barX = ax + 24;
  const barW = 182;
  return (
    <g>
      <Card x={x} y={y + 70} w={110} h={150} name="Import" />
      <VaseArt x={x + 8} y={y + 78} w={94} h={110} />
      <text x={x + 12} y={y + 208} className="v-kicker" fill={FOG}>
        + Add more
      </text>
      <path d={`M${x + 110} ${y + 140}C${x + 130} ${y + 140} ${x + 128} ${y + 60} ${ax} ${y + 60}`} fill="none" stroke={TYPE_COLOR[PortType.IMAGE]} strokeWidth="2" />
      <PortLabel x={x + 110} y={y + 140} type={PortType.IMAGE} side="out" />

      <Card x={ax} y={y + 20} w={230} h={300} name="Creative Analyzer" />
      <PortLabel x={ax} y={y + 60} type={PortType.IMAGE} side="in" />
      <text x={ax + 115} y={y + 44} textAnchor="middle" className="v-kicker" fill={FOG}>
        ACE score
      </text>
      <Ring x={ax + 115} y={y + 88} r={30} value={score} />
      <rect x={barX} y={y + 134} width={barW * 0.33} height={5} rx={2.5} fill="#f87171" />
      <rect x={barX + barW * 0.33} y={y + 134} width={barW * 0.34} height={5} fill="#facc15" />
      <rect x={barX + barW * 0.67} y={y + 134} width={barW * 0.33} height={5} rx={2.5} fill="#4ade80" />
      <rect x={barX + (barW * score) / 100 - 2} y={y + 128} width={4} height={17} rx={2} fill={PAPER} />
      <text x={barX} y={y + 160} className="v-kicker" fill="#f87171">
        &lt; 33
      </text>
      <text x={barX + barW / 2} y={y + 160} textAnchor="middle" className="v-kicker" fill="#facc15">
        33–66
      </text>
      <text x={barX + barW} y={y + 160} textAnchor="end" className="v-kicker" fill="#4ade80">
        &gt; 66
      </text>
      <rect x={ax + 50} y={y + 172} width={130} height={26} rx={13} fill="#262624" />
      <text x={ax + 115} y={y + 189} textAnchor="middle" className="v-kicker" fill={PAPER}>
        Detailed report
      </text>
      <text x={ax + 16} y={y + 224} className="v-kicker" fill={FOG}>
        Choose app
      </text>
      <rect x={ax + 16} y={y + 232} width={198} height={30} rx={8} fill="#232321" stroke={STROKE} />
      <text x={ax + 28} y={y + 252} className="v-kicker" fill={PAPER}>
        Social media post ▾
      </text>
      <rect x={ax + 128} y={y + 278} width={86} height={28} rx={14} fill={PAPER} />
      <text x={ax + 171} y={y + 296} textAnchor="middle" className="v-kicker" fill={INK}>
        Rerun test
      </text>

      <rect x={x + 400} y={y + 20} width={160} height={300} rx={14} fill="#141413" stroke={STROKE} />
      <Ring x={x + 440} y={y + 70} r={18} value={74} label="Attention" />
      <Ring x={x + 520} y={y + 70} r={18} value={68} label="Branding" />
      <Ring x={x + 440} y={y + 160} r={18} value={81} label="Ease" />
      <Ring x={x + 520} y={y + 160} r={18} value={58} label="Emotion" />
      <text x={x + 416} y={y + 250} className="v-kicker" fill={FOG}>
        Export report
      </text>
      <Chip x={x + 412} y={y + 262} label="PDF" />
      <Chip x={x + 466} y={y + 262} label="XLSX" />
      <Chip x={x + 412} y={y + 290} label="CSV" />
    </g>
  );
}

/** Combine Audio & Video: a multi-track timeline inside the node. */
function CombineAudioVideo({ x, y }: Pt) {
  const nx = x + 70;
  const nw = 470;
  const laneX = nx + 16;
  const pps = 14.6;
  return (
    <g>
      <Card x={nx} y={y + 20} w={nw} h={300} name="Combine Audio & Video" />
      <PortLabel x={nx} y={y + 54} type={PortType.VIDEO} label="Video" side="in" />
      <PortLabel x={nx} y={y + 82} type={PortType.AUDIO} label="Audio" side="in" />
      <PortLabel x={nx + nw} y={y + 54} type={PortType.VIDEO} side="out" />
      <VaseArt x={nx + 14} y={y + 34} w={nw - 28} h={118} variant="generated" />
      <circle cx={nx + nw / 2} cy={y + 93} r={18} fill="rgba(244,241,232,0.9)" />
      <path d={`M${nx + nw / 2 - 5} ${y + 84}l14 9-14 9z`} fill={INK} />
      {[0, 5, 10, 15, 20, 25, 30].map((second) => (
        <g key={second}>
          <line x1={laneX + second * pps} y1={y + 164} x2={laneX + second * pps} y2={y + 172} stroke={FOG} />
          <text x={laneX + second * pps + 3} y={y + 172} className="v-kicker" fill={FOG}>
            {second === 0 ? '0' : `0:${String(second).padStart(2, '0')}`}
          </text>
        </g>
      ))}
      {/* Video lane */}
      {[
        { start: 0, end: 5.5, label: 'clip 1' },
        { start: 6, end: 13, label: 'clip 2' },
        { start: 14, end: 21, label: 'clip 3' },
      ].map((clip) => (
        <g key={clip.label}>
          <rect
            x={laneX + clip.start * pps}
            y={y + 182}
            width={(clip.end - clip.start) * pps}
            height={44}
            rx={6}
            fill="rgba(148,204,122,0.12)"
            stroke="rgba(148,204,122,0.6)"
          />
          <VaseArt x={laneX + clip.start * pps + 5} y={y + 187} w={34} h={34} variant="generated" />
          <text x={laneX + clip.start * pps + 45} y={y + 208} className="v-kicker" fill={TYPE_COLOR[PortType.VIDEO]}>
            {clip.label}
          </text>
        </g>
      ))}
      {/* Audio lane */}
      <rect x={laneX + 1 * pps} y={y + 236} width={19 * pps} height={36} rx={6} fill="rgba(233,73,159,0.1)" stroke="rgba(233,73,159,0.6)" />
      <Waveform x={laneX + 1 * pps + 8} y={y + 242} w={19 * pps - 16} h={24} />
      <path d={`M${nx + nw - 34} ${y + 200}h4l5-5v14l-5-5h-4z`} fill={FOG} />
      <path d={`M${nx + nw - 34} ${y + 254}h4l5-5v14l-5-5h-4z`} fill={FOG} />
      {/* Playhead */}
      <line x1={laneX + 9 * pps} y1={y + 160} x2={laneX + 9 * pps} y2={y + 280} stroke={PAPER} strokeWidth="1.5" />
      <path d={`M${laneX + 9 * pps - 5} ${y + 156}h10l-5 7z`} fill={PAPER} />
      <text x={laneX} y={y + 302} className="v-kicker" fill={FOG}>
        drag to move or trim, snaps to 0.1s and to neighbours
      </text>
    </g>
  );
}

/** Ad Maker: product and avatar in, a video ad out. */
function AdMaker({ x, y }: Pt) {
  const nx = x + 170;
  const nw = 300;
  const ports: [PortType, string][] = [
    [PortType.IMAGE, 'Product *'],
    [PortType.IMAGE, 'Avatar *'],
    [PortType.IMAGE, 'Reference image'],
    [PortType.VIDEO, 'Reference video'],
    [PortType.AUDIO, 'Reference audio'],
  ];
  return (
    <g>
      <Card x={nx} y={y + 20} w={nw} h={300} name="Ad Maker" />
      {ports.map(([type, label], index) => (
        <PortLabel key={label} x={nx} y={y + 48 + index * 26} type={type} label={label} side="in" />
      ))}
      <PortLabel x={nx + nw} y={y + 48} type={PortType.VIDEO} side="out" />
      <g transform={`rotate(-8 ${nx + 90} ${y + 90})`}>
        <VaseArt x={nx + 40} y={y + 50} w={90} h={84} />
      </g>
      <g transform={`rotate(6 ${nx + 200} ${y + 90})`}>
        <VaseArt x={nx + 160} y={y + 48} w={90} h={84} variant="generated" />
      </g>
      <rect x={nx + 108} y={y + 40} width={84} height={100} rx={8} fill="#2c2c29" stroke={STROKE} />
      <circle cx={nx + 150} cy={y + 78} r={16} fill={FOG} />
      <path d={`M${nx + 122} ${y + 132}c4-26 52-26 56 0z`} fill={FOG} />
      <text x={nx + nw / 2} y={y + 162} textAnchor="middle" className="v-kicker" fill={FOG}>
        product + avatar in, ad out
      </text>
      <rect x={nx + 16} y={y + 176} width={52} height={52} rx={8} fill="#262624" stroke={STROKE} />
      <VaseArt x={nx + 20} y={y + 180} w={44} h={44} />
      <rect x={nx + 76} y={y + 176} width={52} height={52} rx={8} fill="#262624" stroke={STROKE} />
      <circle cx={nx + 102} cy={y + 196} r={8} fill={FOG} />
      <path d={`M${nx + 88} ${y + 222}c2-14 26-14 28 0z`} fill={FOG} />
      <text x={nx + 16} y={y + 250} className="v-kicker" fill={PAPER}>
        <tspan fill="#b4a2ff">@Vase</tspan> on a sunlit shelf, 15s
      </text>
      <Chip x={nx + 16} y={y + 266} label="UGC" active />
      <Chip x={nx + 78} y={y + 266} label="Hook" />
      <Chip x={nx + 146} y={y + 266} label="Scene" />
    </g>
  );
}

/** Storyboard: one prompt and image become a grid of consistent frames. */
function Storyboard({ x, y }: Pt) {
  const nx = x + 140;
  const nw = 300;
  const cell: CellSize = { w: 84, h: 62 };
  return (
    <g>
      <Card x={nx} y={y + 20} w={nw} h={300} name="Storyboard" />
      <PortLabel x={nx} y={y + 54} type={PortType.TEXT} label="Prompt" side="in" />
      <PortLabel x={nx} y={y + 82} type={PortType.IMAGE} label="Image" side="in" />
      <PortLabel x={nx + nw} y={y + 54} type={PortType.IMAGE} side="out" />
      {Array.from({ length: 9 }, (_, index) => {
        const column = index % 3;
        const row = Math.floor(index / 3);
        const fx = nx + 18 + column * (cell.w + 7);
        const fy = y + 36 + row * (cell.h + 7);
        return (
          <g key={index}>
            <VaseArt x={fx} y={fy} w={cell.w} h={cell.h} variant={index % 2 === 0 ? 'source' : 'generated'} />
            <text x={fx + 6} y={fy + 14} className="v-kicker" fill={INK}>
              {index + 1}
            </text>
          </g>
        );
      })}
      <text x={nx + 18} y={y + 270} className="v-kicker" fill={FOG}>
        3 × 3 grid, medium progression
      </text>
      <rect x={nx + 18} y={y + 282} width={nw - 36} height={26} rx={13} fill="#232321" stroke={STROKE} />
      <text x={nx + 32} y={y + 299} className="v-kicker" fill={FOG}>
        Slow push-in, same vase, morning to dusk…
      </text>
    </g>
  );
}

function Wide() {
  return (
    <>
      <Dots width={1200} height={760} color="rgba(244,241,232,0.07)" background={CANVAS} />
      <CreativeAnalyzer x={30} y={30} />
      <CombineAudioVideo x={600} y={30} />
      <AdMaker x={-20} y={400} />
      <Storyboard x={620} y={400} />
    </>
  );
}

function Narrow() {
  return (
    <>
      <Dots width={600} height={1400} color="rgba(244,241,232,0.07)" background={CANVAS} />
      <CreativeAnalyzer x={20} y={20} />
      <CombineAudioVideo x={0} y={370} />
      <AdMaker x={70} y={720} />
      <Storyboard x={10} y={1060} />
    </>
  );
}

export function NodeShelfVisual() {
  return (
    <VizFrame
      label="Reconstructions of four more nodes on the same canvas. Creative Analyzer scores an imported creative with an ACE score ring, a red, yellow, and green zone bar, KPI rings for attention, branding, ease, and emotion, an app-type selector, and PDF, XLSX, and CSV export. Combine Audio and Video shows a preview above a multi-track timeline with three green video clips, a pink audio clip with a waveform, and a playhead. Ad Maker takes product, avatar, and reference inputs with UGC, Hook, and Scene modes. Storyboard turns a prompt and image into a three by three grid of frames."
      wide={<Wide />}
      narrow={<Narrow />}
      narrowBox="0 0 600 1400"
    />
  );
}
