import type { Metadata, Viewport } from 'next';
import { Archivo, Martian_Mono } from 'next/font/google';
import { Header } from '@/components/site/Header';
import { JsonLd } from '@/components/site/JsonLd';
import { profile } from '@/content/profile';
import { personSchema, websiteSchema } from '@/lib/schema';
import { siteUrl } from '@/lib/site';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
});

const martian = Martian_Mono({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-martian',
  display: 'swap',
  preload: false,
});

const defaultTitle = `${profile.name}, ${profile.title}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${profile.name}`,
  },
  description: profile.description,
  applicationName: profile.name,
  authors: [{ name: profile.name, url: siteUrl }],
  creator: profile.name,
  keywords: [
    'Senior Full Stack Engineer',
    'React Flow',
    'Node-based editor',
    'AI products',
    'Next.js',
    'TypeScript',
    'NestJS',
    'Multi-tenant SaaS',
    profile.name,
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: profile.name,
    title: defaultTitle,
    description: profile.description,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: profile.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#f4f1e8',
  colorScheme: 'light',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${archivo.variable} ${martian.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        {children}
        <JsonLd data={[personSchema(), websiteSchema()]} />
      </body>
    </html>
  );
}
