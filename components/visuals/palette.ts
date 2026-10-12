/**
 * Shared tokens for the SVG reconstructions. DESIGN.md owns the palette;
 * these constants keep every visual drawing the same hexes it names.
 */

/** The editor canvas the dark reconstructions sit on. */
export const VIZ_CANVAS = '#0f0f0f';
/** Node-card fill on that canvas. */
export const VIZ_NODE = '#1b1b1a';
/** Hairlines and node strokes on that canvas. */
export const VIZ_STROKE = '#30302c';

/** Paper, the site canvas colour. */
export const VIZ_PAPER = '#f4f1e8';
/** Muted text on the dark canvas. */
export const VIZ_FOG = '#a9a79c';
/** Ink, the site type/wire colour. */
export const VIZ_INK = '#171815';
/** Graphite, secondary text on paper. */
export const VIZ_GRAPHITE = '#5c5b54';

/**
 * The project accents from DESIGN.md ("Color"). Stream blue doubles as the
 * editor's text-port colour, and ledger amber as its image-port colour.
 */
export const VIZ_SIGNAL = '#c7f36b';
export const VIZ_STREAM = '#8ab4ff';
export const VIZ_LEDGER = '#e6a03a';
export const VIZ_AGENT = '#b4a2ff';
export const VIZ_ROSE = '#ef5b8c';

/** Port colours the editor keeps for typed wires and ports, plus audio. */
export const VIZ_TYPE_COLOR = {
  text: '#8ab4ff',
  image: '#e6a03a',
  video: '#94cc7a',
  audio: '#e9499f',
} as const;
