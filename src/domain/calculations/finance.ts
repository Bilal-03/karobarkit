import { z } from 'zod';
import Decimal from 'decimal.js';

import { decimalToString, parseDecimal } from '@/domain/formatting/decimal';

import { CalculationInputError, type FieldError, type ValidationResult } from './types';

export const financeCalculatorKinds = ['emi', 'sip', 'fd', 'xirr', 'loan-comparison'] as const;

export type FinanceCalculatorKind = (typeof financeCalculatorKinds)[number];
export type FinanceCalculatorInput = Record<string, string>;
export type FinanceMetricFormat = 'currency' | 'percentage' | 'number' | 'multiple' | 'text';
export type FinanceFieldType = 'number' | 'textarea' | 'select';

export interface FinanceFieldOption {
  value: string;
  label: string;
}

export interface FinanceFieldConfig {
  name: string;
  label: string;
  help: string;
  defaultValue: string;
  required?: boolean;
  allowNegative?: boolean;
  type?: FinanceFieldType;
  format?: 'money' | 'percentage' | 'number' | 'text';
  options?: FinanceFieldOption[];
}

export interface FinanceMetric {
  label: string;
  value: string;
  format: FinanceMetricFormat;
}

export interface FinanceScheduleRow {
  period: string;
  payment: string;
  interest: string;
  principal: string;
  balance: string;
}

export interface FinanceCalculationResult {
  kind: FinanceCalculatorKind;
  headline: FinanceMetric;
  tone: 'positive' | 'negative' | 'neutral';
  detail: string;
  details: FinanceMetric[];
  exportRows: FinanceMetric[];
  schedule?: FinanceScheduleRow[];
}

export const financeCalculatorInputSchema = z.record(z.string(), z.string());

const MAX_VALUE = new Decimal('999999999999999.99');
const MAX_TENURE_MONTHS = 600;
const MAX_XIRR_RATE = new Decimal('1000000');

