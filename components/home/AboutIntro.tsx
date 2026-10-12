import Link from 'next/link';
import { TeamsDiagram } from './TeamsDiagram';

export function AboutIntro() {
  return (
    <section id="about" aria-labelledby="about-title" className="about-intro">
      <div className="shell grid-12 gap-y-12">
        <div className="col-span-4 md:col-span-12 lg:col-span-6">
          <h2 id="about-title" className="type-display">
            About
          </h2>
          <div className="about-copy mt-8 grid max-w-[60ch] gap-5">
            <p className="type-lead">
              I’m a senior full stack engineer in Dhaka, Bangladesh. For more than seven years I’ve worked on
              products where the difficult part hides behind the interface.
            </p>
            <p>
              Workflow editors with dozens of node types. AI tools that have to respond while a model is still
              working. Multi-tenant backends where every tenant brings its own payment provider. I like these
              problems because the frontend and the backend can’t be solved separately.
            </p>
            <p>
              I take features from the first idea to production: rendering performance in the browser, the API
              behind it, the database, and the pipeline that ships it. I’ve done that remotely with teams in the
              US, Singapore, France, and Vietnam, and as an engineering manager leading seven engineers at
              iGOT.ai.
            </p>
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
