import type { ProjectTone } from '@/content/types';
import type { GraphEdge } from './planner';

export const NodeKind = {
  ROOT: 'root',
  CAPABILITY: 'capability',
  PROJECT: 'project',
} as const;
export type NodeKind = (typeof NodeKind)[keyof typeof NodeKind];

export interface GraphNodeModel {
  id: string;
  kind: NodeKind;
  title: string;
  /** Short label for compact (mobile) layouts. */
  shortTitle: string;
  meta: string;
  tone?: ProjectTone;
}

export interface InspectorOutput {
  value: string;
  label: string;
}

export interface InspectorModel {
  title: string;
  summary: string;
  outputs: InspectorOutput[];
  link: { href: string; label: string };
}

export interface GraphModel {
  nodes: GraphNodeModel[];
  edges: GraphEdge[];
  details: Record<string, InspectorModel>;
  defaultFocus: string;
}
