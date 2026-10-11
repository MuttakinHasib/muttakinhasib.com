'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { ProjectSlug } from '@/content/types';

interface CaseStudyDemoProps {
  slug: ProjectSlug;
}

function DemoLoading() {
  return (
    <div className="demo-frame demo-loading" role="status">
      <p className="type-small text-graphite">Loading the interactive reconstruction…</p>
    </div>
  );
}

/** Each case study loads only its own demo chunk; React Flow ships with App Builder alone. */
const demos: Record<ProjectSlug, ComponentType> = {
  [ProjectSlug.APP_BUILDER]: dynamic(() => import('@/components/demos/PlannerDemo'), { loading: DemoLoading }),
  [ProjectSlug.GENERATIVE_FILL]: dynamic(() => import('@/components/demos/CompositorDemo'), {
    loading: DemoLoading,
  }),
  [ProjectSlug.COCODING]: dynamic(() => import('@/components/demos/StreamDemo'), { loading: DemoLoading }),
  [ProjectSlug.HASHMATO]: dynamic(() => import('@/components/demos/TenantRoutingDemo'), { loading: DemoLoading }),
  [ProjectSlug.IGOT]: dynamic(() => import('@/components/demos/ExecutionOrderDemo'), { loading: DemoLoading }),
};

/** The schema demo sits in cocoding.ai's Database Explorer section, outside the main demo slot. */
export const SchemaExplorerDemo = dynamic(() => import('@/components/demos/SchemaDemo'), { loading: DemoLoading });

export function CaseStudyDemo({ slug }: CaseStudyDemoProps) {
  const Demo = demos[slug];
  return <Demo />;
}
