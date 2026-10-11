import type { CSSProperties } from 'react';
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
  connected?: boolean;
}

interface RingProps extends Pt {
  r: number;
  value: number;
}

interface ChipProps extends Pt {
  label: string;
  active?: boolean;
}

interface CellSize {
  w: number;
  h: number;
}

interface CavPort {
  type: PortType;
  label: string;
  connected: boolean;
}

interface CavClip {
  label: string;
  start: number;
  end: number;
  variant: 'source' | 'generated';
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

/** Combine Audio & Video timeline: 32 s fills the lane, as in the node. */
const VISIBLE_SECONDS = 32;
const LANE_H = 38;
const MICRO: CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 10 };

const CAV_PORTS: CavPort[] = [
  { type: PortType.VIDEO, label: 'Video 1 *', connected: true },
  { type: PortType.VIDEO, label: 'Video 2', connected: true },
  { type: PortType.VIDEO, label: 'Video 3', connected: true },
  { type: PortType.VIDEO, label: 'Video 4', connected: false },
  { type: PortType.AUDIO, label: 'Audio 1', connected: true },
  { type: PortType.AUDIO, label: 'Audio 2', connected: true },
  { type: PortType.AUDIO, label: 'Audio 3', connected: false },
];

const CAV_VIDEO_CLIPS: CavClip[] = [
  { label: 'Video 1', start: 0, end: 8, variant: 'generated' },
  { label: 'Video 2', start: 8, end: 17, variant: 'source' },
  { label: 'Video 3', start: 17, end: 26, variant: 'generated' },
];

/** Video track muted, Audio 1 full, Audio 2 lowered. */
const CAV_VOLUMES = [0, 100, 60];

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

function PortLabel({ x, y, type, label, side, connected }: PortLabelProps) {
  return (
    <g>
      <circle cx={x} cy={y} r={5.5} fill={side === 'out' ? TYPE_COLOR[type] : CANVAS} stroke={TYPE_COLOR[type]} strokeWidth="2" />
      {connected ? <circle cx={x} cy={y} r={2.5} fill={TYPE_COLOR[type]} /> : null}
      {label ? (
        <text x={side === 'in' ? x - 10 : x + 10} y={y + 4} textAnchor={side === 'in' ? 'end' : 'start'} className="v-kicker" fill={TYPE_COLOR[type]}>
          {label}
        </text>
      ) : null}
    </g>
  );
}

