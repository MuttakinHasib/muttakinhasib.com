import type { Pt } from './primitives';

/**
 * Icons from the ImagineArt editor's own icon set, so reconstructed toolbars
 * read as the real ones. Paths stay in each icon's original viewBox units.
 */

export interface EditorGlyph {
  box: number;
  paths: readonly string[];
  strokeWidth: number;
  filled?: boolean;
}

interface EditorIconProps extends Pt {
  glyph: EditorGlyph;
  size: number;
  color: string;
  /** Stroke width in the glyph's own units, where the editor overrides it. */
  strokeWidth?: number;
}

export const Glyph = {
  TIDY: {
    box: 18,
    strokeWidth: 1.2,
    paths: [
      'M3.545 9.545a.545.545 0 1 0 0-1.09.545.545 0 0 0 0 1.09ZM3.545 4.09a.545.545 0 1 0 0-1.09.545.545 0 0 0 0 1.09ZM3.545 15a.545.545 0 1 0 0-1.09.545.545 0 0 0 0 1.09ZM9 9.545a.545.545 0 1 0 0-1.09.545.545 0 0 0 0 1.09ZM9 4.09A.545.545 0 1 0 9 3a.545.545 0 0 0 0 1.09ZM9 15a.545.545 0 1 0 0-1.09A.545.545 0 0 0 9 15ZM14.454 9.545a.545.545 0 1 0 0-1.09.545.545 0 0 0 0 1.09ZM14.454 4.09a.545.545 0 1 0 0-1.09.545.545 0 0 0 0 1.09ZM14.454 15a.545.545 0 1 0 0-1.09.545.545 0 0 0 0 1.09Z',
    ],
  },
  DOWNLOAD: {
    box: 18,
    strokeWidth: 1.2,
    paths: [
      'M2.25 12.703v1.016c0 .538.219 1.055.608 1.436.39.38.917.595 1.468.595h9.347c.272 0 .543-.053.795-.155a2.08 2.08 0 0 0 .674-.44c.193-.189.346-.412.45-.659.104-.247.158-.51.158-.777v-1.015m-3.345-4.516c-.68 1.33-2.043 2.662-3.404 3.329-1.362-.667-2.724-1.998-3.406-3.33M9 3v8.48',
    ],
  },
  ALIGN_LEFT: {
    box: 18,
    strokeWidth: 1.2,
    paths: [
      'M2.25 14.25v-12m2.728 3.146V4.004c0-.862.778-1.56 1.738-1.56h3.704c.96 0 1.739.698 1.739 1.56v1.392c0 .862-.778 1.56-1.739 1.56H6.716c-.96 0-1.738-.698-1.738-1.56Zm0 7.1v-1.392c0-.862.778-1.56 1.738-1.56h7.295c.96 0 1.739.698 1.739 1.56v1.392c0 .862-.778 1.56-1.739 1.56H6.716c-.96 0-1.738-.698-1.738-1.56Z',
    ],
  },
  WRAP_IN_SECTION: {
    box: 18,
    strokeWidth: 1.2,
    paths: [
      'M9.694 3.717h3.615c.696 0 1.26.555 1.26 1.241v8.845c0 .685-.564 1.164-1.26 1.164H5.25c-.696 0-1.18-.479-1.18-1.164v-6.75M4.031 3.03h3.3a.6.6 0 0 1 .6.6v1.05a.6.6 0 0 1-.6.6h-3.3a.6.6 0 0 1-.6-.6v-1.05a.6.6 0 0 1 .6-.6Z',
    ],
  },
  CHEVRON_DOWN: {
    box: 14,
    strokeWidth: 1,
    paths: ['M11.667 4.667 7.33 9.19a.453.453 0 0 1-.66 0L2.333 4.667'],
  },
  APPS: {
    box: 24,
    strokeWidth: 1.5,
    paths: [
      'M13.5 13.5H21V21h-7.5v-7.5Z',
      'M10.5 10.5H3L6.75 3l3.75 7.5Z',
      'M3 17.25a3.75 3.75 0 1 0 7.5 0 3.75 3.75 0 0 0-7.5 0Z',
      'M17.25 9.91 14.09 6.98c-1.77-1.72.78-5.07 3.16-2.38 2.38-2.69 4.93.66 3.16 2.38l-3.16 2.93Z',
    ],
  },
  INPAINT_BRUSH: {
    box: 24,
    strokeWidth: 1.5,
    paths: [
      'M13.494 14.305a2.6 2.6 0 0 0 .565-.326l1.427-1.144c2.339-1.876 5.134-5.656 6.25-8.437a.98.98 0 0 0-.232-1.101c-.261-.268-.674-.384-1.101-.225-2.774 1.109-6.568 3.918-8.437 6.258l-1.13 1.426a1.9 1.9 0 0 0-.354.608c.144-.014.29 0 .434.008.616.08 1.217.37 1.71.862.484.485.76 1.05.84 1.658.02.138.028.282.028.413m0 0a3.02 3.02 0 0 1-.876 2.136c-.442.442-1.043.746-1.76.84l-1.782.196a1.53 1.53 0 0 1-1.687-1.702l.196-1.782c.173-1.586 1.499-2.6 2.904-2.629.144-.007.297 0 .434.008.616.08 1.217.362 1.71.861.484.486.76 1.05.84 1.659.006.138.021.275.021.413m2.76-2.281a3.43 3.43 0 0 0-3.426-3.426M2.614 15.775c.541 1.624 1.032 1.994 1.032 1.994m-1.453-5.983c-.452 1.082.037 1.9 0 1.901m3.185 5.791c1.38 1.012 2.135 1.14 2.135 1.14M9.71 21c.647-.01 1.188-.01 2.175-.382m1.72-1.253c.875-.657.667-1.42.71-1.595M7.39 6.914c-1.252-.141-1.708.425-1.686.372m4.779 1.045c-.758-.82-1.315-.847-1.315-.847m-5.061.758c-.925.855-1.169 1.563-1.169 1.563',
    ],
  },
  ERASER: {
    box: 24,
    strokeWidth: 1.5,
    paths: [
      'm6.628 11.144 6.213 6.212m-8.132-.888 2.823 2.823a2.424 2.424 0 0 0 3.404 0l8.366-8.366a2.424 2.424 0 0 0 0-3.404l-2.823-2.823a2.424 2.424 0 0 0-3.404 0l-8.366 8.366a2.397 2.397 0 0 0 0 3.404Z',
    ],
  },
  BRUSH_SIZE: {
    box: 24,
    strokeWidth: 0,
    filled: true,
    paths: [
      'M3 5.675A.675.675 0 0 1 3.675 5h16.65a.675.675 0 0 1 0 1.35H3.675A.675.675 0 0 1 3 5.675Zm0 4.949a1.35 1.35 0 0 1 1.35-1.35h15.3a1.35 1.35 0 0 1 0 2.7H4.35A1.35 1.35 0 0 1 3 10.624Zm1.8 4.05a1.8 1.8 0 0 0 0 3.6h14.4a1.8 1.8 0 0 0 0-3.6H4.8Z',
    ],
  },
  UNDO: {
    box: 18,
    strokeWidth: 1.5,
    paths: [
      'M5.347 13.733h6c2.07 0 3.75-1.68 3.75-3.75s-1.68-3.75-3.75-3.75h-8.25M4.822 8.107 2.902 6.187l1.92-1.92',
    ],
  },
  REDO: {
    box: 18,
    strokeWidth: 1.5,
    paths: [
      'M12.652 13.733h-6c-2.07 0-3.75-1.68-3.75-3.75s1.68-3.75 3.75-3.75h8.25m-1.725 1.874 1.92-1.92-1.92-1.92',
    ],
  },
  TEXT_TYPE: {
    box: 36,
    strokeWidth: 2.25,
    paths: ['M4.5 12.485V8.808h16.548v3.677m-8.274-3.677v18.386m-3.677 0h7.354m4.244-6.077H31.5m-6.669-4.941h6.67'],
  },
  REMOVE_BACKGROUND: {
    box: 24,
    strokeWidth: 1.5,
    paths: ['M3 7.5 7.5 3m6.75 0L3 14.25M3 21 21 3m0 6.75L9.75 21M21 16.5 16.5 21'],
  },
} as const satisfies Record<string, EditorGlyph>;

export function EditorIcon({ x, y, glyph, size, color, strokeWidth }: EditorIconProps) {
  const filled = 'filled' in glyph && glyph.filled;
  return (
    <g
      transform={`translate(${x} ${y}) scale(${size / glyph.box})`}
      fill={filled ? color : 'none'}
      stroke={filled ? 'none' : color}
      strokeWidth={strokeWidth ?? glyph.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {glyph.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  );
}

interface HtmlIconProps {
  glyph: EditorGlyph;
  /** Rendered width and height, for HTML contexts that set them. */
  size?: number;
  className?: string;
}

/** The same glyphs as `EditorIcon`, as a standalone `<svg>` for HTML contexts. */
export function HtmlIcon({ glyph, size, className }: HtmlIconProps) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${glyph.box} ${glyph.box}`}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={glyph.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyph.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
