import { describe, expect, it } from 'vitest';

import {
  calculatePhase5,
  phase5CalculatorFields,
  validatePhase5CalculatorInput,
} from '@/domain/calculations/phase5';
import {
  getMarketplacePolicy,
  getMarketplacePolicyFreshness,
  MARKETPLACE_POLICY_BUNDLE,
  validateMarketplaceSourceBundle,
  validateMarketplacePolicyBundle,
} from '@/domain/policies/marketplace-fees';
import { validatePhase5FixtureManifest } from '@/domain/registry';

describe('Phase 5 startup and marketplace calculations', () => {
  it('calculates blended and paid CAC for the same attribution window', () => {
    const result = calculatePhase5('cac', {
      salesMarketingCost: '100000',
      attributionWindowMonths: '3',
      newCustomers: '20',
      paidNewCustomers: '15',
      paidAcquisitionCost: '60000',
    });
    expect(result.headline.value).toBe('5000');
    expect(result.details.find((metric) => metric.label === 'Paid-channel CAC')?.value).toBe('4000');
  });

  it('provides an LTV sensitivity range and flags unstable churn', () => {
    const result = calculatePhase5('ltv', {
      arpuMonthly: '2000',
      grossMarginPercent: '70',
      monthlyChurnPercent: '5',
      churnLowPercent: '3',
      churnHighPercent: '8',
      churnStability: 'unstable',
    });
    expect(result.headline.value).toBe('28000');
    expect(result.warnings[0]).toContain('unstable');
    expect(result.details.find((metric) => metric.label === 'LTV range — lower case')?.value).toBe('17500');
  });

  it('keeps SaaS retention metrics period-consistent and avoids zero denominators', () => {
    const result = calculatePhase5('saas-metrics', {
      periodMonths: '1',
      mrr: '500000',
      priorMrr: '450000',
      newMrr: '70000',
      expansionMrr: '20000',
      contractionMrr: '5000',
      churnedMrr: '35000',
      customers: '250',
      priorCustomers: '230',
      newCustomers: '0',
      churnedCustomers: '0',
      salesMarketingCost: '90000',
      grossMarginPercent: '70',
      profitMarginPercent: '10',
    });
    expect(result.details.find((metric) => metric.label === 'ARR')?.value).toBe('6000000');
    expect(result.details.find((metric) => metric.label === 'GRR')?.value).toBe('91.111111111111111111');
    expect(result.warnings.join(' ')).toContain('CAC');
    expect(result.warnings.join(' ')).toContain('LTV:CAC');
  });

  it('reconciles valuation and post-money ownership scenarios', () => {
    const valuation = calculatePhase5('valuation', {
      annualRevenue: '6000000',
      revenueMultipleLow: '3',
      revenueMultipleHigh: '5',
      preMoneyValuation: '24000000',
      investmentAmount: '6000000',
    });
    expect(valuation.headline.value).toBe('18000000–30000000');
    const dilution = calculatePhase5('equity-dilution', {
      preMoneyValuation: '24000000',
      investmentAmount: '6000000',
      founderOwnershipPercent: '80',
      existingInvestorOwnershipPercent: '15',
      otherOwnershipPercent: '5',
      postMoneyOptionPoolPercent: '10',
    });
    expect(dilution.headline.value).toBe('20');
    expect(dilution.details.find((metric) => metric.label === 'Reconciled total')?.value).toBe('100');
  });

  it('separates ESOP vesting, exercise spread and optional tax illustration', () => {
    const result = calculatePhase5('esop', {
      fullyDilutedSharesBefore: '1000000',
      grantShares: '10000',
      vestedPercent: '25',
      exercisePrice: '10',
      fairMarketValue: '50',
      exercisedShares: '2500',
      exerciseDate: '2026-08-10',
      salePrice: '70',
      taxTreatment: 'illustrative',
      illustrativeTaxRatePercent: '30',
    });
    expect(result.headline.value).toBe('100000');
    expect(result.details.find((metric) => metric.label === 'Illustrative tax on spread')?.value).toBe(
      '30000',
    );
    expect(result.warnings.join(' ')).toContain('not an Income Tax Department determination');
  });

  it('handles cleared optional fields without inventing a denominator or tax rate', () => {
    const cacDefaults = Object.fromEntries(
      phase5CalculatorFields.cac.map((field) => [field.name, field.defaultValue]),
    );
    const cac = calculatePhase5('cac', { ...cacDefaults, paidNewCustomers: '' });
    expect(cac.warnings.join(' ')).toContain('paid-only CAC is not shown');

    const esopDefaults = Object.fromEntries(
      phase5CalculatorFields.esop.map((field) => [field.name, field.defaultValue]),
    );
    const noTax = calculatePhase5('esop', {
      ...esopDefaults,
      taxTreatment: 'no-tax-estimate',
      illustrativeTaxRatePercent: '',
    });
    expect(noTax.details.find((metric) => metric.label === 'Illustrative tax on spread')).toBeUndefined();

    const requiresRate = validatePhase5CalculatorInput('esop', {
      ...esopDefaults,
      taxTreatment: 'illustrative',
      illustrativeTaxRatePercent: '',
    });
    expect(requiresRate.success).toBe(false);
    expect(requiresRate.success ? [] : requiresRate.errors.map((error) => error.code)).toContain('required');
  });

  it('uses official marketplace price-band policy values and keeps overrides explicit', () => {
    const amazon = calculatePhase5('amazon-fees', {
      salePrice: '299',
      productCost: '100',
      category: 'sandals',
      fulfillment: 'easy-ship',
      referralFeePercent: '0',
      shippingFee: '0',
      closingFeeOverride: '',
      otherFee: '0',
      feeGstRatePercent: '18',
      policyDate: '2026-08-10',
    });
    expect(amazon.policy?.id).toBe('amazon-india-fees-2026-03-16-v1');
    expect(amazon.details.find((metric) => metric.label === 'Fixed/closing fee')?.value).toBe('1');
    expect(amazon.details.find((metric) => metric.label === 'Total marketplace fees')?.value).toBe('1.18');

    const apparel = calculatePhase5('amazon-fees', {
      salePrice: '450',
      productCost: '100',
      category: 'apparel-shorts',
      fulfillment: 'fba',
      referralFeePercent: '0',
      shippingFee: '0',
      closingFeeOverride: '',
      otherFee: '0',
      feeGstRatePercent: '18',
      policyDate: '2026-08-10',
    });
    expect(apparel.details.find((metric) => metric.label === 'Fixed/closing fee')?.value).toBe('14');

    const flipkart = calculatePhase5('flipkart-fees', {
      salePrice: '2000',
      productCost: '900',
      category: 'fashion',
      fulfillment: 'nfbf',
      paymentMode: 'prepaid',
      commissionFeePercent: '5',
      collectionFeePercent: '2',
      shippingFee: '144',
      fixedFeeOverride: '',
      otherFee: '0',
      feeGstRatePercent: '18',
      policyDate: '2026-08-10',
    });
    expect(flipkart.policy?.id).toBe('flipkart-seller-fees-2026-01-01-v1');
    expect(flipkart.details.find((metric) => metric.label === 'Fixed/closing fee')?.value).toBe('55');
    expect(flipkart.details.find((metric) => metric.label === 'Contribution margin')?.value).toBe('34.999');
    expect(flipkart.details.find((metric) => metric.label === 'Collection mode')?.value).toBe('prepaid');
    expect(flipkart.details.find((metric) => metric.label === 'Category context')?.value).toBe('fashion');
  });

  it('covers category and price-band boundaries for every bundled marketplace example', () => {
    const amazonCases = [
      { salePrice: '300', category: 'sandals', fulfillment: 'easy-ship', fixed: '1' },
      { salePrice: '301', category: 'sandals', fulfillment: 'easy-ship', fixed: '22' },
      { salePrice: '450', category: 'apparel-shorts', fulfillment: 'fba', fixed: '14' },
      { salePrice: '249', category: 'beverages', fulfillment: 'fba', fixed: '26' },
      { salePrice: '499', category: 'apparel-shirts', fulfillment: 'self-ship', fixed: '26' },
      { salePrice: '299', category: 'facewash', fulfillment: 'self-ship', fixed: '20' },
    ] as const;
    for (const scenario of amazonCases) {
      const result = calculatePhase5('amazon-fees', {
        salePrice: scenario.salePrice,
        productCost: '0',
        category: scenario.category,
        fulfillment: scenario.fulfillment,
        referralFeePercent: '0',
        shippingFee: '0',
        closingFeeOverride: '',
        otherFee: '0',
        feeGstRatePercent: '18',
        policyDate: '2026-08-10',
      });
      expect(result.details.find((metric) => metric.label === 'Fixed/closing fee')?.value).toBe(
        scenario.fixed,
      );
    }

    const flipkartBands = [
      ['300', 'under-300', '14', '16'],
      ['301', '301-500', '14', '16'],
      ['501', '501-1000', '30', '30'],
      ['1001', 'above-1000', '50', '55'],
    ] as const;
    for (const [salePrice, band, fbf, nfbf] of flipkartBands) {
      for (const [fulfillment, expected] of [
        ['fbf', fbf],
        ['nfbf', nfbf],
      ] as const) {
        const result = calculatePhase5('flipkart-fees', {
          salePrice,
          productCost: '0',
          category: 'general',
          fulfillment,
          paymentMode: 'prepaid',
          commissionFeePercent: '0',
          collectionFeePercent: '0',
          shippingFee: '0',
          fixedFeeOverride: '',
          otherFee: '0',
          feeGstRatePercent: '0',
          policyDate: '2026-08-10',
        });
        expect(result.details.find((metric) => metric.label === 'Price band')?.value).toBe(band);
        expect(result.details.find((metric) => metric.label === 'Fixed/closing fee')?.value).toBe(expected);
      }
    }
  });

  it('rejects future marketplace dates and unsupported Self-Ship policy defaults', () => {
    const future = validatePhase5CalculatorInput('amazon-fees', {
      ...Object.fromEntries(
        phase5CalculatorFields['amazon-fees'].map((field) => [field.name, field.defaultValue]),
      ),
      shippingFee: '0',
      policyDate: '2026-08-11',
    });
    expect(future.success).toBe(false);
    expect(future.success ? [] : future.errors.map((error) => error.code)).toContain('future_policy_date');

    const selfShip = validatePhase5CalculatorInput('amazon-fees', {
      ...Object.fromEntries(
        phase5CalculatorFields['amazon-fees'].map((field) => [field.name, field.defaultValue]),
      ),
      fulfillment: 'self-ship',
      shippingFee: '0',
    });
    expect(selfShip.success).toBe(false);
    expect(selfShip.success ? [] : selfShip.errors.map((error) => error.code)).toContain('override_required');
  });

  it('reports marketplace freshness and rejects source-domain poisoning', () => {
    const policy = getMarketplacePolicy('amazon', '2026-03-16')!;
    expect(getMarketplacePolicyFreshness(policy, '2026-08-10').status).toBe('current');
    expect(getMarketplacePolicyFreshness(policy, '2026-09-10').status).toBe('stale');
    expect(validateMarketplaceSourceBundle(['amazon-india-fees-2026'])).toEqual([]);
    expect(
      validateMarketplaceSourceBundle(
        ['amazon-india-fees-2026'],
        [
          {
            id: 'amazon-india-fees-2026',
            title: 'spoofed',
            publisher: 'spoofed',
            url: 'https://example.com/fees',
            lastChecked: '2026-08-10',
            evidenceLevel: 'official',
          },
        ],
      ),
    ).toContain('Marketplace source is not on the approved official domain: amazon-india-fees-2026');
    expect(
      validateMarketplaceSourceBundle(
        ['untrusted-marketplace-source'],
        [
          {
            id: 'untrusted-marketplace-source',
            title: 'untrusted',
            publisher: 'untrusted',
            url: 'https://seller.flipkart.com/fees-and-commission',
            lastChecked: '2026-08-10',
            evidenceLevel: 'official',
          },
        ],
      ),
    ).toContain('Marketplace source is not on the approved official domain: untrusted-marketplace-source');
  });

  it('selects the newest effective policy and respects effectiveTo boundaries', () => {
    const original = MARKETPLACE_POLICY_BUNDLE.find((policy) => policy.kind === 'amazon')!;
    const v1 = { ...original, id: 'amazon-test-v1', effectiveTo: '2026-06-30' };
    const v2 = { ...original, id: 'amazon-test-v2', effectiveFrom: '2026-07-01', effectiveTo: '2026-12-31' };
    expect(getMarketplacePolicy('amazon', '2026-06-30', [v1, v2])?.id).toBe('amazon-test-v1');
    expect(getMarketplacePolicy('amazon', '2026-08-10', [v1, v2])?.id).toBe('amazon-test-v2');
    expect(getMarketplacePolicy('amazon', '2027-01-01', [v1, v2])).toBeUndefined();
    expect(validateMarketplacePolicyBundle([v1, v2])).toEqual([]);
  });

  it('blocks stale bundled marketplace calculations unless a seller override is supplied', () => {
    const input = {
      salePrice: '299',
      productCost: '100',
      category: 'sandals',
      fulfillment: 'easy-ship',
      referralFeePercent: '0',
      shippingFee: '0',
      closingFeeOverride: '',
      otherFee: '0',
      feeGstRatePercent: '18',
      policyDate: '2026-08-10',
    };
    expect(() => calculatePhase5('amazon-fees', input, { asOf: '2026-09-10' })).toThrow(
      /stale bundled policy/,
    );
    const overridden = calculatePhase5(
      'amazon-fees',
      { ...input, closingFeeOverride: '2' },
      { asOf: '2026-09-10' },
    );
    expect(overridden.policyFreshness?.status).toBe('stale');
    expect(overridden.details.find((metric) => metric.label === 'Fixed/closing fee')?.value).toBe('2');
  });

  it('normalizes multi-month SaaS growth, churn and LTV', () => {
    const result = calculatePhase5('saas-metrics', {
      periodMonths: '3',
      mrr: '500000',
      priorMrr: '450000',
      newMrr: '70000',
      expansionMrr: '20000',
      contractionMrr: '5000',
      churnedMrr: '35000',
      customers: '250',
      priorCustomers: '230',
      newCustomers: '30',
      churnedCustomers: '10',
      salesMarketingCost: '90000',
      grossMarginPercent: '70',
      profitMarginPercent: '10',
    });
    const windowGrowth = Number(
      result.details.find((metric) => metric.label === 'MRR growth (window)')?.value,
    );
    const annualizedGrowth = Number(
      result.details.find((metric) => metric.label === 'Annualized revenue growth')?.value,
    );
    const windowChurn = Number(
      result.details.find((metric) => metric.label === 'Logo churn (window)')?.value,
    );
    const monthlyChurn = Number(
      result.details.find((metric) => metric.label === 'Monthly logo churn')?.value,
    );
    expect(annualizedGrowth).toBeGreaterThan(windowGrowth);
    expect(monthlyChurn).toBeLessThan(windowChurn);
    expect(result.details.find((metric) => metric.label === 'Illustrated LTV')).toBeDefined();
    expect(result.warnings.join(' ')).toContain('normalized');
  });

  it('requires exercised shares and an exercise date for ESOP tax-event illustrations', () => {
    const base = Object.fromEntries(
      phase5CalculatorFields.esop.map((field) => [field.name, field.defaultValue]),
    );
    const invalid = validatePhase5CalculatorInput('esop', {
      ...base,
      taxTreatment: 'illustrative',
      illustrativeTaxRatePercent: '30',
    });
    expect(invalid.success).toBe(false);
    expect(invalid.success ? [] : invalid.errors.map((error) => error.code)).toContain(
      'required_for_tax_event',
    );
  });

  it('keeps every Phase 5 golden fixture ID backed by a manifest', () => {
    expect(validatePhase5FixtureManifest()).toEqual([]);
  });
});
