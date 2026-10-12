import { GraphCanvas } from '@/components/graph/graph-canvas';
import { buildGraphModel } from '@/components/graph/graph-model';
import { INTRO, headlineLineDelay } from '@/components/graph/intro';
import { AvailabilityChip } from '@/components/site/availability-chip';
import { profile } from '@/content/profile';
import { vars } from '@/lib/css';

const headlineLines = ['I turn complex', 'systems into', 'intuitive', 'experiences.'];

export function Hero() {
  const model = buildGraphModel();

  return (
    <section aria-labelledby="hero-title" className="hero canvas-dots text-ink">
      <GraphCanvas model={model}>
        <div className="shell grid-12 gap-y-8 pt-[calc(var(--header-h)+clamp(1rem,3svh,3.5rem))]">
          <div className="col-span-4 md:col-span-12 lg:col-span-8" data-headline>
            <AvailabilityChip
              className="intro-fade flex items-center gap-2.5 type-small text-graphite lg:hidden"
              // A named beat: this chip used to ride a CSS fallback delay.
              style={vars({ delay: `${INTRO.availability}ms` })}
            />
            <p
              className="intro-fade focus-chain mt-5 type-small font-medium text-ink lg:mt-0"
              style={vars({ delay: `${INTRO.focusLine}ms` })}
            >
              {profile.focus.map((item, index) => (
                <span key={item} className="flex">
                  {index > 0 ? <span className="port-link" aria-hidden="true" /> : null}
                  {item}
                  {index < profile.focus.length - 1 ? <span className="sr-only">,</span> : null}
                </span>
              ))}
            </p>
            <h1 id="hero-title" className="type-hero hero-title mt-5">
              {headlineLines.map((line, index) => (
                <span key={line} className="intro-line">
                  <span style={vars({ 'intro-delay': `${headlineLineDelay(index)}ms` })}>
                    {line}
                    {index === headlineLines.length - 1 ? (
                      <span className="headline-port" data-headline-port aria-hidden="true" />
                    ) : null}
                  </span>{' '}
                </span>
              ))}
            </h1>
          </div>

          <div className="col-span-4 md:col-span-8 lg:col-span-4 lg:self-end lg:pb-3">
            <p
              className="intro-fade type-lead max-w-[34ch] text-ink"
              style={vars({ delay: `${INTRO.lead}ms` })}
            >
              {profile.intro}
            </p>
            <div
              className="intro-fade mt-7 flex flex-wrap items-center gap-x-6 gap-y-3"
              style={vars({ delay: `${INTRO.actions}ms` })}
            >
              <a href="#work" className="button-primary">
                Explore selected work
                <span className="button-port" aria-hidden="true" />
              </a>
              <a href="#contact" className="wire-link">
                Let’s build something
                <span className="wire" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </GraphCanvas>
    </section>
  );
}
