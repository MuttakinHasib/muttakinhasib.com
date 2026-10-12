import type { ReactNode } from 'react';
import type { Note } from '@/content/types';

interface CaseSectionProps {
  id: string;
  title: string;
  wide?: boolean;
  children: ReactNode;
}

interface NoteListProps {
  notes: Note[];
  variant?: 'challenge' | 'decision' | 'compact';
}

export function CaseSection({ id, title, wide, children }: CaseSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="cs-section">
      <div className="shell grid-12 gap-y-6">
        <h2 id={`${id}-title`} className="cs-section-title col-span-4 md:col-span-3">
          {title}
        </h2>
        <div className={`cs-section-body col-span-4 md:col-span-9 ${wide ? '' : 'lg:col-span-7'}`}>{children}</div>
      </div>
    </section>
  );
}

export function NoteList({ notes, variant = 'challenge' }: NoteListProps) {
  return (
    <ul className="cs-notes" data-variant={variant}>
      {notes.map((note) => (
        <li key={note.title} className="cs-note">
          <span className="cs-note-port" aria-hidden="true" />
          <h3 className="cs-note-title">{note.title}</h3>
          <p className="cs-note-body">{note.body}</p>
        </li>
      ))}
    </ul>
  );
}
