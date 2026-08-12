import { describe, expect, it } from 'vitest';

import {
  allToolDefinitions,
  categoryRegistry,
  getRelatedTools,
  getToolBySlug,
  toolDiscoveryIndex,
  toolMetadataIndex,
  toolRegistry,
  validateToolRegistry,
  PHASE6_EVALUATION_FIXTURE_MANIFEST,
  validatePhase6FixtureManifest,
  validateRegulatedUtilitiesGoldenFixtureManifest,
} from '@/domain/registry';
import { getToolPageRouteContract } from '@/lib/route-contract';

describe('tool registry contract', () => {
  it('contains the published foundation, business, finance, Phase 4/5 and visible WP-5 beta tools', () => {
    expect(toolRegistry.map((tool) => tool.slug)).toEqual([
      'cagr-calculator',
      'roi-calculator',
      'gst-calculator',
      'url-qr',
      'upi-standee',
      'letterhead-generator',
      'payment-receipt-generator',
      'business-card-generator',
      'invoice-generator',
      'invoice-number-generator',
      'quotation-generator',
      'gst-invoice-generator',
      'hra-calculator',
      'margin-calculator',
      'markup-calculator',
      'break-even-calculator',
      'pricing-calculator',
      'cash-flow-calculator',
      'burn-rate-calculator',
      'runway-calculator',
      'marketplace-margin-calculator',
      'roas-calculator',
      'cod-cost-calculator',
      'emi-calculator',
      'sip-calculator',
      'fd-calculator',
      'xirr-calculator',
      'loan-comparison',
      'income-tax-calculator',
      'tds-calculator',
      'corporate-tax-calculator',
      'presumptive-tax-calculator',
      'ctc-calculator',
      'in-hand-salary-calculator',
      'pf-calculator',
      'gratuity-calculator',
      'cac-calculator',
      'ltv-calculator',
      'saas-metrics-calculator',
      'startup-valuation-calculator',
      'equity-dilution-calculator',
      'esop-calculator',
      'amazon-fees-calculator',
      'flipkart-fees-calculator',
      'business-name-generator',
      'pricing-assistant',
      'startup-cost-estimator',
      'business-plan-assistant',
      'percentage-calculator',
      'discount-calculator',
      'area-converter',
      'business-days-calculator',
      'fuel-expense-calculator',
      'volumetric-weight-calculator',
      'word-character-counter',
      'password-toolkit',
      'todo-checklist',
      'whatsapp-link-generator',
      'vcard-qr-generator',
      'wifi-qr-generator',
      'barcode-generator',
      'qr-barcode-scanner',
      'photo-resizer-compressor',
      'pdf-merge-split',
      'digital-signature-generator',
      'email-signature-generator',
      'review-request-builder',
      'favicon-app-icon-generator',
      'price-tag-generator',
      'delivery-challan-generator',
      'shipping-label-generator',
      'purchase-order-generator',
      'menu-generator',
      'wage-slip-generator',
      'rent-receipt-generator',
      'notice-period-calculator',
      'leave-balance-calculator',
      'hsn-sac-finder',
      'gst-filing-due-date-calendar',
      'depreciation-calculator',
      'professional-tax-calculator',
      'msme-late-payment-interest-calculator',
      'currency-converter',
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
      'daily-utilities',
      'retail-logistics',
      'marketing-digital',
      'media-files',
    ]);
  });

  it('keeps the expansion category metadata stable while waves are enabled', () => {
    const expansionCategories = categoryRegistry.filter((category) =>
      ['daily-utilities', 'retail-logistics', 'marketing-digital', 'media-files'].includes(category.slug),
    );

    expect(expansionCategories).toHaveLength(4);
    expect(expansionCategories.map((category) => category.name)).toEqual([
      'Everyday Utilities',
      'Retail & Logistics',
      'Marketing & Digital',
      'Media & Files',
    ]);
    expect(expansionCategories.every((category) => category.searchTerms.length > 0)).toBe(true);
  });

  it('declares sources, review dates, calculations and privacy policy for every tool', () => {
    for (const tool of toolRegistry) {
      expect(tool.inputSchema).toBeDefined();
      expect(tool.calculate).toBeTypeOf('function');
      expect(tool.renderResult).toBeTypeOf('function');
      expect(tool.sources.length).toBeGreaterThan(0);
      expect(tool.lastReviewed).toMatch(/^2026-\d{2}-\d{2}$/);
      expect(tool.privacyNote).toContain('browser');
      expect(['local-only', 'local-with-bundled-data', 'network-required']).toContain(tool.executionMode);
      expect(['live', 'beta']).toContain(tool.lifecycle);
      expect(tool.secondaryCategories).toBeInstanceOf(Array);
      expect(tool.governance.owner).toBeTruthy();
      expect(tool.governance.reviewCadenceDays).toBeGreaterThan(0);
      expect(tool.trust.method).toBeTruthy();
      expect(tool.trust.lastVerified).toMatch(/^2026-\d{2}-\d{2}$/);
      expect(tool.capabilities).toBeInstanceOf(Array);
      expect(tool.analyticsPolicy.allowedProperties).toEqual([
        'toolId',
        'category',
        'format',
        'pageSize',
        'errorCodes',
      ]);
      expect(['not-required', 'pending', 'approved']).toContain(tool.trust.reviewer.status);
      expect(tool.analyticsPolicy.forbiddenProperties).toContain('rawInput');
      expect(['calculator', 'comparison', 'generator', 'worksheet', 'data-backed', 'ai-assisted']).toContain(
        tool.kind,
      );
      expect(tool.ui.adapter).not.toBe('unavailable');
      if (tool.kind === 'generator') expect(tool.generatorKind).toBeDefined();
    }
  });

  it('keeps public definitions and the metadata-only build index separate', () => {
    expect(allToolDefinitions).toHaveLength(83);
    expect(allToolDefinitions.filter((tool) => tool.featureFlag === 'regulated-utilities-wave')).toHaveLength(
      6,
    );
    expect(validateRegulatedUtilitiesGoldenFixtureManifest()).toBe(true);
    expect(
      allToolDefinitions
        .filter((tool) => tool.featureFlag === 'regulated-utilities-wave')
        .every((tool) => tool.lifecycle === 'beta' && tool.trust.reviewer.status === 'pending'),
    ).toBe(true);
    expect(allToolDefinitions.filter((tool) => tool.featureFlag === 'everyday-utilities-wave')).toHaveLength(
      9,
    );
    expect(
      allToolDefinitions
        .filter((tool) => tool.featureFlag === 'everyday-utilities-wave')
        .every((tool) => tool.lifecycle === 'beta'),
    ).toBe(true);
    expect(
      allToolDefinitions.filter((tool) => tool.featureFlag === 'sharing-file-utilities-wave'),
    ).toHaveLength(11);
    expect(
      allToolDefinitions
        .filter((tool) => tool.featureFlag === 'sharing-file-utilities-wave')
        .every((tool) => tool.lifecycle === 'beta' && tool.executionMode === 'local-only'),
    ).toBe(true);
    expect(allToolDefinitions.filter((tool) => tool.featureFlag === 'retail-workplace-wave')).toHaveLength(9);
    expect(
      allToolDefinitions
        .filter((tool) => tool.featureFlag === 'retail-workplace-wave')
        .every((tool) => tool.lifecycle === 'beta' && tool.executionMode === 'local-only'),
    ).toBe(true);
    expect(toolMetadataIndex).toHaveLength(toolRegistry.length);
    expect(toolDiscoveryIndex).toBe(toolMetadataIndex);
    expect(JSON.parse(JSON.stringify(toolDiscoveryIndex))).toEqual(toolDiscoveryIndex);
    for (const metadata of toolMetadataIndex) {
      expect(metadata).not.toHaveProperty('defaultValues');
      expect(metadata).not.toHaveProperty('calculate');
      expect(metadata).not.toHaveProperty('renderResult');
      expect(metadata.lastVerified).toMatch(/^2026-\d{2}-\d{2}$/);
      expect(metadata.capabilities).toEqual(expect.any(Array));
    }
    expect(toolDiscoveryIndex.find((tool) => tool.id === 'url-qr-generator')?.capabilities).toEqual([
      'qr-output',
      'download-png',
      'print-a4',
    ]);
    expect(toolDiscoveryIndex.find((tool) => tool.id === 'amazon-fees-calculator')?.capabilities).toEqual([
      'download-csv',
      'bundled-data',
    ]);
  });

  it('does not imply external approval for regulated tools while review is pending', () => {
    const regulated = toolRegistry.filter((tool) => tool.governance.riskTier === 'D');
    expect(regulated.map((tool) => tool.id)).toEqual([
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
      'wage-slip-generator',
      'rent-receipt-generator',
      'hsn-sac-finder',
      'gst-filing-due-date-calendar',
      'depreciation-calculator',
      'professional-tax-calculator',
      'msme-late-payment-interest-calculator',
    ]);
    for (const tool of regulated) {
      expect(tool.trust.reviewer.status).toBe('pending');
      expect(tool.sources.some((source) => source.evidenceLevel === 'official')).toBe(true);
      expect(tool.governance.policyDependencies.length).toBeGreaterThan(0);
    }
  });

  it('publishes Phase 4 Tier D tools as a controlled beta by default', () => {
    expect(toolRegistry.some((tool) => tool.id === 'hra-calculator')).toBe(true);
    expect(toolRegistry.some((tool) => tool.id === 'income-tax-calculator')).toBe(true);
    expect(allToolDefinitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'hra-calculator', featureFlag: 'phase4-tax-review' }),
        expect.objectContaining({ id: 'income-tax-calculator', featureFlag: 'phase4-tax-review' }),
        expect.objectContaining({ id: 'pf-calculator', featureFlag: 'phase4-tax-review' }),
        expect.objectContaining({ id: 'esop-calculator', featureFlag: 'phase5-startup-marketplace' }),
        expect.objectContaining({
          id: 'amazon-fees-calculator',
          featureFlag: 'phase5-marketplace',
          trust: expect.objectContaining({ effectiveFrom: '2026-03-16' }),
        }),
        expect.objectContaining({
          id: 'pricing-assistant',
          kind: 'ai-assisted',
          featureFlag: 'phase6-ai-assistants',
          executionMode: 'network-required',
          trust: expect.objectContaining({ reviewer: expect.objectContaining({ status: 'pending' }) }),
        }),
      ]),
    );
  });

  it('keeps the Phase 6 evaluation manifest traceable without claiming an independent signature', () => {
    expect(validatePhase6FixtureManifest()).toEqual([]);
    expect(PHASE6_EVALUATION_FIXTURE_MANIFEST.status).toBe('pending');
    expect(PHASE6_EVALUATION_FIXTURE_MANIFEST.signature.status).toBe('pending');
    expect(PHASE6_EVALUATION_FIXTURE_MANIFEST.signature.reviewerName).toBeNull();
    expect(PHASE6_EVALUATION_FIXTURE_MANIFEST.fixtures.length).toBeGreaterThanOrEqual(8);
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

  it('keeps full runtime validation on the server-side registry boundary', () => {
    expect(validateToolRegistry()).toEqual([]);
  });
});
