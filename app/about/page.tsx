import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactSection } from '@/components/contact/ContactSection';
import { TeamsDiagram } from '@/components/home/TeamsDiagram';
import { JsonLd } from '@/components/site/JsonLd';
import { PageTransition } from '@/components/site/PageTransition';
import { education, experience } from '@/content/experience';
import { profile } from '@/content/profile';
import { getProject } from '@/content/projects';
import { profilePageSchema } from '@/lib/schema';
import { caseStudyHref } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Muttakin Islam Hasib is a Senior Full Stack Engineer in Dhaka with 7+ years building AI products, node-based editors, and multi-tenant platforms for remote teams in the US, Singapore, France, and Vietnam.',
  alternates: { canonical: '/about' },
};

const principles = [
  {
    title: 'Own it end to end',
    body: 'I take features from the first sketch to production: rendering in the browser, the API, the database, and the CI/CD that ships it. Fewer handoffs means fewer places for a product to go wrong.',
    evidence: 'Frontend from first commit to production at cocoding.ai; payment, delivery, and pricing services at Hashmato.',
  },
  {
    title: 'Treat performance as design',
    body: 'A canvas that stutters or a page that loads slowly is a design problem, not a later optimisation. I measure, then fix what the numbers point at.',
    evidence: '~20% faster canvas rendering at ImagineArt; 80% web performance improvement at cocoding.ai.',
  },
  {
    title: 'Make complex systems legible',
    body: 'Graphs, agents, and distributed services are hard to reason about. The interface should show what the system is doing: which nodes feed which, what ran, what failed.',
    evidence: 'Reachability-based app planning, live agent timelines, and edge-to-execution-order sync.',
  },
  {
    title: 'Lead by raising the floor',
    body: 'As a manager I focused on the things that make every engineer faster: shared build and delivery standards, quality gates, architecture walkthroughs, and reviews.',
    evidence: 'Managed and mentored 7 engineers across 5 products at iGOT.ai.',
  },
];

const skills = [
  { group: 'Languages', items: 'TypeScript, JavaScript, Python, SQL, HTML, CSS' },
  {
    group: 'Frontend',
    items: 'React, Next.js (App Router, Server Components), React Flow, Konva, HTML Canvas, Monaco Editor, xterm.js, ELK.js, TipTap, Three.js, GSAP, Framer Motion, Tailwind CSS',
  },
  { group: 'State and data', items: 'Zustand, Redux, TanStack Query, React Hook Form, Zod' },
  { group: 'Backend', items: 'Node.js, NestJS, Express, FastAPI, REST, OpenAPI, WebSockets, SSE, Socket.io, BullMQ, OAuth2, RBAC' },
  { group: 'Databases', items: 'PostgreSQL, MongoDB, Redis, TypeORM, Prisma, Mongoose' },
  { group: 'AI and workflows', items: 'LLM integration (GPT-4, Claude, Gemini, Llama 3), RAG, AI agents, multi-agent workflows, CrewAI' },
  { group: 'Cloud and DevOps', items: 'Docker, Kubernetes, Helm, GitHub Actions, Jenkins, Terraform, AWS (EC2, S3, EKS, RDS), NGINX, Vercel' },
  { group: 'Mobile and desktop', items: 'React Native, Expo, Flutter, Electron' },
];

