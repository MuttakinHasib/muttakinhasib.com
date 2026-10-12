import { useId } from 'react';
import { type EditorGlyph, EditorIcon, Glyph } from './editor-icons';
import { Dots, type Pt, SelectionBox, VizFrame } from './primitives';
import { VIZ_CANVAS as CANVAS, VIZ_FOG as FOG, VIZ_INK as INK, VIZ_NODE as NODE, VIZ_PAPER as PAPER, VIZ_ROSE as GUIDE, VIZ_STROKE as STROKE } from './palette';
import { VaseArt } from './vase-art';

/**
 * Generative Fill and Compositor, reconstructed after the live editors:
 * Generative Fill edits in place on the canvas (the rest of the graph blurs),
 * with a lavender mask for inpainting and a framed extension for outpainting.
 * Compositor opens a layers / artboard / properties editor.
 */

interface ToolbarProps extends Pt {
  w: number;
  /** Narrow layout, where labels set larger. */
  narrow?: boolean;
}

interface LayerRowProps extends Pt {
  w: number;
  name: string;
  badge?: string;
  selected?: boolean;
  icon: 'artboard' | 'text' | 'image';
}

interface PropFieldProps extends Pt {
  w: number;
  prefix: string;
  value: string;
  /** Draw a dropdown chevron, as on the blend mode select. */
  menu?: boolean;
}

interface ToolButtonProps extends Pt {
  w: number;
  label: string;
  glyph: EditorGlyph;
}

interface CompositorProps extends Pt {
  w: number;
  h: number;
  compact?: boolean;
}

interface PromptPillProps extends Pt {
  w: number;
}

interface MaskStrokeProps {
  transform?: string;
}

interface BlurDefsProps {
  id: string;
}

const MASK = 'rgba(167,139,250,0.6)';
const OUTPAINT = '#2a1650';

/** Measured widths of the toolbar's "Inpaint" and "Model" labels at each layout's type size. */
const LABEL_WIDTH = {
  wide: { mode: 47, model: 43 },
  narrow: { mode: 57, model: 51 },
} as const;

const BLEND_MODES = ['Normal', 'Multiply', 'Screen', 'Overlay', 'Darken', 'Lighten', 'Color Dodge'];

function BlurDefs({ id }: BlurDefsProps) {
  return (
    <defs>
      <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>
  );
}

/**
 * The floating toolbar Generative Fill shows while inpainting, as the editor
 * lays it out: mode and model menus, then brush, eraser, and brush size, then
 * undo and redo.
 */
function EditToolbar({ x, y, w, narrow }: ToolbarProps) {
  const label = narrow ? LABEL_WIDTH.narrow : LABEL_WIDTH.wide;
  const iconY = y + 13;
  const modeChevronX = x + 44 + label.mode;
  const modelSepX = modeChevronX + 19;
  const modelChevronX = modelSepX + 18 + label.model;
  const right = x + w;
  return (
    <g>
      <rect x={x} y={y} width={w} height={42} rx={20} fill="#1f1f1d" stroke={STROKE} />
      <EditorIcon x={x + 14} y={iconY} glyph={Glyph.INPAINT_BRUSH} size={16} color={PAPER} strokeWidth={2.5} />
      <text x={x + 38} y={y + 26} className="v-label" fill={PAPER}>
        Inpaint
      </text>
      <EditorIcon x={modeChevronX} y={y + 17} glyph={Glyph.CHEVRON_DOWN} size={9} color={PAPER} strokeWidth={2} />
      <line x1={modelSepX} y1={y + 12} x2={modelSepX} y2={y + 30} stroke={STROKE} />
      <text x={modelSepX + 12} y={y + 26} className="v-label" fill={PAPER}>
        Model
      </text>
      <EditorIcon x={modelChevronX} y={y + 17} glyph={Glyph.CHEVRON_DOWN} size={9} color={PAPER} strokeWidth={2} />
      <line x1={right - 176} y1={y + 12} x2={right - 176} y2={y + 30} stroke={STROKE} />
      <rect x={right - 168} y={y + 7} width={44} height={28} rx={8} fill="#2c2c29" />
      <EditorIcon x={right - 162} y={iconY} glyph={Glyph.INPAINT_BRUSH} size={16} color={PAPER} />
      <EditorIcon x={right - 142} y={y + 17} glyph={Glyph.CHEVRON_DOWN} size={9} color={PAPER} strokeWidth={2} />
      <EditorIcon x={right - 116} y={iconY} glyph={Glyph.ERASER} size={16} color={FOG} />
      <EditorIcon x={right - 90} y={iconY} glyph={Glyph.BRUSH_SIZE} size={16} color={FOG} />
      <line x1={right - 64} y1={y + 12} x2={right - 64} y2={y + 30} stroke={STROKE} />
      <EditorIcon x={right - 56} y={iconY} glyph={Glyph.UNDO} size={16} color={FOG} />
      <EditorIcon x={right - 30} y={iconY} glyph={Glyph.REDO} size={16} color={FOG} />
    </g>
  );
}

