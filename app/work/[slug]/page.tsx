import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense, ViewTransition } from 'react';
import { CaseStudyDemo } from '@/components/case-study/CaseStudyDemo';
import { CocodingWorkspace } from '@/components/case-study/CocodingWorkspace';
import { CaseStudyExtras } from '@/components/case-study/CaseStudyExtras';
import { CaseSection, NoteList } from '@/components/case-study/CaseSection';
import { ContactSection } from '@/components/contact/ContactSection';
import { MetricList } from '@/components/home/SelectedWork';
import { JsonLd } from '@/components/site/JsonLd';
import { PageTransition } from '@/components/site/PageTransition';
import { ProjectVisual } from '@/components/visuals/ProjectVisual';
import { findProject, getNextProject, getProject, projects } from '@/content/projects';
import { ProjectSlug, ProjectTone } from '@/content/types';
import { caseStudySchema } from '@/lib/schema';
import { caseStudyHref } from '@/lib/site';

const darkTones = new Set<string>([ProjectTone.SIGNAL, ProjectTone.STREAM]);

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps<'/work/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) return {};
  const path = caseStudyHref(project.slug);
  return {
    title: `${project.title} case study`,
    description: project.seoDescription,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      url: path,
      title: `${project.title}: case study`,
      description: project.seoDescription,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${project.title}: case study`,
      description: project.seoDescription,
    },
  };
}

interface CaseStudyProps {
  params: PageProps<'/work/[slug]'>['params'];
}

export default function CaseStudyPage({ params }: PageProps<'/work/[slug]'>) {
  return (
    <PageTransition>
      <Suspense fallback={<CaseStudyFallback />}>
        <CaseStudy params={params} />
      </Suspense>
      <ContactSection />
    </PageTransition>
  );
}

/** Shown only when a navigation beats its prefetch; direct visits get the prerendered page. */
function CaseStudyFallback() {
  return (
    <main id="main" tabIndex={-1} className="case-study" aria-busy="true">
      <div className="cs-hero bg-paper">
        <div className="shell pt-[calc(var(--header-h)+clamp(2rem,6vh,4rem))]">
          <p className="type-small text-graphite" role="status">
            Loading case study…
          </p>
          <div className="cs-skeleton mt-10" />
        </div>
      </div>
    </main>
  );
}

async function CaseStudy({ params }: CaseStudyProps) {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) notFound();

  const next = getNextProject(project.slug);
  const related = project.related.map(getProject);
  const dark = darkTones.has(project.tone);

  return (
    <>
      <main id="main" tabIndex={-1} data-tone={project.tone} className="case-study">
        <header
          className={`cs-hero ${project.tone === ProjectTone.STREAM ? 'bg-editor' : dark ? 'bg-ink' : 'bg-paper'}`}
          data-theme={dark ? 'dark' : undefined}
        >
          <div className="shell pt-[calc(var(--header-h)+clamp(2rem,6vh,4rem))]">
            <nav aria-label="Breadcrumb" className="type-small">
              <ol className="cs-breadcrumb">
                <li>
                  <Link href="/work" transitionTypes={['nav-back']}>
                    Work
                  </Link>
                </li>
                <li aria-current="page">{project.shortTitle}</li>
              </ol>
            </nav>
            <div className="grid-12 mt-8 gap-y-8">
              <div className="col-span-4 md:col-span-12 lg:col-span-9">
                <ViewTransition name={`project-title-${project.slug}`} share="project-morph" default="none">
                  <h1 className="type-display feature-title">{project.title}</h1>
                </ViewTransition>
                <p className="type-lead mt-6 max-w-[52ch]">{project.summary}</p>
              </div>
            </div>
            <dl className="cs-facts">
              <div>
                <dt>Company</dt>
                <dd>
                  {project.company}
                  <span className="cs-fact-note">{project.companyContext}</span>
                </dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{project.role}</dd>
              </div>
              <div>
                <dt>Period</dt>
                <dd>{project.period}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{project.location}</dd>
              </div>
            </dl>
            <div className="cs-hero-visual">
              <ViewTransition name={`project-visual-${project.slug}`} share="project-morph" default="none">
                <div>
                  {project.slug === ProjectSlug.COCODING ? <CocodingWorkspace /> : <ProjectVisual slug={project.slug} />}
                </div>
              </ViewTransition>
              <p className="type-small mt-3 opacity-75">Original reconstruction for this portfolio.</p>
            </div>
          </div>
        </header>

        <CaseSection id="overview" title="Overview">
          {project.overview.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </CaseSection>

        <CaseSection id="context" title="Context and problem">
          {project.context.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </CaseSection>

        <CaseSection id="role" title="My role and ownership">
          <div className={`cs-ownership ${project.led ? 'cs-ownership-split' : ''}`}>
            <div>
              <h3 className="cs-subhead">
                <span className="cs-port" aria-hidden="true" />
                What I built
              </h3>
              <ul className="cs-list">
                {project.built.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            {project.led ? (
              <div>
                <h3 className="cs-subhead">
                  <span className="cs-port cs-port-open" aria-hidden="true" />
                  What I led
                </h3>
                <ul className="cs-list">
                  {project.led.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </CaseSection>

        <CaseSection id="challenges" title="Challenges">
          <NoteList notes={project.challenges} />
        </CaseSection>

        <CaseSection id="decisions" title="Design and architecture decisions">
          <NoteList notes={project.decisions} variant="decision" />
        </CaseSection>

        <CaseSection id="implementation" title="Selected implementation details" wide>
          <CaseStudyDemo slug={project.slug} />
          <NoteList notes={project.implementation} variant="compact" />
        </CaseSection>

        <CaseStudyExtras slug={project.slug} />

        <CaseSection id="outcomes" title="Outcomes">
          <MetricList metrics={project.outcomes} className="cs-metrics" />
          <p className="type-small mt-8 text-graphite">
            Figures come from my resume. Where a number describes the product rather than my work, the context says
            so.
          </p>
        </CaseSection>

        <CaseSection id="technologies" title="Technologies">
          <ul className="cs-stack">
            {project.stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CaseSection>

        <CaseSection id="related" title="Related projects">
          <ul className="cs-related">
            {related.map((item) => (
              <li key={item.slug} data-tone={item.tone}>
                <Link
                  href={caseStudyHref(item.slug)}
                  prefetch
                  transitionTypes={['nav-forward']}
                  className="cs-related-link"
                >
                  <span className="type-mono text-graphite">{item.company}</span>
                  <span className="type-heading">{item.title}</span>
                  <span className="type-small text-graphite">{item.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </CaseSection>

        <nav aria-label="Next case study" className="cs-next" data-tone={next.tone}>
          <div className="shell">
            <Link href={caseStudyHref(next.slug)} prefetch transitionTypes={['nav-forward']} className="cs-next-link">
              <span className="type-small text-graphite">Next case study</span>
              <span className="type-display">{next.title}</span>
              <span className="wire-link" aria-hidden="true">
                {next.company}, {next.period}
                <span className="wire" />
              </span>
            </Link>
          </div>
        </nav>
      </main>
      <JsonLd data={caseStudySchema(project)} />
    </>
  );
}
