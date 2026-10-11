import type { ReactNode } from 'react';
import { Dots, type Pt, Tag, VizFrame } from './primitives';
import { VaseArt } from './VaseArt';

/**
 * App Builder, reconstructed in the visual language of a dark node-based
 * workflow editor: typed ports (text, image), node header/body/footer, a
 * selection, and the live app preview that appears on hovering "Build app".
 */

const PortType = {
  TEXT: 'text',
  IMAGE: 'image',
} as const;
type PortType = (typeof PortType)[keyof typeof PortType];

interface PortSpec {
  y: number;
  type: PortType;
  active?: boolean;
}

interface FlowNodeProps {
  x: number;
  y: number;
  w: number;
  h: number;
  icon: 'text' | 'image' | 'video';
  name: string;
  meta?: string;
  dim?: boolean;
  inputs?: PortSpec[];
  outputs?: PortSpec[];
  footer?: 'references' | 'add-images';
  children?: ReactNode;
}

interface TypedWireProps {
  from: Pt;
  to: Pt;
  type: PortType;
  dim?: boolean;
}

interface PreviewFieldProps {
  x: number;
  y: number;
  w: number;
  label: string;
  value: string;
  type: PortType;
}

interface PlayButtonProps {
  cx: number;
  cy: number;
}

interface PreviewCardProps {
  x: number;
  y: number;
  w: number;
  h: number;
  arrowX: number;
  compact?: boolean;
}

const CANVAS = '#0f0f0f';
const NODE = '#1b1b1a';
const NODE_STROKE = '#30302c';
const PAPER = '#f4f1e8';
const FOG = '#a9a79c';
const INK = '#171815';
const SIGNAL = '#c7f36b';
const TYPE_COLOR: Record<PortType, string> = {
  [PortType.TEXT]: '#8ab4ff',
  [PortType.IMAGE]: '#e6a03a',
};

