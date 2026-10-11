import { Dots, type Pt, VizFrame } from './primitives';
import { VaseArt } from './VaseArt';

/**
 * Group connections, reconstructed after the live editor: a multi-selection
 * grows one output handle per data type; dropping it on a node wires every
 * member into its own slot of a compatible input, and inputs that cannot
 * take the type dim while the wire is in the air.
 */

interface SourceNodeProps extends Pt {
  w: number;
  name: string;
  variant: 'source' | 'generated';
}

interface SlotProps extends Pt {
  label: string;
  state: 'filled' | 'next' | 'dimmed';
  color: string;
}

interface TargetProps extends Pt {
  w: number;
  h: number;
  compact?: boolean;
}

const CANVAS = '#0f0f0f';
const NODE = '#1b1b1a';
const STROKE = '#30302c';
const PAPER = '#f4f1e8';
const FOG = '#a9a79c';
const INK = '#171815';
const IMAGE = '#e6a03a';
const TEXT = '#8ab4ff';

function SourceNode({ x, y, w, name, variant }: SourceNodeProps) {
  return (
    <g>
      <text x={x + 2} y={y - 8} className="v-small" fill={PAPER}>
        {name}
      </text>
      <rect x={x} y={y} width={w} height={74} rx={12} fill={NODE} stroke={STROKE} />
      <VaseArt x={x + 8} y={y + 8} w={w - 16} h={58} variant={variant} />
      <circle cx={x + w} cy={y + 37} r={5.5} fill={IMAGE} stroke={IMAGE} strokeWidth="2" />
    </g>
  );
}

function Slot({ x, y, label, state, color }: SlotProps) {
  return (
    <g opacity={state === 'dimmed' ? 0.3 : 1}>
      <circle
        cx={x}
        cy={y}
        r={6}
        fill={state === 'filled' ? color : CANVAS}
        stroke={color}
        strokeWidth="2"
        strokeDasharray={state === 'next' ? '3 3' : undefined}
      />
      <text x={x - 12} y={y + 4} textAnchor="end" className="v-kicker" fill={color}>
        {label}
      </text>
    </g>
  );
}

function Target({ x, y, w, h, compact }: TargetProps) {
  return (
    <g>
      <text x={x + 2} y={y - 8} className="v-small" fill={PAPER}>
        Compositor
      </text>
      <rect x={x} y={y} width={w} height={h} rx={14} fill={NODE} stroke={IMAGE} strokeWidth="1.5" />
      <VaseArt x={x + 10} y={y + 10} w={w - 20} h={h - 64} variant="generated" />
      <VaseArt x={x + 24} y={y + h - 106} w={44} h={34} />
      <VaseArt x={x + 74} y={y + h - 106} w={44} h={34} variant="generated" />
      <VaseArt x={x + 124} y={y + h - 106} w={44} h={34} />
      <rect x={x + w - 124} y={y + h - 42} width={110} height={30} rx={15} fill={PAPER} />
      <text x={x + w - 69} y={y + h - 22} textAnchor="middle" className="v-kicker" fill={INK}>
        Edit layers
      </text>
      <Slot x={x} y={y + 28} label="Text, not an image" state="dimmed" color={TEXT} />
      <Slot x={x} y={y + 58} label="Image 1" state="filled" color={IMAGE} />
      <Slot x={x} y={y + 84} label="Image 2" state="filled" color={IMAGE} />
      <Slot x={x} y={y + 110} label="Image 3" state="filled" color={IMAGE} />
      <Slot x={x} y={y + 136} label={compact ? 'Image 4' : 'Image 4, next slot'} state="next" color={IMAGE} />
    </g>
  );
}

function Wide() {
  return (
    <>
      <Dots width={1200} height={460} color="rgba(244,241,232,0.07)" background={CANVAS} />

      {/* Selection toolbar and box */}
      <rect x={110} y={24} width={250} height={36} rx={18} fill={NODE} stroke={STROKE} />
      <text x={130} y={47} className="v-kicker" fill={FOG}>
        3 selected
      </text>
      <rect x={208} y={30} width={140} height={24} rx={12} fill="#2c2c29" />
      <text x={278} y={47} textAnchor="middle" className="v-kicker" fill={PAPER}>
        Build App
      </text>
      <rect x={60} y={74} width={360} height={344} fill="none" stroke="rgba(244,241,232,0.55)" />
      {[
        [60, 74],
        [420, 74],
        [60, 418],
        [420, 418],
      ].map(([cx, cy]) => (
        <rect key={`${cx}-${cy}`} x={cx - 4} y={cy - 4} width={8} height={8} fill={PAPER} />
      ))}
      <SourceNode x={90} y={114} w={260} name="Front angle" variant="source" />
      <SourceNode x={90} y={220} w={260} name="Side angle" variant="generated" />
      <SourceNode x={90} y={326} w={260} name="Top angle" variant="source" />

      {/* The group's single output handle, mid-drag */}
      <circle cx={420} cy={246} r={9} fill={IMAGE} stroke={PAPER} strokeWidth="2" />
      <text x={434} y={238} className="v-kicker" fill={IMAGE}>
        Image ×3
      </text>
      <path d="M420 246C560 246 620 262 752 262" fill="none" stroke={IMAGE} strokeWidth="2.5" strokeDasharray="7 6" />
      <path
        transform="translate(724 254)"
        d="M0 0L0 22L6 16.5L10.5 26L14.5 24.2L10 14.8L17.5 14.8Z"
        fill={PAPER}
        stroke={INK}
        strokeWidth="1.4"
      />

      <Target x={760} y={84} w={380} h={330} />
      <text x={60} y={446} className="v-kicker" fill={FOG}>
        one drop: each image finds its own slot, the text input stays out
      </text>
    </>
  );
}

function Narrow() {
  return (
    <>
      <Dots width={600} height={760} color="rgba(244,241,232,0.07)" background={CANVAS} />
      <rect x={40} y={36} width={520} height={330} fill="none" stroke="rgba(244,241,232,0.55)" />
      <SourceNode x={70} y={74} w={440} name="Front angle" variant="source" />
      <SourceNode x={70} y={176} w={440} name="Side angle" variant="generated" />
      <SourceNode x={70} y={278} w={440} name="Top angle" variant="source" />
      <circle cx={560} cy={200} r={9} fill={IMAGE} stroke={PAPER} strokeWidth="2" />
      <text x={548} y={28} textAnchor="end" className="v-kicker" fill={IMAGE}>
        group handle: Image ×3
      </text>
      <path d="M560 200C640 430 110 470 230 498" fill="none" stroke={IMAGE} strokeWidth="2.5" strokeDasharray="7 6" />
      <Target x={230} y={440} w={340} h={300} compact />
    </>
  );
}

export function GroupConnectionVisual() {
  return (
    <VizFrame
      label="Reconstruction of a group connection. Three selected image nodes share one group output handle labelled Image times three. Its dashed wire is dropped on a Compositor node, whose Image 1, 2, and 3 slots fill, an Image 4 slot opens next, and the Text input dims because it cannot take an image."
      wide={<Wide />}
      narrow={<Narrow />}
      wideBox="0 0 1200 460"
    />
  );
}