export default function AboutPage() {
  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="about-page">
        <header className="shell grid-12 gap-y-10 pb-16 pt-[calc(var(--header-h)+clamp(3rem,10vh,7rem))] lg:pb-24">
          <div className="col-span-4 md:col-span-12 lg:col-span-7">
            <h1 className="type-hero">About</h1>
            <div className="mt-10 grid max-w-[62ch] gap-5">
              <p className="type-lead">
                I’m Muttakin Islam Hasib, a senior full stack engineer based in Dhaka, Bangladesh, open to remote
                roles.
              </p>
              <p>
                Since 2018 I’ve built products where the difficult part sits behind the interface: node-based
                workflow editors, AI image and video tools, browser IDEs, AI agent platforms, and multi-tenant SaaS
                backends with payments and partner integrations.
              </p>
              <p>
                I enjoy the problems where frontend and backend can’t be solved separately. A graph editor needs an
                execution engine that agrees with it. An AI tool needs an interface that stays responsive while a
                model works. A point-of-sale system needs every tenant’s money to reconcile.
              </p>
              <p>
                I’ve shipped that kind of work remotely with teams in the US, Singapore, France, and Vietnam, and led
                a team of seven engineers as an engineering manager at iGOT.ai.
              </p>
              <p>
                <a href={profile.resume} className="wire-link" rel="noopener" target="_blank">
                  Read my resume
                  <span className="sr-only"> (PDF, opens in a new tab)</span>
                  <span className="wire" aria-hidden="true" />
                </a>
              </p>
            </div>
          </div>
          <div className="col-span-4 md:col-span-10 lg:col-span-5 lg:self-end">
            <TeamsDiagram />
          </div>
        </header>

        <section aria-labelledby="principles-title" className="about-principles">
          <div className="shell">
            <h2 id="principles-title" className="type-display">
              How I work
            </h2>
            <ul className="principles-grid">
              {principles.map((principle) => (
                <li key={principle.title} className="principle">
                  <h3 className="type-heading">{principle.title}</h3>
                  <p className="mt-3">{principle.body}</p>
                  <p className="type-small mt-4 text-graphite">
                    <span className="principle-port" aria-hidden="true" />
                    {principle.evidence}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="experience-title" className="about-experience">
          <div className="shell grid-12 gap-y-10">
            <h2 id="experience-title" className="type-display col-span-4 md:col-span-12 lg:col-span-4">
              Experience
            </h2>
            <ol className="timeline col-span-4 md:col-span-12 lg:col-span-8">
              {experience.map((item) => (
                <li key={item.company} className="timeline-item">
                  <span className="timeline-port" aria-hidden="true" />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h3 className="type-title">{item.company}</h3>
                    <p className="type-small text-graphite">{item.location}</p>
                  </div>
                  {item.context ? <p className="type-small mt-1 text-graphite">{item.context}</p> : null}
                  {item.roles.map((role) => (
                    <div key={role.title} className="mt-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-6">
                        <p className="font-[600]">{role.title}</p>
                        <p className="type-small tabular-nums text-graphite">{role.period}</p>
                      </div>
                      <ul className="cs-list mt-3">
                        {role.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {item.caseStudies.length > 0 ? (
                    <p className="type-small mt-5 flex flex-wrap gap-x-5">
                      {item.caseStudies.map((slug) => (
                        <Link
                          key={slug}
                          href={caseStudyHref(slug)}
                          transitionTypes={['nav-forward']}
                          className="capability-link"
                        >
                          {getProject(slug).shortTitle} case study
                        </Link>
                      ))}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="skills-title" className="about-skills">
          <div className="shell grid-12 gap-y-10">
            <div className="col-span-4 md:col-span-12 lg:col-span-4">
              <h2 id="skills-title" className="type-display">
                Toolbox
              </h2>
              <p className="type-small mt-4 max-w-[34ch] text-graphite">
                The full list from my resume. The case studies show where each tool earned its place.
              </p>
            </div>
            <dl className="skills-list col-span-4 md:col-span-12 lg:col-span-8">
              {skills.map((skill) => (
                <div key={skill.group}>
                  <dt className="font-[600]">{skill.group}</dt>
                  <dd className="text-graphite">{skill.items}</dd>
                </div>
              ))}
            </dl>

            <h2 className="type-title col-span-4 md:col-span-12 lg:col-span-4">Education</h2>
            <ul className="col-span-4 grid gap-5 md:col-span-12 lg:col-span-8">
              {education.map((item) => (
                <li key={item.degree}>
                  <p className="font-[600]">{item.degree}</p>
                  <p className="type-small text-graphite">
                    {item.school}. {item.note}.
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <ContactSection />
      <JsonLd data={profilePageSchema()} />
    </PageTransition>
  );
}
