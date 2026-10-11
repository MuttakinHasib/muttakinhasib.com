import { capabilities } from '@/content/capabilities';
import { profile } from '@/content/profile';
import type { Project } from '@/content/types';
import { absoluteUrl, caseStudyHref, siteUrl } from './site';

const personId = `${siteUrl}/#person`;
const websiteId = `${siteUrl}/#website`;

export function personSchema() {
  return {
    '@type': 'Person',
    '@id': personId,
    name: profile.name,
    jobTitle: profile.title,
    description: profile.description,
    url: siteUrl,
    email: `mailto:${profile.email}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Dhaka',
      addressCountry: 'BD',
    },
    sameAs: [profile.github, profile.linkedin],
    knowsAbout: capabilities.flatMap((capability) => capability.tools),
    alumniOf: {
      '@type': 'EducationalOrganization',
      name: 'Model Institute of Science & Technology',
    },
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': websiteId,
    url: siteUrl,
    name: profile.name,
    inLanguage: 'en',
    author: { '@id': personId },
  };
}

export function profilePageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: absoluteUrl('/about'),
    mainEntity: { '@id': personId },
    isPartOf: { '@id': websiteId },
  };
}

export function caseStudySchema(project: Project) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    headline: project.title,
    description: project.seoDescription,
    url: absoluteUrl(caseStudyHref(project.slug)),
    author: { '@id': personId },
    creator: { '@id': personId },
    isPartOf: { '@id': websiteId },
    about: project.company,
    keywords: project.stack.join(', '),
  };
}
