import { type ReactNode, ViewTransition } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

const directional = {
  'nav-forward': 'nav-forward',
  'nav-back': 'nav-back',
  default: 'none',
};

/** Slides page content by navigation direction; the header stays anchored (see globals.css). */
export function PageTransition({ children }: PageTransitionProps) {
  return (
    <ViewTransition enter={directional} exit={directional} default="none">
      {children}
    </ViewTransition>
  );
}
