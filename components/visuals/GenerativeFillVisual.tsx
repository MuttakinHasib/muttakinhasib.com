import { useId } from 'react';
import { Tag, VizFrame } from './primitives';
import { VaseArt } from './VaseArt';

interface LayerRowProps {
  y: number;
  x: number;
  w: number;
  name: string;
  detail: string;
  selected?: boolean;
  thumb: 'text' | 'image' | 'shadow' | 'mask' | 'background';
}

interface HandlesProps {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface IconProps {
  x: number;
  y: number;
}

interface ThumbProps extends IconProps {
  kind: LayerRowProps['thumb'];
}

interface PatternsProps {
  checkerId: string;
  hatchId: string;
}

const INK = '#171815';
const MASK = '#ef5b8c';
const GRAPHITE = '#5c5b54';
const PAPER = '#f4f1e8';
const WINDOW = '#fbfaf6';

const MASK_PATH =
  'M396 236C380 200 410 168 452 174C496 166 532 192 524 230C520 254 488 262 460 256C428 262 404 256 396 236Z';

function Eye({ x, y }: IconProps) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-8 0C-4 -6 4 -6 8 0C4 6 -4 6 -8 0Z" fill="none" stroke={INK} strokeWidth="1.3" />
      <circle r="2.4" fill={INK} />
    </g>
  );
}

function Thumb({ x, y, kind }: ThumbProps) {
  return (
    <g>
      <rect x={x} y={y} width={30} height={30} rx={3} fill={kind === 'background' ? '#cdbfa6' : '#e6e3da'} stroke="rgba(23,24,21,0.25)" />
      {kind === 'text' ? (
        <text x={x + 15} y={y + 21} textAnchor="middle" className="v-label" fill={INK}>
          T
        </text>
      ) : null}
      {kind === 'image' ? <path d={`M${x + 11} ${y + 25}C${x + 6} ${y + 20} ${x + 7} ${y + 11} ${x + 12} ${y + 8}L${x + 18} ${y + 8}C${x + 23} ${y + 11} ${x + 24} ${y + 20} ${x + 19} ${y + 25}Z`} fill={PAPER} stroke={INK} strokeWidth="1" /> : null}
      {kind === 'shadow' ? <ellipse cx={x + 15} cy={y + 20} rx={10} ry={3.5} fill="#7d705b" /> : null}
      {kind === 'mask' ? <circle cx={x + 15} cy={y + 15} r={9} fill={MASK} opacity={0.55} /> : null}
    </g>
  );
}

function LayerRow({ x, y, w, name, detail, selected, thumb }: LayerRowProps) {
  return (
    <g>
      {selected ? <rect x={x} y={y} width={w} height={48} rx={5} fill="#e9e6dc" stroke={INK} /> : null}
      <Eye x={x + 22} y={y + 24} />
      <Thumb x={x + 42} y={y + 9} kind={thumb} />
      <text x={x + 86} y={y + 29} className="v-label" fill={INK}>
        {name}
      </text>
      <text x={x + w - 14} y={y + 29} textAnchor="end" className="v-kicker" fill={GRAPHITE}>
        {detail}
      </text>
    </g>
  );
}

function Handles({ x, y, w, h }: HandlesProps) {
  const points = [
    [x, y],
    [x + w / 2, y],
    [x + w, y],
    [x, y + h / 2],
    [x + w, y + h / 2],
    [x, y + h],
    [x + w / 2, y + h],
    [x + w, y + h],
  ];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth="1.25" />
      {points.map(([px, py]) => (
        <rect key={`${px}-${py}`} x={px - 4.5} y={py - 4.5} width={9} height={9} fill="#fff" stroke={INK} strokeWidth="1.25" />
      ))}
    </g>
  );
}

