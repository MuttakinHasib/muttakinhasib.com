import type { JSX } from 'react';
import { ProjectSlug } from '@/content/types';
import { AppBuilderVisual } from './app-builder-visual';
import { CocodingVisual } from './cocoding-visual';
import { GenerativeFillVisual } from './generative-fill-visual';
import { HashmatoVisual } from './hashmato-visual';
import { IgotVisual } from './igot-visual';

interface ProjectVisualProps {
  slug: ProjectSlug;
}

const visuals: Record<ProjectSlug, () => JSX.Element> = {
  [ProjectSlug.APP_BUILDER]: AppBuilderVisual,
  [ProjectSlug.GENERATIVE_FILL]: GenerativeFillVisual,
  [ProjectSlug.COCODING]: CocodingVisual,
  [ProjectSlug.HASHMATO]: HashmatoVisual,
  [ProjectSlug.IGOT]: IgotVisual,
};

export function ProjectVisual({ slug }: ProjectVisualProps) {
  const Visual = visuals[slug];
  return <Visual />;
}
