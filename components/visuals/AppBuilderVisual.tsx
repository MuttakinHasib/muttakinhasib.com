import type { ReactNode } from 'react';
import { Dots, type Pt, VizFrame } from './primitives';
import { SelectionToolbar, selectionToolbarLayout } from './selection-toolbar';
import { VaseArt } from './VaseArt';

/**
 * App Builder, reconstructed after the live editor. Two moments:
 * 1. Hovering "Build App" on a selection previews the plan in place:
 *    planned inputs wear a violet halo, outputs an amber one, the rest dims.
 * 2. Clicking it opens the guided flow (Input → Output → Publish).
 */

const PortType = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
} as const;
type PortType = (typeof PortType)[keyof typeof PortType];

const Role = {
  INPUT: 'input',
  OUTPUT: 'output',
  DIM: 'dim',
  NONE: 'none',
} as const;
type Role = (typeof Role)[keyof typeof Role];

interface PortSpec {
  y: number;
  type: PortType;
}

interface FlowNodeProps {
  x: number;
  y: number;
  w: number;
  h: number;
  icon: 'text' | 'image' | 'video';
  name: string;
  meta?: string;
  role?: Role;
  inputs?: PortSpec[];
  outputs?: PortSpec[];
  footer?: 'references' | 'add-images';
  children?: ReactNode;
}

interface NodeIconProps extends Pt {
  icon: FlowNodeProps['icon'];
}

interface TypedWireProps {
  from: Pt;
  to: Pt;
  type: PortType;
  dim?: boolean;
}

interface BuildAppHoverProps extends Pt {
  compact?: boolean;
}

interface PanelProps extends Pt {
  w: number;
  h: number;
  compact?: boolean;
}

interface FieldProps extends Pt {
  w: number;
  label: string;
  value: string;
}

interface SelectionBoxProps extends Pt {
  w: number;
  h: number;
}

interface RoleStyle {
  fill: string;
  stroke: string;
  width: number;
  opacity: number;
}

interface ToggleRowProps extends Pt {
  w: number;
  label: string;
  value: string;
}

const CANVAS = '#0f0f0f';
const NODE = '#1b1b1a';
const NODE_STROKE = '#30302c';
const PAPER = '#f4f1e8';
const FOG = '#a9a79c';
const INK = '#171815';
const SIGNAL = '#c7f36b';
const VIOLET = '#9b6dff';
const AMBER = '#f5a524';

const TYPE_COLOR: Record<PortType, string> = {
  [PortType.TEXT]: '#8ab4ff',
  [PortType.IMAGE]: '#e6a03a',
  [PortType.VIDEO]: '#94cc7a',
};

const ROLE_STYLE: Record<Role, RoleStyle> = {
  [Role.INPUT]: { fill: '#22163d', stroke: VIOLET, width: 2.5, opacity: 1 },
  [Role.OUTPUT]: { fill: '#1b0e00', stroke: AMBER, width: 2.5, opacity: 1 },
  [Role.DIM]: { fill: NODE, stroke: NODE_STROKE, width: 1, opacity: 0.32 },
  [Role.NONE]: { fill: NODE, stroke: NODE_STROKE, width: 1, opacity: 1 },
};

function NodeIcon({ x, y, icon }: NodeIconProps) {
  if (icon === 'text') {
    return (
      <text x={x} y={y + 9} className="v-kicker" fill={FOG}>
        T
      </text>
    );
  }
  if (icon === 'image') {
    return (
      <g fill="none" stroke={FOG} strokeWidth="1.2">
        <rect x={x} y={y} width={11} height={10} rx={2} />
        <path d={`M${x + 1} ${y + 9}l3.5-4 3 3 2-2 1.5 2`} />
      </g>
    );
  }
  return (
    <g fill="none" stroke={FOG} strokeWidth="1.2">
      <rect x={x} y={y} width={12} height={10} rx={2} />
      <path d={`M${x + 4.5} ${y + 3}l3.5 2-3.5 2z`} fill={FOG} />
    </g>
  );
}