function PromptPill({ x, y, w }: PromptPillProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={44} rx={22} fill="#1f1f1d" stroke={STROKE} />
      <text x={x + 20} y={y + 27} className="v-small" fill={FOG}>
        Describe what to add in the painted area…
      </text>
      <circle cx={x + w - 22} cy={y + 22} r={12} fill="#2c2c29" />
      <path d={`M${x + w - 22} ${y + 28}v-12M${x + w - 27} ${y + 21}l5-5 5 5`} stroke={PAPER} strokeWidth="1.5" fill="none" />
    </g>
  );
}

function LayerRow({ x, y, w, name, badge, selected, icon }: LayerRowProps) {
  return (
    <g>
      {selected ? <rect x={x} y={y} width={w} height={30} rx={6} fill="#262624" /> : null}
      {icon === 'artboard' ? (
        <rect x={x + 10} y={y + 9} width={12} height={12} rx={2} fill="none" stroke={FOG} strokeDasharray="2 2" />
      ) : icon === 'text' ? (
        <EditorIcon x={x + 9} y={y + 8} glyph={Glyph.TEXT_TYPE} size={14} color={FOG} />
      ) : (
        <circle cx={x + 16} cy={y + 15} r={6} fill="#cdbfa6" />
      )}
      <text x={x + 30} y={y + 20} className="v-small" fill={PAPER}>
        {name}
      </text>
      {badge ? (
        <text x={x + w - 8} y={y + 20} textAnchor="end" className="v-kicker" fill="#b4a2ff">
          {badge}
        </text>
      ) : null}
    </g>
  );
}

function PropField({ x, y, w, prefix, value, menu }: PropFieldProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={28} rx={7} fill="#1f1f1d" stroke={STROKE} />
      {prefix ? (
        <text x={x + 10} y={y + 18} className="v-small" fill={FOG}>
          {prefix}
        </text>
      ) : null}
      <text x={x + (prefix ? 26 : 10)} y={y + 18} className="v-small" fill={PAPER}>
        {value}
      </text>
      {menu ? <EditorIcon x={x + w - 18} y={y + 10} glyph={Glyph.CHEVRON_DOWN} size={9} color={FOG} strokeWidth={2} /> : null}
    </g>
  );
}

function ToolButton({ x, y, w, label, glyph }: ToolButtonProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={30} rx={8} fill="#1f1f1d" stroke={STROKE} />
      <EditorIcon x={x + 11} y={y + 7} glyph={glyph} size={16} color={PAPER} />
      <text x={x + 36} y={y + 19.5} className="v-small" fill={PAPER}>
        {label}
      </text>
    </g>
  );
}