function UndoRedo({ x, y }: IconProps) {
  return (
    <g fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${x + 6} ${y - 4}L${x} ${y + 2}L${x + 6} ${y + 8}M${x} ${y + 2}H${x + 12}C${x + 18} ${y + 2} ${x + 20} ${y + 6} ${x + 20} ${y + 10}`} />
      <path d={`M${x + 50} ${y - 4}L${x + 56} ${y + 2}L${x + 50} ${y + 8}M${x + 56} ${y + 2}H${x + 44}C${x + 38} ${y + 2} ${x + 36} ${y + 6} ${x + 36} ${y + 10}`} />
    </g>
  );
}

function Patterns({ checkerId, hatchId }: PatternsProps) {
  return (
    <defs>
      <pattern id={checkerId} width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#f7f6f2" />
        <rect width="10" height="10" fill="#e6e3da" />
        <rect x="10" y="10" width="10" height="10" fill="#e6e3da" />
      </pattern>
      <pattern id={hatchId} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="10" stroke={MASK} strokeWidth="1.2" opacity="0.45" />
      </pattern>
    </defs>
  );
}

function Wide() {
  const checker = useId();
  const hatch = useId();
  return (
    <>
      <Patterns checkerId={checker} hatchId={hatch} />
      <rect x={8} y={8} width={1184} height={744} rx={12} fill={WINDOW} stroke={INK} strokeWidth="1.25" />
      <line x1={8} y1={60} x2={1192} y2={60} stroke="rgba(23,24,21,0.15)" />
      <text x={32} y={41} className="v-label" fill={GRAPHITE}>
        Generative Fill
      </text>
      <text x={176} y={41} className="v-label" fill={INK}>
        Compositor
      </text>
      <line x1={176} y1={59} x2={266} y2={59} stroke={INK} strokeWidth="2" />
      <UndoRedo x={998} y={30} />
      <text x={1166} y={41} textAnchor="end" className="v-kicker" fill={GRAPHITE}>
        history 14
      </text>

      {/* Tool rail */}
      <line x1={64} y1={60} x2={64} y2={752} stroke="rgba(23,24,21,0.15)" />
      <rect x={20} y={124} width={32} height={32} rx={5} fill={MASK} opacity={0.9} />
      <circle cx={36} cy={140} r={7} fill="none" stroke={INK} strokeWidth="1.5" />
      <path d="M28 88h16M36 80v16" stroke={INK} strokeWidth="1.5" />
      <text x={36} y={200} textAnchor="middle" className="v-title" fill={INK}>
        T
      </text>
      <path d="M26 236h20M26 248h20M32 230v24M40 230v24" stroke={INK} strokeWidth="1.2" />

      {/* Artboard: checkerboard, outpainted margin, source image */}
      <rect x={64} y={60} width={796} height={640} fill="#eceae3" />
      <rect x={130} y={110} width={660} height={520} fill={`url(#${checker})`} />
      <rect x={130} y={110} width={660} height={520} fill="#cdbfa6" opacity="0.55" />
      <rect x={130} y={536} width={660} height={94} fill="#b3a58c" opacity="0.6" />
      <rect x={130} y={110} width={660} height={520} fill={`url(#${hatch})`} />
      <VaseArt x={230} y={170} w={460} h={400} />
      <rect x={230} y={170} width={460} height={400} fill="none" stroke={INK} strokeDasharray="6 5" />
      <Tag x={146} y={124} label="outpaint preview" fill={WINDOW} color={INK} stroke={INK} />
      <text x={236} y={590} className="v-kicker" fill={INK}>
        source 1024 × 890
      </text>

      {/* Smart guides */}
      <line x1={460} y1={110} x2={460} y2={630} stroke={MASK} strokeWidth="1.25" />
      <line x1={300} y1={426} x2={620} y2={426} stroke={MASK} strokeWidth="1.25" strokeDasharray="4 4" />
      <text x={628} y={430} className="v-kicker" fill={MASK}>
        snap
      </text>

      {/* Text layer pulled out of the image */}
      <text x={252} y={236} className="v-poster" fill={INK}>
        SOFT LIGHT
      </text>
      <rect x={244} y={202} width={178} height={44} fill="none" stroke={INK} strokeDasharray="3 3" />

      {/* Mask and the selected layer */}
      <path d={MASK_PATH} fill={MASK} fillOpacity="0.42" stroke={MASK} strokeWidth="1.5" strokeDasharray="5 4" />
      <Tag x={530} y={176} label="mask, reused" fill={MASK} color={INK} />
      <Handles x={366} y={256} w={188} h={174} />

      {/* Canvas footer */}
      <line x1={64} y1={700} x2={860} y2={700} stroke="rgba(23,24,21,0.15)" />
      <text x={84} y={732} className="v-kicker" fill={GRAPHITE}>
        konva stage, 5 layers
      </text>
      <text x={840} y={732} textAnchor="end" className="v-kicker" fill={GRAPHITE}>
        84%
      </text>

      {/* Layers panel */}
      <rect x={860} y={60} width={332} height={692} fill={PAPER} />
      <line x1={860} y1={60} x2={860} y2={752} stroke="rgba(23,24,21,0.15)" />
      <text x={884} y={98} className="v-label" fill={INK}>
        Layers
      </text>
      <LayerRow x={876} y={116} w={300} name="Soft light" detail="AI text" thumb="text" />
      <LayerRow x={876} y={166} w={300} name="Vase" detail="normal" thumb="image" selected />
      <LayerRow x={876} y={216} w={300} name="Shadow" detail="multiply" thumb="shadow" />
      <LayerRow x={876} y={266} w={300} name="Generated fill" detail="normal" thumb="mask" />
      <LayerRow x={876} y={316} w={300} name="Background" detail="locked" thumb="background" />

      <line x1={876} y1={382} x2={1176} y2={382} stroke="rgba(23,24,21,0.15)" />
      <text x={884} y={414} className="v-label" fill={INK}>
        Blend mode
      </text>
      <rect x={884} y={426} width={284} height={40} rx={5} fill={WINDOW} stroke={INK} />
      <text x={900} y={452} className="v-body" fill={INK}>
        Multiply
      </text>
      <path d="M1146 442l6 6 6-6" fill="none" stroke={INK} strokeWidth="1.5" />
      <text x={884} y={500} className="v-label" fill={INK}>
        Opacity
      </text>
      <text x={1168} y={500} textAnchor="end" className="v-kicker" fill={GRAPHITE}>
        72%
      </text>
      <rect x={884} y={514} width={284} height={4} rx={2} fill="#dfdbcf" />
      <rect x={884} y={514} width={204} height={4} rx={2} fill={INK} />
      <circle cx={1088} cy={516} r={8} fill={WINDOW} stroke={INK} strokeWidth="1.5" />

      <line x1={876} y1={548} x2={1176} y2={548} stroke="rgba(23,24,21,0.15)" />
      <text x={884} y={580} className="v-label" fill={INK}>
        Generative Fill
      </text>
      <rect x={884} y={594} width={284} height={56} rx={5} fill={WINDOW} stroke={INK} />
      <text x={900} y={627} className="v-body" fill={GRAPHITE}>
        dried flowers in the vase
      </text>
      <rect x={884} y={662} width={284} height={42} rx={5} fill={MASK} />
      <text x={1026} y={689} textAnchor="middle" className="v-label" fill={INK}>
        Generate
      </text>
      <text x={884} y={728} className="v-kicker" fill={GRAPHITE}>
        preview shown while it runs
      </text>
    </>
  );
}

function Narrow() {
  const checker = useId();
  const hatch = useId();
  return (
    <>
      <Patterns checkerId={checker} hatchId={hatch} />
      <rect x={8} y={8} width={584} height={744} rx={12} fill={WINDOW} stroke={INK} strokeWidth="1.25" />
      <line x1={8} y1={58} x2={592} y2={58} stroke="rgba(23,24,21,0.15)" />
      <text x={30} y={40} className="v-label" fill={INK}>
        Compositor
      </text>
      <line x1={30} y1={57} x2={140} y2={57} stroke={INK} strokeWidth="2" />
      <UndoRedo x={504} y={30} />

      <rect x={32} y={80} width={536} height={400} fill={`url(#${checker})`} />
      <rect x={32} y={80} width={536} height={400} fill="#cdbfa6" opacity="0.55" />
      <rect x={32} y={80} width={536} height={400} fill={`url(#${hatch})`} />
      <VaseArt x={92} y={110} w={416} h={340} />
      <rect x={92} y={110} width={416} height={340} fill="none" stroke={INK} strokeDasharray="6 5" />
      <line x1={300} y1={80} x2={300} y2={480} stroke={MASK} strokeWidth="1.25" />
      <text x={110} y={168} className="v-poster" fill={INK}>
        SOFT LIGHT
      </text>
      <g transform="translate(300 156) scale(0.85) translate(-460 -215)">
        <path d={MASK_PATH} fill={MASK} fillOpacity="0.42" stroke={MASK} strokeWidth="1.8" strokeDasharray="5 4" />
      </g>
      <Handles x={219} y={176} w={162} h={156} />
      <Tag x={392} y={120} label="mask, reused" fill={MASK} color={INK} />

      <line x1={8} y1={500} x2={592} y2={500} stroke="rgba(23,24,21,0.15)" />
      <text x={32} y={534} className="v-label" fill={INK}>
        Layers
      </text>
      <text x={568} y={534} textAnchor="end" className="v-kicker" fill={GRAPHITE}>
        history 14
      </text>
      <LayerRow x={24} y={550} w={552} name="Soft light" detail="AI text" thumb="text" />
      <LayerRow x={24} y={598} w={552} name="Vase" detail="normal" thumb="image" selected />
      <LayerRow x={24} y={648} w={552} name="Shadow" detail="multiply" thumb="shadow" />
      <LayerRow x={24} y={696} w={552} name="Background" detail="locked" thumb="background" />
    </>
  );
}

export function GenerativeFillVisual() {
  return (
    <VizFrame
      label="Reconstruction of the Compositor editor: a still life with a pink inpainting mask marked as reused, a hatched outpainting preview around the source image, a center smart guide, an extracted text layer, and a layers panel with blend modes."
      wide={<Wide />}
      narrow={<Narrow />}
    />
  );
}
