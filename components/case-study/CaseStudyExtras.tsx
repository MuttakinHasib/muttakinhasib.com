import type { JSX } from 'react';
import { NodeShelfVisual } from '@/components/visuals/NodeShelfVisual';
import { ProjectSlug } from '@/content/types';
import { CaseSection, NoteList } from './CaseSection';

interface CaseStudyExtrasProps {
  slug: ProjectSlug;
}

function AppBuilderExtras() {
  return (
    <CaseSection id="more-nodes" title="Other nodes I shipped on this canvas" wide>
      <NodeShelfVisual />
      <p className="type-small text-graphite">Original reconstructions after the live nodes.</p>
      <NoteList
        variant="compact"
        notes={[
          {
            title: 'Creative Analyzer',
            body: 'Ad-effectiveness predictions for enterprise clients through Brainsuite’s scoring API, with a schema-driven test wizard, reports for 3 ad formats, and PDF/XLSX/CSV export.',
          },
          {
            title: 'Combine Audio & Video',
            body: 'The audio/video merger rebuilt as a multi-track timeline inside the node.',
          },
          {
            title: 'Ad Maker',
            body: 'Video ads from product, avatar, and template selections.',
          },
          {
            title: 'Storyboard and Sound Effects',
            body: 'Two more AI nodes on the same canvas: storyboard frames and generated sound effects.',
          },
        ]}
      />
    </CaseSection>
  );
}

const extras: Partial<Record<ProjectSlug, () => JSX.Element>> = {
  [ProjectSlug.APP_BUILDER]: AppBuilderExtras,
};

/** Project-specific sections that sit between implementation and outcomes. */
export function CaseStudyExtras({ slug }: CaseStudyExtrasProps) {
  const Extra = extras[slug];
  return Extra ? <Extra /> : null;
}
