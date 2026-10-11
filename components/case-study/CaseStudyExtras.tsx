import type { JSX } from 'react';
import { GroupConnectionVisual } from '@/components/visuals/GroupConnectionVisual';
import { NodeShelfVisual } from '@/components/visuals/NodeShelfVisual';
import { ProjectSlug } from '@/content/types';
import { CaseSection, NoteList } from './CaseSection';

interface CaseStudyExtrasProps {
  slug: ProjectSlug;
}

function AppBuilderExtras() {
  return (
    <>
      <CaseSection id="group-connections" title="Group connections" wide>
        <GroupConnectionVisual />
        <p>
          Wiring ten reference images into a node used to take ten drags. A section or multi-selection now grows
          one output handle per data type. Drop it on a node and every member lands in its own slot of the
          roomiest compatible input, with new slots added up to that input’s limit. Inputs that can’t take the
          type dim while the wire is in the air, and a group with mixed outputs explains why it can’t connect.
        </p>
      </CaseSection>
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
            body: 'A timeline inside the node: every wired clip gets a lane, with per-track volume and mute, and drags that snap to any clip edge.',
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
    </>
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
