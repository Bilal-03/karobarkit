import type { BreadcrumbItem } from '@/components/ui/breadcrumbs';
import type { FaqItem } from '@/domain/registry/types';

import { absoluteUrl, siteConfig } from './site';

export function breadcrumbStructuredData(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
}

export function websiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    alternateName: siteConfig.positioning,
    url: absoluteUrl('/'),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/search')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function toolStructuredData(tool: {
  name: string;
  summary: string;
  slug: string;
  category?: string;
  lastReviewed?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    description: tool.summary,
    url: absoluteUrl(`/tools/${tool.slug}`),
    applicationCategory: 'BusinessApplication',
    ...(tool.category ? { applicationSubCategory: tool.category } : {}),
    ...(tool.lastReviewed ? { dateModified: tool.lastReviewed } : {}),
    operatingSystem: 'Any modern web browser',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  };
}

export function faqStructuredData(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function serializeStructuredData(value: object) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
