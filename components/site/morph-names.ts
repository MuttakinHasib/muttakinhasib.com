import type { ProjectSlug } from '@/content/types';

/**
 * Shared-element morph names for the project title and visual <ViewTransition>s.
 * The home card and the case-study hero must produce identical strings for the
 * same project, or the morph silently fails to pair — so both sides import
 * these instead of typing the template.
 */

export function projectTitleMorphName(slug: ProjectSlug): string {
  return `project-title-${slug}`;
}

export function projectVisualMorphName(slug: ProjectSlug): string {
  return `project-visual-${slug}`;
}
