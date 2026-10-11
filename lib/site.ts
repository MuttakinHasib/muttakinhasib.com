import { profile } from '@/content/profile';

export const siteUrl = profile.url;

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl).toString();
}

export function caseStudyHref(slug: string): string {
  return `/work/${slug}`;
}

export const navigation = [
  { label: 'Work', href: '/work' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/#contact' },
] as const;
