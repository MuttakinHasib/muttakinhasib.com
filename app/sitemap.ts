import type { MetadataRoute } from 'next';
import { projects } from '@/content/projects';
import { absoluteUrl, caseStudyHref } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl('/'), changeFrequency: 'monthly', priority: 1 },
    { url: absoluteUrl('/work'), changeFrequency: 'monthly', priority: 0.9 },
    ...projects.map((project) => ({
      url: absoluteUrl(caseStudyHref(project.slug)),
      changeFrequency: 'yearly' as const,
      priority: 0.8,
    })),
    { url: absoluteUrl('/about'), changeFrequency: 'yearly', priority: 0.7 },
  ];
}