export const financeCalculatorFields: Record<FinanceCalculatorKind, FinanceFieldConfig[]> = {
  emi: [
    {
      name: 'loanAmount',
      label: 'Loan amount',
      help: 'Principal borrowed, excluding any fee that you want to show separately.',
      defaultValue: '1000000',
      format: 'money',
    },
    {
      name: 'annualRatePercent',
      label: 'Annual interest rate',
      help: 'Enter the annual rate used for this fixed-rate illustration. No lender rate is imported.',
      defaultValue: '10',
      format: 'percentage',
    },
    {
      name: 'tenureMonths',
      label: 'Tenure in months',
      help: `Use a whole number of months, up to ${MAX_TENURE_MONTHS} months for this local model.`,
      defaultValue: '60',
      format: 'number',
    },
    {
      name: 'processingFee',
      label: 'Processing fee',
      help: 'Optional one-time fee included in total cost; it is not used to calculate the EMI.',
      defaultValue: '0',
      required: false,
      format: 'money',
    },
    {
      name: 'resetAfterMonths',
      label: 'Rate reset after months (optional)',
      help: 'Optional scenario input. Leave blank for a fixed-rate schedule; if used, the reset month must be before the final month.',
      defaultValue: '',
      required: false,
      format: 'number',
    },
    {
      name: 'resetAnnualRatePercent',
      label: 'New annual rate after reset (optional)',
      help: 'Optional user-supplied rate for the reset scenario. The remaining tenure is kept unchanged.',
      defaultValue: '',
      required: false,
      format: 'percentage',
    },
  ],
  sip: [
    {
      name: 'monthlyContribution',
      label: 'Monthly contribution',
      help: 'The amount contributed every month in this illustration.',
      defaultValue: '10000',
      format: 'money',
    },
    {
      name: 'annualExpectedReturnPercent',
      label: 'Expected annual return',
      help: 'A user-entered illustration assumption, not a promise or forecast of market performance.',
      defaultValue: '12',
      allowNegative: true,
      format: 'percentage',
    },
    {
      name: 'tenureMonths',
      label: 'Investment period in months',
      help: `Use a whole number of months, up to ${MAX_TENURE_MONTHS} months for this illustration.`,
      defaultValue: '120',
      format: 'number',
    },
    {
      name: 'contributionTiming',
      label: 'Contribution timing',
      help: 'Choose whether each contribution is made at the end or beginning of the month.',
      defaultValue: 'end',
      type: 'select',
      options: [
        { value: 'end', label: 'End of each month' },
        { value: 'beginning', label: 'Beginning of each month' },
      ],
    },
  ],
  fd: [
    {
      name: 'principal',
      label: 'Deposit principal',
      help: 'The amount deposited at the start of the fixed-deposit illustration.',
      defaultValue: '100000',
      format: 'money',
    },
    {
      name: 'annualRatePercent',
      label: 'Annual interest rate',
      help: 'Enter the nominal annual rate offered or assumed for this scenario. No bank rate is imported.',
      defaultValue: '7',
      format: 'percentage',
    },
    {
      name: 'tenureMonths',
      label: 'Tenure in months',
      help: `Use a whole number of months, up to ${MAX_TENURE_MONTHS} months for this arithmetic model.`,
      defaultValue: '12',
      format: 'number',
    },
    {
      name: 'compoundingFrequency',
      label: 'Compounding frequency',
      help: 'Choose the compounding frequency stated by your bank or product terms.',
      defaultValue: '4',
      type: 'select',
      options: [
        { value: '1', label: 'Annually' },
        { value: '2', label: 'Half-yearly' },
        { value: '4', label: 'Quarterly' },
        { value: '12', label: 'Monthly' },
      ],
    },
  ],
  xirr: [
    {
      name: 'cashFlows',
      label: 'Dated cash flows',
      help: 'One cash flow per line as YYYY-MM-DD,amount. Use negative amounts for money invested and positive amounts for money received.',
      defaultValue: '2024-01-01,-100000\n2025-01-01,110000',
      required: true,
      type: 'textarea',
      format: 'text',
    },
    {
      name: 'guessPercent',
      label: 'Starting guess (optional)',
      help: 'A percentage hint for the solver. The answer is still checked with a bracketed, deterministic search.',
      defaultValue: '10',
      required: false,
      allowNegative: true,
      format: 'percentage',
    },
  ],
  'loan-comparison': [
    {
      name: 'amountA',
      label: 'Option A loan amount',
      help: 'Principal for the first user-entered loan scenario.',
      defaultValue: '1000000',
      format: 'money',
    },
    {
      name: 'annualRateA',
      label: 'Option A nominal annual interest rate',
      help: 'Nominal annual interest rate used for the EMI illustration; it is not an APR calculation and no lender rate is imported.',
      defaultValue: '10',
      format: 'percentage',
    },
    {
      name: 'termMonthsA',
      label: 'Option A tenure in months',
      help: 'Whole-number term for Option A.',
      defaultValue: '60',
      format: 'number',
    },
    {
      name: 'processingFeeA',
      label: 'Option A processing fee',
      help: 'Optional one-time fee included in Option A total cost.',
      defaultValue: '0',
      required: false,
      format: 'money',
    },
    {
      name: 'prepaymentFeeA',
      label: 'Option A prepayment or other fee',
      help: 'Optional user-supplied fee added to the comparison; the tool does not model a prepayment schedule.',
      defaultValue: '0',
      required: false,
      format: 'money',
    },
    {
      name: 'rateTypeA',
      label: 'Option A rate type',
      help: 'A disclosure label only. Floating-rate resets are not forecast without your own reset assumptions.',
      defaultValue: 'fixed',
      type: 'select',
      options: [
        { value: 'fixed', label: 'Fixed' },
        { value: 'floating', label: 'Floating' },
      ],
    },
    {
      name: 'resetAfterMonthsA',
      label: 'Option A reset after months (optional)',
      help: 'Optional reset month for Option A. Leave both reset fields blank to keep the original rate throughout.',
      defaultValue: '',
      required: false,
      format: 'number',
    },
    {
      name: 'resetAnnualRateA',
      label: 'Option A new annual rate (optional)',
      help: 'Optional user-entered rate after Option A resets; the remaining term stays unchanged.',
      defaultValue: '',
      required: false,
      format: 'percentage',
    },
    {
      name: 'amountB',
      label: 'Option B loan amount',
      help: 'Principal for the second user-entered loan scenario.',
      defaultValue: '1000000',
      format: 'money',
    },
    {
      name: 'annualRateB',
      label: 'Option B nominal annual interest rate',
      help: 'Nominal annual interest rate used for the EMI illustration; it is not an APR calculation and no lender rate is imported.',
      defaultValue: '11',
      format: 'percentage',
    },
    {
      name: 'termMonthsB',
      label: 'Option B tenure in months',
      help: 'Whole-number term for Option B.',
      defaultValue: '60',
      format: 'number',
    },
    {
      name: 'processingFeeB',
      label: 'Option B processing fee',
      help: 'Optional one-time fee included in Option B total cost.',
      defaultValue: '0',
      required: false,
      format: 'money',
    },
    {
      name: 'prepaymentFeeB',
      label: 'Option B prepayment or other fee',
      help: 'Optional user-supplied fee added to the comparison; the tool does not model a prepayment schedule.',
      defaultValue: '0',
      required: false,
      format: 'money',
    },
    {
      name: 'rateTypeB',
      label: 'Option B rate type',
      help: 'A disclosure label only. Floating-rate resets are not forecast without your own reset assumptions.',
      defaultValue: 'fixed',
      type: 'select',
      options: [
        { value: 'fixed', label: 'Fixed' },
        { value: 'floating', label: 'Floating' },
      ],
    },
    {
      name: 'resetAfterMonthsB',
      label: 'Option B reset after months (optional)',
      help: 'Optional reset month for Option B. Leave both reset fields blank to keep the original rate throughout.',
      defaultValue: '',
      required: false,
      format: 'number',
    },
    {
      name: 'resetAnnualRateB',
      label: 'Option B new annual rate (optional)',
      help: 'Optional user-entered rate after Option B resets; the remaining term stays unchanged.',
      defaultValue: '',
      required: false,
      format: 'percentage',
    },
  ],
};