/** Label sits above the card, as in the editor; the card carries the halo. */
function FlowNode({ x, y, w, h, icon, name, meta, role = Role.NONE, inputs = [], outputs = [], footer, children }: FlowNodeProps) {
  const style = ROLE_STYLE[role];
  return (
    <g opacity={style.opacity}>
      <NodeIcon x={x + 2} y={y - 18} icon={icon} />
      <text x={x + 20} y={y - 9} className="v-small" fill={PAPER}>
        {name}
      </text>
      {meta ? (
        <text x={x + w} y={y - 9} textAnchor="end" className="v-kicker" fill={FOG}>
          {meta}
        </text>
      ) : null}
      <rect x={x} y={y} width={w} height={h} rx={12} fill={style.fill} stroke={style.stroke} strokeWidth={style.width} />
      {children}
      {footer === 'references' ? (
        <g>
          <rect x={x + 10} y={y + h - 32} width={88} height={22} rx={11} fill="#262624" />
          <text x={x + 21} y={y + h - 17} className="v-kicker" fill={FOG}>
            References
          </text>
          <circle cx={x + w - 21} cy={y + h - 21} r={10} fill={PAPER} />
          <path d={`M${x + w - 21} ${y + h - 26}v10M${x + w - 25} ${y + h - 22}l4-4 4 4`} stroke={INK} strokeWidth="1.5" fill="none" />
        </g>
      ) : null}
      {footer === 'add-images' ? (
        <text x={x + 14} y={y + h - 14} className="v-kicker" fill={FOG}>
          + Add more images
        </text>
      ) : null}
      {inputs.map((port) => (
        <circle key={`in-${port.y}`} cx={x} cy={y + port.y} r={5.5} fill={CANVAS} stroke={TYPE_COLOR[port.type]} strokeWidth={2} />
      ))}
      {outputs.map((port) => (
        <circle key={`out-${port.y}`} cx={x + w} cy={y + port.y} r={5.5} fill={TYPE_COLOR[port.type]} stroke={TYPE_COLOR[port.type]} strokeWidth={2} />
      ))}
    </g>
  );
}

function TypedWire({ from, to, type, dim }: TypedWireProps) {
  const k = Math.max(36, Math.abs(to.x - from.x) * 0.5);
  return (
    <path
      d={`M${from.x} ${from.y}C${from.x + k} ${from.y} ${to.x - k} ${to.y} ${to.x} ${to.y}`}
      fill="none"
      stroke={TYPE_COLOR[type]}
      strokeWidth={2}
      opacity={dim ? 0.3 : 0.95}
    />
  );
}

function Cursor({ x, y }: Pt) {
  return (
    <path
      transform={`translate(${x} ${y})`}
      d="M0 0L0 22L6 16.5L10.5 26L14.5 24.2L10 14.8L17.5 14.8Z"
      fill={PAPER}
      stroke={INK}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  );
}

/** The selection toolbar with Build App hovered: its tooltip and the cursor. */
function BuildAppHover({ x, y, compact }: BuildAppHoverProps) {
  const { buildX, buildW } = selectionToolbarLayout({ x, compact });
  const buildCenter = buildX + buildW / 2;
  return (
    <g>
      <SelectionToolbar x={x} y={y} compact={compact} />
      <rect x={buildCenter - 136} y={y - 58} width={272} height={46} rx={10} fill={PAPER} />
      <text x={buildCenter} y={y - 39} textAnchor="middle" className="v-small" fill={INK}>
        Turns the selection into an app
      </text>
      <text x={buildCenter} y={y - 21} textAnchor="middle" className="v-small" fill={INK}>
        you can share or run again.
      </text>
      <Cursor x={buildX + buildW - 12} y={y + 24} />
    </g>
  );
}

