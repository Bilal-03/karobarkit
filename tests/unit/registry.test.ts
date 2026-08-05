import { describe, expect, it } from 'vitest';

import { categoryRegistry, getRelatedTools, getToolBySlug, toolRegistry } from '@/domain/registry';
import { getToolPageRouteContract } from '@/lib/route-contract';

describe('tool registry contract', () => {
  it('contains exactly the two foundation calculators', () => {
    expect(toolRegistry.map((tool) => tool.slug)).toEqual(['cagr-calculator', 'roi-calculator']);
    expect(categoryRegistry.map((category) => category.slug)).toEqual(['financial-calculators']);
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

  it('links each calculator to the other without dangling relationships', () => {
    for (const tool of toolRegistry) {
      expect(getRelatedTools(tool).map((related) => related.id)).toEqual(
        expect.arrayContaining(tool.relatedToolIds),
      );
    }
  });
});
