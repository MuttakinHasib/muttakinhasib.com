import { cacheLife } from 'next/cache';
import { profile } from '@/content/profile';
import { CopyEmailButton } from './CopyEmailButton';

async function buildYear(): Promise<number> {
  'use cache';
  cacheLife('max');
  return new Date().getFullYear();
}

export async function ContactSection() {
  const year = await buildYear();

  return (
    <footer id="contact" data-theme="dark" className="contact" aria-labelledby="contact-title">
      <div className="shell">
        <div className="contact-graph" aria-hidden="true">
          <span className="contact-node contact-node-self">
            <span className="type-mono text-graphite">person</span>
            <span className="contact-node-title">{profile.shortName}</span>
            <span className="contact-port contact-port-out" />
          </span>
          <span className="contact-wire" />
          <span className="contact-node contact-node-open">
            <span className="contact-port contact-port-in" />
            <span className="type-mono text-fog">input</span>
            <span className="contact-node-title">Your project</span>
          </span>
        </div>

        <h2 id="contact-title" className="type-hero contact-title">
          Have a complex problem worth solving?
        </h2>
        <div className="grid-12 mt-10 gap-y-10 lg:mt-14">
          <p className="type-lead col-span-4 max-w-[40ch] text-paper md:col-span-6 lg:col-span-5">
            I’m interested in building thoughtful products, solving difficult engineering challenges, and working
            with ambitious teams.
          </p>
          <div className="col-span-4 md:col-span-6 lg:col-span-6 lg:col-start-7">
            <a href={`mailto:${profile.email}`} className="contact-email">
              {profile.email}
            </a>
            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
              <CopyEmailButton email={profile.email} />
              <a href={profile.linkedin} className="wire-link" rel="me noopener" target="_blank">
                LinkedIn
                <span className="sr-only"> (opens in a new tab)</span>
                <span className="wire" aria-hidden="true" />
              </a>
              <a href={profile.github} className="wire-link" rel="me noopener" target="_blank">
                GitHub
                <span className="sr-only"> (opens in a new tab)</span>
                <span className="wire" aria-hidden="true" />
              </a>
              <a href={profile.resume} className="wire-link" rel="noopener" target="_blank">
                Resume
                <span className="sr-only"> (PDF, opens in a new tab)</span>
                <span className="wire" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div className="contact-footer type-small">
          <p>
            © {year} {profile.name}
          </p>
          <p>
            {profile.location}, {profile.timezone}. {profile.availability}.
          </p>
          <p>Built with Next.js, React, and TypeScript.</p>
        </div>
      </div>
    </footer>
  );
}