function Legend({ x, y }: Pt) {
  return (
    <g>
      <rect x={x} y={y} width={14} height={14} rx={4} fill="#22163d" stroke={VIOLET} strokeWidth="2" />
      <text x={x + 22} y={y + 12} className="v-kicker" fill={PAPER}>
        planned input
      </text>
      <rect x={x + 150} y={y} width={14} height={14} rx={4} fill="#1b0e00" stroke={AMBER} strokeWidth="2" />
      <text x={x + 172} y={y + 12} className="v-kicker" fill={PAPER}>
        planned output
      </text>
      <rect x={x + 310} y={y} width={14} height={14} rx={4} fill={NODE} stroke={NODE_STROKE} opacity={0.5} />
      <text x={x + 332} y={y + 12} className="v-kicker" fill={FOG}>
        dimmed: internal step
      </text>
    </g>
  );
}

function Field({ x, y, w, label, value }: FieldProps) {
  return (
    <g>
      <text x={x} y={y} className="v-kicker" fill={FOG}>
        {label}
      </text>
      <rect x={x} y={y + 8} width={w} height={36} rx={8} fill="#232321" stroke={NODE_STROKE} />
      <text x={x + 12} y={y + 31} className="v-small" fill={PAPER}>
        {value}
      </text>
    </g>
  );
}

function ToggleRow({ x, y, w, label, value }: ToggleRowProps) {
  return (
    <g>
      <text x={x} y={y + 14} className="v-small" fill={PAPER}>
        {label}
      </text>
      <text x={x + w - 52} y={y + 14} textAnchor="end" className="v-kicker" fill={FOG}>
        {value}
      </text>
      <rect x={x + w - 40} y={y} width={40} height={22} rx={11} fill={SIGNAL} />
      <circle cx={x + w - 11} cy={y + 11} r={8} fill={INK} />
    </g>
  );
}

/** The App Builder sidebar after clicking: three ordered steps, Publish active. */
function BuilderPanel({ x, y, w, h, compact }: PanelProps) {
  const steps = ['Input', 'Output', 'Publish'];
  const inner = w - 40;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} fill="#171716" stroke={NODE_STROKE} />
      <text x={x + 20} y={y + 34} className="v-label" fill={PAPER}>
        App Builder
      </text>
      <text x={x + w - 20} y={y + 34} textAnchor="end" className="v-kicker" fill={FOG}>
        after the click
      </text>
      {steps.map((step, index) => {
        const sx = x + 20 + index * (inner / 3);
        const done = index < 2;
        return (
          <g key={step}>
            {index > 0 ? <line x1={sx - inner / 3 + 88} y1={y + 66} x2={sx - 4} y2={y + 66} stroke={done ? SIGNAL : NODE_STROKE} strokeWidth="1.5" /> : null}
            <circle cx={sx + 11} cy={y + 66} r={11} fill={done ? SIGNAL : PAPER} />
            <text x={sx + 11} y={y + 70} textAnchor="middle" className="v-kicker" fill={INK}>
              {done ? '✓' : '3'}
            </text>
            <text x={sx + 28} y={y + 70} className="v-kicker" fill={done ? FOG : PAPER}>
              {step}
            </text>
          </g>
        );
      })}
      {compact ? (
        <>
          <Field x={x + 20} y={y + 94} w={inner / 2 - 8} label="App name" value="Vase studio" />
          <ToggleRow x={x + 20 + inner / 2 + 8} y={y + 110} w={inner / 2 - 8} label="Monetize" value="on" />
          <rect x={x + 20} y={y + h - 50} width={inner / 2 - 8} height={36} rx={18} fill="#262624" />
          <text x={x + 20 + (inner / 2 - 8) / 2} y={y + h - 27} textAnchor="middle" className="v-label" fill={PAPER}>
            Test run
          </text>
          <rect x={x + 20 + inner / 2 + 8} y={y + h - 50} width={inner / 2 - 8} height={36} rx={18} fill={PAPER} />
          <text x={x + 20 + inner * 0.75 + 4} y={y + h - 27} textAnchor="middle" className="v-label" fill={INK}>
            Publish app
          </text>
        </>
      ) : (
        <>
          <VaseArt x={x + 20} y={y + 96} w={inner} h={150} variant="generated" />
          <circle cx={x + w / 2} cy={y + 171} r={18} fill={PAPER} />
          <path d={`M${x + w / 2 - 5} ${y + 162}L${x + w / 2 + 9} ${y + 171}L${x + w / 2 - 5} ${y + 180}Z`} fill={INK} />
          <Field x={x + 20} y={y + 274} w={inner} label="App name" value="Vase studio" />
          <Field x={x + 20} y={y + 338} w={inner} label="Description" value="Product photo in, 5-second clip out." />
          <ToggleRow x={x + 20} y={y + 404} w={inner} label="Monetize runs" value="on" />
          <ToggleRow x={x + 20} y={y + 440} w={inner} label="Public" value="listed" />
          <ToggleRow x={x + 20} y={y + 476} w={inner} label="Allow remix" value="on" />
          <rect x={x + 20} y={y + h - 64} width={inner / 2 - 8} height={42} rx={21} fill="#262624" />
          <text x={x + 20 + (inner / 2 - 8) / 2} y={y + h - 38} textAnchor="middle" className="v-label" fill={PAPER}>
            Test run
          </text>
          <rect x={x + 20 + inner / 2 + 8} y={y + h - 64} width={inner / 2 - 8} height={42} rx={21} fill={PAPER} />
          <text x={x + 20 + inner * 0.75 + 4} y={y + h - 38} textAnchor="middle" className="v-label" fill={INK}>
            Publish app
          </text>
        </>
      )}
    </g>
  );
}