function NodeIcon({ x, y, icon }: Pt & { icon: FlowNodeProps['icon'] }) {
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

function FlowNode({ x, y, w, h, icon, name, meta, dim, inputs = [], outputs = [], footer, children }: FlowNodeProps) {
  return (
    <g opacity={dim ? 0.38 : 1}>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={NODE} stroke={NODE_STROKE} />
      <NodeIcon x={x + 14} y={y + 14} icon={icon} />
      <text x={x + 32} y={y + 24} className="v-label" fill={PAPER}>
        {name}
      </text>
      {meta ? (
        <text x={x + w - 14} y={y + 24} textAnchor="end" className="v-kicker" fill={FOG}>
          {meta}
        </text>
      ) : null}
      {children}
      {footer === 'references' ? (
        <g>
          <rect x={x + 12} y={y + h - 34} width={92} height={24} rx={12} fill="#262624" />
          <text x={x + 24} y={y + h - 17} className="v-kicker" fill={FOG}>
            References
          </text>
          <circle cx={x + w - 24} cy={y + h - 22} r={11} fill={PAPER} />
          <path d={`M${x + w - 28} ${y + h - 27}l9 5-9 5z`} fill={INK} />
        </g>
      ) : null}
      {footer === 'add-images' ? (
        <text x={x + 14} y={y + h - 16} className="v-kicker" fill={FOG}>
          + Add more images
        </text>
      ) : null}
      {inputs.map((port) => (
        <circle
          key={`in-${port.y}`}
          cx={x}
          cy={y + port.y}
          r={5.5}
          fill={port.active ? TYPE_COLOR[port.type] : NODE}
          stroke={TYPE_COLOR[port.type]}
          strokeWidth={2}
        />
      ))}
      {outputs.map((port) => (
        <circle
          key={`out-${port.y}`}
          cx={x + w}
          cy={y + port.y}
          r={5.5}
          fill={port.active ? TYPE_COLOR[port.type] : NODE}
          stroke={TYPE_COLOR[port.type]}
          strokeWidth={2}
        />
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

function PreviewField({ x, y, w, label, value, type }: PreviewFieldProps) {
  return (
    <g>
      <circle cx={x + 4} cy={y - 5} r={4} fill={TYPE_COLOR[type]} stroke={INK} strokeWidth="1" />
      <text x={x + 14} y={y} className="v-label" fill={INK}>
        {label}
      </text>
      <rect x={x} y={y + 10} width={w} height={42} rx={6} fill="#fbfaf6" stroke={INK} />
      <text x={x + 14} y={y + 36} className="v-body" fill="#5c5b54">
        {value}
      </text>
    </g>
  );
}

function PlayButton({ cx, cy }: PlayButtonProps) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={20} fill={PAPER} stroke={INK} />
      <path d={`M${cx - 6} ${cy - 9}L${cx + 10} ${cy}L${cx - 6} ${cy + 9}Z`} fill={INK} />
    </g>
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

/** The live preview that appears while hovering "Build app" over a selection. */
function PreviewCard({ x, y, w, h, arrowX, compact }: PreviewCardProps) {
  const inner = w - 40;
  return (
    <g>
      <path d={`M${arrowX - 10} ${y}L${arrowX} ${y - 10}L${arrowX + 10} ${y}Z`} fill={PAPER} />
      <rect x={x} y={y} width={w} height={h} rx={12} fill={PAPER} />
      <circle cx={x + 26} cy={y + 27} r={4.5} fill={SIGNAL} stroke={INK} />
      <text x={x + 38} y={y + 31} className="v-kicker" fill="#5c5b54">
        live preview
      </text>
      <text x={x + w - 20} y={y + 31} textAnchor="end" className="v-kicker" fill="#5c5b54">
        5 nodes → 1 app
      </text>
      <text x={x + 20} y={y + 70} className="v-display" fill={INK}>
        Vase studio
      </text>
      {compact ? (
        <>
          <PreviewField x={x + 20} y={y + 112} w={inner / 2 - 8} label="Prompt" value="ceramic vase…" type={PortType.TEXT} />
          <PreviewField x={x + 20 + inner / 2 + 8} y={y + 112} w={inner / 2 - 8} label="Reference" value="vase-ref.jpg" type={PortType.IMAGE} />
          <rect x={x + 20} y={y + 186} width={inner / 2 - 8} height={46} rx={6} fill={INK} />
          <text x={x + 20 + (inner / 2 - 8) / 2} y={y + 215} textAnchor="middle" className="v-label" fill={PAPER}>
            Run app
          </text>
          <rect x={x + 20 + inner / 2 + 8} y={y + 186} width={inner / 2 - 8} height={h - 206} rx={6} fill="#dfdbcf" />
          <PlayButton cx={x + 20 + inner * 0.75 + 4} cy={y + 186 + (h - 206) / 2} />
        </>
      ) : (
        <>
          <text x={x + 20} y={y + 94} className="v-body" fill="#5c5b54">
            Inputs and result found by the planner
          </text>
          <PreviewField x={x + 20} y={y + 136} w={inner} label="Prompt" value="ceramic vase, soft light" type={PortType.TEXT} />
          <circle cx={x + 24} cy={y + 211} r={4} fill={TYPE_COLOR[PortType.IMAGE]} stroke={INK} strokeWidth="1" />
          <text x={x + 34} y={y + 216} className="v-label" fill={INK}>
            Reference
          </text>
          <rect x={x + 20} y={y + 226} width={inner} height={84} rx={6} fill="#fbfaf6" stroke="#5c5b54" strokeDasharray="5 4" />
          <VaseArt x={x + 32} y={y + 238} w={60} h={60} />
          <text x={x + 106} y={y + 264} className="v-body" fill={INK}>
            vase-ref.jpg
          </text>
          <text x={x + 106} y={y + 286} className="v-small" fill="#5c5b54">
            Replace
          </text>
          <rect x={x + 20} y={y + 328} width={inner} height={44} rx={6} fill={INK} />
          <text x={x + w / 2} y={y + 356} textAnchor="middle" className="v-label" fill={PAPER}>
            Run app
          </text>
          <text x={x + 20} y={y + 404} className="v-label" fill={INK}>
            Result
          </text>
          <rect x={x + 20} y={y + 414} width={inner} height={h - 434} rx={6} fill="#dfdbcf" />
          <PlayButton cx={x + w / 2} cy={y + 414 + (h - 434) / 2} />
        </>
      )}
    </g>
  );
}

function Toolbar({ x, y }: Pt) {
  const icons = 8;
  return (
    <g>
      <rect x={x} y={y} width={56 + icons * 34} height={44} rx={22} fill={NODE} stroke={NODE_STROKE} />
      <circle cx={x + 24} cy={y + 22} r={14} fill={PAPER} />
      <path d={`M${x + 19} ${y + 15}l11 6-5 1.5-1.5 5z`} fill={INK} />
      {Array.from({ length: icons }, (_, index) => (
        <rect
          key={index}
          x={x + 52 + index * 34}
          y={y + 15}
          width={14}
          height={14}
          rx={3}
          fill="none"
          stroke={FOG}
          strokeWidth="1.3"
        />
      ))}
    </g>
  );
}

function Wide() {
  return (
    <>
      <Dots width={1200} height={760} color="rgba(244,241,232,0.08)" background={CANVAS} />

      {/* Editor chrome */}
      <rect x={60} y={22} width={232} height={40} rx={20} fill={NODE} stroke={NODE_STROKE} />
      <text x={80} y={47} className="v-label" fill={PAPER}>
        Vase studio
      </text>
      <path d="M262 46a5 5 0 0 1 1-9.8 7 7 0 0 1 13.5 2.3 4 4 0 0 1-.5 7.5z" fill="none" stroke={FOG} strokeWidth="1.3" />
      <rect x={898} y={22} width={134} height={40} rx={20} fill={NODE} stroke={SIGNAL} strokeWidth={2} />
      <text x={965} y={47} textAnchor="middle" className="v-label" fill={PAPER}>
        Build app
      </text>
      <rect x={1044} y={22} width={92} height={40} rx={20} fill={PAPER} />
      <text x={1090} y={47} textAnchor="middle" className="v-label" fill={INK}>
        Share
      </text>
      <Cursor x={990} y={46} />
      {[0, 1, 2, 3].map((index) => (
        <rect key={index} x={18} y={110 + index * 46} width={18} height={18} rx={4} fill="none" stroke={FOG} strokeWidth="1.3" />
      ))}

      {/* Selection */}
      <rect x={44} y={128} width={850} height={396} rx={14} fill="rgba(199,243,107,0.04)" stroke={SIGNAL} strokeWidth={1.5} strokeDasharray="8 6" />
      <text x={56} y={118} className="v-kicker" fill={SIGNAL}>
        5 nodes selected
      </text>

      {/* Typed wires: text in blue, images in amber */}
      <TypedWire from={{ x: 240, y: 226 }} to={{ x: 290, y: 278 }} type={PortType.TEXT} />
      <TypedWire from={{ x: 240, y: 404 }} to={{ x: 290, y: 308 }} type={PortType.IMAGE} />
      <TypedWire from={{ x: 480, y: 330 }} to={{ x: 530, y: 214 }} type={PortType.IMAGE} />
      <TypedWire from={{ x: 680, y: 214 }} to={{ x: 730, y: 286 }} type={PortType.IMAGE} />
      <TypedWire from={{ x: 480, y: 330 }} to={{ x: 530, y: 610 }} type={PortType.IMAGE} dim />

      {/* Nodes */}
      <FlowNode x={60} y={166} w={180} h={120} icon="text" name="Prompt" meta="38 chars" outputs={[{ y: 60, type: PortType.TEXT, active: true }]}>
        <text x={74} y={222} className="v-body" fill={FOG}>
          ceramic vase on
        </text>
        <text x={74} y={242} className="v-body" fill={FOG}>
          travertine, soft light
        </text>
      </FlowNode>
      <FlowNode x={60} y={306} w={180} h={196} icon="image" name="Image" footer="add-images" outputs={[{ y: 98, type: PortType.IMAGE, active: true }]}>
        <VaseArt x={74} y={344} w={152} h={112} />
      </FlowNode>
      <FlowNode
        x={290}
        y={194}
        w={190}
        h={240}
        icon="image"
        name="Image 1"
        meta="image model"
        footer="references"
        inputs={[
          { y: 84, type: PortType.TEXT },
          { y: 114, type: PortType.IMAGE },
        ]}
        outputs={[{ y: 136, type: PortType.IMAGE }]}
      >
        <VaseArt x={304} y={234} w={162} h={150} variant="generated" />
      </FlowNode>
      <FlowNode x={530} y={160} w={150} h={108} icon="image" name="Upscale" meta="×2" inputs={[{ y: 54, type: PortType.IMAGE }]} outputs={[{ y: 54, type: PortType.IMAGE }]}>
        <text x={544} y={222} className="v-small" fill={FOG}>
          2048 × 2048
        </text>
      </FlowNode>
      <FlowNode x={730} y={190} w={150} h={196} icon="video" name="Animate" meta="5s" footer="references" inputs={[{ y: 96, type: PortType.IMAGE }]} outputs={[{ y: 96, type: PortType.IMAGE, active: true }]}>
        <VaseArt x={744} y={226} w={122} h={110} variant="generated" />
        <path d="M798 270l16 11-16 11z" fill={PAPER} />
      </FlowNode>
      <FlowNode x={530} y={560} w={150} h={100} icon="text" name="Caption" meta="outside" dim inputs={[{ y: 50, type: PortType.IMAGE }]} />

      {/* What the planner derived */}
      <Tag x={184} y={155} label="input" fill={SIGNAL} color={INK} />
      <Tag x={184} y={295} label="input" fill={SIGNAL} color={INK} />
      <Tag x={395} y={183} label="internal" fill="#2d2e29" color={FOG} stroke="#45463f" />
      <Tag x={595} y={149} label="internal" fill="#2d2e29" color={FOG} stroke="#45463f" />
      <Tag x={815} y={179} label="output" fill={SIGNAL} color={INK} />

      {/* A sticky note, the way creators document workflows */}
      <rect x={60} y={556} width={210} height={108} rx={4} fill="#e8c46a" />
      <text x={74} y={582} className="v-label" fill={INK}>
        How it works
      </text>
      <text x={74} y={606} className="v-small" fill={INK}>
        Drop a product photo and a
      </text>
      <text x={74} y={626} className="v-small" fill={INK}>
        prompt. The app returns a
      </text>
      <text x={74} y={646} className="v-small" fill={INK}>
        five-second clip.
      </text>

      <PreviewCard x={900} y={84} w={280} h={600} arrowX={965} />

      {/* Canvas controls */}
      <rect x={60} y={700} width={150} height={40} rx={20} fill={NODE} stroke={NODE_STROKE} />
      <text x={80} y={725} className="v-kicker" fill={FOG}>
        ↶ ↷
      </text>
      <text x={150} y={725} className="v-kicker" fill={PAPER}>
        64%
      </text>
      <Toolbar x={346} y={698} />
    </>
  );
}

function Narrow() {
  return (
    <>
      <Dots width={600} height={760} color="rgba(244,241,232,0.08)" background={CANVAS} />
      <rect x={24} y={20} width={240} height={40} rx={20} fill={NODE} stroke={NODE_STROKE} />
      <text x={44} y={46} className="v-label" fill={PAPER}>
        Vase studio
      </text>

      <rect x={24} y={78} width={552} height={300} rx={14} fill="rgba(199,243,107,0.04)" stroke={SIGNAL} strokeWidth={1.5} strokeDasharray="8 6" />
      <text x={40} y={104} className="v-kicker" fill={SIGNAL}>
        4 nodes selected
      </text>

      <TypedWire from={{ x: 268, y: 168 }} to={{ x: 324, y: 160 }} type={PortType.TEXT} />
      <TypedWire from={{ x: 268, y: 300 }} to={{ x: 324, y: 190 }} type={PortType.IMAGE} />
      <path d="M440 236V262" stroke={TYPE_COLOR[PortType.IMAGE]} strokeWidth={2} />

      <FlowNode x={44} y={118} w={224} h={100} icon="text" name="Prompt" meta="38 chars" outputs={[{ y: 50, type: PortType.TEXT, active: true }]}>
        <text x={58} y={180} className="v-body" fill={FOG}>
          ceramic vase, soft light
        </text>
      </FlowNode>
      <FlowNode x={44} y={236} w={224} h={128} icon="image" name="Image" outputs={[{ y: 64, type: PortType.IMAGE, active: true }]}>
        <VaseArt x={58} y={270} w={196} h={80} />
      </FlowNode>
      <FlowNode
        x={324}
        y={118}
        w={232}
        h={118}
        icon="image"
        name="Image 1"
        meta="model"
        inputs={[
          { y: 42, type: PortType.TEXT },
          { y: 72, type: PortType.IMAGE },
        ]}
      >
        <VaseArt x={338} y={150} w={204} h={72} variant="generated" />
      </FlowNode>
      <FlowNode x={324} y={262} w={232} h={102} icon="video" name="Animate" meta="5s">
        <VaseArt x={338} y={294} w={204} h={56} variant="generated" />
      </FlowNode>
      <circle cx={440} cy={236} r={5.5} fill={NODE} stroke={TYPE_COLOR[PortType.IMAGE]} strokeWidth={2} />
      <circle cx={440} cy={262} r={5.5} fill={NODE} stroke={TYPE_COLOR[PortType.IMAGE]} strokeWidth={2} />

      <Tag x={212} y={107} label="input" fill={SIGNAL} color={INK} />
      <Tag x={212} y={225} label="input" fill={SIGNAL} color={INK} />
      <Tag x={496} y={251} label="output" fill={SIGNAL} color={INK} />

      <rect x={372} y={396} width={204} height={44} rx={22} fill={NODE} stroke={SIGNAL} strokeWidth={2} />
      <text x={474} y={424} textAnchor="middle" className="v-label" fill={PAPER}>
        Build app
      </text>
      <Cursor x={520} y={420} />
      <PreviewCard x={24} y={462} w={552} h={276} arrowX={474} compact />
    </>
  );
}

export function AppBuilderVisual() {
  return (
    <VizFrame
      label="Reconstruction of App Builder in a dark workflow editor: five selected nodes connected by typed wires (blue for text, amber for images), the planner marking Prompt and Image as inputs and Animate as the output, and the live app preview shown while hovering Build app, with Prompt and Reference fields, a Run app button, and a video result."
      wide={<Wide />}
      narrow={<Narrow />}
    />
  );
}
