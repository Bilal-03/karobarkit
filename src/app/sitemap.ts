import type { MetadataRoute } from 'next';

import { categoryRegistry, toolRegistry } from '@/domain/registry';
import { absoluteUrl } from '@/lib/site';

const staticPaths = [
  '/',
  '/tools',
  '/categories',
  '/methodology',
  '/gst-methodology',
  '/gst-policy-version',
  '/gst-source-verification',
  '/sources',
  '/about',
  '/contact',
  '/faq',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/report-an-error',
];

export function getSitemapPaths() {
  return [
    ...staticPaths,
    ...categoryRegistry.map((category) => `/categories/${category.slug}`),
    ...toolRegistry.map((tool) => `/tools/${tool.slug}`),
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...staticPaths.map((path) => ({
      url: absoluteUrl(path),
      lastModified: new Date('2026-08-06T00:00:00Z'),
    })),
    ...categoryRegistry.map((category) => ({
      url: absoluteUrl(`/categories/${category.slug}`),
      lastModified: new Date('2026-08-06T00:00:00Z'),
    })),
    ...toolRegistry.map((tool) => ({
      url: absoluteUrl(`/tools/${tool.slug}`),
      lastModified: new Date(tool.lastReviewed),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
