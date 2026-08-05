import type { Metadata } from 'next';

import { absoluteUrl, siteConfig } from './site';

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
}

export function pageMetadata({ title, description, path }: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: siteConfig.name,
      type: 'website',
    },
    twitter: { card: 'summary', title, description },
  };
}
