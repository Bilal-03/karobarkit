import { describe, expect, it } from 'vitest';

import {
  allToolDefinitions,
  categoryRegistry,
  getRelatedTools,
  getToolBySlug,
  toolMetadataIndex,
  toolRegistry,
} from '@/domain/registry';
import { getToolPageRouteContract } from '@/lib/route-contract';

describe('tool registry contract', () => {
  it('contains the completed calculators, GST calculator, QR generators and document generators', () => {
    expect(toolRegistry.map((tool) => tool.slug)).toEqual([
      'cagr-calculator',
      'roi-calculator',
      'gst-calculator',
      'url-qr',
      'upi-standee',
      'letterhead-generator',
      'payment-receipt-generator',
      'gst-invoice-generator',
    ]);
    expect(categoryRegistry.map((category) => category.slug)).toEqual([
      'business',
      'gst-tax',
      'startup',
      'finance',
      'ecommerce',
      'hr-salary',
      'generators',
      'ai-tools',
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
      expect(tool.executionMode).toBe('local-only');
      expect(tool.lifecycle).toBe('live');
      expect(tool.secondaryCategories).toBeInstanceOf(Array);
      expect(tool.governance.owner).toBeTruthy();
      expect(tool.governance.reviewCadenceDays).toBeGreaterThan(0);
      expect(tool.trust.method).toBeTruthy();
      expect(tool.trust.lastVerified).toMatch(/^2026-\d{2}-\d{2}$/);
      expect(['not-required', 'pending', 'approved']).toContain(tool.trust.reviewer.status);
      expect(tool.analyticsPolicy.forbiddenProperties).toContain('rawInput');
      expect(['calculator', 'generator']).toContain(tool.kind);
      expect(tool.ui.adapter).not.toBe('unavailable');
      if (tool.kind === 'generator') expect(tool.generatorKind).toBeDefined();
    }
  });

  it('keeps public definitions and the metadata-only build index separate', () => {
    expect(allToolDefinitions).toHaveLength(8);
    expect(toolMetadataIndex).toHaveLength(toolRegistry.length);
    for (const metadata of toolMetadataIndex) {
      expect(metadata).not.toHaveProperty('defaultValues');
      expect(metadata).not.toHaveProperty('calculate');
      expect(metadata).not.toHaveProperty('renderResult');
      expect(metadata.lastVerified).toMatch(/^2026-\d{2}-\d{2}$/);
    }
  });

  it('does not imply external approval for regulated tools while review is pending', () => {
    const regulated = toolRegistry.filter((tool) => tool.governance.riskTier === 'D');
    expect(regulated.map((tool) => tool.id)).toEqual(['gst-calculator', 'gst-invoice-generator']);
    for (const tool of regulated) {
      expect(tool.trust.reviewer.status).toBe('pending');
      expect(tool.sources.some((source) => source.evidenceLevel === 'official')).toBe(true);
      expect(tool.governance.policyDependencies.length).toBeGreaterThan(0);
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
