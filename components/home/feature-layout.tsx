import Link from 'next/link';
import { type JSX, ViewTransition } from 'react';
import { MetricList } from '@/components/ui/metric-list';
import { ProjectVisual } from '@/components/visuals/project-visual';
import { type Project, ProjectSlug, isDarkTone } from '@/content/types';
import { caseStudyHref } from '@/lib/site';
import { projectTitleMorphName, projectVisualMorphName } from '@/components/site/morph-names';

/**
 * The homepage feature compositions. One module, one interface
 * (<FeatureLayout project />), five variants in the implementation — the grid
 * choreography lives here so the shared pieces below stay coherent.
 */

interface ProjectProps {
  project: Project;
}

interface SummaryProps extends ProjectProps {
  dark: boolean;
  /** Grid placement, for variants that put the summary straight into their grid. */
  className?: string;
}

interface BuiltSectionProps {
  label: string;
  items: string[];
  led?: boolean;
}

interface FeatureLayoutProps extends ProjectProps {
  variant: FeatureVariant;
}

export const FeatureVariant = {
  SPLIT_DARK: 'split-dark',
  VISUAL_FIRST: 'visual-first',
  STAGE: 'stage',
  SYSTEM: 'system',
  BUILT_LED: 'built-led',
} as const;
export type FeatureVariant = (typeof FeatureVariant)[keyof typeof FeatureVariant];

/** Which composition each project gets. */
export function variantForSlug(slug: ProjectSlug): FeatureVariant {
  const bySlug: Record<ProjectSlug, FeatureVariant> = {
    [ProjectSlug.APP_BUILDER]: FeatureVariant.SPLIT_DARK,
    [ProjectSlug.GENERATIVE_FILL]: FeatureVariant.VISUAL_FIRST,
    [ProjectSlug.COCODING]: FeatureVariant.STAGE,
    [ProjectSlug.HASHMATO]: FeatureVariant.SYSTEM,
    [ProjectSlug.IGOT]: FeatureVariant.BUILT_LED,
  };
  return bySlug[slug];
}

function ProjectTitle({ project }: ProjectProps) {
  return (
    <ViewTransition name={projectTitleMorphName(project.slug)} share="project-morph" default="none">
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

function FeatureMeta({ project }: ProjectProps) {
  return (
    <p className="feature-meta type-small">
      <span>{project.company}</span>
      <span>{project.role}</span>
      <span>{project.period}</span>
    </p>
  );
}

function FeatureVisual({ project }: ProjectProps) {
  return (
    <ViewTransition name={projectVisualMorphName(project.slug)} share="project-morph" default="none">
      <Link
        href={caseStudyHref(project.slug)}
        transitionTypes={['nav-forward']}
        className="feature-visual"
        // A pointer shortcut: the title and the case study link already reach this page.
        aria-hidden="true"
        tabIndex={-1}
      >
        <ProjectVisual slug={project.slug} />
      </Link>
    </ViewTransition>
  );
}

function Highlights({ project }: ProjectProps) {
  return (
    <ul className="feature-highlights">
      {project.highlights.map((highlight) => (
        <li key={highlight}>{highlight}</li>
      ))}
    </ul>
  );
}

function CaseStudyLink({ project }: ProjectProps) {
  return (
    <Link href={caseStudyHref(project.slug)} transitionTypes={['nav-forward']} className="wire-link">
      Read the case study
      <span className="sr-only">: {project.shortTitle}</span>
      <span className="wire" aria-hidden="true" />
    </Link>
  );
}

function Summary({ project, dark, className }: SummaryProps) {
  const classes = ['type-lead', dark ? 'text-paper' : '', className ?? ''].filter(Boolean).join(' ');
  return <p className={classes}>{project.summary}</p>;
}

function SplitDark({ project }: ProjectProps): JSX.Element {
  const dark = isDarkTone(project.tone);
  return (
    <article id={project.slug} data-theme={dark ? 'dark' : undefined} data-tone={project.tone} className="feature feature-split-dark">
      <div className="shell grid-12 gap-y-10 lg:grid-rows-[auto_1fr]">
        <div className="col-span-4 md:col-span-8 lg:col-span-4 lg:row-start-1 lg:pt-4">
          <ProjectTitle project={project} />
          <FeatureMeta project={project} />
        </div>
        <div className="col-span-4 md:col-span-12 lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:col-span-8 lg:col-start-5 lg:row-span-2 lg:row-start-1 lg:-mr-[var(--gutter)] lg:self-start">
          <FeatureVisual project={project} />
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-4 lg:row-start-2">
          <Summary project={project} dark={dark} />
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

function VisualFirst({ project }: ProjectProps): JSX.Element {
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
          <Summary project={project} dark={false} />
          <Highlights project={project} />
          <div className="mt-8">
            <CaseStudyLink project={project} />
          </div>
        </div>
      </div>
    </article>
  );
}

function Stage({ project }: ProjectProps): JSX.Element {
  const dark = isDarkTone(project.tone);
  return (
    <article id={project.slug} data-theme={dark ? 'dark' : undefined} data-tone={project.tone} className="feature feature-stage">
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
          <Summary project={project} dark={dark} className="col-span-4 md:col-span-6 lg:col-span-4" />
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

function SystemLayout({ project }: ProjectProps): JSX.Element {
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
          <Summary project={project} dark={false} />
          <Highlights project={project} />
          <div className="mt-8">
            <CaseStudyLink project={project} />
          </div>
        </div>
      </div>
    </article>
  );
}

function BuiltSection({ label, items, led }: BuiltSectionProps) {
  return (
    <section aria-label={label}>
      <h4 className="feature-split-label">
        <span className="feature-split-port" data-led={led || undefined} aria-hidden="true" />
        {label}
      </h4>
      <ul className="feature-highlights mt-3">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function BuiltLed({ project }: ProjectProps): JSX.Element {
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
            <BuiltSection label="I built" items={project.built.slice(0, 2)} />
            <BuiltSection label="I led" items={(project.led ?? []).slice(0, 2)} led />
            <div>
              <CaseStudyLink project={project} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

const variants: Record<FeatureVariant, (props: ProjectProps) => JSX.Element> = {
  [FeatureVariant.SPLIT_DARK]: SplitDark,
  [FeatureVariant.VISUAL_FIRST]: VisualFirst,
  [FeatureVariant.STAGE]: Stage,
  [FeatureVariant.SYSTEM]: SystemLayout,
  [FeatureVariant.BUILT_LED]: BuiltLed,
};

export function FeatureLayout({ project, variant }: FeatureLayoutProps) {
  const Feature = variants[variant];
  return <Feature project={project} />;
}
