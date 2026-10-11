import type { JSX } from 'react';
import { ProjectSlug } from '@/content/types';
import { AppBuilderVisual } from './AppBuilderVisual';
import { CocodingVisual } from './CocodingVisual';
import { GenerativeFillVisual } from './GenerativeFillVisual';
import { HashmatoVisual } from './HashmatoVisual';
import { IgotVisual } from './IgotVisual';

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
