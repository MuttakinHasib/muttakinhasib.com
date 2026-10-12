export const profile = {
  name: 'Muttakin Islam Hasib',
  shortName: 'Muttakin Hasib',
  title: 'Senior Full Stack Engineer',
  experience: '7+ years',
  location: 'Dhaka, Bangladesh',
  timezone: 'GMT+6',
  availability: 'Open to remote roles',
  url: 'https://muttakinhasib.com',
  email: 'muttakinislamhasib@gmail.com',
  github: 'https://github.com/MuttakinHasib',
  linkedin: 'https://linkedin.com/in/muttakinhasib',
  /** Served from public/; rebuild it in the Resume repo and copy it over when the resume changes. */
  resume: '/Muttakin_Islam_Hasib_Resume.pdf',
  focus: ['AI products', 'Interactive systems', 'Full stack engineering'],
  headline: 'I turn complex systems into intuitive experiences.',
  intro:
    'Senior Full Stack Engineer building AI products, high-performance interactive interfaces, and scalable systems from concept to production.',
  description:
    'Senior Full Stack Engineer with 7+ years building AI products, node-based workflow editors, and multi-tenant SaaS platforms with TypeScript, React, Next.js, Node.js, and NestJS.',
  teams: [
    { place: 'United States', companies: 'ImagineArt, BeWeddy' },
    { place: 'Singapore', companies: 'Hashmato' },
    { place: 'France', companies: 'cocoding.ai' },
    { place: 'Vietnam', companies: 'iGOT.ai' },
  ],
} as const;

export const contactLinks = [
  { label: 'Email', value: profile.email, href: `mailto:${profile.email}` },
  { label: 'LinkedIn', value: 'linkedin.com/in/muttakinhasib', href: profile.linkedin },
  { label: 'GitHub', value: 'github.com/MuttakinHasib', href: profile.github },
] as const;
