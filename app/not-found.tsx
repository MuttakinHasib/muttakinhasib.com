import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="not-found canvas-dots">
      <div className="shell pb-24 pt-[calc(var(--header-h)+clamp(4rem,14vh,9rem))]">
        <div className="not-found-node">
          <span className="port port-in" aria-hidden="true" />
          <p className="type-mono text-graphite">404</p>
          <h1 className="type-display mt-3">This node isn’t connected to anything.</h1>
          <p className="type-lead mt-5 max-w-[40ch] text-graphite">
            The page you followed doesn’t exist, or it moved. These routes do:
          </p>
          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-2">
            <li>
              <Link href="/" className="wire-link">
                Home
                <span className="wire" aria-hidden="true" />
              </Link>
            </li>
            <li>
              <Link href="/work" className="wire-link">
                Selected work
                <span className="wire" aria-hidden="true" />
              </Link>
            </li>
            <li>
              <Link href="/about" className="wire-link">
                About
                <span className="wire" aria-hidden="true" />
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
