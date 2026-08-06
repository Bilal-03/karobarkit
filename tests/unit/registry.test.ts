import { describe, expect, it } from 'vitest';

import { categoryRegistry, getRelatedTools, getToolBySlug, toolRegistry } from '@/domain/registry';
import { getToolPageRouteContract } from '@/lib/route-contract';

describe('tool registry contract', () => {
  it('contains the tested calculator and QR generator milestone', () => {
    expect(toolRegistry.map((tool) => tool.slug)).toEqual([
      'cagr-calculator',
      'roi-calculator',
      'url-qr',
      'upi-standee',
    ]);
    expect(categoryRegistry.map((category) => category.slug)).toEqual([
      'financial-calculators',
      'marketing-barcodes',
    ]);
  });

  it('declares sources, review dates, calculations and privacy policy for every tool', () => {
    for (const tool of toolRegistry) {
      expect(tool.inputSchema).toBeDefined();
      expect(tool.calculate).toBeTypeOf('function');
      expect(tool.renderResult).toBeTypeOf('function');
      expect(tool.sources.length).toBeGreaterThan(0);
      expect(tool.lastReviewed).toMatch(/^2026-\d{2}-\d{2}$/);
      expect(tool.privacyNote).toContain('browser');
      expect(tool.analyticsPolicy.forbiddenProperties).toContain('rawInput');
      expect(['calculator', 'generator']).toContain(tool.kind);
    }
  });

  it('keeps slug, canonical path, title and H1 tied to one record', () => {
    for (const tool of toolRegistry) {
      const contract = getToolPageRouteContract(tool);
      expect(contract.slug).toBe(tool.slug);
      expect(contract.canonicalPath).toBe(`/tools/${tool.slug}`);
      expect(contract.h1).toBe(tool.name);
      expect(contract.title).toBe(tool.seo.title);
      expect(getToolBySlug(contract.slug)?.id).toBe(tool.id);
    }
  });

  it('has no dangling related-tool relationships', () => {
    for (const tool of toolRegistry) {
      expect(getRelatedTools(tool).map((related) => related.id)).toEqual(
        expect.arrayContaining(tool.relatedToolIds),
      );
    }
  });
});
