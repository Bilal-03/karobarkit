import type { Metadata } from 'next';

import { SiteShell } from '@/components/layout/site-shell';
import { siteConfig } from '@/lib/site';

import '@fontsource/outfit/latin-500.css';
import '@fontsource/outfit/latin-600.css';
import '@fontsource/outfit/latin-700.css';
import '@fontsource/outfit/latin-800.css';
import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@/styles/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: 'KarobarKit · Private business tools for India',
    template: '%s · KarobarKit',
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: 'KarobarKit' }],
  creator: 'KarobarKit',
  icons: { icon: '/brand-mark.svg', apple: '/brand-mark.svg' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" data-scroll-behavior="smooth">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