function SelectionBox({ x, y, w, h }: SelectionBoxProps) {
  const corners: [number, number][] = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="rgba(244,241,232,0.55)" strokeWidth="1" />
      {corners.map(([cx, cy]) => (
        <rect key={`${cx}-${cy}`} x={cx - 4} y={cy - 4} width={8} height={8} fill={PAPER} />
      ))}
    </g>
  );
}

function Wide() {
  return (
    <>
      <Dots width={1200} height={760} color="rgba(244,241,232,0.08)" background={CANVAS} />

      {/* Editor chrome */}
      <rect x={40} y={22} width={200} height={40} rx={20} fill={NODE} stroke={NODE_STROKE} />
      <text x={60} y={47} className="v-label" fill={PAPER}>
        Vase studio
      </text>

      <BuildAppHover x={184} y={112} />
      <SelectionBox x={40} y={184} w={736} h={384} />

      {/* Wires keep their data type: text blue, image amber, video green */}
      <TypedWire from={{ x: 236, y: 262 }} to={{ x: 300, y: 300 }} type={PortType.TEXT} />
      <TypedWire from={{ x: 236, y: 428 }} to={{ x: 300, y: 330 }} type={PortType.IMAGE} />
      <TypedWire from={{ x: 486, y: 352 }} to={{ x: 548, y: 352 }} type={PortType.IMAGE} />
      <TypedWire from={{ x: 486, y: 352 }} to={{ x: 548, y: 650 }} type={PortType.IMAGE} dim />

      <FlowNode x={60} y={220} w={176} h={96} icon="text" name="Prompt" role={Role.INPUT} outputs={[{ y: 42, type: PortType.TEXT }]}>
        <text x={74} y={250} className="v-small" fill={PAPER}>
          ceramic vase on
        </text>
        <text x={74} y={270} className="v-small" fill={PAPER}>
          travertine, soft light
        </text>
      </FlowNode>
      <FlowNode x={60} y={356} w={176} h={180} icon="image" name="Image" role={Role.INPUT} footer="add-images" outputs={[{ y: 72, type: PortType.IMAGE }]}>
        <VaseArt x={72} y={368} w={152} h={128} />
      </FlowNode>
      <FlowNode
        x={300}
        y={244}
        w={186}
        h={216}
        icon="image"
        name="Image 1"
        meta="model"
        role={Role.DIM}
        footer="references"
        inputs={[
          { y: 56, type: PortType.TEXT },
          { y: 86, type: PortType.IMAGE },
        ]}
        outputs={[{ y: 108, type: PortType.IMAGE }]}
      >
        <VaseArt x={310} y={254} w={166} h={160} variant="generated" />
      </FlowNode>
      <FlowNode
        x={548}
        y={244}
        w={206}
        h={216}
        icon="video"
        name="Animate"
        meta="5s"
        role={Role.OUTPUT}
        footer="references"
        inputs={[{ y: 108, type: PortType.IMAGE }]}
        outputs={[{ y: 108, type: PortType.VIDEO }]}
      >
        <VaseArt x={558} y={254} w={186} h={160} variant="generated" />
        <circle cx={651} cy={334} r={18} fill="rgba(244,241,232,0.9)" />
        <path d="M645 325l15 9-15 9z" fill={INK} />
      </FlowNode>

      {/* Outside the selection: untouched by the plan */}
      <FlowNode x={548} y={612} w={190} h={78} icon="text" name="Caption" inputs={[{ y: 38, type: PortType.IMAGE }]}>
        <text x={562} y={656} className="v-small" fill={FOG}>
          not in the selection
        </text>
      </FlowNode>

      <Legend x={40} y={716} />

      <BuilderPanel x={812} y={84} w={368} h={640} />
    </>
  );
}

