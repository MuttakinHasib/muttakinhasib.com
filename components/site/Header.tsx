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
          <p className="availability hidden lg:flex">
            <span className="status-dot" aria-hidden="true" />
            {profile.availability}
          </p>
        </div>
      </nav>
    </header>
  );
}
