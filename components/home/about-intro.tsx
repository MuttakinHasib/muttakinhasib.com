import Link from 'next/link';
import { bioIntro } from '@/content/profile';
import { TeamsDiagram } from './teams-diagram';

export function AboutIntro() {
  return (
    <section id="about" aria-labelledby="about-title" className="about-intro">
      <div className="shell grid-12 gap-y-12">
        <div className="col-span-4 md:col-span-12 lg:col-span-6">
          <h2 id="about-title" className="type-display">
            About
          </h2>
          <div className="about-copy mt-8 grid max-w-[60ch] gap-5">
            <p className="type-lead">{bioIntro[0]}</p>
            {bioIntro.slice(1).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <Link href="/about" className="wire-link mt-8">
            More about how I work
            <span className="wire" aria-hidden="true" />
          </Link>
        </div>
        <div className="col-span-4 md:col-span-10 lg:col-span-5 lg:col-start-8 lg:self-center">
          <TeamsDiagram />
        </div>
      </div>
    </section>
  );
}
