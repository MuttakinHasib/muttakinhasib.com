'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/** Long enough for the restored page to render and take back its scroll position. */
const RESTORE_WINDOW = 800;

/**
 * Back and forward to another page restore its earlier scroll position. With
 * smooth scrolling on <html> that restore would slide through the page, so it
 * is switched off until the restore has landed. In-page links also fire
 * popstate, but keep the same path, so they stay smooth.
 */
export function HistoryScroll() {
  const pathname = usePathname();
  const lastPath = useRef(pathname);

  useEffect(() => {
    lastPath.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let timer: number | undefined;
    const onPopState = () => {
      if (window.location.pathname === lastPath.current) return;
      const root = document.documentElement;
      root.style.scrollBehavior = 'auto';
      window.clearTimeout(timer);
      timer = window.setTimeout(() => root.style.removeProperty('scroll-behavior'), RESTORE_WINDOW);
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
