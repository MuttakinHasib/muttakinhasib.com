import { ProjectSlug } from './types';

export interface Role {
  title: string;
  period: string;
  points: string[];
}

export interface Experience {
  company: string;
  location: string;
  context?: string;
  roles: Role[];
  caseStudies: ProjectSlug[];
}

export const experience: Experience[] = [
  {
    company: 'ImagineArt',
    location: 'San Francisco, CA (remote)',
    context: 'AI image and video creation platform with 100M+ users across web and mobile.',
    caseStudies: [ProjectSlug.APP_BUILDER, ProjectSlug.GENERATIVE_FILL],
    roles: [
      {
        title: 'Senior Frontend Engineer',
        period: 'Feb 2026 – Sep 2026',
        points: [
          'Architected and launched App Builder for ImagineArt Workflows, with one-click “Build App” from any canvas selection.',
          'Improved canvas rendering by ~20% and built canvas components adopted across 45, 30, and 29 node types.',
          'Built group connections that wire a whole section or selection into a node in one drag, validated against supported input types.',
          'Top contributor to the web app: 2,152 commits between Feb and Sep 2026.',
          'Built Generative Fill and Compositor, two AI image editors.',
          'Developed AI video and audio nodes, including Ad Maker, Storyboard, Sound Effects, and Combine Video, and rebuilt the audio/video merger as a multi-track timeline.',
          'Delivered Creative Analyzer for enterprise clients: ad-effectiveness predictions through Brainsuite’s scoring API, a schema-driven test wizard, reports for 3 ad formats, and PDF/XLSX/CSV export.',
        ],
      },
    ],
  },
  {
    company: 'Hashmato',
    location: 'Singapore (remote)',
    context: 'Cloud POS for F&B and retail operators, part of RBS’s hospitality portfolio.',
    caseStudies: [ProjectSlug.HASHMATO],
    roles: [
      {
        title: 'Software Engineer II',
        period: 'Sep 2025 – Mar 2026',
        points: [
          'Architected a multi-provider payment gateway and a food-delivery integration service for a multi-tenant cloud POS.',
          'Designed the shared data-access layer behind 30+ domain modules on database-per-tenant PostgreSQL.',
          'Built a context-aware pricing engine and a stored-value ordering backend.',
          'Extended Kubernetes delivery for 7 NestJS microservices.',
        ],
      },
    ],
  },
  {
    company: 'cocoding.ai',
    location: 'France (remote)',
    context: 'AI app builder that turns natural-language prompts into full-stack SaaS applications.',
    caseStudies: [ProjectSlug.COCODING],
    roles: [
      {
        title: 'Software Engineer (part-time)',
        period: 'Nov 2024 – Feb 2026',
        points: [
          'Architected and built the frontend from first commit to production.',
          'Built a browser IDE around Monaco and a real-time AI chat streaming multi-agent output over SSE and WebSockets.',
          'Improved web performance by 80% and localized the platform into 16 languages.',
        ],
      },
    ],
  },
  {
    company: 'iGOT.ai',
    location: 'Vietnam (remote)',
    context: 'No-code platform for building LLM-powered virtual assistants and workflow agents.',
    caseStudies: [ProjectSlug.IGOT],
    roles: [
      {
        title: 'Engineering Manager',
        period: 'Sep 2024 – Mar 2025',
        points: [
          'Managed and mentored 7 engineers across 5 AI and Web3 products.',
          'Architected and shipped an AI audit platform for a government client with a 6-stage multi-agent RAG pipeline.',
          'Led Workbook, Datalog, and OpenWare.',
        ],
      },
      {
        title: 'Frontend Engineer',
        period: 'Mar 2024 – Sep 2024',
        points: [
          'Architected the React Flow graph engine behind iGOT.ai Studio’s agent builder (23 task-node types).',
          'Built the React Native voice app and published @igot.ai/react-native.',
        ],
      },
    ],
  },
  {
    company: 'SoftTribe',
    location: 'Bangladesh (remote)',
    caseStudies: [],
    roles: [
      {
        title: 'Senior Frontend Engineer (part-time)',
        period: 'Jan 2023 – Mar 2024',
        points: [
          'Led delivery of 10+ client projects built on React Flow node-based interfaces, most centered on AI integrations.',
        ],
      },
    ],
  },
  {
    company: 'BeWeddy',
    location: 'United States (remote)',
    caseStudies: [],
    roles: [
      {
        title: 'Senior Software Engineer',
        period: 'Dec 2022 – Dec 2023',
        points: [
          'Architected and built the full platform on Next.js, NestJS, and MongoDB, including personalized wedding websites.',
          'Integrated Stripe Connect to pay out gift-card and honeymoon funds to couples and venues.',
          'Built the Evite BeWeddy Canva app for designing and sending invitations.',
        ],
      },
      {
        title: 'Software Engineer',
        period: 'Jul 2021 – Dec 2022',
        points: [
          'Built role-based authentication, SMS/email/calendar invites, and RSVP tracking.',
          'Integrated Tango gifting and Stripe subscription onboarding; deployed on AWS EC2.',
        ],
      },
    ],
  },
  {
    company: 'Self-employed',
    location: 'Remote',
    caseStudies: [],
    roles: [
      {
        title: 'Freelance Full Stack Developer',
        period: '2018 – present',
        points: [
          'Full-stack e-commerce platforms (NestJS, React, Next.js) and node-based workflow builders (React Flow/xyflow).',
        ],
      },
    ],
  },
];

export const education = [
  {
    degree: 'B.Sc. in Computer Science and Engineering',
    school: 'Uttara University, Dhaka',
    note: 'In progress',
  },
  {
    degree: 'Diploma in Computer Engineering',
    school: 'Model Institute of Science & Technology, Gazipur',
    note: 'CGPA 3.96 / 4.00',
  },
] as const;
