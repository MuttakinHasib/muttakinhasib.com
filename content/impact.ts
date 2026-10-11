import { ProjectSlug } from './types';

export const Emphasis = {
  LEAD: 'lead',
  SUPPORT: 'support',
} as const;
export type Emphasis = (typeof Emphasis)[keyof typeof Emphasis];

export interface ImpactEntry {
  value: string;
  claim: string;
  context: string;
  project: ProjectSlug;
  source: string;
  emphasis: Emphasis;
}

export const impact: ImpactEntry[] = [
  {
    value: '~20%',
    claim: 'faster canvas rendering',
    context:
      'Zoom-aware image loading across 6 resolution tiers, plus identity-based memoization of node renders. The live canvas now pans and zooms at 120 fps on a 120 Hz display (median frame 8.3 ms, measured).',
    project: ProjectSlug.APP_BUILDER,
    source: 'ImagineArt Workflows',
    emphasis: Emphasis.LEAD,
  },
  {
    value: '80%',
    claim: 'web performance improvement',
    context:
      'Code splitting, dynamic imports, critical-CSS inlining, and re-render profiling. Lighthouse: 100 SEO, 100 Accessibility, 91 Performance.',
    project: ProjectSlug.COCODING,
    source: 'cocoding.ai',
    emphasis: Emphasis.LEAD,
  },
  {
    value: '100M+',
    claim: 'users on the platform I shipped into',
    context: 'ImagineArt’s reach across web and mobile. A measure of scale, not of users I acquired.',
    project: ProjectSlug.APP_BUILDER,
    source: 'ImagineArt',
    emphasis: Emphasis.SUPPORT,
  },
  {
    value: '1,567',
    claim: 'commits to ImagineArt’s web app in 7 months',
    context: 'The most of 33 contributors between Feb and Sep 2026, more than twice the next.',
    project: ProjectSlug.APP_BUILDER,
    source: 'ImagineArt',
    emphasis: Emphasis.SUPPORT,
  },
  {
    value: '7',
    claim: 'engineers managed and mentored',
    context: 'Across 5 AI and Web3 products, with shared CI/CD and quality gates.',
    project: ProjectSlug.IGOT,
    source: 'iGOT.ai',
    emphasis: Emphasis.SUPPORT,
  },
  {
    value: '16',
    claim: 'languages',
    context: 'The platform and its MDX blog, localized with next-intl, JSON-LD, and hreflang.',
    project: ProjectSlug.COCODING,
    source: 'cocoding.ai',
    emphasis: Emphasis.SUPPORT,
  },
];
