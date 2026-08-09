import { describe, expect, it } from 'vitest';

import {
  calculateTax,
  getTaxPolicyFreshness,
  taxCalculatorFields,
  type TaxCalculatorInput,
  validateTaxCalculatorInput,
} from '@/domain/calculations/tax';

function defaults(kind: keyof typeof taxCalculatorFields): TaxCalculatorInput {
  return Object.fromEntries(taxCalculatorFields[kind].map((field) => [field.name, field.defaultValue]));
}

describe('Phase 4 tax and payroll policy fixtures', () => {
  it('calculates an individual AY 2026-27 new-regime fixture with cess', () => {
    const result = calculateTax('income-tax', {
      ...defaults('income-tax'),
      salaryIncome: '1500000',
      housePropertyIncome: '0',
      otherIncome: '0',
      deductions: '0',
      taxRegime: 'new',
      taxPeriod: 'ay-2026-27',
    });
    expect(result.headline.value).toBe('109200.00');
    expect(result.policy.act).toBe('Income Tax Act, 1961');
  });

  it('switches TDS Act reference by the earlier credit/payment date', () => {
    const result = calculateTax('tds', {
      ...defaults('tds'),
      paymentDate: '2026-04-05',
      creditDate: '2026-04-04',
      paymentAmount: '120000',
      cumulativeAmount: '120000',
      paymentType: 'contractor',
      payeeType: 'individual',
      panStatus: 'available',
      payeeResidency: 'resident',
    });
    expect(result.headline.value).toBe('1200.00');
    expect(result.policy.act).toBe('Income Tax Act, 2025');
    expect(result.details.find((detail) => detail.label === 'Act / section reference')?.value).toMatch(
      /393/iu,
    );
  });

  it('applies the contractor single-payment threshold as well as the annual threshold', () => {
    const result = calculateTax('tds', {
      ...defaults('tds'),
      paymentAmount: '50000',
      cumulativeAmount: '50000',
      paymentType: 'contractor',
    });
    expect(result.headline.value).toBe('500.00');
  });

  it('calculates a 44AD digital-receipt fixture', () => {
    const result = calculateTax('presumptive-tax', {
      ...defaults('presumptive-tax'),
      scheme: '44ad',
      entityType: 'individual',
      activity: 'business',
      resident: 'yes',
      turnover: '1000000',
      cashReceiptPercent: '0',
    });
    expect(result.headline.value).toBe('60000.00');
  });

  it('calculates corporate tax with the MAT comparison', () => {
    const result = calculateTax('corporate-tax', {
      ...defaults('corporate-tax'),
      regime: 'normal-25',
      taxableIncome: '5000000',
      bookProfit: '5000000',
    });
    expect(result.headline.value).toBe('1300000.00');
  });

  it('calculates CTC, take-home, PF and gratuity fixtures', () => {
    expect(calculateTax('ctc', defaults('ctc')).headline.value).toBe('1084846.00');
    expect(calculateTax('in-hand-salary', defaults('in-hand-salary')).headline.value).toBe('885600.00');
    const pf = calculateTax('pf', defaults('pf'));
    expect(pf.headline.value).toBe('1800.00');
    expect(pf.details.find((detail) => detail.label === 'EPS share')?.value).toBe('1249.50');
    expect(calculateTax('gratuity', defaults('gratuity')).headline.value).toBe('144230.77');
  });

  it('stops unsupported eligibility and transition cases', () => {
    const presumptive = validateTaxCalculatorInput('presumptive-tax', {
      ...defaults('presumptive-tax'),
      scheme: '44AD',
      entityType: 'company',
      activity: 'commission',
      resident: 'no',
    });
    expect(presumptive.success).toBe(false);
    const incomeTax = validateTaxCalculatorInput('income-tax', {
      ...defaults('income-tax'),
      taxPeriod: 'ty-2026-27',
      taxRegime: 'old',
    });
    expect(incomeTax.success).toBe(false);
  });

  it('stops invalid calendar dates, heavy 44AE vehicles and out-of-range payroll dates', () => {
    const invalidTds = validateTaxCalculatorInput('tds', {
      ...defaults('tds'),
      paymentDate: '2026-02-30',
    });
    expect(invalidTds.success).toBe(false);
    const heavyVehicle = validateTaxCalculatorInput('presumptive-tax', {
      ...defaults('presumptive-tax'),
      scheme: '44ae',
      activity: 'goods-carriage',
      vehicleType: 'heavy',
    });
    expect(heavyVehicle.success).toBe(false);
    const payroll = validateTaxCalculatorInput('pf', {
      ...defaults('pf'),
      policyDate: '2024-12-31',
    });
    expect(payroll.success).toBe(false);
  });

  it('exposes a deterministic freshness gate for tax and payroll policies', () => {
    const result = calculateTax('income-tax', defaults('income-tax'));
    expect(result.policyFreshness.isStale).toBe(false);
    expect(
      getTaxPolicyFreshness({ ...result.policy, lastVerifiedOn: '2025-01-01' }, '2026-08-10').isStale,
    ).toBe(true);
  });
});
