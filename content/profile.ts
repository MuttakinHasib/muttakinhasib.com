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
    'Senior Full Stack Engineer with 7+ years building AI products, node-based workflow editors, and multi-tenant SaaS with TypeScript, React, Next.js, and NestJS.',
  teams: [
    { place: 'United States', companies: 'ImagineArt, BeWeddy' },
    { place: 'Singapore', companies: 'Hashmato' },
    { place: 'France', companies: 'cocoding.ai' },
    { place: 'Vietnam', companies: 'iGOT.ai' },
  ],
} as const;

/**
 * Bio copy, single-sourced so the load-bearing facts (Dhaka, seven years,
 * teams in the US/Singapore/France/Vietnam, EM of seven at iGOT.ai) can't
 * drift between the home intro and the About page.
 */
export const bioIntro = [
  'I’m a senior full stack engineer in Dhaka, Bangladesh. For more than seven years I’ve worked on products where the difficult part hides behind the interface.',
  'Workflow editors with dozens of node types. AI tools that have to respond while a model is still working. Multi-tenant backends where every tenant brings its own payment provider. I like these problems because the frontend and the backend can’t be solved separately.',
  'I take features from the first idea to production: rendering performance in the browser, the API behind it, the database, and the pipeline that ships it. I’ve done that remotely with teams in the US, Singapore, France, and Vietnam, and as an engineering manager leading seven engineers at iGOT.ai.',
] as const;

export const bioAbout = [
  'I’m Muttakin Islam Hasib, a senior full stack engineer based in Dhaka, Bangladesh, open to remote roles.',
  'Since 2018 I’ve built products where the difficult part sits behind the interface: node-based workflow editors, AI image and video tools, browser IDEs, AI agent platforms, and multi-tenant SaaS backends with payments and partner integrations.',
  'I enjoy the problems where frontend and backend can’t be solved separately. A graph editor needs an execution engine that agrees with it. An AI tool needs an interface that stays responsive while a model works. A point-of-sale system needs every tenant’s money to reconcile.',
  'I’ve shipped that kind of work remotely with teams in the US, Singapore, France, and Vietnam, and led a team of seven engineers as an engineering manager at iGOT.ai.',
] as const;

export const contactLinks = [
  { label: 'Email', value: profile.email, href: `mailto:${profile.email}` },
  { label: 'LinkedIn', value: 'linkedin.com/in/muttakinhasib', href: profile.linkedin },
  { label: 'GitHub', value: 'github.com/MuttakinHasib', href: profile.github },
] as const;
