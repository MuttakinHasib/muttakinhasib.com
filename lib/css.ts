import type { CSSProperties } from 'react';

export type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

/** Typed helper for CSS custom properties in `style`: `vars({ delay: '300ms' })`. */
export function vars(values: Record<string, string | number>): CSSVars {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [`--${key}`, value])) as CSSVars;
}
