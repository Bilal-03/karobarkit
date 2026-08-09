import { describe, expect, it } from 'vitest';

import {
  calculateBusinessEconomics,
  validateBusinessCalculatorInput,
  type BusinessCalculatorKind,
  type BusinessCalculatorInput,
} from '@/domain/calculations/business-economics';

function calculate(kind: BusinessCalculatorKind, input: BusinessCalculatorInput) {
  return calculateBusinessEconomics(kind, input);
}

describe('business economics calculations', () => {
  it('calculates margin and keeps a loss visible', () => {
    const profit = calculate('margin', { revenue: '100000', totalCost: '70000' });
    expect(profit.headline.value).toBe('30');
    expect(profit.details.find((metric) => metric.label === 'Contribution profit')?.value).toBe('30000');
    expect(profit.tone).toBe('positive');

    const loss = calculate('margin', { revenue: '100000', totalCost: '120000' });
    expect(loss.headline.value).toBe('-20');
    expect(loss.tone).toBe('negative');
  });

  it('separates markup from margin', () => {
    const result = calculate('markup', { unitCost: '700', sellingPrice: '1000' });
    expect(Number(result.headline.value)).toBeCloseTo(42.857142857, 8);
    expect(Number(result.details.find((metric) => metric.label === 'Margin')?.value)).toBeCloseTo(30, 8);
  });

  it('rounds break-even units up and exposes the exact result', () => {
    const result = calculate('break-even', {
      fixedCosts: '100000',
      sellingPricePerUnit: '1000',
      variableCostPerUnit: '600',
    });
    expect(result.headline.value).toBe('250');
    expect(result.details.find((metric) => metric.label === 'Exact break-even units')?.value).toBe('250');
    expect(result.details.find((metric) => metric.label === 'Break-even revenue')?.value).toBe('250000');

    const rounded = calculate('break-even', {
      fixedCosts: '100001',
      sellingPricePerUnit: '1000',
      variableCostPerUnit: '600',
    });
    expect(rounded.headline.value).toBe('251');
    expect(rounded.details.find((metric) => metric.label === 'Exact break-even units')?.value).toBe(
      '250.0025',
    );
  });

  it('models pricing in the correct order: margin, discount, then tax', () => {
    const result = calculate('pricing', {
      unitCost: '600',
      targetMargin: '40',
      discountPercent: '10',
      taxRate: '18',
    });
    expect(result.headline.value).toBe('1180');
    expect(result.details.find((metric) => metric.label === 'Target pre-tax price')?.value).toBe('1000');
    expect(result.details.find((metric) => metric.label === 'Tax amount')?.value).toBe('180');

    const noOptionalAdjustments = calculate('pricing', {
      unitCost: '600',
      targetMargin: '40',
      discountPercent: '',
      taxRate: '',
    });
    expect(noOptionalAdjustments.headline.value).toBe('1000');
  });

  it('calculates cash flow, burn rate and runway independently', () => {
    const cashFlow = calculate('cash-flow', {
      openingCash: '250000',
      cashInflows: '180000',
      cashOutflows: '150000',
      oneOffOutflows: '10000',
    });
    expect(cashFlow.headline.value).toBe('270000');
    expect(cashFlow.details.find((metric) => metric.label === 'Net cash flow')?.value).toBe('20000');

    const burn = calculate('burn-rate', {
      periodMonths: '3',
      totalOutflows: '450000',
      totalInflows: '150000',
    });
    expect(burn.headline.value).toBe('100000');
    expect(burn.details.find((metric) => metric.label === 'Gross burn per month')?.value).toBe('150000');

    const runway = calculate('runway', {
      currentCash: '900000',
      monthlyOutflows: '300000',
      monthlyInflows: '100000',
    });
    expect(runway.headline.value).toBe('4.5');

    const noBurn = calculate('runway', {
      currentCash: '900000',
      monthlyOutflows: '100000',
      monthlyInflows: '100000',
    });
    expect(noBurn.headline.value).toBe('No burn');
  });

  it('calculates marketplace margin and ROAS without pretending to know vendor rates', () => {
    const marketplace = calculate('marketplace-margin', {
      sellingPrice: '1500',
      productCost: '600',
      platformFeePercent: '18',
      shippingCost: '90',
      paymentFeePercent: '2',
      returnCost: '30',
      taxCost: '0',
    });
    expect(marketplace.headline.value).toBe('32');
    expect(marketplace.details.find((metric) => metric.label === 'Contribution profit')?.value).toBe('480');

    const roas = calculate('roas', {
      adSpend: '50000',
      attributedRevenue: '200000',
      productCost: '80000',
      otherVariableCosts: '20000',
    });
    expect(roas.headline.value).toBe('4');
    expect(roas.details.find((metric) => metric.label === 'Contribution profit')?.value).toBe('50000');
    expect(roas.details.find((metric) => metric.label === 'Break-even ROAS')?.value).toBe('2');
  });

  it('calculates expected COD cost using the RTO probability', () => {
    const result = calculate('cod-cost', {
      orderValue: '1200',
      productCost: '500',
      codFee: '25',
      forwardShipping: '70',
      returnShipping: '70',
      rtoRate: '8',
      returnLoss: '40',
      cashCycleCost: '10',
    });
    expect(result.headline.value).toBe('113.8');
    expect(result.details.find((metric) => metric.label === 'Expected contribution')?.value).toBe('586.2');
  });
});

describe('business economics validation boundaries', () => {
  it.each([
    ['margin', { revenue: '', totalCost: '1' }, 'revenue'],
    ['markup', { unitCost: '0', sellingPrice: '1' }, 'unitCost'],
    [
      'break-even',
      { fixedCosts: '100', sellingPricePerUnit: '100', variableCostPerUnit: '100' },
      'variableCostPerUnit',
    ],
    [
      'pricing',
      { unitCost: '100', targetMargin: '100', discountPercent: '0', taxRate: '18' },
      'targetMargin',
    ],
    [
      'pricing',
      { unitCost: '100', targetMargin: '40', discountPercent: '100', taxRate: '18' },
      'discountPercent',
    ],
    ['burn-rate', { periodMonths: '0', totalOutflows: '100', totalInflows: '0' }, 'periodMonths'],
    [
      'marketplace-margin',
      {
        sellingPrice: '0',
        productCost: '1',
        platformFeePercent: '0',
        shippingCost: '0',
        paymentFeePercent: '0',
        returnCost: '0',
        taxCost: '0',
      },
      'sellingPrice',
    ],
    [
      'roas',
      { adSpend: '-1', attributedRevenue: '100', productCost: '0', otherVariableCosts: '0' },
      'adSpend',
    ],
    [
      'cod-cost',
      {
        orderValue: '100',
        productCost: '10',
        codFee: '1',
        forwardShipping: '1',
        returnShipping: '1',
        rtoRate: '101',
        returnLoss: '1',
        cashCycleCost: '1',
      },
      'rtoRate',
    ],
  ] as const)('rejects %s boundary input', (kind, input, field) => {
    const validation = validateBusinessCalculatorInput(kind, input);
    expect(validation.success).toBe(false);
    if (!validation.success) expect(validation.errors.some((error) => error.field === field)).toBe(true);
  });

  it('rejects unsafe precision and values above the bounded range', () => {
    const unsafe = validateBusinessCalculatorInput('margin', {
      revenue: '1.23456789012345678901',
      totalCost: '1',
    });
    expect(unsafe.success).toBe(false);

    const tooLarge = validateBusinessCalculatorInput('margin', {
      revenue: '1000000000000000',
      totalCost: '1',
    });
    expect(tooLarge.success).toBe(false);
  });
});
