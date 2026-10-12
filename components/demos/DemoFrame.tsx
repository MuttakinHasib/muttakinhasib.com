import type { ReactNode } from 'react';

interface DemoFrameProps {
  title: string;
  instructions: string;
  note: string;
  children: ReactNode;
}

/** Shared chrome for the case-study prototypes: what it is, how to use it, and what it isn't. */
export function DemoFrame({ title, instructions, note, children }: DemoFrameProps) {
  return (
    <figure className="demo-frame">
      <div className="demo-header">
        <p className="demo-title">
          <span className="demo-live" aria-hidden="true" />
          {title}
        </p>
        <p className="type-small max-w-[62ch] text-graphite">{instructions}</p>
      </div>
      <div className="demo-body">{children}</div>
      <figcaption className="demo-note type-small">{note}</figcaption>
    </figure>
  );
}