/** Compositor: layers on the left, artboard in the middle, properties on the right. */
function Compositor({ x, y, w, h, compact }: CompositorProps) {
  const layersW = compact ? 190 : 140;
  const propsW = 200;
  const half = (propsW - 36) / 2;
  const stageX = x + layersW;
  const stageW = w - layersW - propsW;
  const propsX = x + w - propsW;
  const artW = compact ? stageW - 24 : stageW - 28;
  const artH = artW * 0.75;
  const artX = stageX + (stageW - artW) / 2;
  const artY = y + (compact ? 40 : (h - artH) / 2 - 20);
  const center = artX + artW / 2;
  const blendY = compact ? y + 60 : y + 196;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={16} fill="#141413" stroke={STROKE} />
      {/* Layers */}
      <text x={x + 14} y={y + 30} className="v-label" fill={PAPER}>
        Layers
      </text>
      <LayerRow x={x + 8} y={y + 44} w={layersW - 16} name="Artboard" icon="artboard" />
      <LayerRow x={x + 8} y={y + 76} w={layersW - 16} name="Soft light" badge="AI" icon="text" />
      <LayerRow x={x + 8} y={y + 108} w={layersW - 16} name="Vase" icon="image" selected />
      <LayerRow x={x + 8} y={y + 140} w={layersW - 16} name="Shadow" icon="image" />
      <LayerRow x={x + 8} y={y + 172} w={layersW - 16} name="Background" icon="image" />

      {/* Stage */}
      <rect x={stageX} y={y + 1} width={stageW} height={h - 2} fill="#0b0b0b" />
      <VaseArt x={artX} y={artY} w={artW} h={artH} />
      <text x={artX + 10} y={artY + artH - 9} className="v-small" fill={INK} fontWeight={700} letterSpacing="0.1em">
        SOFT LIGHT
      </text>
      <line x1={center} y1={artY - 12} x2={center} y2={artY + artH + 12} stroke={GUIDE} strokeWidth="1.25" />
      <rect x={center - artW * 0.16} y={artY + artH * 0.12} width={artW * 0.32} height={artH * 0.62} fill="none" stroke={PAPER} strokeWidth="1.25" />
      {[
        [center - artW * 0.16, artY + artH * 0.12],
        [center + artW * 0.16, artY + artH * 0.12],
        [center - artW * 0.16, artY + artH * 0.74],
        [center + artW * 0.16, artY + artH * 0.74],
      ].map(([hx, hy]) => (
        <rect key={`${hx}-${hy}`} x={hx - 4} y={hy - 4} width={8} height={8} fill={PAPER} stroke={INK} />
      ))}
      <circle cx={center} cy={artY + artH + 26} r={7} fill="none" stroke={PAPER} strokeWidth="1.3" />
      {!compact ? (
        <>
          <rect x={stageX + 12} y={y + h - 46} width={124} height={32} rx={16} fill="#1f1f1d" stroke={STROKE} />
          <EditorIcon x={stageX + 24} y={y + h - 38} glyph={Glyph.UNDO} size={16} color={FOG} />
          <EditorIcon x={stageX + 46} y={y + h - 38} glyph={Glyph.REDO} size={16} color={FOG} />
          <text x={stageX + 74} y={y + h - 25} className="v-small" fill={PAPER}>
            59%
          </text>
          <EditorIcon x={stageX + 108} y={y + h - 34} glyph={Glyph.CHEVRON_DOWN} size={9} color={FOG} strokeWidth={2} />
        </>
      ) : null}

      {/* Properties, in the editor's order */}
      <text x={propsX + 14} y={y + 30} className="v-label" fill={PAPER}>
        Vase
      </text>
      {!compact ? (
        <>
          <text x={propsX + 14} y={y + 60} className="v-small" fill={FOG}>
            Position
          </text>
          <PropField x={propsX + 14} y={y + 68} w={half} prefix="X" value="128" />
          <PropField x={propsX + 22 + half} y={y + 68} w={half} prefix="Y" value="64" />
          <text x={propsX + 14} y={y + 122} className="v-small" fill={FOG}>
            Dimension
          </text>
          <PropField x={propsX + 14} y={y + 130} w={half} prefix="W" value="420" />
          <PropField x={propsX + 22 + half} y={y + 130} w={half} prefix="H" value="560" />
          <line x1={propsX + 14} y1={y + 176} x2={propsX + propsW - 14} y2={y + 176} stroke={STROKE} />
        </>
      ) : null}
      <text x={propsX + 14} y={blendY} className="v-small" fill={FOG}>
        Opacity
      </text>
      <PropField x={propsX + 14} y={blendY + 8} w={half} prefix="%" value="100" />
      <text x={propsX + 22 + half} y={blendY} className="v-small" fill={FOG}>
        Blend Modes
      </text>
      <PropField x={propsX + 22 + half} y={blendY + 8} w={half} prefix="" value="Multiply" menu />
      <rect x={propsX + 14} y={blendY + 42} width={propsW - 28} height={BLEND_MODES.length * 24 + 12} rx={9} fill="#1f1f1d" stroke={STROKE} />
      {BLEND_MODES.map((mode, index) => (
        <g key={mode}>
          {mode === 'Multiply' ? <rect x={propsX + 20} y={blendY + 48 + index * 24} width={propsW - 40} height={22} rx={5} fill="#2c2c29" /> : null}
          <text x={propsX + 28} y={blendY + 63 + index * 24} className="v-small" fill={mode === 'Multiply' ? PAPER : FOG}>
            {mode}
          </text>
        </g>
      ))}
      {!compact ? (
        <>
          <text x={propsX + 14} y={y + 452} className="v-small" fill={FOG}>
            Tools
          </text>
          <ToolButton x={propsX + 14} y={y + 462} w={propsW - 28} label="Create Layers" glyph={Glyph.TEXT_TYPE} />
          <ToolButton x={propsX + 14} y={y + 500} w={propsW - 28} label="Remove Background" glyph={Glyph.REMOVE_BACKGROUND} />
        </>
      ) : null}
    </g>
  );
}

