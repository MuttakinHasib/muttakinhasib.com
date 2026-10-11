import { CapabilityId, type Project, ProjectSlug, ProjectTone } from './types';

export const projects: Project[] = [
  {
    slug: ProjectSlug.APP_BUILDER,
    title: 'ImagineArt Workflows: App Builder',
    shortTitle: 'App Builder',
    company: 'ImagineArt',
    companyContext: 'AI image and video creation platform with 100M+ users across web and mobile.',
    role: 'Senior Frontend Engineer',
    period: 'Feb 2026 – Sep 2026',
    location: 'San Francisco, CA (remote)',
    tone: ProjectTone.SIGNAL,
    summary:
      'Turning node-based AI workflows into publishable, monetizable apps, starting from any selection on the canvas.',
    highlights: [
      'A graph planner derives each app’s entry inputs and final outputs from dependency and reachability rules.',
      'One-click “Build App” from any canvas selection, with a live preview on hover.',
      'Canvas rendering improved by about 20% with zoom-aware image loading and identity-based memoization.',
    ],
    overview: [
      'ImagineArt Workflows lets creators chain AI image and video models on a node-based canvas. I architected and launched App Builder, which turns those workflows into publishable, monetizable apps with in-editor test runs and a guided publish flow.',
      'Alongside it, I built shared canvas components that the rest of the platform adopted: one action toolbar, one resize system, and one floating results carousel, now used across dozens of node types.',
    ],
    context: [
      'A workflow graph makes sense to the person who built it. An app has to make sense to everyone else. To publish one, the system needs to know which nodes are the app’s inputs, which are its results, and which are internal steps the end user should never see.',
      'Creators can select any part of a canvas, so that answer can’t be configured by hand for every selection. It has to come from the structure of the graph itself.',
    ],
    built: [
      'Architected and launched App Builder for ImagineArt Workflows: in-editor test runs and a guided publish flow.',
      'Built one-click “Build App” from any canvas selection, using a graph planner that derives entry inputs and final outputs from dependency and reachability rules.',
      'Added a live preview of the resulting app on hover, before anything is created.',
      'Improved canvas rendering by about 20% via zoom-aware image loading (6 resolution tiers) and identity-based memoization.',
      'Built group connections: drag a whole section or multi-selection onto a node and every member wires into the node’s roomiest compatible input, with type validation and slots added up to the input’s limit.',
      'Engineered reusable canvas components: a config-driven action toolbar used by 45 node types, a resize system used by 30, and a floating results carousel with inertial panning used by 29.',
    ],
    challenges: [
      {
        title: 'Deriving a contract from an arbitrary selection',
        body: 'A selection can be a whole workflow or a fragment of one. The app’s inputs and outputs had to be inferred from how the selected nodes depend on each other, not from manual configuration.',
      },
      {
        title: 'Keeping an image-heavy canvas responsive',
        body: 'Workflow nodes render generated images and video at every zoom level. Loading full-resolution media everywhere makes panning and zooming expensive.',
      },
      {
        title: 'Consistency across dozens of node types',
        body: 'Toolbars, resizing, and result browsing rebuilt per node type drift apart in behavior and cost. They needed to be shared without becoming rigid.',
      },
    ],
    decisions: [
      {
        title: 'Plan from the graph, not from settings',
        body: 'The planner walks dependencies and reachability inside the selection to find where data enters and where final results leave. The creator selects; the system works out the contract.',
      },
      {
        title: 'Show the app before building it',
        body: 'A live preview on hover shows the app the planner would produce, so creators can adjust a selection before anything is created.',
      },
      {
        title: 'Load only the pixels the zoom level needs',
        body: 'Images load from one of 6 resolution tiers based on the current zoom, and node components memoize on data identity so unrelated updates don’t re-render them.',
      },
      {
        title: 'Configure shared components per node type',
        body: 'The action toolbar is driven by configuration, so each node type declares its actions instead of shipping its own toolbar.',
      },
    ],
    implementation: [
      {
        title: 'Selection to app',
        body: 'Select nodes, plan, preview on hover, build, test-run inside the editor, then publish through a guided flow.',
      },
      {
        title: 'Zoom-aware media',
        body: 'Six resolution tiers mapped to zoom ranges, combined with identity-based memoization of node renders.',
      },
      {
        title: 'Group connections',
        body: 'One drag connects a whole group: each member is checked against the target’s supported input types and lands in its own slot, with incompatible handles dimmed while you drag.',
      },
      {
        title: 'Platform components',
        body: 'Action toolbar (45 node types), resize system (30), and a floating results carousel with inertial panning (29).',
      },
    ],
    outcomes: [
      {
        value: '~20%',
        label: 'faster canvas rendering',
        context: 'From zoom-aware image loading and identity-based memoization.',
      },
      {
        value: '120 fps',
        label: 'pan and zoom on an image-heavy workflow',
        context:
          'Measured on the live canvas on a 120 Hz display: median frame 8.3 ms, p95 9.3 ms once images are cached. A team result that includes my rendering work.',
      },
      {
        value: '2,152',
        label: 'commits to the ImagineArt web app',
        context: 'Every commit across all branches, Feb to Sep 2026. The most of 33 contributors.',
      },
      {
        value: '100M+',
        label: 'users on the ImagineArt platform',
        context: 'The scale of the product I shipped into, not users I acquired.',
      },
    ],
    stack: ['React', 'TypeScript', 'React Flow', 'Graph algorithms', 'Rendering performance'],
    capabilities: [CapabilityId.INTERACTIVE, CapabilityId.AI],
    related: [ProjectSlug.GENERATIVE_FILL, ProjectSlug.IGOT],
    seoDescription:
      'Case study: how Muttakin Islam Hasib architected App Builder for ImagineArt Workflows, turning node-based AI workflows into publishable apps with a reachability-based graph planner and ~20% faster canvas rendering.',
  },
  {
    slug: ProjectSlug.GENERATIVE_FILL,
    title: 'Generative Fill and Compositor',
    shortTitle: 'Generative Fill',
    company: 'ImagineArt',
    companyContext: 'AI image and video creation platform with 100M+ users across web and mobile.',
    role: 'Senior Frontend Engineer',
    period: 'Feb 2026 – Sep 2026',
    location: 'San Francisco, CA (remote)',
    tone: ProjectTone.MASK,
    summary:
      'Two AI image editors inside ImagineArt: inpainting and outpainting that respond before the model does, and multi-layer composition on Konva.',
    highlights: [
      'Inpainting and outpainting with optimistic previews and reusable masks.',
      'Konva multi-layer editing with smart guides, blend modes, and undo/redo.',
      'AI text-layer extraction, so text in an image can become its own layer.',
    ],
    overview: [
      'I built two AI image editors for ImagineArt. Generative Fill handles inpainting and outpainting. Compositor is a multi-layer editor built on Konva.',
      'Both had to feel like creative software rather than a form that submits a prompt: direct manipulation first, generation in the background.',
    ],
    context: [
      'Generation takes time, and editing is a loop. If every brush stroke waits on a model round trip, people stop experimenting.',
      'Layered composition brings its own expectations from desktop tools: alignment that snaps, blend modes that behave, and an undo history people can trust.',
    ],
    built: [
      'Generative Fill: inpainting and outpainting with optimistic previews and mask reuse.',
      'Compositor: multi-layer editing on Konva with smart guides, blend modes, and undo/redo.',
      'AI text-layer extraction inside Compositor.',
    ],
    challenges: [
      {
        title: 'Model latency inside an editing loop',
        body: 'A fill request takes far longer than a brush stroke. The editor had to stay responsive while results were still on their way.',
      },
      {
        title: 'Masks people want to keep',
        body: 'Iterating on one region means generating against the same mask more than once. Repainting it every time breaks the loop.',
      },
      {
        title: 'Desktop-grade layering in a browser',
        body: 'Multiple layers, alignment, blending, and history all have to agree with each other on a canvas.',
      },
    ],
    decisions: [
      {
        title: 'Optimistic previews',
        body: 'The canvas reflects the requested edit immediately and reconciles when the generated result arrives.',
      },
      {
        title: 'Masks as reusable input',
        body: 'A painted mask can be reused for the next generation instead of being redrawn.',
      },
      {
        title: 'Konva for the layer model',
        body: 'Compositor uses Konva’s scene graph for layers, with smart guides, blend modes, and an undo/redo history on top.',
      },
    ],
    implementation: [
      {
        title: 'Generative Fill',
        body: 'Inpainting inside a mask, outpainting beyond the frame, optimistic previews, and mask reuse.',
      },
      {
        title: 'Compositor',
        body: 'Konva layers with smart guides, blend modes, undo/redo, and AI text-layer extraction.',
      },
    ],
    outcomes: [
      {
        value: '2',
        label: 'AI image editors shipped',
        context: 'Generative Fill and Compositor, both built by me for ImagineArt.',
      },
      {
        value: '100M+',
        label: 'users on the ImagineArt platform',
        context: 'Platform scale, not a measure of either editor’s usage.',
      },
    ],
    stack: ['React', 'TypeScript', 'Konva', 'HTML Canvas'],
    capabilities: [CapabilityId.INTERACTIVE, CapabilityId.AI],
    related: [ProjectSlug.APP_BUILDER, ProjectSlug.COCODING],
    seoDescription:
      'Case study: Generative Fill and Compositor, two AI image editors Muttakin Islam Hasib built for ImagineArt, with inpainting, outpainting, optimistic previews, and Konva multi-layer editing.',
  },
  {
    slug: ProjectSlug.COCODING,
    title: 'cocoding.ai: AI application builder',
    shortTitle: 'cocoding.ai',
    company: 'cocoding.ai',
    companyContext: 'AI app builder that turns natural-language prompts into full-stack SaaS applications.',
    role: 'Software Engineer (part-time)',
    period: 'Nov 2024 – Feb 2026',
    location: 'France (remote)',
    tone: ProjectTone.STREAM,
    summary:
      'A browser IDE and real-time AI chat that turn a prompt into a working full-stack app, built from the first commit to production.',
    highlights: [
      'Browser IDE: Monaco, file explorer, multi-tab xterm.js terminals on Kubernetes pods, live preview.',
      'Multi-agent output streamed over SSE and WebSockets into a live timeline.',
      'Web performance improved by 80%, reaching Lighthouse 100 SEO, 100 Accessibility, and 91 Performance.',
    ],
    overview: [
      'cocoding.ai turns natural-language prompts into full-stack SaaS applications. I architected and built its frontend from the first commit to production in Next.js, React, and TypeScript, and defined the state, API, and edge-auth layers.',
      'By the end, I had written 67% of the frontend’s commits, and 73% of the code still in production was mine.',
    ],
    context: [
      'An AI app builder has to show work that’s happening somewhere else: agents writing files, commands running in a container, an app booting in a preview. If the interface goes quiet, people assume it’s broken.',
      'It also has to feel like a real development environment, because the people using it will read and edit the generated code.',
    ],
    built: [
      'Architected and built the frontend from first commit to production (Next.js, React, TypeScript), including the state (Zustand, TanStack Query), API, and edge-auth layers.',
      'Built a browser-based IDE around Monaco Editor: file explorer, multi-tab xterm.js terminal attached to Kubernetes pods, live preview, and a Database Explorer with auto-laid-out ER diagrams (React Flow, ELK.js).',
      'Designed a real-time AI chat that streams multi-agent output over SSE and WebSockets into a live timeline of tool calls, file edits, and commands.',
      'Engineered a reusable WebSocket layer for 4 real-time channels (chat, code generation, files, terminal) with token refresh, capped auto-reconnect, heartbeats, and tab-focus recovery.',
      'Improved web performance by 80% through code splitting, dynamic imports, critical-CSS inlining, and React re-render profiling.',
      'Localized the platform and MDX blog into 16 languages (next-intl), with JSON-LD, sitemaps, and hreflang SEO.',
    ],
    challenges: [
      {
        title: 'Making remote work visible',
        body: 'Multi-agent generation produces a stream of tool calls, file edits, and commands. The interface had to present them as they happened, in order.',
      },
      {
        title: 'Four real-time channels that must not drop',
        body: 'Chat, code generation, files, and terminal each need a live connection that survives expired tokens, flaky networks, and background tabs.',
      },
      {
        title: 'An IDE that still loads fast',
        body: 'Monaco, terminals, and diagrams are heavy. Public pages also needed to rank and stay accessible.',
      },
    ],
    decisions: [
      {
        title: 'A timeline, not a spinner',
        body: 'Agent output streams into a live timeline of tool calls, file edits, and commands, so progress is legible step by step.',
      },
      {
        title: 'One WebSocket layer for every channel',
        body: 'A shared layer handles token refresh, capped auto-reconnect, heartbeats, and tab-focus recovery for all 4 channels.',
      },
      {
        title: 'Load the IDE only when it’s needed',
        body: 'Code splitting, dynamic imports, critical-CSS inlining, and re-render profiling took web performance up by 80%.',
      },
    ],
    implementation: [
      {
        title: 'Browser IDE',
        body: 'Monaco Editor, a file explorer, multi-tab xterm.js terminals attached to Kubernetes pods, and a live preview.',
      },
      {
        title: 'Database Explorer',
        body: 'Auto-laid-out ER diagrams built with React Flow and ELK.js.',
      },
      {
        title: 'Global reach',
        body: 'Platform and MDX blog localized into 16 languages with next-intl, plus JSON-LD, sitemaps, and hreflang.',
      },
    ],
    outcomes: [
      {
        value: '80%',
        label: 'web performance improvement',
        context: 'Code splitting, dynamic imports, critical-CSS inlining, and re-render profiling.',
      },
      {
        value: '100 / 100 / 91',
        label: 'Lighthouse SEO, Accessibility, Performance',
        context: 'Reported scores for the public-facing platform.',
      },
      {
        value: '16',
        label: 'languages',
        context: 'Platform and MDX blog localized with next-intl.',
      },
      {
        value: '73%',
        label: 'of production frontend code written by me',
        context: 'And 67% of the frontend’s commits.',
      },
    ],
    stack: [
      'Next.js',
      'React',
      'TypeScript',
      'Zustand',
      'TanStack Query',
      'Monaco Editor',
      'xterm.js',
      'React Flow',
      'ELK.js',
      'SSE',
      'WebSockets',
      'next-intl',
    ],
    capabilities: [CapabilityId.AI, CapabilityId.FULL_STACK, CapabilityId.PLATFORM],
    related: [ProjectSlug.IGOT, ProjectSlug.APP_BUILDER],
    seoDescription:
      'Case study: the cocoding.ai browser IDE and real-time AI chat Muttakin Islam Hasib built from first commit to production, with SSE and WebSocket streaming and an 80% web performance improvement.',
  },
  {
    slug: ProjectSlug.HASHMATO,
    title: 'Hashmato: multi-tenant cloud POS',
    shortTitle: 'Hashmato',
    company: 'Hashmato',
    companyContext:
      'Cloud POS for F&B and retail operators, part of RBS’s hospitality portfolio (4,800+ properties, 35+ countries).',
    role: 'Software Engineer II',
    period: 'Sep 2025 – Mar 2026',
    location: 'Singapore (remote)',
    tone: ProjectTone.LEDGER,
    summary:
      'Payment, delivery, pricing, and ordering services for a database-per-tenant POS, where every tenant brings its own providers.',
    highlights: [
      'One adapter interface for Stripe, Omise, PayNow QR, and an in-house gateway.',
      'Deliveroo, Grab, and Delivery Hero behind one partner interface.',
      'A shared data-access layer behind 30+ domain modules on database-per-tenant PostgreSQL.',
    ],
    overview: [
      'Hashmato is a cloud POS for food-and-beverage and retail operators. I worked on its backend: the payment gateway, the food-delivery integration service, the shared data-access layer, a pricing engine, and a stored-value ordering backend.',
      'Every one of these runs per tenant, and each tenant can be configured differently.',
    ],
    context: [
      'In a multi-tenant POS, tenants don’t share a payment provider, a delivery partner, or a price list. One tenant takes Stripe, another PayNow QR. One sells on Grab, another on Deliveroo.',
      'Money and orders also leave no room for partial failure. Webhooks can arrive more than once, partners retry, and refunds have to reconcile.',
    ],
    built: [
      'Architected a multi-provider payment gateway: Stripe, Omise, PayNow QR, or an in-house gateway behind one adapter interface, with HMAC-verified webhooks and BullMQ retries.',
      'Built a food-delivery integration service connecting POS menus and orders to Deliveroo, Grab, and Delivery Hero: menu sync, order ingestion, store status, and OAuth2/HMAC webhooks.',
      'Designed the shared data-access layer behind 30+ domain modules of a database-per-tenant PostgreSQL/TypeORM platform: nested-relation filters, transactional bulk upserts, streaming export, and queued Excel import.',
      'Built a context-aware pricing engine from scratch (brand, location, channel, and timezone schedules), then removed an N+1 bottleneck by batching per-item override lookups into one query per page.',
      'Delivered a stored-value ordering backend: cart and combos, prepaid wallets, auto-recharge, ledgered refunds, and partial cancellations, using PostgreSQL transactions and atomic Redis Lua queue numbering.',
      'Extended Kubernetes delivery for 7 NestJS microservices (Helm, helmfile, SOPS, Traefik) and containerized 3 new services with multi-stage Docker builds and GitHub Actions publishing to GHCR.',
    ],
    challenges: [
      {
        title: 'Many providers, one checkout',
        body: 'Each tenant can run a different payment provider, and the POS shouldn’t need to know which one.',
      },
      {
        title: 'Partners that speak different protocols',
        body: 'Delivery platforms each have their own menu formats, order flows, store status, and webhook security.',
      },
      {
        title: 'Prices that depend on context',
        body: 'The same item can cost different amounts by brand, location, channel, and time of day in the tenant’s timezone.',
      },
      {
        title: 'Money that must always reconcile',
        body: 'Wallets, auto-recharge, refunds, and partial cancellations all touch balances that must stay consistent.',
      },
    ],
    decisions: [
      {
        title: 'Adapters behind one interface',
        body: 'Payment providers and delivery partners each implement a single interface. Webhooks are verified with HMAC (and OAuth2 where partners require it) and retried through BullMQ.',
      },
      {
        title: 'Database per tenant, shared access layer',
        body: 'Tenants keep separate PostgreSQL databases, while 30+ domain modules share one data-access layer for filtering, bulk upserts, export, and import.',
      },
      {
        title: 'Batch the lookups',
        body: 'The pricing engine’s first version looked up overrides per item. Batching them into one PostgreSQL query per page removed the N+1.',
      },
      {
        title: 'Transactions and atomic counters',
        body: 'Ordering uses PostgreSQL transactions for balances and ledgered refunds, and Redis Lua scripts for atomic queue numbers.',
      },
    ],
    implementation: [
      {
        title: 'Payment gateway',
        body: 'Stripe, Omise, PayNow QR, and an in-house gateway behind one adapter, with HMAC-verified webhooks and BullMQ retries.',
      },
      {
        title: 'Delivery integrations',
        body: 'Deliveroo, Grab, and Delivery Hero: menu sync, order ingestion, store status, OAuth2/HMAC webhooks.',
      },
      {
        title: 'Delivery pipeline',
        body: '7 NestJS microservices on Kubernetes with Helm, helmfile, SOPS, and Traefik; 3 new services containerized with GitHub Actions to GHCR.',
      },
    ],
    outcomes: [
      {
        value: '4',
        label: 'payment providers behind one adapter',
        context: 'Stripe, Omise, PayNow QR, and an in-house gateway, chosen per tenant.',
      },
      {
        value: '30+',
        label: 'domain modules on one data-access layer',
        context: 'Database-per-tenant PostgreSQL with TypeORM.',
      },
      {
        value: '1 query',
        label: 'per page for price overrides',
        context: 'Replaced an N+1 lookup in the pricing engine’s first version.',
      },
      {
        value: '7',
        label: 'NestJS microservices on Kubernetes delivery',
        context: 'Extended with Helm, helmfile, SOPS, and Traefik.',
      },
    ],
    stack: [
      'NestJS',
      'TypeScript',
      'PostgreSQL',
      'TypeORM',
      'Redis',
      'BullMQ',
      'Docker',
      'Kubernetes',
      'Helm',
      'GitHub Actions',
    ],
    capabilities: [CapabilityId.FULL_STACK, CapabilityId.PLATFORM],
    related: [ProjectSlug.COCODING, ProjectSlug.IGOT],
    seoDescription:
      'Case study: payment, delivery, pricing, and ordering services Muttakin Islam Hasib built for Hashmato’s multi-tenant cloud POS on NestJS, PostgreSQL, Redis, and Kubernetes.',
  },
  {
    slug: ProjectSlug.IGOT,
    title: 'iGOT.ai: AI agents and workflow platform',
    shortTitle: 'iGOT.ai',
    company: 'iGOT.ai',
    companyContext: 'No-code platform for building LLM-powered virtual assistants and workflow agents.',
    role: 'Frontend Engineer, then Engineering Manager',
    period: 'Mar 2024 – Mar 2025',
    location: 'Vietnam (remote)',
    tone: ProjectTone.AGENT,
    summary:
      'The graph engine behind a no-code AI agent builder, then leading the team that built five AI and Web3 products on top of it.',
    highlights: [
      'Architected the React Flow graph engine that syncs canvas edges with backend execution order.',
      'Auto-layout and optimistic node creation across 23 task-node types.',
      'Managed and mentored 7 engineers across 5 AI and Web3 products.',
    ],
    overview: [
      'iGOT.ai is a no-code platform for building LLM-powered assistants and workflow agents. I joined as a frontend engineer and architected the graph engine behind iGOT.ai Studio’s agent builder.',
      'Six months later I became engineering manager, leading 7 engineers across 5 AI and Web3 products, including a multi-agent RAG platform for a government client.',
    ],
    context: [
      'In a no-code agent builder, the canvas is the program. If what people draw and what the backend runs disagree, the product is wrong in a way users can’t debug.',
      'As a manager, the problem shifted from one engine to five products that needed consistent builds, reviews, and delivery.',
    ],
    built: [
      'Architected the graph engine behind iGOT.ai Studio’s no-code AI agent builder in React Flow, syncing canvas edges with backend execution order.',
      'Added auto-layout and optimistic node creation; the engine powers 23 task-node types.',
      'Developed the iGOT.ai mobile app with voice-based AI interaction in React Native, and published the @igot.ai/react-native npm package.',
      'Implemented a Siri-like voice assistant for EMDDI, a ride-hailing app, and a Flutter chat-bubble boilerplate to embed iGOT.ai agents in iHanoi.',
    ],
    led: [
      'Managed and mentored 7 engineers across 5 AI and Web3 products; standardized containerized builds, CI/CD, and pre-commit quality gates.',
      'Architected and shipped a full-stack AI audit platform for a Vietnamese government client: a 6-stage multi-agent RAG pipeline, role-based access, and versioned AI results with a full audit trail.',
      'Architected and led Workbook, a NotebookLM-style research app with multi-agent workflows and Google Docs/Sheets/Drive sources, built with Python, FastAPI, and PostgreSQL.',
      'Led delivery of Datalog (formerly Catalog): owned the project plan and ran architecture walkthroughs and code reviews.',
      'Led development of OpenWare, a Solana DeFi platform with an AI-powered token launcher and a real-time multi-wallet trading interface.',
    ],
    challenges: [
      {
        title: 'The canvas is the program',
        body: 'Edges drawn on the canvas had to match the order the backend actually executes tasks in.',
      },
      {
        title: 'Graphs that stay readable',
        body: 'As people add nodes, layouts tangle. New nodes also need to appear instantly, before the server confirms them.',
      },
      {
        title: 'Five products, one team',
        body: 'Different stacks and deadlines needed shared standards for builds, CI/CD, and quality.',
      },
    ],
    decisions: [
      {
        title: 'Edges define execution order',
        body: 'The graph engine keeps canvas edges and backend execution order in sync, so what users draw is what runs.',
      },
      {
        title: 'Auto-layout and optimistic nodes',
        body: 'Layout runs automatically and new nodes appear immediately, then reconcile with the backend.',
      },
      {
        title: 'Standardize the delivery path',
        body: 'Containerized builds, CI/CD, and pre-commit quality gates across the team’s products.',
      },
      {
        title: 'Audit everything the AI decides',
        body: 'The government platform keeps versioned AI results with a full audit trail, behind role-based access.',
      },
    ],
    implementation: [
      {
        title: 'Graph engine',
        body: 'React Flow canvas with edge-to-execution-order sync, auto-layout, and optimistic node creation for 23 task-node types.',
      },
      {
        title: 'AI audit platform',
        body: '6-stage multi-agent RAG pipeline, role-based access, versioned results, and an audit trail.',
      },
      {
        title: 'Mobile and embeds',
        body: 'React Native voice app, the @igot.ai/react-native package, and a Flutter chat bubble for iHanoi.',
      },
    ],
    outcomes: [
      {
        value: '23',
        label: 'task-node types on one graph engine',
        context: 'iGOT.ai Studio’s no-code agent builder.',
      },
      {
        value: '7',
        label: 'engineers managed and mentored',
        context: 'Across 5 AI and Web3 products, as engineering manager.',
      },
      {
        value: '6',
        label: 'stage multi-agent RAG pipeline',
        context: 'Shipped for a Vietnamese government client, with a full audit trail.',
      },
    ],
    stack: [
      'React',
      'React Flow',
      'TypeScript',
      'Python',
      'FastAPI',
      'PostgreSQL',
      'React Native',
      'Flutter',
      'Docker',
      'CI/CD',
    ],
    capabilities: [
      CapabilityId.INTERACTIVE,
      CapabilityId.AI,
      CapabilityId.FULL_STACK,
      CapabilityId.PLATFORM,
    ],
    related: [ProjectSlug.APP_BUILDER, ProjectSlug.COCODING],
    seoDescription:
      'Case study: the React Flow graph engine Muttakin Islam Hasib architected for iGOT.ai’s no-code AI agent builder, and his work leading 7 engineers across 5 AI products.',
  },
];

const projectBySlug = new Map(projects.map((project) => [project.slug, project]));

export function findProject(slug: string): Project | undefined {
  return projectBySlug.get(slug as ProjectSlug);
}

export function getProject(slug: ProjectSlug): Project {
  const project = projectBySlug.get(slug);
  if (!project) throw new Error(`Unknown project: ${slug}`);
  return project;
}

export function getNextProject(slug: ProjectSlug): Project {
  const index = projects.findIndex((project) => project.slug === slug);
  return projects[(index + 1) % projects.length];
}
