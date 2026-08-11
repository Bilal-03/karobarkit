import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  filterTools,
  filterToolDirectory,
  getFeaturedTools,
  normalizeSearchQuery,
  scoreTool,
  searchTools,
  validateDiscoveryRegistry,
} from '@/domain/discovery';
import { allToolDefinitions, categoryRegistry, toolDiscoveryIndex } from '@/domain/registry';

describe('tool discovery', () => {
  it('normalizes punctuation, case, whitespace and length', () => {
    expect(normalizeSearchQuery('  GST—Bill!!  ')).toBe('gst bill');
    expect(normalizeSearchQuery('x'.repeat(100))).toHaveLength(80);
  });

  it('ranks exact names above synonyms and description matches', () => {
    const gst = toolDiscoveryIndex.find((tool) => tool.id === 'gst-calculator')!;
    expect(scoreTool(gst, 'GST Calculator')).toBe(100);
    expect(scoreTool(gst, 'tax calculator')).toBe(90);
    expect(scoreTool(gst, 'explicit tax component')).toBe(20);
  });

  it('supports multi-token intent without displacing exact names or synonyms', () => {
    const gstInvoice = toolDiscoveryIndex.find((tool) => tool.id === 'gst-invoice-generator')!;
    expect(scoreTool(gstInvoice, 'GST Invoice Generator')).toBe(100);
    expect(scoreTool(gstInvoice, 'GST Bill')).toBe(90);
    expect(searchTools(toolDiscoveryIndex, 'payment qr standee')[0]?.id).toBe('upi-standee-generator');
    expect(searchTools(toolDiscoveryIndex, 'cash runway planning')[0]?.id).toBe('runway-calculator');
  });

  it.each([
    ['return on investment', 'roi-calculator'],
    ['growth rate', 'cagr-calculator'],
    ['gst bill', 'gst-invoice-generator'],
    ['money receipt', 'payment-receipt-generator'],
    ['payment qr', 'upi-standee-generator'],
    ['break even point', 'break-even-calculator'],
    ['cash runway', 'runway-calculator'],
    ['return on ad spend', 'roas-calculator'],
    ['equated monthly instalment', 'emi-calculator'],
    ['systematic investment plan', 'sip-calculator'],
    ['fixed deposit calculator', 'fd-calculator'],
    ['dated cash flow return', 'xirr-calculator'],
    ['compare loans', 'loan-comparison'],
    ['customer acquisition cost', 'cac-calculator'],
    ['customer lifetime value', 'ltv-calculator'],
    ['startup valuation', 'startup-valuation-calculator'],
    ['amazon seller fees', 'amazon-fees-calculator'],
    ['flipkart commission', 'flipkart-fees-calculator'],
  ])('maps the synonym %s to %s', (query, expectedId) => {
    expect(searchTools(toolDiscoveryIndex, query)[0]?.id).toBe(expectedId);
  });

  it('returns no irrelevant tools and filters valid categories', () => {
    expect(searchTools(toolDiscoveryIndex, 'spaceship telemetry')).toEqual([]);
    expect(filterTools(toolDiscoveryIndex, 'finance').map((tool) => tool.id)).toEqual([
      'cagr-calculator',
      'roi-calculator',
      'emi-calculator',
      'sip-calculator',
      'fd-calculator',
      'xirr-calculator',
      'loan-comparison',
      'currency-converter',
    ]);
    expect(filterTools(toolDiscoveryIndex, 'not-a-category')).toEqual([]);
  });

  it('supports scalable type, data-mode and regulatory filters', () => {
    expect(
      filterToolDirectory(toolDiscoveryIndex, { kind: 'generator', execution: 'local' }).every(
        (tool) => tool.kind === 'generator' && tool.executionMode === 'local-only',
      ),
    ).toBe(true);
    expect(
      filterToolDirectory(toolDiscoveryIndex, { regulated: 'regulated' }).map((tool) => tool.id),
    ).toEqual([
      'gst-calculator',
      'gst-invoice-generator',
      'hra-calculator',
      'income-tax-calculator',
      'tds-calculator',
      'corporate-tax-calculator',
      'presumptive-tax-calculator',
      'ctc-calculator',
      'in-hand-salary-calculator',
      'pf-calculator',
      'gratuity-calculator',
      'esop-calculator',
      'hsn-sac-finder',
      'gst-filing-due-date-calendar',
      'depreciation-calculator',
      'professional-tax-calculator',
      'msme-late-payment-interest-calculator',
      'currency-converter',
    ]);
    expect(allToolDefinitions.find((tool) => tool.id === 'hra-calculator')?.featureFlag).toBe(
      'phase4-tax-review',
    );
    expect(filterToolDirectory(toolDiscoveryIndex, { kind: 'worksheet' }).map((tool) => tool.id)).toEqual([
      'saas-metrics-calculator',
      'startup-valuation-calculator',
      'esop-calculator',
      'todo-checklist',
    ]);
  });

  it('keeps discovery references and featured ordering valid', () => {
    expect(validateDiscoveryRegistry(toolDiscoveryIndex)).toEqual([]);
    expect(getFeaturedTools(toolDiscoveryIndex)).toHaveLength(15);
    expect(getFeaturedTools(toolDiscoveryIndex).every((tool) => tool.featured)).toBe(true);
    expect(
      getFeaturedTools(toolDiscoveryIndex)
        .slice(-4)
        .map((tool) => tool.id),
    ).toEqual(['margin-calculator', 'emi-calculator', 'sip-calculator', 'percentage-calculator']);
    expect(new Set(toolDiscoveryIndex.map((tool) => tool.slug)).size).toBe(toolDiscoveryIndex.length);
    expect(new Set(categoryRegistry.map((category) => category.slug)).size).toBe(categoryRegistry.length);
  });

  it('keeps client discovery modules away from the runtime registry', () => {
    const sourceFiles = [
      join(process.cwd(), 'src/domain/discovery/index.ts'),
      join(process.cwd(), 'src/components/search/live-tool-search.tsx'),
    ];

    for (const sourceFile of sourceFiles) {
      const source = readFileSync(sourceFile, 'utf8');
      expect(source).not.toMatch(/from ['"]@\/domain\/registry['"]/);
      expect(source).not.toContain('allToolDefinitions');
      expect(source).not.toContain('toolRegistry');
    }
  });
});
