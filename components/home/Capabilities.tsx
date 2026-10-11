import Link from 'next/link';
import { capabilities } from '@/content/capabilities';
import { projects } from '@/content/projects';
import { caseStudyHref } from '@/lib/site';

export function Capabilities() {
  return (
    <section id="capabilities" aria-labelledby="capabilities-title" className="capabilities">
      <div className="shell">
        <div className="grid-12 gap-y-6">
          <h2 id="capabilities-title" className="type-display col-span-4 md:col-span-7">
            Capabilities
          </h2>
          <p className="type-lead col-span-4 max-w-[38ch] text-graphite md:col-span-5 md:self-end">
            Four connected groups. Each one is traced to the projects that actually used it.
          </p>
        </div>

        <ol className="capability-row">
          {capabilities.map((capability) => {
            const usedIn = projects.filter((project) => project.capabilities.includes(capability.id));
            return (
              <li key={capability.id} className="capability-node">
                <span className="port port-in" aria-hidden="true" />
                <span className="port port-out" aria-hidden="true" />
                <p className="type-mono text-graphite" aria-hidden="true">
                  capability
                </p>
                <h3 className="type-heading mt-2">{capability.name}</h3>
                <p className="mt-3 text-[0.975rem] leading-relaxed">{capability.summary}</p>
                <p className="type-small mt-4 text-graphite">{capability.tools.join(', ')}</p>
                <div className="capability-used">
                  <p className="type-small font-[560]">Used in</p>
                  <ul className="mt-1">
                    {usedIn.map((project) => (
                      <li key={project.slug}>
                        <Link
                          href={caseStudyHref(project.slug)}
                          transitionTypes={['nav-forward']}
                          className="capability-link"
                        >
                          {project.shortTitle}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