function fieldLabel(kind: FinanceCalculatorKind, name: string) {
  return financeCalculatorFields[kind].find((field) => field.name === name)?.label ?? name;
}

function parseNumber(
  input: FinanceCalculatorInput,
  kind: FinanceCalculatorKind,
  name: string,
  options: { allowNegative?: boolean } = {},
) {
  try {
    const value = parseDecimal(input[name] ?? '');
    if (!options.allowNegative && value.lt(0)) {
      throw new CalculationInputError(
        name,
        'must_not_be_negative',
        `${fieldLabel(kind, name)} cannot be negative.`,
      );
    }
    if (value.abs().gt(MAX_VALUE)) {
      throw new CalculationInputError(
        name,
        'too_large',
        `${fieldLabel(kind, name)} is outside the safe range.`,
      );
    }
    return value;
  } catch (error) {
    if (error instanceof CalculationInputError) throw error;
    throw new CalculationInputError(
      name,
      'invalid_number',
      `Enter a valid ${fieldLabel(kind, name).toLowerCase()}.`,
    );
  }
}

function parsePositive(input: FinanceCalculatorInput, kind: FinanceCalculatorKind, name: string) {
  const value = parseNumber(input, kind, name);
  if (value.lte(0)) {
    throw new CalculationInputError(
      name,
      'must_be_positive',
      `${fieldLabel(kind, name)} must be greater than zero.`,
    );
  }
  return value;
}

function parseIntegerInRange(
  input: FinanceCalculatorInput,
  kind: FinanceCalculatorKind,
  name: string,
  minimum: number,
  maximum: number,
) {
  const value = parsePositive(input, kind, name);
  if (!value.isInteger() || value.lt(minimum) || value.gt(maximum)) {
    throw new CalculationInputError(
      name,
      'whole_number_out_of_range',
      `${fieldLabel(kind, name)} must be a whole number between ${minimum} and ${maximum}.`,
    );
  }
  return value.toNumber();
}

function parseRate(
  input: FinanceCalculatorInput,
  kind: FinanceCalculatorKind,
  name: string,
  minimum = 0,
  maximum = 100,
) {
  let value: Decimal;
  try {
    value = parseDecimal(input[name] ?? '');
    if (value.lt(minimum) || value.gt(maximum)) {
      throw new CalculationInputError(
        name,
        'rate_out_of_range',
        `${fieldLabel(kind, name)} must be between ${minimum}% and ${maximum}%.`,
      );
    }
  } catch (error) {
    if (error instanceof CalculationInputError) throw error;
    throw new CalculationInputError(
      name,
      'invalid_number',
      `Enter a valid ${fieldLabel(kind, name).toLowerCase()}.`,
    );
  }
  return value;
}

function parseOptionalNumber(input: FinanceCalculatorInput, kind: FinanceCalculatorKind, name: string) {
  if (!(input[name] ?? '').trim()) return new Decimal(0);
  return parseNumber(input, kind, name);
}

function optionValues(kind: FinanceCalculatorKind, name: string) {
  return (
    financeCalculatorFields[kind]
      .find((field) => field.name === name)
      ?.options?.map((option) => option.value) ?? []
  );
}

export interface ParsedCashFlow {
  date: string;
  amount: Decimal;
  dayOffset: number;
}

export interface XirrSolverOptions {
  maxNewtonIterations?: number;
  maxBisectionIterations?: number;
}

function parseCashFlows(raw: string): ParsedCashFlow[] {
  const lines = raw
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    throw new CalculationInputError('cashFlows', 'not_enough_flows', 'Enter at least two dated cash flows.');
  }

  const parsed = lines.map((line, index) => {
    const [date, ...amountParts] = line.split(',');
    const amountText = amountParts.join(',').trim();
    if (!date || !/^\d{4}-\d{2}-\d{2}$/u.test(date.trim()) || !amountText) {
      throw new CalculationInputError(
        'cashFlows',
        'invalid_cash_flow_line',
        `Line ${index + 1} must use YYYY-MM-DD,amount format.`,
      );
    }
    const dateText = date.trim();
    const dateObject = new Date(`${dateText}T00:00:00Z`);
    if (Number.isNaN(dateObject.getTime()) || dateObject.toISOString().slice(0, 10) !== dateText) {
      throw new CalculationInputError('cashFlows', 'invalid_date', `Line ${index + 1} has an invalid date.`);
    }
    let amount: Decimal;
    try {
      amount = parseDecimal(amountText);
      if (amount.abs().gt(MAX_VALUE)) {
        throw new CalculationInputError('cashFlows', 'too_large', 'Cash flow is outside the safe range.');
      }
    } catch (error) {
      if (error instanceof CalculationInputError) throw error;
      throw new CalculationInputError(
        'cashFlows',
        'invalid_amount',
        `Line ${index + 1} has an invalid amount.`,
      );
    }
    return { date: dateText, amount, dateMs: dateObject.getTime() };
  });

  parsed.sort((left, right) => left.dateMs - right.dateMs);
  const firstDate = parsed[0]?.dateMs ?? 0;
  const positive = parsed.some((flow) => flow.amount.gt(0));
  const negative = parsed.some((flow) => flow.amount.lt(0));
  if (!positive || !negative) {
    throw new CalculationInputError(
      'cashFlows',
      'needs_both_signs',
      'Include at least one negative investment and one positive receipt to solve XIRR.',
    );
  }

  return parsed.map((flow) => ({
    date: flow.date,
    amount: flow.amount,
    dayOffset: Math.round((flow.dateMs - firstDate) / 86_400_000),
  }));
}