function MaskStroke({ transform }: MaskStrokeProps) {
  return (
    <path
      transform={transform}
      d="M262 236C280 208 316 196 344 206C372 216 384 232 404 222"
      fill="none"
      stroke={MASK}
      strokeWidth="30"
      strokeLinecap="round"
    />
  );
}

function Wide() {
  const blur = useId();
  return (
    <>
      <BlurDefs id={blur} />
      <Dots width={1200} height={760} color="rgba(244,241,232,0.07)" background={CANVAS} />

      {/* The rest of the graph blurs while Generative Fill edits in place */}
      <g filter={`url(#${blur})`} opacity="0.45">
        <rect x={30} y={250} width={120} height={150} rx={12} fill={NODE} stroke={STROKE} />
        <VaseArt x={40} y={262} w={100} h={100} />
        <path d="M150 300C170 300 170 330 186 330" stroke="#e6a03a" strokeWidth="2" fill="none" />
        <rect x={30} y={520} width={130} height={90} rx={12} fill={NODE} stroke={STROKE} />
      </g>

      <text x={190} y={120} className="v-kicker" fill={FOG}>
        generative fill, inpaint
      </text>
      <EditToolbar x={180} y={132} w={400} />
      <VaseArt x={190} y={190} w={380} h={286} />
      <MaskStroke />
      <circle cx={404} cy={222} r={15} fill="none" stroke={PAPER} strokeWidth="1.5" />
      <PromptPill x={190} y={494} w={380} />

      {/* Outpaint: drag the frame out, the new area waits in violet */}
      <text x={190} y={584} className="v-kicker" fill={FOG}>
        outpaint, extend the frame
      </text>
      <VaseArt x={190} y={596} w={220} h={140} />
      <rect x={410} y={596} width={150} height={140} fill={OUTPAINT} />
      <rect x={190} y={596} width={370} height={140} fill="none" stroke={PAPER} strokeWidth="1" />
      <SelectionBox x={190} y={596} w={370} h={140} frame={false} />
      <rect x={556} y={650} width={8} height={32} rx={4} fill={PAPER} />

      <Compositor x={612} y={24} w={572} h={712} />
    </>
  );
}

function Narrow() {
  return (
    <>
      <Dots width={600} height={760} color="rgba(244,241,232,0.07)" background={CANVAS} />
      <EditToolbar x={60} y={20} w={480} narrow />
      <VaseArt x={40} y={78} w={520} h={300} />
      <g transform="translate(300 180) scale(1.35) translate(-333 -214)">
        <MaskStroke />
      </g>
      <rect x={60} y={392} width={480} height={44} rx={22} fill="#1f1f1d" stroke={STROKE} />
      <text x={80} y={419} className="v-small" fill={FOG}>
        Describe what to add in the painted area…
      </text>
      <Compositor x={16} y={456} w={568} h={292} compact />
    </>
  );
}

export function GenerativeFillVisual() {
  return (
    <VizFrame
      label="Reconstruction of Generative Fill and Compositor. Generative Fill edits a node in place while the rest of the canvas blurs: an Inpaint toolbar with model, brush, eraser, and undo; a lavender mask painted over the vase; a prompt field; and an outpainting frame extended to the right with the new area shown in violet. Compositor shows layers (Artboard, an AI-extracted Soft light text layer, Vase, Shadow, Background), an artboard with a centre smart guide and selection handles, and properties with position, dimensions, opacity, the blend-mode list with Multiply selected, and the Create Layers and Remove Background tools."
      wide={<Wide />}
      narrow={<Narrow />}
    />
  );
}