function Ring({ x, y, r, value }: RingProps) {
  const circumference = 2 * Math.PI * r;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="none" stroke="#2c2c29" strokeWidth={6} />
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="none"
        stroke={zoneColor(value)}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${(circumference * value) / 100} ${circumference}`}
        transform={`rotate(-90 ${x} ${y})`}
      />
      <text x={x} y={y + 7} textAnchor="middle" className="v-title" fill={PAPER}>
        {value}
      </text>
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
      <rect x={ax + 40} y={y + 172} width={150} height={26} rx={13} fill="#262624" />
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
      <rect x={ax + 110} y={y + 278} width={104} height={28} rx={14} fill={PAPER} />
      <text x={ax + 162} y={y + 296} textAnchor="middle" className="v-kicker" fill={INK}>
        Rerun test
      </text>
    </g>
  );
}

/** Combine Audio & Video: every wire becomes a clip on a timeline inside the node. */
function CombineAudioVideo({ x, y }: Pt) {
  const nx = x + 90;
  const nw = 480;
  const top = y + 20;
  const preview = { x: nx + 12, y: top + 12, w: nw - 24, h: 88 };
  const chipsY = preview.y + preview.h + 8;
  const tt = chipsY + 34;
  const railX = nx + nw - 44;
  const laneX = nx + 8;
  const laneW = railX - laneX - 8;
  const pps = laneW / VISIBLE_SECONDS;
  const lanes = [tt + 22, tt + 22 + LANE_H, tt + 22 + LANE_H * 2];
  const tb = lanes[2] + LANE_H;
  const at = (seconds: number) => laneX + seconds * pps;
  const playheadX = at(8);
  return (
    <g>
      <Card x={nx} y={top} w={nw} h={tb - top + 44} name="Combine Audio & Video" />

      {/* Result preview with player controls */}
      <rect x={preview.x} y={preview.y} width={preview.w} height={preview.h} rx={6} fill="#232321" />
      <VaseArt x={preview.x + (preview.w - 150) / 2} y={preview.y} w={150} h={preview.h} variant="generated" />
      <rect x={preview.x} y={preview.y + preview.h - 22} width={preview.w} height={22} fill="rgba(15,15,15,0.55)" />
      <path d={`M${preview.x + 10} ${preview.y + preview.h - 16}l8 5-8 5z`} fill={PAPER} />
      <text x={preview.x + 26} y={preview.y + preview.h - 7} style={MICRO} fill={PAPER}>
        0:00 / 0:26
      </text>
      <rect x={preview.x + 96} y={preview.y + preview.h - 12} width={preview.w - 110} height={2} rx={1} fill="rgba(244,241,232,0.3)" />

      {/* Connected inputs as chips */}
      <circle cx={nx + 25} cy={chipsY + 13} r={12} fill="none" stroke={STROKE} />
      <path d={`M${nx + 20} ${chipsY + 13}h10M${nx + 25} ${chipsY + 8}v10`} stroke={FOG} strokeWidth="1.5" />
      {[0, 1, 2].map((index) => (
        <g key={index}>
          <VaseArt x={nx + 46 + index * 32} y={chipsY} w={26} h={26} variant={index === 1 ? 'source' : 'generated'} />
          <circle cx={nx + 59 + index * 32} cy={chipsY + 13} r={6} fill="rgba(15,15,15,0.6)" />
          <path d={`M${nx + 57 + index * 32} ${chipsY + 10}l5 3-5 3z`} fill={PAPER} />
        </g>
      ))}
      {[0, 1].map((index) => (
        <g key={index}>
          <rect x={nx + 142 + index * 32} y={chipsY} width={26} height={26} rx={6} fill="#262624" />
          {[4, 9, 6, 10, 5].map((barH, bar) => (
            <rect key={bar} x={nx + 148 + index * 32 + bar * 3.2} y={chipsY + 13 - barH / 2} width={1.6} height={barH} rx={0.8} fill={FOG} />
          ))}
        </g>
      ))}

      {/* Timeline: ruler, one video lane, one lane per audio clip */}
      <rect x={nx + 1} y={tt} width={nw - 2} height={tb - tt} fill="#151514" />
      {Array.from({ length: VISIBLE_SECONDS * 2 + 1 }, (_, tick) => {
        const seconds = tick / 2;
        const major = seconds % 4 === 0;
        return (
          <line
            key={tick}
            x1={at(seconds)}
            y1={tt + 14}
            x2={at(seconds)}
            y2={tt + (major ? 20 : 17)}
            stroke={major ? FOG : '#3a3a37'}
          />
        );
      })}
      {[0, 4, 8, 12, 16, 20, 24, 28].map((seconds) => (
        <text key={seconds} x={at(seconds)} y={tt + 10} textAnchor={seconds === 0 ? 'start' : 'middle'} style={MICRO} fill={FOG}>
          {seconds === 0 ? '0' : `0:${String(seconds).padStart(2, '0')}`}
        </text>
      ))}
      {[tt + 22, ...lanes.map((laneY) => laneY + LANE_H)].map((lineY) => (
        <line key={lineY} x1={nx + 1} y1={lineY} x2={nx + nw - 1} y2={lineY} stroke="#2a2a28" />
      ))}

      {CAV_VIDEO_CLIPS.map((clip) => (
        <g key={clip.label} opacity={0.6}>
          <rect x={at(clip.start)} y={lanes[0] + 5} width={(clip.end - clip.start) * pps - 1} height={LANE_H - 10} rx={6} fill="rgba(148,204,122,0.1)" stroke="rgba(148,204,122,0.6)" />
          <VaseArt x={at(clip.start) + 4} y={lanes[0] + 9} w={20} h={20} variant={clip.variant} />
          <text x={at(clip.start) + 30} y={lanes[0] + 23} className="v-kicker" fill={TYPE_COLOR[PortType.VIDEO]}>
            {clip.label}
          </text>
        </g>
      ))}
      <rect x={at(0)} y={lanes[1] + 5} width={24 * pps} height={LANE_H - 10} rx={6} fill="rgba(233,73,159,0.1)" stroke="rgba(233,73,159,0.6)" />
      <text x={at(0) + 12} y={lanes[1] + 23} className="v-kicker" fill={TYPE_COLOR[PortType.AUDIO]}>
        Audio 1
      </text>
      {/* Audio 2 mid-drag: raised, snapped to the 0:08 edge between Video 1 and Video 2 */}
      <rect x={playheadX} y={lanes[2] + 5} width={railX - playheadX + 12} height={LANE_H - 10} rx={6} fill="#2a1520" stroke={TYPE_COLOR[PortType.AUDIO]} strokeWidth="1.5" />
      <text x={playheadX + 12} y={lanes[2] + 23} className="v-kicker" fill={TYPE_COLOR[PortType.AUDIO]}>
        Audio 2
      </text>
      {/* Lane right-edge fade, then the volume rail */}
      {[0, 1, 2, 3, 4, 5].map((step) => (
        <rect key={step} x={railX - 24 + step * 4} y={tt + 22} width={4} height={tb - tt - 22} fill="#151514" opacity={0.15 + step * 0.17} />
      ))}
      <rect x={railX} y={tt} width={nx + nw - 1 - railX} height={tb - tt} fill="#151514" />
      {lanes.map((laneY, index) => {
        const volume = CAV_VOLUMES[index];
        const sliderH = LANE_H - 12;
        return (
          <g key={laneY}>
            <path d={`M${railX + 4} ${laneY + 16}h3l4-4v12l-4-4h-3z`} fill={FOG} />
            {volume === 0 ? (
              <path d={`M${railX + 14} ${laneY + 16}l5 5M${railX + 19} ${laneY + 16}l-5 5`} stroke={FOG} strokeWidth="1.3" />
            ) : (
              <path d={`M${railX + 14} ${laneY + 15}q3 3 0 6`} fill="none" stroke={FOG} strokeWidth="1.3" />
            )}
            <rect x={railX + 30} y={laneY + 6} width={3} height={sliderH} rx={1.5} fill="#3a3a37" />
            <rect x={railX + 30} y={laneY + 6 + sliderH * (1 - volume / 100)} width={3} height={(sliderH * volume) / 100} rx={1.5} fill={PAPER} />
          </g>
        );
      })}
      {/* Dashed playhead: the clip is aligned to another clip's edge */}
      <line x1={playheadX} y1={tt + 18} x2={playheadX} y2={tb} stroke={PAPER} strokeDasharray="3 3" />
      <rect x={playheadX - 19} y={tt} width={38} height={18} rx={4} fill={PAPER} />
      <text x={playheadX} y={tt + 13} textAnchor="middle" style={MICRO} fill={INK}>
        0:08
      </text>
      <path
        transform={`translate(${playheadX + 96} ${lanes[2] + 14})`}
        d="M0 0L0 22L6 16.5L10.5 26L14.5 24.2L10 14.8L17.5 14.8Z"
        fill={PAPER}
        stroke={INK}
        strokeWidth="1.4"
      />

      {/* Lane scrollbar and run button */}
      <rect x={laneX} y={tb + 5} width={laneW * 0.78} height={4} rx={2} fill="#3a3a37" />
      <circle cx={nx + nw - 26} cy={tb + 24} r={13} fill={PAPER} />
      <path d={`M${nx + nw - 26} ${tb + 30}v-12M${nx + nw - 31} ${tb + 23}l5-5 5 5`} fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />

      {/* Ports last, so the timeline never paints over them */}
      {CAV_PORTS.map((port, index) => (
        <g key={port.label} opacity={port.connected ? 1 : 0.6}>
          <PortLabel x={nx} y={top + 28 + index * 22} type={port.type} label={port.label} side="in" connected={port.connected} />
        </g>
      ))}
      <PortLabel x={nx + nw} y={top + 28} type={PortType.VIDEO} side="out" />
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
        Slow push-in, dusk light…
      </text>
    </g>
  );
}

function Wide() {
  return (
    <>
      <Dots width={1200} height={760} color="rgba(244,241,232,0.07)" background={CANVAS} />
      <CreativeAnalyzer x={110} y={30} />
      <CombineAudioVideo x={600} y={30} />
      <AdMaker x={-20} y={400} />
      <Storyboard x={640} y={400} />
    </>
  );
}

function Narrow() {
  return (
    <>
      <Dots width={600} height={1450} color="rgba(244,241,232,0.07)" background={CANVAS} />
      <CreativeAnalyzer x={110} y={20} />
      <CombineAudioVideo x={0} y={370} />
      <AdMaker x={70} y={770} />
      <Storyboard x={10} y={1110} />
    </>
  );
}

export function NodeShelfVisual() {
  return (
    <VizFrame
      label="Reconstructions of four more nodes on the same canvas. Creative Analyzer scores an imported creative with an ACE score ring, a red, yellow, and green zone bar, a detailed-report button, and an app-type selector. Combine Audio and Video shows the result above a timeline: three green video clips packed in one lane, two pink audio clips in lanes of their own, a volume rail with the video track muted, and Audio 2 mid-drag, snapped to the 0:08 edge with a dashed playhead. Ad Maker takes product, avatar, and reference inputs with UGC, Hook, and Scene modes. Storyboard turns a prompt and image into a three by three grid of frames."
      wide={<Wide />}
      narrow={<Narrow />}
      narrowBox="0 0 600 1450"
    />
  );
}