function monthlyRate(annualRatePercent: Decimal) {
  return annualRatePercent.div(1200);
}

function calculatePayment(principal: Decimal, annualRatePercent: Decimal, months: number) {
  const rate = monthlyRate(annualRatePercent);
  if (rate.isZero()) return principal.div(months);
  const growth = new Decimal(1).plus(rate).pow(months);
  return principal.times(rate).times(growth).div(growth.minus(1));
}

function createAmortizationSchedule(
  principal: Decimal,
  annualRatePercent: Decimal,
  amortizationMonths: number,
  startingPeriod = 1,
  periods = amortizationMonths,
): { payment: Decimal; schedule: FinanceScheduleRow[]; totalInterest: Decimal; endingBalance: Decimal } {
  const payment = calculatePayment(principal, annualRatePercent, amortizationMonths);
  const rate = monthlyRate(annualRatePercent);
  let balance = principal;
  let totalInterest = new Decimal(0);
  const schedule: FinanceScheduleRow[] = [];

  for (let month = 1; month <= periods; month += 1) {
    const interest = balance.times(rate);
    let principalPaid = payment.minus(interest);
    let actualPayment = payment;
    if (month === amortizationMonths) {
      principalPaid = balance;
      actualPayment = principalPaid.plus(interest);
    }
    balance = balance.minus(principalPaid);
    if (balance.abs().lt('0.0000000001')) balance = new Decimal(0);
    totalInterest = totalInterest.plus(interest);
    schedule.push({
      period: String(startingPeriod + month - 1),
      payment: decimalToString(actualPayment),
      interest: decimalToString(interest),
      principal: decimalToString(principalPaid),
      balance: decimalToString(balance),
    });
  }

  return { payment, schedule, totalInterest, endingBalance: balance };
}

function createComparisonSchedule(
  input: FinanceCalculatorInput,
  kind: FinanceCalculatorKind,
  option: 'A' | 'B',
  principal: Decimal,
  annualRate: Decimal,
  months: number,
) {
  const resetMonthRaw = input[`resetAfterMonths${option}`] ?? '';
  const resetRateRaw = input[`resetAnnualRate${option}`] ?? '';
  if (!resetMonthRaw || !resetRateRaw) {
    return {
      ...createAmortizationSchedule(principal, annualRate, months),
      resetMonth: null,
      resetRate: null,
    };
  }

  const resetMonth = parseIntegerInRange(input, kind, `resetAfterMonths${option}`, 1, MAX_TENURE_MONTHS - 1);
  const resetRate = parseRate(input, kind, `resetAnnualRate${option}`);
  const firstPeriod = createAmortizationSchedule(principal, annualRate, months, 1, resetMonth);
  const secondPeriod = createAmortizationSchedule(
    firstPeriod.endingBalance,
    resetRate,
    months - resetMonth,
    resetMonth + 1,
  );
  return {
    payment: firstPeriod.payment,
    schedule: [...firstPeriod.schedule, ...secondPeriod.schedule],
    totalInterest: firstPeriod.totalInterest.plus(secondPeriod.totalInterest),
    endingBalance: secondPeriod.endingBalance,
    resetMonth,
    resetRate,
  };
}

function metric(label: string, value: Decimal | string, format: FinanceMetricFormat): FinanceMetric {
  return { label, value: typeof value === 'string' ? value : decimalToString(value), format };
}

function makeResult(
  kind: FinanceCalculatorKind,
  headline: FinanceMetric,
  tone: FinanceCalculationResult['tone'],
  detail: string,
  details: FinanceMetric[],
  schedule?: FinanceScheduleRow[],
): FinanceCalculationResult {
  return { kind, headline, tone, detail, details, exportRows: [headline, ...details], schedule };
}

function xnpv(rate: Decimal, flows: ParsedCashFlow[]) {
  const base = new Decimal(1).plus(rate);
  return flows.reduce((total, flow) => {
    const exponent = new Decimal(flow.dayOffset).div(365);
    return total.plus(flow.amount.div(base.pow(exponent)));
  }, new Decimal(0));
}

function xnpvDerivative(rate: Decimal, flows: ParsedCashFlow[]) {
  const base = new Decimal(1).plus(rate);
  return flows.reduce((total, flow) => {
    const exponent = new Decimal(flow.dayOffset).div(365);
    if (exponent.isZero()) return total;
    return total.minus(flow.amount.times(exponent).div(base.pow(exponent.plus(1))));
  }, new Decimal(0));
}

