import type { CSSProperties } from 'react';
import { profile } from '@/content/profile';

interface AvailabilityChipProps {
  className: string;
  /** Intro delay, set by callers that participate in the intro timeline. */
  style?: CSSProperties;
}

/** The availability signal: dot plus status text, shared by the hero (mobile) and the header (desktop). */
export function AvailabilityChip({ className, style }: AvailabilityChipProps) {
  return (
    <p className={className} style={style}>
      <span className="status-dot" aria-hidden="true" />
      {profile.availability}
    </p>
  );
}
