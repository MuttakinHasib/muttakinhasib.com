import Link from 'next/link';
import { profile } from '@/content/profile';
import { NavLinks } from './NavLinks';

export function Header() {
  return (
    <header className="site-header" style={{ viewTransitionName: 'site-header' }}>
      <nav aria-label="Primary" className="shell flex h-full items-center justify-between gap-4">
        <Link href="/" className="wordmark" aria-label={`${profile.name}, home`}>
          <span className="wordmark-mark" aria-hidden="true">
            <span />
          </span>
          <span className="wordmark-full">{profile.shortName}</span>
        </Link>
        <div className="flex items-center gap-3 lg:gap-8">
          <NavLinks />
          {/* Tablet and up: phones reach the resume from the footer and the About page. */}
          <div className="hidden items-center gap-4 md:flex">
            <p className="availability hidden lg:flex">
              <span className="status-dot" aria-hidden="true" />
              {profile.availability}
            </p>
            <a href={profile.resume} className="header-resume" rel="noopener" target="_blank">
              Resume
              <span className="sr-only"> (PDF, opens in a new tab)</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 7h10v10" />
                <path d="M7 17 17 7" />
              </svg>
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