function Narrow() {
  return (
    <>
      <Dots width={600} height={760} color="rgba(244,241,232,0.08)" background={CANVAS} />
      <BuildAppHover x={56} y={78} compact />
      <SelectionBox x={24} y={146} w={552} h={334} />

      <TypedWire from={{ x: 264, y: 220 }} to={{ x: 324, y: 222 }} type={PortType.TEXT} />
      <TypedWire from={{ x: 264, y: 360 }} to={{ x: 324, y: 246 }} type={PortType.IMAGE} />
      <path d="M436 300V330" stroke={TYPE_COLOR[PortType.IMAGE]} strokeWidth={2} />

      <FlowNode x={44} y={182} w={220} h={78} icon="text" name="Prompt" role={Role.INPUT} outputs={[{ y: 38, type: PortType.TEXT }]}>
        <text x={58} y={226} className="v-small" fill={PAPER}>
          ceramic vase, soft light
        </text>
      </FlowNode>
      <FlowNode x={44} y={300} w={220} h={160} icon="image" name="Image" role={Role.INPUT} outputs={[{ y: 60, type: PortType.IMAGE }]}>
        <VaseArt x={56} y={312} w={196} h={136} />
      </FlowNode>
      <FlowNode
        x={324}
        y={182}
        w={224}
        h={118}
        icon="image"
        name="Image 1"
        meta="model"
        role={Role.DIM}
        inputs={[
          { y: 40, type: PortType.TEXT },
          { y: 64, type: PortType.IMAGE },
        ]}
      >
        <VaseArt x={336} y={194} w={200} h={94} variant="generated" />
      </FlowNode>
      <FlowNode x={324} y={348} w={224} h={112} icon="video" name="Animate" meta="5s" role={Role.OUTPUT}>
        <VaseArt x={336} y={360} w={200} h={88} variant="generated" />
      </FlowNode>

      <Legend x={24} y={500} />
      <BuilderPanel x={24} y={536} w={552} h={204} compact />
    </>
  );
}

export function AppBuilderVisual() {
  return (
    <VizFrame
      label="Reconstruction of App Builder. Hovering Build App on a multi-node selection previews the plan in place: Prompt and Image glow violet as planned inputs, Animate glows amber as the planned output, and the internal Image step dims. Clicking opens the App Builder sidebar with Input, Output, and Publish steps, app name, monetization, visibility, remix, a test run, and Publish app."
      wide={<Wide />}
      narrow={<Narrow />}
    />
  );
}
