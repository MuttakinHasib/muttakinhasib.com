export interface OtherWork {
  company: string;
  title: string;
  description: string;
}

/** Resume-backed work that doesn't have a full case study. No links are invented. */
export const otherWork: OtherWork[] = [
  {
    company: 'ImagineArt',
    title: 'AI video and audio nodes',
    description:
      'Ad Maker (video ads from product, avatar, and template selections), Storyboard, Sound Effects, and Combine Video, plus the audio/video merger rebuilt as a multi-track timeline.',
  },
  {
    company: 'ImagineArt',
    title: 'Creative Analyzer',
    description:
      'Ad-effectiveness predictions for enterprise clients through Brainsuite’s scoring API, with a schema-driven test wizard, reports for 3 ad formats, and PDF/XLSX/CSV export.',
  },
  {
    company: 'iGOT.ai',
    title: 'Workbook',
    description:
      'A NotebookLM-style research app with multi-agent workflows, Google Docs/Sheets/Drive sources, and chart and Mermaid visualizations. Architected and led; Python, FastAPI, PostgreSQL.',
  },
  {
    company: 'iGOT.ai',
    title: 'Mobile app and @igot.ai/react-native',
    description:
      'Voice-based AI interaction in React Native, and a published npm package for embedding iGOT.ai assistants in third-party apps. Also a Siri-like voice assistant for the EMDDI ride-hailing app.',
  },
  {
    company: 'iGOT.ai',
    title: 'OpenWare',
    description:
      'Led development of a Solana DeFi platform with an AI-powered token launcher, AMM trading, liquidity management, and a real-time multi-wallet trading interface.',
  },
  {
    company: 'BeWeddy',
    title: 'Wedding platform',
    description:
      'Architected and built the full platform on Next.js, NestJS, and MongoDB, with Stripe Connect payouts to couples and venues and an Evite Canva app for invitations.',
  },
  {
    company: 'SoftTribe',
    title: 'React Flow client projects',
    description: 'Led delivery of 10+ client projects built on node-based interfaces, most centred on AI integrations.',
  },
];
