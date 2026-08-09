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
import { allToolDefinitions, categoryRegistry, toolRegistry } from '@/domain/registry';

describe('tool discovery', () => {
  it('normalizes punctuation, case, whitespace and length', () => {
    expect(normalizeSearchQuery('  GST—Bill!!  ')).toBe('gst bill');
    expect(normalizeSearchQuery('x'.repeat(100))).toHaveLength(80);
  });

  it('ranks exact names above synonyms and description matches', () => {
    const gst = toolRegistry.find((tool) => tool.id === 'gst-calculator')!;
    expect(scoreTool(gst, 'GST Calculator')).toBe(100);
    expect(scoreTool(gst, 'tax calculator')).toBe(90);
    expect(scoreTool(gst, 'explicit tax component')).toBe(20);
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
  ])('maps the synonym %s to %s', (query, expectedId) => {
    expect(searchTools(query)[0]?.id).toBe(expectedId);
  });

  it('returns no irrelevant tools and filters valid categories', () => {
    expect(searchTools('spaceship telemetry')).toEqual([]);
    expect(filterTools('finance').map((tool) => tool.id)).toEqual([
      'cagr-calculator',
      'roi-calculator',
      'emi-calculator',
      'sip-calculator',
      'fd-calculator',
      'xirr-calculator',
      'loan-comparison',
    ]);
    expect(filterTools('not-a-category')).toEqual([]);
  });

  it('supports scalable type, data-mode and regulatory filters', () => {
    expect(
      filterToolDirectory(toolRegistry, { kind: 'generator', execution: 'local' }).every(
        (tool) => tool.kind === 'generator' && tool.executionMode === 'local-only',
      ),
    ).toBe(true);
    expect(filterToolDirectory(toolRegistry, { regulated: 'regulated' }).map((tool) => tool.id)).toEqual([
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
    ]);
    expect(allToolDefinitions.find((tool) => tool.id === 'hra-calculator')?.featureFlag).toBe(
      'phase4-tax-review',
    );
    expect(filterToolDirectory(toolRegistry, { kind: 'worksheet' })).toEqual([]);
  });

  it('keeps discovery references and featured ordering valid', () => {
    expect(validateDiscoveryRegistry()).toEqual([]);
    expect(getFeaturedTools()).toHaveLength(11);
    expect(getFeaturedTools().every((tool) => tool.featured)).toBe(true);
    expect(new Set(toolRegistry.map((tool) => tool.slug)).size).toBe(toolRegistry.length);
    expect(new Set(categoryRegistry.map((category) => category.slug)).size).toBe(categoryRegistry.length);
  });
});
