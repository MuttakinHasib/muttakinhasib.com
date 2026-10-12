import 'server-only';

import { capabilities } from '@/content/capabilities';
import { profile } from '@/content/profile';
import { projects } from '@/content/projects';
import { caseStudyHref } from '@/lib/site';
import type { GraphEdge } from './planner';
import { type GraphModel, type GraphNodeModel, type InspectorModel, NodeKind } from './types';

export const ROOT_ID = 'hasib';

/** Builds the compact, serializable graph the hero needs, so content files stay on the server. */
export function buildGraphModel(): GraphModel {
  const nodes: GraphNodeModel[] = [
    {
      id: ROOT_ID,
      kind: NodeKind.ROOT,
      title: profile.name,
      shortTitle: profile.shortName,
      meta: profile.experience,
    },
    ...capabilities.map((capability) => ({
      id: capability.id,
      kind: NodeKind.CAPABILITY,
      title: capability.name,
      shortTitle: capability.shortName,
      meta: `${projects.filter((project) => project.capabilities.includes(capability.id)).length} projects`,
    })),
    ...projects.map((project) => ({
      id: project.slug,
      kind: NodeKind.PROJECT,
      title: project.shortTitle,
      shortTitle: project.shortTitle,
      meta: project.company,
      tone: project.tone,
    })),
  ];

  const edges: GraphEdge[] = [
    ...capabilities.map((capability) => ({ from: ROOT_ID, to: capability.id })),
    ...projects.flatMap((project) =>
      project.capabilities.map((capabilityId) => ({ from: capabilityId, to: project.slug })),
    ),
  ];

  const details: Record<string, InspectorModel> = {
    [ROOT_ID]: {
      title: profile.name,
      summary: `Based in ${profile.location}, ${profile.timezone}, and ${profile.availability.toLowerCase()}. Every capability and project on this map traces back here.`,
      outputs: [
        { value: profile.experience, label: 'shipping production software' },
        { value: '4', label: 'countries of remote teams' },
      ],
      link: { href: '/about', label: 'Read about me' },
    },
  };

  for (const capability of capabilities) {
    details[capability.id] = {
      title: capability.name,
      summary: capability.summary,
      outputs: [],
      link: { href: '/#capabilities', label: 'See all capabilities' },
    };
  }

  for (const project of projects) {
    details[project.slug] = {
      title: project.shortTitle,
      summary: project.summary,
      outputs: project.outcomes.slice(0, 2).map(({ value, label }) => ({ value, label })),
      link: { href: caseStudyHref(project.slug), label: 'Read the case study' },
    };
  }

  // Open on the root: it traces to every node, so the first view is the whole map at full strength.
  return { nodes, edges, details, defaultFocus: ROOT_ID };
}
