export const CapabilityId = {
  INTERACTIVE: 'interactive-systems',
  AI: 'ai-products',
  FULL_STACK: 'full-stack',
  PLATFORM: 'platform',
} as const;
export type CapabilityId = (typeof CapabilityId)[keyof typeof CapabilityId];

export const ProjectSlug = {
  APP_BUILDER: 'imagineart-app-builder',
  GENERATIVE_FILL: 'generative-fill-compositor',
  COCODING: 'cocoding-ai',
  HASHMATO: 'hashmato-cloud-pos',
  IGOT: 'igot-ai-agents',
} as const;
export type ProjectSlug = (typeof ProjectSlug)[keyof typeof ProjectSlug];

/** Each project borrows one accent from its own domain; base palette stays paper/ink/signal. */
export const ProjectTone = {
  SIGNAL: 'signal',
  MASK: 'mask',
  STREAM: 'stream',
  LEDGER: 'ledger',
  AGENT: 'agent',
} as const;
export type ProjectTone = (typeof ProjectTone)[keyof typeof ProjectTone];

export interface Capability {
  id: CapabilityId;
  name: string;
  shortName: string;
  summary: string;
  tools: string[];
}

export interface Metric {
  value: string;
  label: string;
  context: string;
}

export interface Note {
  title: string;
  body: string;
}

export interface Project {
  slug: ProjectSlug;
  title: string;
  shortTitle: string;
  company: string;
  companyContext: string;
  role: string;
  period: string;
  location: string;
  tone: ProjectTone;
  summary: string;
  /** Three short, scannable points used on the homepage. */
  highlights: string[];
  overview: string[];
  context: string[];
  /** What the resume attributes to Hasib personally. */
  built: string[];
  /** Leadership or team-level responsibilities, kept separate from individual work. */
  led?: string[];
  challenges: Note[];
  decisions: Note[];
  implementation: Note[];
  outcomes: Metric[];
  stack: string[];
  capabilities: CapabilityId[];
  related: ProjectSlug[];
  seoDescription: string;
}
