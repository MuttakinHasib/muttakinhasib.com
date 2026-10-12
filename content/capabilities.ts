import { type Capability, CapabilityId } from './types.ts';

export const capabilities: Capability[] = [
  {
    id: CapabilityId.INTERACTIVE,
    name: 'Interactive systems',
    shortName: 'Interactive',
    summary:
      'Node-based editors, layered canvases, and graph logic that stay fast when the canvas gets crowded.',
    tools: [
      'React',
      'React Flow',
      'Konva',
      'HTML Canvas',
      'ELK.js',
      'Graph algorithms',
      'Rendering performance',
    ],
  },
  {
    id: CapabilityId.AI,
    name: 'AI products',
    shortName: 'AI',
    summary:
      'Creative tools, agent builders, and app generators where a model does the work and the interface makes it legible.',
    tools: [
      'LLM integration',
      'Multi-agent workflows',
      'RAG',
      'Streaming interfaces',
      'AI image and video tools',
      'CrewAI',
    ],
  },
  {
    id: CapabilityId.FULL_STACK,
    name: 'Full stack engineering',
    shortName: 'Full stack',
    summary:
      'Typed products end to end, from the React tree to the API, the queue, and the database.',
    tools: [
      'Next.js',
      'TypeScript',
      'Node.js',
      'NestJS',
      'Python',
      'FastAPI',
      'PostgreSQL',
      'MongoDB',
      'Redis',
      'WebSockets',
      'SSE',
    ],
  },
  {
    id: CapabilityId.PLATFORM,
    name: 'Platform and architecture',
    shortName: 'Platform',
    summary:
      'Multi-tenant SaaS, payments, partner integrations, and the delivery pipeline that ships them.',
    tools: [
      'Multi-tenant SaaS',
      'Payments',
      'Integrations',
      'Docker',
      'Kubernetes',
      'Helm',
      'AWS',
      'GitHub Actions',
      'System design',
    ],
  },
];

const capabilityById = new Map(capabilities.map((capability) => [capability.id, capability]));

export function getCapability(id: CapabilityId): Capability {
  const capability = capabilityById.get(id);
  if (!capability) throw new Error(`Unknown capability: ${id}`);
  return capability;
}
