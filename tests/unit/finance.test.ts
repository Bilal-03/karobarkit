import { describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';

import {
  calculateFinance,
  solveXirr,
  validateFinanceCalculatorInput,
  type FinanceCalculatorInput,
  type FinanceCalculatorKind,
  type ParsedCashFlow,
} from '@/domain/calculations/finance';

function calculate(kind: FinanceCalculatorKind, input: FinanceCalculatorInput) {
  return calculateFinance(kind, input);
}

describe('finance calculations', () => {
  it('calculates EMI and reconciles the amortization schedule', () => {
    const result = calculate('emi', {
      loanAmount: '1000000',
      annualRatePercent: '10',
      tenureMonths: '60',
      processingFee: '5000',
      resetAfterMonths: '',
      resetAnnualRatePercent: '',
    });

    expect(Number(result.headline.value)).toBeCloseTo(21247.0447, 4);
    expect(Number(result.details.find((metric) => metric.label === 'Total interest')?.value)).toBeCloseTo(
      274822.6827,
      4,
    );
    expect(result.details.find((metric) => metric.label === 'Total cost')?.value).toBe(
      '1279822.6826760964668',
    );
    expect(result.schedule).toHaveLength(60);
    expect(result.schedule?.at(-1)?.balance).toBe('0');
  });

  it('supports zero-rate EMI and an explicit rate reset scenario', () => {
    const zeroRate = calculate('emi', {
      loanAmount: '100000',
      annualRatePercent: '0',
      tenureMonths: '10',
      processingFee: '',
      resetAfterMonths: '',
      resetAnnualRatePercent: '',
    });
    expect(zeroRate.headline.value).toBe('10000');

    const reset = calculate('emi', {
      loanAmount: '1000000',
      annualRatePercent: '10',
      tenureMonths: '60',
      processingFee: '0',
      resetAfterMonths: '12',
      resetAnnualRatePercent: '14',
    });
    expect(Number(reset.headline.value)).toBeCloseTo(21247.0447, 4);
    expect(Number(reset.details.find((metric) => metric.label === 'New EMI after reset')?.value)).toBeCloseTo(
      22892.2605,
      4,
    );
    expect(Number(reset.schedule?.[11]?.balance)).toBeCloseTo(837731.8803, 4);
    expect(reset.schedule?.at(-1)?.balance).toBe('0');
    expect(reset.schedule).toHaveLength(60);
    expect(reset.details.some((metric) => metric.label === 'New EMI after reset')).toBe(true);
  });

  it('illustrates SIP timing and keeps gains assumption-led', () => {
    const end = calculate('sip', {
      monthlyContribution: '10000',
      annualExpectedReturnPercent: '12',
      tenureMonths: '12',
      contributionTiming: 'end',
    });
    expect(Number(end.headline.value)).toBeCloseTo(126825.0301, 4);
    expect(Number(end.details.find((metric) => metric.label === 'Total invested')?.value)).toBe(120000);

    const beginning = calculate('sip', {
      monthlyContribution: '10000',
      annualExpectedReturnPercent: '12',
      tenureMonths: '12',
      contributionTiming: 'beginning',
    });
    expect(Number(beginning.headline.value)).toBeCloseTo(128093.2804, 4);
  });

  it('calculates FD maturity from declared compounding frequency', () => {
    const result = calculate('fd', {
      principal: '100000',
      annualRatePercent: '7',
      tenureMonths: '12',
      compoundingFrequency: '4',
    });
    expect(Number(result.headline.value)).toBeCloseTo(107185.9031, 4);
    expect(Number(result.details.find((metric) => metric.label === 'Interest earned')?.value)).toBeCloseTo(
      7185.9031,
      4,
    );
  });

  it('solves dated cash flows and rejects unsolvable sign patterns', () => {
    const result = calculate('xirr', {
      cashFlows: '2023-01-01,-100000\n2024-01-01,110000',
      guessPercent: '10',
    });
    expect(Number(result.headline.value)).toBeCloseTo(10, 6);

    const validation = validateFinanceCalculatorInput('xirr', {
      cashFlows: '2024-01-01,100000\n2025-01-01,110000',
      guessPercent: '10',
    });
    expect(validation.success).toBe(false);
    if (!validation.success) expect(validation.errors[0]?.code).toBe('needs_both_signs');

    expect(() =>
      calculate('xirr', {
        cashFlows: '2023-01-01,100\n2023-01-02,-1\n2023-01-03,1',
        guessPercent: '10',
      }),
    ).toThrow(/do not produce a solvable XIRR/u);

    expect(() =>
      calculate('xirr', {
        cashFlows: '2023-01-01,-1\n2024-01-01,999999999999999',
        guessPercent: '10',
      }),
    ).toThrow(/supported rate range/u);
  });

  it('matches Microsoft’s published XIRR fixture and accepts a signed guess', () => {
    const result = calculate('xirr', {
      cashFlows: '2008-01-01,-10000\n2008-03-01,2750\n2008-10-30,4250\n2009-02-15,3250\n2009-04-01,2750',
      guessPercent: '-10',
    });
    expect(Number(result.headline.value)).toBeCloseTo(37.3362535, 6);
  });

  it('reports deterministic non-convergence when the solver budget is exhausted', () => {
    const flows: ParsedCashFlow[] = [
      { date: '2023-01-01', amount: new Decimal('-100'), dayOffset: 0 },
      { date: '2024-01-01', amount: new Decimal('110'), dayOffset: 365 },
    ];
    expect(() =>
      solveXirr(flows, new Decimal('10'), { maxNewtonIterations: 0, maxBisectionIterations: 1 }),
    ).toThrow(/could not converge/u);
  });

  it('accepts a negative SIP assumption as an illustration', () => {
    const validation = validateFinanceCalculatorInput('sip', {
      monthlyContribution: '10000',
      annualExpectedReturnPercent: '-10',
      tenureMonths: '12',
      contributionTiming: 'end',
    });
    expect(validation.success).toBe(true);
    const result = calculate('sip', {
      monthlyContribution: '10000',
      annualExpectedReturnPercent: '-10',
      tenureMonths: '12',
      contributionTiming: 'end',
    });
    expect(result.tone).toBe('negative');
  });

  it('compares two loan scenarios without ranking lenders', () => {
    const result = calculate('loan-comparison', {
      amountA: '1000000',
      annualRateA: '10',
      termMonthsA: '60',
      processingFeeA: '5000',
      prepaymentFeeA: '0',
      rateTypeA: 'fixed',
      resetAfterMonthsA: '12',
      resetAnnualRateA: '14',
      amountB: '1000000',
      annualRateB: '11',
      termMonthsB: '60',
      processingFeeB: '0',
      prepaymentFeeB: '0',
      rateTypeB: 'floating',
      resetAfterMonthsB: '',
      resetAnnualRateB: '',
    });
    expect(result.headline.value).toBe('Option B has lower total cost');
    expect(
      result.details.some((metric) => metric.label === 'Option B rate type' && metric.value === 'Floating'),
    ).toBe(true);
    expect(result.details.some((metric) => metric.label === 'Option A reset scenario')).toBe(true);
  });
});

describe('finance validation boundaries', () => {
  it.each([
    [
      'emi',
      {
        loanAmount: '0',
        annualRatePercent: '10',
        tenureMonths: '60',
        processingFee: '',
        resetAfterMonths: '',
        resetAnnualRatePercent: '',
      },
      'loanAmount',
    ],
    [
      'emi',
      {
        loanAmount: '100000',
        annualRatePercent: '10',
        tenureMonths: '12.5',
        processingFee: '',
        resetAfterMonths: '',
        resetAnnualRatePercent: '',
      },
      'tenureMonths',
    ],
    [
      'sip',
      {
        monthlyContribution: '1000',
        annualExpectedReturnPercent: '-100',
        tenureMonths: '12',
        contributionTiming: 'end',
      },
      'annualExpectedReturnPercent',
    ],
    [
      'fd',
      { principal: '100000', annualRatePercent: '7', tenureMonths: '12', compoundingFrequency: '3' },
      'compoundingFrequency',
    ],
    ['xirr', { cashFlows: '2024-02-30,-100\n2025-01-01,110', guessPercent: '10' }, 'cashFlows'],
  ] as const)('rejects %s boundary input', (kind, input, field) => {
    const validation = validateFinanceCalculatorInput(kind, input);
    expect(validation.success).toBe(false);
    if (!validation.success) expect(validation.errors.some((error) => error.field === field)).toBe(true);
  });

  it('requires both EMI reset assumptions', () => {
    const validation = validateFinanceCalculatorInput('emi', {
      loanAmount: '100000',
      annualRatePercent: '10',
      tenureMonths: '60',
      processingFee: '0',
      resetAfterMonths: '12',
      resetAnnualRatePercent: '',
    });
    expect(validation.success).toBe(false);
    if (!validation.success)
      expect(validation.errors.some((error) => error.code === 'reset_pair_required')).toBe(true);
  });
});