export function solveXirr(flows: ParsedCashFlow[], guessPercent: Decimal, options: XirrSolverOptions = {}) {
  const maxNewtonIterations = options.maxNewtonIterations ?? 20;
  const maxBisectionIterations = options.maxBisectionIterations ?? 220;
  const lowerLimit = new Decimal('-0.999999999');
  let lower = lowerLimit;
  let upper = new Decimal(1);
  let lowerValue = xnpv(lower, flows);
  let upperValue = xnpv(upper, flows);

  for (let attempt = 0; attempt < 60 && lowerValue.times(upperValue).gt(0); attempt += 1) {
    upper = upper.times(2);
    if (upper.gt(MAX_XIRR_RATE)) upper = MAX_XIRR_RATE;
    upperValue = xnpv(upper, flows);
    if (upper.eq(MAX_XIRR_RATE)) break;
  }

  if (lowerValue.isZero()) return lower;
  if (upperValue.isZero()) return upper;
  if (lowerValue.times(upperValue).gt(0)) {
    throw new CalculationInputError(
      'cashFlows',
      'no_solution',
      'These cash flows do not produce a solvable XIRR within the supported rate range.',
    );
  }

  let candidate = guessPercent.div(100);
  if (candidate.lte(lower) || candidate.gte(upper)) candidate = lower.plus(upper).div(2);
  for (let attempt = 0; attempt < maxNewtonIterations; attempt += 1) {
    const value = xnpv(candidate, flows);
    if (value.abs().lt('0.0000000001')) return candidate;
    const derivative = xnpvDerivative(candidate, flows);
    if (derivative.isZero()) break;
    const next = candidate.minus(value.div(derivative));
    if (next.lte(lower) || next.gte(upper)) break;
    if (xnpv(next, flows).abs().gte(value.abs())) break;
    candidate = next;
  }

  for (let iteration = 0; iteration < maxBisectionIterations; iteration += 1) {
    const midpoint = lower.plus(upper).div(2);
    const midpointValue = xnpv(midpoint, flows);
    if (midpointValue.abs().lt('0.0000000001') || upper.minus(lower).lt('0.0000000001')) {
      return midpoint;
    }
    if (lowerValue.times(midpointValue).lte(0)) {
      upper = midpoint;
      upperValue = midpointValue;
    } else {
      lower = midpoint;
      lowerValue = midpointValue;
    }
  }

  throw new CalculationInputError(
    'cashFlows',
    'not_converged',
    'The solver could not converge for these dated cash flows. Check dates and amounts.',
  );
}

