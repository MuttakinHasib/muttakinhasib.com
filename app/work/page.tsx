import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactSection } from '@/components/contact/contact-section';
import { PageTransition } from '@/components/site/page-transition';
import { getCapability } from '@/content/capabilities';
import { otherWork } from '@/content/other-work';
import { projects } from '@/content/projects';
import { caseStudyHref } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Selected work',
  description:
    'Case studies by Muttakin Islam Hasib: ImagineArt App Builder, Generative Fill and Compositor, cocoding.ai, Hashmato, and iGOT.ai.',
  alternates: { canonical: '/work' },
};

export default function WorkPage() {
  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="work-index">
        <header className="shell grid-12 gap-y-6 pb-12 pt-[calc(var(--header-h)+clamp(3rem,10vh,7rem))] lg:pb-20">
          <h1 className="type-hero col-span-4 md:col-span-8">Selected work</h1>
          <p className="type-lead col-span-4 max-w-[40ch] text-graphite md:col-span-4 md:self-end">
            Five case studies: what was hard, what I decided, and what changed.
          </p>
        </header>

        <section aria-label="Case studies" className="shell">
          <ol className="work-list">
            {projects.map((project) => (
              <li key={project.slug} data-tone={project.tone} className="work-row">
                <Link
                  href={caseStudyHref(project.slug)}
                  prefetch
                  transitionTypes={['nav-forward']}
                  className="work-row-link"
                >
                  <span className="work-row-tone" aria-hidden="true" />
                  <span className="work-row-main">
                    <span className="type-title work-row-title">{project.title}</span>
                    <span className="work-row-summary">{project.summary}</span>
                  </span>
                  <span className="work-row-meta type-small">
                    <span>{project.company}</span>
                    <span>{project.role}</span>
                    <span>{project.period}</span>
                    <span className="text-graphite">
                      {project.capabilities.map((id) => getCapability(id).name).join(', ')}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="other-work-title" className="other-work">
          <div className="shell grid-12 gap-y-8">
            <div className="col-span-4 md:col-span-4">
              <h2 id="other-work-title" className="type-title">
                Other work
              </h2>
              <p className="type-small mt-3 max-w-[32ch] text-graphite">
                Projects from my resume without a full case study.
              </p>
            </div>
            <ul className="col-span-4 grid gap-x-8 gap-y-8 md:col-span-8 md:grid-cols-2">
              {otherWork.map((item) => (
                <li key={item.title} className="other-work-item">
                  <p className="type-mono text-graphite">{item.company}</p>
                  <h3 className="type-heading mt-1">{item.title}</h3>
                  <p className="type-small mt-2 text-graphite">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <ContactSection />
    </PageTransition>
  );
}
