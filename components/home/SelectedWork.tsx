import Link from 'next/link';
import { type JSX, ViewTransition } from 'react';
import { projects } from '@/content/projects';
import { type Metric, type Project, ProjectSlug } from '@/content/types';
import { ProjectVisual } from '@/components/visuals/ProjectVisual';
import { caseStudyHref } from '@/lib/site';

interface FeatureProps {
  project: Project;
}

interface MetricListProps {
  metrics: Metric[];
  className?: string;
}

/** Each project gets its own composition; the shared pieces below keep the system coherent. */
const FeatureLayout = {
  SPLIT_DARK: 'split-dark',
  VISUAL_FIRST: 'visual-first',
  STAGE: 'stage',
  SYSTEM: 'system',
  BUILT_LED: 'built-led',
} as const;
type FeatureLayout = (typeof FeatureLayout)[keyof typeof FeatureLayout];

const layoutBySlug: Record<ProjectSlug, FeatureLayout> = {
  [ProjectSlug.APP_BUILDER]: FeatureLayout.SPLIT_DARK,
  [ProjectSlug.GENERATIVE_FILL]: FeatureLayout.VISUAL_FIRST,
  [ProjectSlug.COCODING]: FeatureLayout.STAGE,
  [ProjectSlug.HASHMATO]: FeatureLayout.SYSTEM,
  [ProjectSlug.IGOT]: FeatureLayout.BUILT_LED,
};

export function ProjectTitle({ project }: FeatureProps) {
  return (
    <ViewTransition name={`project-title-${project.slug}`} share="project-morph" default="none">
      <h3 className="type-display feature-title">
        <Link
          href={caseStudyHref(project.slug)}
          prefetch
          transitionTypes={['nav-forward']}
          className="feature-title-link"
        >
          {project.title}
        </Link>
      </h3>
    </ViewTransition>
  );
}

function FeatureMeta({ project }: FeatureProps) {
  return (
    <p className="feature-meta type-small">
      <span>{project.company}</span>
      <span>{project.role}</span>
      <span>{project.period}</span>
    </p>
  );
}

function FeatureVisual({ project }: FeatureProps) {
  return (
    <ViewTransition name={`project-visual-${project.slug}`} share="project-morph" default="none">
      <Link
        href={caseStudyHref(project.slug)}
        transitionTypes={['nav-forward']}
        className="feature-visual"
        aria-label={`Open the ${project.shortTitle} case study`}
        tabIndex={-1}
      >
        <ProjectVisual slug={project.slug} />
      </Link>
    </ViewTransition>
  );
}

function Highlights({ project }: FeatureProps) {
  return (
    <ul className="feature-highlights">
      {project.highlights.map((highlight) => (
        <li key={highlight}>{highlight}</li>
      ))}
    </ul>
  );
}

export function MetricList({ metrics, className }: MetricListProps) {
  return (
    <dl className={`feature-metrics ${className ?? ''}`}>
      {metrics.map((metric) => (
        <div key={metric.label} className="feature-metric">
          <dt>
            <span className="type-figure feature-metric-value">{metric.value}</span>
            <span className="feature-metric-label">{metric.label}</span>
          </dt>
          <dd className="type-small feature-metric-context">{metric.context}</dd>
        </div>
      ))}
    </dl>
  );
}

function CaseStudyLink({ project }: FeatureProps) {
  return (
    <Link href={caseStudyHref(project.slug)} transitionTypes={['nav-forward']} className="wire-link">
      Read the case study
      <span className="sr-only">: {project.shortTitle}</span>
      <span className="wire" aria-hidden="true" />
    </Link>
  );
}

function SplitDark({ project }: FeatureProps) {
  return (
    <article id={project.slug} data-theme="dark" data-tone={project.tone} className="feature feature-split-dark">
      <div className="shell grid-12 gap-y-10 lg:grid-rows-[auto_1fr]">
        <div className="col-span-4 md:col-span-8 lg:col-span-4 lg:row-start-1 lg:pt-4">
          <ProjectTitle project={project} />
          <FeatureMeta project={project} />
        </div>
        <div className="col-span-4 md:col-span-12 lg:col-span-8 lg:col-start-5 lg:row-span-2 lg:row-start-1 lg:-mr-[var(--gutter)]">
          <FeatureVisual project={project} />
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-4 lg:row-start-2">
          <p className="type-lead text-paper">{project.summary}</p>
          <Highlights project={project} />
          <MetricList metrics={project.outcomes.slice(0, 2)} className="mt-10" />
          <div className="mt-8">
            <CaseStudyLink project={project} />
          </div>
        </div>
      </div>
    </article>
  );
}

