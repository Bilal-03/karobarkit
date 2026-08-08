import { describe, expect, it } from 'vitest';

import { getSitemapPaths } from '@/app/sitemap';
import { categoryRegistry, getToolsByCategory, toolRegistry } from '@/domain/registry';
import { pageMetadata } from '@/lib/seo';
import {
  breadcrumbStructuredData,
  faqStructuredData,
  serializeStructuredData,
  toolStructuredData,
} from '@/lib/structured-data';

describe('SEO discovery contracts', () => {
  it('creates complete canonical page metadata', () => {
    const metadata = pageMetadata({ title: 'Example', description: 'Useful description', path: '/example' });
    expect(metadata.title).toBe('Example');
    expect(metadata.description).toBe('Useful description');
    expect(metadata.alternates?.canonical).toMatch(/\/example$/);
    expect(metadata.openGraph).toMatchObject({ title: 'Example', description: 'Useful description' });
    expect(metadata.twitter).toMatchObject({ title: 'Example', description: 'Useful description' });
  });

  it('includes every live tool and populated category once, and excludes thin pages and search', () => {
    const paths = getSitemapPaths();
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).not.toContain('/search');
    for (const tool of toolRegistry) expect(paths).toContain(`/tools/${tool.slug}`);
    for (const category of categoryRegistry) {
      if (getToolsByCategory(category.slug).length > 0) {
        expect(paths).toContain(`/categories/${category.slug}`);
      } else {
        expect(paths).not.toContain(`/categories/${category.slug}`);
      }
    }
  });

  it('generates accurate breadcrumb, application and visible FAQ data', () => {
    const crumbs = breadcrumbStructuredData([
      { label: 'Home', href: '/' },
      { label: 'Tools', href: '/tools' },
      { label: 'CAGR Calculator' },
    ]);
    expect(crumbs.itemListElement).toHaveLength(3);
    expect(crumbs.itemListElement[2]).toMatchObject({ position: 3, name: 'CAGR Calculator' });
    expect(toolStructuredData(toolRegistry[0])).toMatchObject({
      '@type': 'WebApplication',
      name: toolRegistry[0].name,
    });
    expect(faqStructuredData(toolRegistry[0].faqs).mainEntity).toHaveLength(toolRegistry[0].faqs.length);
    expect(serializeStructuredData({ value: '</script>' })).not.toContain('</script>');
  });

  it('keeps metadata and sources populated for every tool', () => {
    for (const tool of toolRegistry) {
      expect(tool.seo.title).toContain(tool.name);
      expect(tool.seo.description.length).toBeGreaterThan(40);
      expect(tool.sources.length).toBeGreaterThan(0);
      for (const source of tool.sources) expect(() => new URL(source.url)).not.toThrow();
    }
  });
});
