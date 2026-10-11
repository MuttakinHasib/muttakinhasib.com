import { findProject, projects } from '@/content/projects';
import { ogSize, renderOgCard } from '@/lib/og';

interface SlugParams {
  slug: string;
}

interface ImageProps {
  params: Promise<SlugParams>;
}

export const alt = 'Case study by Muttakin Islam Hasib';
export const size = ogSize;
export const contentType = 'image/png';

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const project = findProject(slug);
  return renderOgCard({
    kicker: project ? `Case study, ${project.company}` : 'Case study',
    title: project?.title ?? 'Selected work',
    subtitle: project?.summary ?? 'Muttakin Islam Hasib, Senior Full Stack Engineer.',
  });
}