function validateWithErrors(kind: FinanceCalculatorKind, input: FinanceCalculatorInput) {
  const errors: FieldError[] = [];
  const fields = financeCalculatorFields[kind];
  const addError = (field: string, error: unknown, fallback: string) => {
    errors.push({
      field,
      code: error instanceof CalculationInputError ? error.code : 'invalid_input',
      message: error instanceof Error ? error.message : fallback,
    });
  };

  for (const field of fields) {
    const raw = (input[field.name] ?? '').trim();
    if (!raw && field.required === false) continue;
    if (!raw) {
      addError(
        field.name,
        new CalculationInputError(field.name, 'required', `${field.label} is required.`),
        `${field.label} is required.`,
      );
      continue;
    }
    try {
      if (field.type === 'select') {
        if (!optionValues(kind, field.name).includes(raw)) {
          throw new CalculationInputError(
            field.name,
            'invalid_option',
            `Choose a valid ${field.label.toLowerCase()}.`,
          );
        }
      } else if (field.type === 'textarea') {
        parseCashFlows(raw);
      } else {
        parseNumber(input, kind, field.name, { allowNegative: field.allowNegative });
      }
    } catch (error) {
      addError(field.name, error, `Enter a valid ${field.label.toLowerCase()}.`);
    }
  }

  const check = (field: string, action: () => unknown, fallback: string) => {
    try {
      action();
    } catch (error) {
      if (!errors.some((candidate) => candidate.field === field)) addError(field, error, fallback);
    }
  };

  if (kind === 'emi') {
    check(
      'loanAmount',
      () => parsePositive(input, kind, 'loanAmount'),
      'Loan amount must be greater than zero.',
    );
    check(
      'annualRatePercent',
      () => parseRate(input, kind, 'annualRatePercent'),
      'Enter an annual rate between 0% and 100%.',
    );
    check(
      'tenureMonths',
      () => parseIntegerInRange(input, kind, 'tenureMonths', 1, MAX_TENURE_MONTHS),
      'Tenure must be a whole number in the supported range.',
    );
    const hasResetMonth = Boolean((input.resetAfterMonths ?? '').trim());
    const hasResetRate = Boolean((input.resetAnnualRatePercent ?? '').trim());
    if (hasResetMonth !== hasResetRate) {
      const missing = hasResetMonth ? 'resetAnnualRatePercent' : 'resetAfterMonths';
      addError(
        missing,
        new CalculationInputError(
          missing,
          'reset_pair_required',
          'Enter both reset assumptions or leave both blank.',
        ),
        'Enter both reset assumptions or leave both blank.',
      );
    }
    if (hasResetMonth) {
      check(
        'resetAfterMonths',
        () => {
          const tenure = parseIntegerInRange(input, kind, 'tenureMonths', 1, MAX_TENURE_MONTHS);
          const resetMonth = parseIntegerInRange(input, kind, 'resetAfterMonths', 1, MAX_TENURE_MONTHS - 1);
          if (resetMonth >= tenure) {
            throw new CalculationInputError(
              'resetAfterMonths',
              'reset_after_tenure',
              'Reset month must be before the final tenure month.',
            );
          }
        },
        'Reset month must be before the final tenure month.',
      );
      check(
        'resetAnnualRatePercent',
        () => parseRate(input, kind, 'resetAnnualRatePercent'),
        'Enter a reset rate between 0% and 100%.',
      );
    }
  }

  if (kind === 'sip') {
    check(
      'monthlyContribution',
      () => parsePositive(input, kind, 'monthlyContribution'),
      'Monthly contribution must be greater than zero.',
    );
    check(
      'annualExpectedReturnPercent',
      () => parseRate(input, kind, 'annualExpectedReturnPercent', -99.99, 100),
      'Expected return must be between -99.99% and 100%.',
    );
    check(
      'tenureMonths',
      () => parseIntegerInRange(input, kind, 'tenureMonths', 1, MAX_TENURE_MONTHS),
      'Investment period must be a whole number in the supported range.',
    );
  }

  if (kind === 'fd') {
    check(
      'principal',
      () => parsePositive(input, kind, 'principal'),
      'Deposit principal must be greater than zero.',
    );
    check(
      'annualRatePercent',
      () => parseRate(input, kind, 'annualRatePercent'),
      'Enter an annual rate between 0% and 100%.',
    );
    check(
      'tenureMonths',
      () => parseIntegerInRange(input, kind, 'tenureMonths', 1, MAX_TENURE_MONTHS),
      'Tenure must be a whole number in the supported range.',
    );
    check(
      'compoundingFrequency',
      () => {
        const frequency = parseIntegerInRange(input, kind, 'compoundingFrequency', 1, 12);
        if (![1, 2, 4, 12].includes(frequency)) {
          throw new CalculationInputError(
            'compoundingFrequency',
            'invalid_frequency',
            'Choose annual, half-yearly, quarterly or monthly compounding.',
          );
        }
      },
      'Choose a supported compounding frequency.',
    );
  }

  if (kind === 'xirr') {
    check('cashFlows', () => parseCashFlows(input.cashFlows ?? ''), 'Enter valid dated cash flows.');
    if ((input.guessPercent ?? '').trim()) {
      check(
        'guessPercent',
        () => parseRate(input, kind, 'guessPercent', -99.99, 100000),
        'Starting guess must be between -99.99% and 100,000%.',
      );
    }
  }

  if (kind === 'loan-comparison') {
    for (const option of ['A', 'B'] as const) {
      check(
        `amount${option}`,
        () => parsePositive(input, kind, `amount${option}`),
        `Option ${option} amount must be greater than zero.`,
      );
      check(
        `annualRate${option}`,
        () => parseRate(input, kind, `annualRate${option}`),
        `Option ${option} rate must be between 0% and 100%.`,
      );
      check(
        `termMonths${option}`,
        () => parseIntegerInRange(input, kind, `termMonths${option}`, 1, MAX_TENURE_MONTHS),
        `Option ${option} tenure must be a whole number in the supported range.`,
      );
      const hasResetMonth = Boolean((input[`resetAfterMonths${option}`] ?? '').trim());
      const hasResetRate = Boolean((input[`resetAnnualRate${option}`] ?? '').trim());
      if (hasResetMonth !== hasResetRate) {
        const missing = hasResetMonth ? `resetAnnualRate${option}` : `resetAfterMonths${option}`;
        addError(
          missing,
          new CalculationInputError(
            missing,
            'reset_pair_required',
            `Enter both Option ${option} reset assumptions or leave both blank.`,
          ),
          `Enter both Option ${option} reset assumptions or leave both blank.`,
        );
      }
      if (hasResetMonth) {
        check(
          `resetAfterMonths${option}`,
          () => {
            const term = parseIntegerInRange(input, kind, `termMonths${option}`, 1, MAX_TENURE_MONTHS);
            const resetMonth = parseIntegerInRange(
              input,
              kind,
              `resetAfterMonths${option}`,
              1,
              MAX_TENURE_MONTHS - 1,
            );
            if (resetMonth >= term) {
              throw new CalculationInputError(
                `resetAfterMonths${option}`,
                'reset_after_tenure',
                `Option ${option} reset month must be before the final tenure month.`,
              );
            }
          },
          `Option ${option} reset month must be before the final tenure month.`,
        );
        check(
          `resetAnnualRate${option}`,
          () => parseRate(input, kind, `resetAnnualRate${option}`),
          `Option ${option} reset rate must be between 0% and 100%.`,
        );
      }
    }
  }

  if (errors.length > 0) return { success: false as const, errors };
  return {
    success: true as const,
    data: Object.fromEntries(fields.map((field) => [field.name, (input[field.name] ?? '').trim()])),
  };
}

