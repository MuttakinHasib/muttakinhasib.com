import Link from 'next/link';
import { Emphasis, type ImpactEntry, impact } from '@/content/impact';
import { caseStudyHref } from '@/lib/site';

interface EntryProps {
  entry: ImpactEntry;
}

function Source({ entry }: EntryProps) {
  return (
    <Link href={caseStudyHref(entry.project)} transitionTypes={['nav-forward']} className="impact-source">
      <span className="impact-source-port" aria-hidden="true" />
      {entry.source}
    </Link>
  );
}

function LeadEntry({ entry }: EntryProps) {
  return (
    <div className="impact-lead">
      <dt>
        <span className="type-figure impact-lead-value">{entry.value}</span>
        <span className="type-heading mt-3 block">{entry.claim}</span>
      </dt>
      <dd className="mt-3 max-w-[44ch] text-graphite">{entry.context}</dd>
      <dd className="mt-4">
        <Source entry={entry} />
      </dd>
    </div>
  );
}

function SupportEntry({ entry }: EntryProps) {
  return (
    <div className="impact-support">
      <dt>
        <span className="type-figure impact-support-value">{entry.value}</span>
        <span className="mt-2 block font-[560]">{entry.claim}</span>
      </dt>
      <dd className="type-small mt-2 text-graphite">{entry.context}</dd>
      <dd className="mt-3">
        <Source entry={entry} />
      </dd>
    </div>
  );
}

export function Impact() {
  const lead = impact.filter((entry) => entry.emphasis === Emphasis.LEAD);
  const support = impact.filter((entry) => entry.emphasis === Emphasis.SUPPORT);

  return (
    <section id="impact" aria-labelledby="impact-title" className="impact">
      <div className="shell">
        <div className="grid-12 gap-y-6">
          <h2 id="impact-title" className="type-display col-span-4 md:col-span-7">
            Engineering impact
          </h2>
          <p className="type-lead col-span-4 max-w-[38ch] text-graphite md:col-span-5 md:self-end">
            A number is only useful next to what it measured, so each one keeps its context and its source.
          </p>
        </div>
        <div className="impact-grid">
          <dl className="impact-lead-row">
            {lead.map((entry) => (
              <LeadEntry key={entry.claim} entry={entry} />
            ))}
          </dl>
          <dl className="impact-support-row">
            {support.map((entry) => (
              <SupportEntry key={entry.claim} entry={entry} />
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