function VisualFirst({ project }: FeatureProps) {
  return (
    <article id={project.slug} data-tone={project.tone} className="feature feature-visual-first">
      <div className="shell grid-12 gap-y-10 lg:grid-rows-[1fr_auto_auto_1fr]">
        <div className="col-span-4 md:col-span-8 lg:col-span-4 lg:col-start-9 lg:row-start-2">
          <ProjectTitle project={project} />
          <FeatureMeta project={project} />
        </div>
        <div className="col-span-4 md:col-span-12 lg:col-span-8 lg:col-start-1 lg:row-span-4 lg:row-start-1 lg:-ml-[var(--gutter)]">
          <FeatureVisual project={project} />
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-4 lg:col-start-9 lg:row-start-3">
          <p className="type-lead">{project.summary}</p>
          <Highlights project={project} />
          <div className="mt-8">
            <CaseStudyLink project={project} />
          </div>
        </div>
      </div>
    </article>
  );
}

function Stage({ project }: FeatureProps) {
  return (
    <article id={project.slug} data-theme="dark" data-tone={project.tone} className="feature feature-stage">
      <div className="shell">
        <div className="grid-12 gap-y-6">
          <div className="col-span-4 md:col-span-12 lg:col-span-9">
            <ProjectTitle project={project} />
            <FeatureMeta project={project} />
          </div>
        </div>
        <div className="mt-10 lg:mt-14">
          <FeatureVisual project={project} />
        </div>
        <div className="grid-12 mt-10 gap-y-8 lg:mt-14">
          <p className="col-span-4 type-lead text-paper md:col-span-6 lg:col-span-4">{project.summary}</p>
          <div className="col-span-4 md:col-span-6 lg:col-span-4">
            <Highlights project={project} />
          </div>
          <div className="col-span-4 md:col-span-12 lg:col-span-4">
            <MetricList metrics={project.outcomes.slice(0, 2)} />
            <div className="mt-6">
              <CaseStudyLink project={project} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function SystemLayout({ project }: FeatureProps) {
  return (
    <article id={project.slug} data-tone={project.tone} className="feature feature-system">
      <div className="shell grid-12 gap-y-10 lg:grid-rows-[auto_1fr]">
        <div className="col-span-4 md:col-span-8 lg:col-span-4 lg:row-start-1">
          <ProjectTitle project={project} />
          <FeatureMeta project={project} />
        </div>
        <div className="col-span-4 md:col-span-12 lg:col-span-8 lg:col-start-5 lg:row-span-2 lg:row-start-1">
          <FeatureVisual project={project} />
          <MetricList metrics={project.outcomes.slice(0, 3)} className="feature-metrics-row mt-10" />
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-4 lg:row-start-2">
          <p className="type-lead">{project.summary}</p>
          <Highlights project={project} />
          <div className="mt-8">
            <CaseStudyLink project={project} />
          </div>
        </div>
      </div>
    </article>
  );
}

function BuiltLed({ project }: FeatureProps) {
  return (
    <article id={project.slug} data-tone={project.tone} className="feature feature-built-led">
      <div className="shell">
        <div className="grid-12 gap-y-6">
          <div className="col-span-4 md:col-span-12 lg:col-span-8">
            <ProjectTitle project={project} />
            <FeatureMeta project={project} />
          </div>
          <p className="col-span-4 type-lead md:col-span-8 lg:col-span-4 lg:self-end">{project.summary}</p>
        </div>
        <div className="grid-12 mt-10 gap-y-10 lg:mt-14">
          <div className="col-span-4 md:col-span-12 lg:col-span-7">
            <FeatureVisual project={project} />
          </div>
          <div className="col-span-4 grid gap-8 md:col-span-12 md:grid-cols-2 lg:col-span-5 lg:grid-cols-1 lg:content-start">
            <section aria-label="What I built">
              <h4 className="feature-split-label">
                <span className="feature-split-port" aria-hidden="true" />I built
              </h4>
              <ul className="feature-highlights mt-3">
                {project.built.slice(0, 2).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section aria-label="What I led">
              <h4 className="feature-split-label">
                <span className="feature-split-port" data-led aria-hidden="true" />I led
              </h4>
              <ul className="feature-highlights mt-3">
                {(project.led ?? []).slice(0, 2).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <div>
              <CaseStudyLink project={project} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

const renderers: Record<FeatureLayout, (props: FeatureProps) => JSX.Element> = {
  [FeatureLayout.SPLIT_DARK]: SplitDark,
  [FeatureLayout.VISUAL_FIRST]: VisualFirst,
  [FeatureLayout.STAGE]: Stage,
  [FeatureLayout.SYSTEM]: SystemLayout,
  [FeatureLayout.BUILT_LED]: BuiltLed,
};

export function SelectedWork() {
  return (
    <section id="work" aria-labelledby="work-title" className="selected-work">
      <div className="shell grid-12 gap-y-6 pb-16 pt-24 lg:pb-24 lg:pt-36">
        <h2 id="work-title" className="type-display col-span-4 md:col-span-7">
          Selected work
        </h2>
        <p className="type-lead col-span-4 max-w-[38ch] text-graphite md:col-span-5 md:self-end">
          Five systems where the hard part sits below the interface, and the interface still has to make it
          feel simple.
        </p>
      </div>
      {projects.map((project) => {
        const Feature = renderers[layoutBySlug[project.slug]];
        return <Feature key={project.slug} project={project} />;
      })}
    </section>
  );
}