export function validateFinanceCalculatorInput(
  kind: FinanceCalculatorKind,
  input: FinanceCalculatorInput,
): ValidationResult<FinanceCalculatorInput> {
  const parsed = financeCalculatorInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      errors: [{ field: 'form', code: 'invalid_input', message: 'Enter values for this scenario.' }],
    };
  }
  return validateWithErrors(kind, parsed.data);
}

export function calculateFinance(
  kind: FinanceCalculatorKind,
  input: FinanceCalculatorInput,
): FinanceCalculationResult {
  const validation = validateFinanceCalculatorInput(kind, input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new CalculationInputError(
      first?.field ?? 'form',
      first?.code ?? 'invalid_input',
      first?.message ?? 'Check the inputs.',
    );
  }
  const values = validation.data;

  if (kind === 'emi') {
    const principal = parsePositive(values, kind, 'loanAmount');
    const annualRate = parseRate(values, kind, 'annualRatePercent');
    const tenure = parseIntegerInRange(values, kind, 'tenureMonths', 1, MAX_TENURE_MONTHS);
    const processingFee = parseOptionalNumber(values, kind, 'processingFee');
    const resetMonthRaw = values.resetAfterMonths ?? '';
    const resetRateRaw = values.resetAnnualRatePercent ?? '';
    let scheduleResult = createAmortizationSchedule(principal, annualRate, tenure);
    let resetDetails: FinanceMetric[] = [];
    if (resetMonthRaw && resetRateRaw) {
      const resetMonth = parseIntegerInRange(values, kind, 'resetAfterMonths', 1, MAX_TENURE_MONTHS - 1);
      const resetRate = parseRate(values, kind, 'resetAnnualRatePercent');
      const firstPeriod = createAmortizationSchedule(principal, annualRate, tenure, 1, resetMonth);
      const remaining = firstPeriod.endingBalance;
      const secondPeriod = createAmortizationSchedule(
        remaining,
        resetRate,
        tenure - resetMonth,
        resetMonth + 1,
      );
      scheduleResult = {
        payment: firstPeriod.payment,
        schedule: [...firstPeriod.schedule, ...secondPeriod.schedule],
        totalInterest: firstPeriod.totalInterest.plus(secondPeriod.totalInterest),
        endingBalance: secondPeriod.endingBalance,
      };
      resetDetails = [
        metric('Reset month', resetMonth.toString(), 'number'),
        metric('New EMI after reset', secondPeriod.payment, 'currency'),
        metric('Reset annual rate', resetRate, 'percentage'),
      ];
    }
    const totalCost = principal.plus(scheduleResult.totalInterest).plus(processingFee);
    return makeResult(
      kind,
      metric('Monthly EMI', scheduleResult.payment, 'currency'),
      'neutral',
      resetDetails.length > 0
        ? 'A fixed-rate amortization followed by the user-entered rate-reset scenario. The remaining tenure is kept unchanged.'
        : 'A fixed-rate amortization using the annual rate, tenure and principal you entered.',
      [
        metric('Loan amount', principal, 'currency'),
        metric('Annual interest rate', annualRate, 'percentage'),
        metric('Tenure', tenure.toString(), 'number'),
        metric('Total interest', scheduleResult.totalInterest, 'currency'),
        metric('Processing fee', processingFee, 'currency'),
        metric('Total cost', totalCost, 'currency'),
        ...resetDetails,
      ],
      scheduleResult.schedule,
    );
  }

  if (kind === 'sip') {
    const contribution = parsePositive(values, kind, 'monthlyContribution');
    const annualReturn = parseRate(values, kind, 'annualExpectedReturnPercent', -99.99, 100);
    const months = parseIntegerInRange(values, kind, 'tenureMonths', 1, MAX_TENURE_MONTHS);
    const monthlyReturn = monthlyRate(annualReturn);
    const growth = new Decimal(1).plus(monthlyReturn).pow(months);
    const factor = monthlyReturn.isZero() ? new Decimal(months) : growth.minus(1).div(monthlyReturn);
    const futureValue = contribution
      .times(factor)
      .times(values.contributionTiming === 'beginning' ? new Decimal(1).plus(monthlyReturn) : 1);
    const invested = contribution.times(months);
    const gain = futureValue.minus(invested);
    return makeResult(
      kind,
      metric('Illustrated future value', futureValue, 'currency'),
      gain.gt(0) ? 'positive' : gain.lt(0) ? 'negative' : 'neutral',
      'An illustration using a user-entered expected return. Actual returns, taxes and inflation can differ; this is not a guarantee.',
      [
        metric('Monthly contribution', contribution, 'currency'),
        metric('Expected annual return', annualReturn, 'percentage'),
        metric('Investment period', months.toString(), 'number'),
        metric(
          'Contribution timing',
          values.contributionTiming === 'beginning' ? 'Beginning of month' : 'End of month',
          'text',
        ),
        metric('Total invested', invested, 'currency'),
        metric('Illustrated gain', gain, 'currency'),
      ],
    );
  }

  if (kind === 'fd') {
    const principal = parsePositive(values, kind, 'principal');
    const annualRate = parseRate(values, kind, 'annualRatePercent');
    const months = parseIntegerInRange(values, kind, 'tenureMonths', 1, MAX_TENURE_MONTHS);
    const frequency = parseIntegerInRange(values, kind, 'compoundingFrequency', 1, 12);
    const maturity = principal.times(
      new Decimal(1)
        .plus(annualRate.div(100).div(frequency))
        .pow(new Decimal(frequency).times(months).div(12)),
    );
    const interest = maturity.minus(principal);
    return makeResult(
      kind,
      metric('Maturity value', maturity, 'currency'),
      interest.gte(0) ? 'positive' : 'negative',
      'Compounded principal using your annual rate, tenure and declared compounding frequency. Bank-specific tax and premature-closure rules are excluded.',
      [
        metric('Deposit principal', principal, 'currency'),
        metric('Annual interest rate', annualRate, 'percentage'),
        metric('Tenure', months.toString(), 'number'),
        metric('Compounding periods per year', frequency.toString(), 'number'),
        metric('Interest earned', interest, 'currency'),
      ],
    );
  }

  if (kind === 'xirr') {
    const flows = parseCashFlows(values.cashFlows ?? '');
    const guess = values.guessPercent?.trim()
      ? parseRate(values, kind, 'guessPercent', -99.99, 100000)
      : new Decimal(10);
    const annualRate = solveXirr(flows, guess).times(100);
    const invested = flows
      .filter((flow) => flow.amount.lt(0))
      .reduce((total, flow) => total.plus(flow.amount.abs()), new Decimal(0));
    const received = flows
      .filter((flow) => flow.amount.gt(0))
      .reduce((total, flow) => total.plus(flow.amount), new Decimal(0));
    return makeResult(
      kind,
      metric('Annualized XIRR', annualRate, 'percentage'),
      annualRate.gte(0) ? 'positive' : 'negative',
      'The annualized rate that makes the net present value of your dated cash flows equal to zero. Results depend on the dates and signs you enter.',
      [
        metric('Total invested', invested, 'currency'),
        metric('Total received', received, 'currency'),
        metric('Cash-flow entries', flows.length.toString(), 'number'),
        metric('Date range', `${flows[0]?.date ?? ''} to ${flows.at(-1)?.date ?? ''}`, 'text'),
      ],
    );
  }

  const amountA = parsePositive(values, kind, 'amountA');
  const rateA = parseRate(values, kind, 'annualRateA');
  const termA = parseIntegerInRange(values, kind, 'termMonthsA', 1, MAX_TENURE_MONTHS);
  const feeA = parseOptionalNumber(values, kind, 'processingFeeA').plus(
    parseOptionalNumber(values, kind, 'prepaymentFeeA'),
  );
  const amountB = parsePositive(values, kind, 'amountB');
  const rateB = parseRate(values, kind, 'annualRateB');
  const termB = parseIntegerInRange(values, kind, 'termMonthsB', 1, MAX_TENURE_MONTHS);
  const feeB = parseOptionalNumber(values, kind, 'processingFeeB').plus(
    parseOptionalNumber(values, kind, 'prepaymentFeeB'),
  );
  const loanA = createComparisonSchedule(values, kind, 'A', amountA, rateA, termA);
  const loanB = createComparisonSchedule(values, kind, 'B', amountB, rateB, termB);
  const totalA = amountA.plus(loanA.totalInterest).plus(feeA);
  const totalB = amountB.plus(loanB.totalInterest).plus(feeB);
  const difference = totalA.minus(totalB).abs();
  const headline = totalA.eq(totalB)
    ? 'Same total cost'
    : totalA.lt(totalB)
      ? 'Option A has lower total cost'
      : 'Option B has lower total cost';
  return makeResult(
    kind,
    metric('Comparison', headline, 'text'),
    'neutral',
    'A side-by-side arithmetic comparison of two user-entered scenarios. It is not a lender recommendation, quote or approval decision.',
    [
      metric('Option A EMI', loanA.payment, 'currency'),
      metric('Option A nominal annual interest rate', rateA, 'percentage'),
      metric('Option A total cost', totalA, 'currency'),
      metric('Option A interest', loanA.totalInterest, 'currency'),
      metric('Option A rate type', values.rateTypeA === 'floating' ? 'Floating' : 'Fixed', 'text'),
      metric(
        'Option A reset scenario',
        loanA.resetMonth
          ? `${loanA.resetMonth} months → ${decimalToString(loanA.resetRate ?? new Decimal(0))}%`
          : 'Not modelled',
        'text',
      ),
      metric('Option B EMI', loanB.payment, 'currency'),
      metric('Option B nominal annual interest rate', rateB, 'percentage'),
      metric('Option B total cost', totalB, 'currency'),
      metric('Option B interest', loanB.totalInterest, 'currency'),
      metric('Option B rate type', values.rateTypeB === 'floating' ? 'Floating' : 'Fixed', 'text'),
      metric(
        'Option B reset scenario',
        loanB.resetMonth
          ? `${loanB.resetMonth} months → ${decimalToString(loanB.resetRate ?? new Decimal(0))}%`
          : 'Not modelled',
        'text',
      ),
      metric('Absolute total-cost difference', difference, 'currency'),
    ],
  );
}
