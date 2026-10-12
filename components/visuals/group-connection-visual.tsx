import { Cursor, Dots, type Pt, SelectionBox, VizFrame } from './primitives';
import { VIZ_CANVAS as CANVAS, VIZ_FOG as FOG, VIZ_INK as INK, VIZ_NODE as NODE, VIZ_PAPER as PAPER, VIZ_STROKE as STROKE, VIZ_TYPE_COLOR } from './palette';
import { SelectionToolbar } from './selection-toolbar';
import { VaseArt } from './vase-art';

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

const IMAGE = VIZ_TYPE_COLOR.image;
const TEXT = VIZ_TYPE_COLOR.text;

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

      {/* Selection toolbar, centred over the selection box */}
      <SelectionToolbar x={21} y={20} />
      <SelectionBox x={60} y={74} w={360} h={344} />
      <SourceNode x={90} y={114} w={260} name="Front angle" variant="source" />
      <SourceNode x={90} y={220} w={260} name="Side angle" variant="generated" />
      <SourceNode x={90} y={326} w={260} name="Top angle" variant="source" />

      {/* The group's single output handle, mid-drag */}
      <circle cx={420} cy={246} r={9} fill={IMAGE} stroke={PAPER} strokeWidth="2" />
      <text x={434} y={238} className="v-kicker" fill={IMAGE}>
        Image ×3
      </text>
      <path d="M420 246C560 246 620 262 752 262" fill="none" stroke={IMAGE} strokeWidth="2.5" strokeDasharray="7 6" />
      <Cursor x={724} y={254} miter />

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
