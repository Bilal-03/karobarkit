import Decimal from 'decimal.js';
import { z } from 'zod';

import type { ValidationResult } from './types';
import { decimalToString, parseDecimal } from '@/domain/formatting/decimal';
import { isIsoDate } from '@/domain/policies/effective-dated';
import {
  currentIsoDate,
  regulatedPolicyMessage,
  regulatedPolicyState,
  isApprovedOfficialPolicyUrl,
  regulatedPolicyReviews,
  type RegulatedPolicyKey,
  type RegulatedPolicyState,
} from '@/domain/policies/regulated-utilities';

export const HSN_DATASET_VERSION = 'hsn-sac-reference-2026-04-provisional';
export const GST_DUE_DATE_DATASET_VERSION = 'gst-calendar-reference-fy-2026-27-provisional';
export const DEPRECIATION_POLICY_VERSION = 'depreciation-methods-2026-reference';
export const PROFESSIONAL_TAX_DATASET_VERSION = 'maharashtra-pt-reference-2026-provisional';
export const MSME_INTEREST_POLICY_VERSION = 'msmed-section-16-reference-2026';

export interface RegulatedResultBase {
  policyState: RegulatedPolicyState;
  lastVerifiedOn: string;
  policyMessage: string;
}

function text(label: string, max: number) {
  return z.string().trim().min(1, `Enter ${label}.`).max(max, `${label} must be ${max} characters or fewer.`);
}

function optionalText(max: number) {
  return z.string().trim().max(max, `Keep this field to ${max} characters or fewer.`);
}

function decimalText(label: string) {
  return z
    .string()
    .trim()
    .min(1, `Enter ${label}.`)
    .refine((value) => {
      try {
        return parseDecimal(value).isFinite();
      } catch {
        return false;
      }
    }, `${label} must be a valid number.`);
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function dateText(label: string) {
  return z.string().refine(validDate, `Enter a valid ${label}.`);
}

function validate<T>(schema: z.ZodType<T>, input: T): ValidationResult<T> {
  const parsed = schema.safeParse(input);
  return parsed.success
    ? { success: true, data: parsed.data }
    : {
        success: false,
        errors: parsed.error.issues.map((issue) => ({
          field: String(issue.path[0] ?? 'form'),
          code: 'invalid_input',
          message: issue.message,
        })),
      };
}

function validated<T>(schema: z.ZodType<T>, input: T) {
  const result = validate(schema, input);
  if (!result.success) throw new Error(result.errors[0]?.message ?? 'Check the highlighted fields.');
  return result.data;
}

function positive(value: string, label: string) {
  const parsed = parseDecimal(value);
  if (parsed.isNegative()) throw new Error(`${label} cannot be negative.`);
  return parsed;
}

function policyBase(policyKey: RegulatedPolicyKey, today = currentIsoDate()): RegulatedResultBase {
  const { lastVerifiedOn, reviewCadenceDays } = regulatedPolicyReviews[policyKey];
  const state = regulatedPolicyState(lastVerifiedOn, today, 'active', reviewCadenceDays);
  return { policyState: state, lastVerifiedOn, policyMessage: regulatedPolicyMessage(state) };
}

function assertFreshPolicy(policyKey: RegulatedPolicyKey, today = currentIsoDate()) {
  const result = policyBase(policyKey, today);
  if (result.policyState !== 'fresh') throw new Error(result.policyMessage);
  return result;
}

export interface HsnRecord {
  code: string;
  description: string;
  kind: 'goods' | 'services';
  chapter: string;
  keywords: string[];
}

export const bundledHsnRecords: readonly HsnRecord[] = [
  {
    code: '1001',
    description: 'Wheat and meslin',
    kind: 'goods',
    chapter: '10',
    keywords: ['wheat', 'grain', 'cereal'],
  },
  {
    code: '1905',
    description: 'Bread, pastry, cakes and biscuits',
    kind: 'goods',
    chapter: '19',
    keywords: ['bread', 'bakery', 'biscuit', 'cake'],
  },
  {
    code: '2106',
    description: 'Food preparations not elsewhere specified',
    kind: 'goods',
    chapter: '21',
    keywords: ['food preparation', 'prepared food'],
  },
  {
    code: '3304',
    description: 'Beauty or make-up preparations and skin-care preparations',
    kind: 'goods',
    chapter: '33',
    keywords: ['cosmetic', 'skin care', 'beauty'],
  },
  {
    code: '6109',
    description: 'T-shirts, singlets and other vests, knitted or crocheted',
    kind: 'goods',
    chapter: '61',
    keywords: ['t-shirt', 'shirt', 'garment'],
  },
  {
    code: '8517',
    description: 'Telephone sets and other apparatus for communication',
    kind: 'goods',
    chapter: '85',
    keywords: ['phone', 'telephone', 'communication'],
  },
  {
    code: '9983',
    description: 'Other professional, technical and business services',
    kind: 'services',
    chapter: '99',
    keywords: ['professional', 'technical', 'business service'],
  },
  {
    code: '9985',
    description: 'Support services',
    kind: 'services',
    chapter: '99',
    keywords: ['support', 'service'],
  },
  {
    code: '9992',
    description: 'Education services',
    kind: 'services',
    chapter: '99',
    keywords: ['education', 'training', 'teaching'],
  },
];

export interface HsnInput {
  query: string;
  kind: 'all' | 'goods' | 'services';
}

export interface HsnResult extends RegulatedResultBase {
  query: string;
  datasetVersion: string;
  matches: HsnRecord[];
  classificationNotice: string;
}

export const hsnInputSchema = z.object({
  query: text('a code or keyword', 120),
  kind: z.enum(['all', 'goods', 'services']),
});

export function validateHsnInput(input: HsnInput) {
  return validate(hsnInputSchema, input);
}

export function calculateHsn(input: HsnInput, today = currentIsoDate()): HsnResult {
  const value = validated(hsnInputSchema, input);
  const policy = assertFreshPolicy('hsn', today);
  const query = value.query.toLowerCase();
  const matches = bundledHsnRecords
    .filter((record) => value.kind === 'all' || record.kind === value.kind)
    .filter((record) =>
      [record.code, record.description, ...record.keywords].some((field) =>
        field.toLowerCase().includes(query),
      ),
    )
    .slice(0, 20);
  return {
    ...policy,
    query: value.query,
    datasetVersion: HSN_DATASET_VERSION,
    matches,
    classificationNotice:
      'Reference search only. Do not treat a match as a classification, rate, eligibility or filing decision.',
  };
}

export interface GstDueDateInput {
  financialYear: '2026-27';
  returnType: 'gstr-1' | 'gstr-3b';
  taxpayerType: 'regular-monthly' | 'qrmp-quarterly';
  qrmpDueDateGroup: '22' | '24';
  period: string;
}

export interface GstDueDateResult extends RegulatedResultBase {
  financialYear: string;
  returnType: GstDueDateInput['returnType'];
  taxpayerType: GstDueDateInput['taxpayerType'];
  qrmpDueDateGroup: GstDueDateInput['qrmpDueDateGroup'];
  period: string;
  referenceDueDate: string;
  datasetVersion: string;
  notice: string;
}

export const gstDueDateInputSchema = z
  .object({
    financialYear: z.literal('2026-27'),
    returnType: z.enum(['gstr-1', 'gstr-3b']),
    taxpayerType: z.enum(['regular-monthly', 'qrmp-quarterly']),
    qrmpDueDateGroup: z.enum(['22', '24']),
    period: z
      .string()
      .regex(
        /^(?:2026-(0[4-9]|1[0-2])|2027-(0[1-3]))$/u,
        'Choose a month in FY 2026-27 (April 2026 to March 2027).',
      ),
  })
  .superRefine((value, context) => {
    if (value.taxpayerType === 'qrmp-quarterly' && !/(?:-06|-09|-12|-03)$/u.test(value.period)) {
      context.addIssue({
        code: 'custom',
        path: ['period'],
        message: 'For QRMP, choose a quarter ending in June, September, December or March.',
      });
    }
  });

export function validateGstDueDateInput(input: GstDueDateInput) {
  return validate(gstDueDateInputSchema, input);
}

function addMonthDays(period: string, day: number) {
  const [year, month] = period.split('-').map(Number);
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const daysInMonth = new Date(Date.UTC(nextMonth.year, nextMonth.month, 0)).getUTCDate();
  return `${nextMonth.year}-${String(nextMonth.month).padStart(2, '0')}-${String(Math.min(day, daysInMonth)).padStart(2, '0')}`;
}

export function calculateGstDueDate(input: GstDueDateInput, today = currentIsoDate()): GstDueDateResult {
  const value = validated(gstDueDateInputSchema, input);
  const policy = assertFreshPolicy('gst-calendar', today);
  const day =
    value.returnType === 'gstr-1'
      ? value.taxpayerType === 'regular-monthly'
        ? 11
        : 13
      : value.taxpayerType === 'regular-monthly'
        ? 20
        : Number(value.qrmpDueDateGroup);
  return {
    ...policy,
    financialYear: value.financialYear,
    returnType: value.returnType,
    taxpayerType: value.taxpayerType,
    qrmpDueDateGroup: value.qrmpDueDateGroup,
    period: value.period,
    referenceDueDate: addMonthDays(value.period, day),
    datasetVersion: GST_DUE_DATE_DATASET_VERSION,
    notice:
      'Reference calendar only. Notifications, extensions, state/period facts and portal status can change the applicable due date.',
  };
}

export interface DepreciationInput {
  mode: 'companies-act' | 'income-tax';
  assetCost: string;
  residualValue: string;
  usefulLifeYears: string;
  openingWdv: string;
  ratePercent: string;
  daysInService: string;
  method: 'slm' | 'wdv';
}

export interface DepreciationResult extends RegulatedResultBase {
  mode: DepreciationInput['mode'];
  annualDepreciation: string;
  closingValue: string;
  baseValue: string;
  method: DepreciationInput['method'];
  policyVersion: string;
  notice: string;
}

export const depreciationInputSchema = z.object({
  mode: z.enum(['companies-act', 'income-tax']),
  assetCost: decimalText('asset cost'),
  residualValue: decimalText('residual value'),
  usefulLifeYears: optionalText(40),
  openingWdv: optionalText(40),
  ratePercent: optionalText(40),
  daysInService: optionalText(8),
  method: z.enum(['slm', 'wdv']),
});

export function validateDepreciationInput(input: DepreciationInput) {
  return validate(depreciationInputSchema, input);
}

export function calculateDepreciation(
  input: DepreciationInput,
  today = currentIsoDate(),
): DepreciationResult {
  const value = validated(depreciationInputSchema, input);
  const policy = assertFreshPolicy('depreciation', today);
  if (value.mode === 'companies-act' && value.method !== 'slm') {
    throw new Error('Companies Act mode uses the straight-line method (SLM).');
  }
  if (value.mode === 'income-tax' && value.method !== 'wdv') {
    throw new Error('Income Tax mode uses the written-down value method (WDV).');
  }
  const cost = positive(value.assetCost, 'Asset cost');
  const residual = positive(value.residualValue || '0', 'Residual value');
  if (residual.gt(cost)) throw new Error('Residual value cannot exceed asset cost.');
  const days = value.daysInService.trim()
    ? positive(value.daysInService, 'Days in service')
    : new Decimal(365);
  if (!days.isInteger() || days.isZero() || days.gt(366))
    throw new Error('Days in service must be a whole number from 1 to 366.');

  let baseValue = cost;
  let annual: Decimal;
  if (value.mode === 'companies-act') {
    const life = positive(value.usefulLifeYears || '0', 'Useful life');
    if (life.isZero()) throw new Error('Useful life must be greater than zero.');
    annual = cost.minus(residual).div(life).times(days).div(365);
  } else {
    const rate = positive(value.ratePercent || '0', 'Rate');
    if (rate.isZero() || rate.gt(100))
      throw new Error('Income-tax rate must be greater than 0% and no more than 100%.');
    baseValue = value.openingWdv.trim() ? positive(value.openingWdv, 'Opening WDV') : cost;
    const firstYearFactor = days.lt(180) ? new Decimal(0.5) : new Decimal(1);
    annual = baseValue.times(rate).div(100).times(firstYearFactor);
  }
  const closing = Decimal.max(new Decimal(0), baseValue.minus(annual));
  return {
    ...policy,
    mode: value.mode,
    annualDepreciation: decimalToString(annual),
    closingValue: decimalToString(closing),
    baseValue: decimalToString(baseValue),
    method: value.method,
    policyVersion: DEPRECIATION_POLICY_VERSION,
    notice:
      'Illustrative arithmetic only. Income Tax mode applies the statutory 50% first-year restriction below 180 days; rates, blocks, component accounting and eligibility still require reviewed records.',
  };
}

export interface ProfessionalTaxInput {
  state: 'maharashtra';
  salaryAmount: string;
  salaryPeriod: 'monthly' | 'annual';
  salaryDefinition: 'gross-monthly' | 'taxable-salary';
  gender: 'female' | 'male';
  month: string;
}

export interface ProfessionalTaxResult extends RegulatedResultBase {
  state: ProfessionalTaxInput['state'];
  monthlySalary: string;
  monthlyTax: string;
  annualIllustration: string;
  salaryDefinition: ProfessionalTaxInput['salaryDefinition'];
  datasetVersion: string;
  notice: string;
}

export const professionalTaxInputSchema = z.object({
  state: z.literal('maharashtra'),
  salaryAmount: decimalText('salary amount'),
  salaryPeriod: z.enum(['monthly', 'annual']),
  salaryDefinition: z.enum(['gross-monthly', 'taxable-salary']),
  gender: z.enum(['female', 'male']),
  month: z.string().regex(/^(?:2026-(0[4-9]|1[0-2])|2027-(0[1-3]))$/u, 'Choose a month in FY 2026-27.'),
});

export function validateProfessionalTaxInput(input: ProfessionalTaxInput) {
  return validate(professionalTaxInputSchema, input);
}

export function calculateProfessionalTax(
  input: ProfessionalTaxInput,
  today = currentIsoDate(),
): ProfessionalTaxResult {
  const value = validated(professionalTaxInputSchema, input);
  const policy = assertFreshPolicy('professional-tax', today);
  const amount = positive(value.salaryAmount, 'Salary amount');
  const monthly = value.salaryPeriod === 'annual' ? amount.div(12) : amount;
  const taxForMonth = (month: string) => {
    if (value.gender === 'female' && monthly.lte(25_000)) return new Decimal(0);
    if (value.gender === 'male' && monthly.lte(7_500)) return new Decimal(0);
    if (value.gender === 'male' && monthly.lte(10_000)) return new Decimal(175);
    return new Decimal(month.endsWith('-02') ? 300 : 200);
  };
  const monthlyTax = taxForMonth(value.month);
  const annualTax = [
    '2026-04',
    '2026-05',
    '2026-06',
    '2026-07',
    '2026-08',
    '2026-09',
    '2026-10',
    '2026-11',
    '2026-12',
    '2027-01',
    '2027-02',
    '2027-03',
  ].reduce((sum, month) => sum.plus(taxForMonth(month)), new Decimal(0));
  return {
    ...policy,
    state: value.state,
    monthlySalary: decimalToString(monthly),
    monthlyTax: decimalToString(monthlyTax),
    annualIllustration: decimalToString(annualTax),
    salaryDefinition: value.salaryDefinition,
    datasetVersion: PROFESSIONAL_TAX_DATASET_VERSION,
    notice:
      'Maharashtra reference schedule only. Verify the current state notification, exemption, salary definition, gender rule and filing period before use.',
  };
}

export interface MsmeInterestInput {
  principal: string;
  invoiceDate: string;
  acceptedDate: string;
  agreedPaymentDays: string;
  agreementBasis: 'written-agreement' | 'no-agreement';
  paymentDate: string;
  bankRatePercent: string;
  bankRateEffectiveOn: string;
  enterpriseType: 'micro' | 'small' | 'medium' | 'trading' | 'unknown';
}

export interface MsmeInterestResult extends RegulatedResultBase {
  eligible: boolean;
  eligibilityStatus: 'eligible-reference' | 'not-eligible-reference' | 'needs-review';
  principal: string;
  dueDate: string;
  overdueDays: number;
  bankRateEffectiveOn: string;
  annualInterestRate: string;
  estimatedInterest: string;
  estimatedTotal: string;
  policyVersion: string;
  notice: string;
}

export const msmeInterestInputSchema = z.object({
  principal: decimalText('principal'),
  invoiceDate: dateText('invoice date'),
  acceptedDate: dateText('acceptance date'),
  agreedPaymentDays: decimalText('agreed payment days'),
  agreementBasis: z.enum(['written-agreement', 'no-agreement']),
  paymentDate: dateText('payment date'),
  bankRatePercent: decimalText('bank rate'),
  bankRateEffectiveOn: dateText('bank-rate effective date'),
  enterpriseType: z.enum(['micro', 'small', 'medium', 'trading', 'unknown']),
});

export function validateMsmeInterestInput(input: MsmeInterestInput) {
  return validate(msmeInterestInputSchema, input);
}

function dateDifference(start: string, end: string) {
  return Math.floor(
    (new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) / 86_400_000,
  );
}

function dateAfter(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function calendarMonthAnniversary(value: string, months: number) {
  const [year, month, day] = value.split('-').map(Number);
  const targetMonthIndex = month - 1 + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const normalizedMonthIndex = ((targetMonthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonthIndex + 1, 0)).getUTCDate();
  return `${targetYear}-${String(normalizedMonthIndex + 1).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}

export function calculateMsmeInterest(
  input: MsmeInterestInput,
  today = currentIsoDate(),
): MsmeInterestResult {
  const value = validated(msmeInterestInputSchema, input);
  const policy = assertFreshPolicy('msme', today);
  const principal = positive(value.principal, 'Principal');
  const agreedDays = positive(value.agreedPaymentDays, 'Agreed payment days');
  const bankRate = positive(value.bankRatePercent, 'Bank rate');
  if (!agreedDays.isInteger() || agreedDays.gt(45))
    throw new Error('Agreed payment days must be a whole number from 0 to 45.');
  if (value.agreementBasis === 'written-agreement' && agreedDays.isZero())
    throw new Error('Enter at least one agreed payment day for a written agreement.');
  if (
    value.paymentDate < value.invoiceDate ||
    value.acceptedDate < value.invoiceDate ||
    value.paymentDate < value.acceptedDate
  )
    throw new Error('Dates cannot precede the invoice or acceptance date.');
  const dueDays = value.agreementBasis === 'no-agreement' ? 15 : agreedDays.toNumber();
  const dueDate = dateAfter(value.acceptedDate, dueDays);
  if (value.bankRateEffectiveOn > dueDate)
    throw new Error('The bank-rate effective date cannot be after the payment due date.');
  const overdueDays = Math.max(0, dateDifference(dueDate, value.paymentDate));
  const annualRate = bankRate.times(3).div(100);
  let restDate = dueDate;
  let fullMonths = 0;
  while (true) {
    const nextRestDate = calendarMonthAnniversary(dueDate, fullMonths + 1);
    if (nextRestDate > value.paymentDate) break;
    fullMonths += 1;
    restDate = nextRestDate;
  }
  const remainderDays = Math.max(0, dateDifference(restDate, value.paymentDate));
  const monthlyRate = annualRate.div(12);
  const compounded = principal.times(new Decimal(1).plus(monthlyRate).pow(fullMonths).minus(1));
  const remainderInterest = principal.plus(compounded).times(annualRate).times(remainderDays).div(365);
  const interest = compounded.plus(remainderInterest);
  const eligible = value.enterpriseType === 'micro' || value.enterpriseType === 'small';
  const eligibilityStatus =
    value.enterpriseType === 'unknown'
      ? 'needs-review'
      : eligible
        ? 'eligible-reference'
        : 'not-eligible-reference';
  return {
    ...policy,
    eligible,
    eligibilityStatus,
    principal: decimalToString(principal),
    dueDate,
    overdueDays,
    bankRateEffectiveOn: value.bankRateEffectiveOn,
    annualInterestRate: decimalToString(annualRate.times(100)),
    estimatedInterest: decimalToString(eligible ? interest : new Decimal(0)),
    estimatedTotal: decimalToString(eligible ? principal.plus(interest) : principal),
    policyVersion: MSME_INTEREST_POLICY_VERSION,
    notice:
      'Reference arithmetic only. Eligibility, acceptance, agreed terms, bank-rate changes and monthly-rest treatment require reviewed records and the applicable MSMED process.',
  };
}

export const supportedCurrencyCodes = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AED', 'SGD', 'AUD'] as const;
export type SupportedCurrencyCode = (typeof supportedCurrencyCodes)[number];

export interface CurrencyInput {
  amount: string;
  fromCurrency: SupportedCurrencyCode;
  toCurrency: SupportedCurrencyCode;
  manualRate: string;
}

export interface CurrencyQuote {
  rate: string;
  quotedOn: string;
  source: 'ECB reference';
  rateType: 'reference';
  cacheState: 'not-cached';
  sourceUrl: string;
}

export interface CurrencyResult extends RegulatedResultBase {
  amount: string;
  fromCurrency: SupportedCurrencyCode;
  toCurrency: SupportedCurrencyCode;
  rate: string;
  convertedAmount: string;
  quoteSource: 'manual' | 'ECB reference';
  rateType: 'manual' | 'reference';
  cacheState: 'not-cached';
  quotedOn: string | null;
  sourceUrl: string | null;
  stale: boolean;
  fallback: boolean;
  notice: string;
}

export const currencyInputSchema = z.object({
  amount: decimalText('amount'),
  fromCurrency: z.enum(supportedCurrencyCodes),
  toCurrency: z.enum(supportedCurrencyCodes),
  manualRate: optionalText(40),
});

export function validateCurrencyInput(input: CurrencyInput) {
  return validate(currencyInputSchema, input);
}

export function calculateCurrencyConversion(
  input: CurrencyInput,
  quote?: CurrencyQuote,
  today = currentIsoDate(),
): CurrencyResult {
  const value = validated(currencyInputSchema, input);
  const amount = positive(value.amount, 'Amount');
  const policy = policyBase('currency', today);
  if (quote && !isApprovedOfficialPolicyUrl(quote.sourceUrl)) {
    throw new Error('The supplied quote source is not an approved official source.');
  }
  if (quote && !isIsoDate(quote.quotedOn)) {
    throw new Error('The supplied quote date is invalid.');
  }
  const rate = quote
    ? positive(quote.rate, 'Quoted rate')
    : value.fromCurrency === value.toCurrency
      ? new Decimal(1)
      : positive(value.manualRate, 'Manual rate');
  const quotedOn = quote?.quotedOn ?? null;
  const stale = quotedOn ? quotedOn > today || dateDifference(quotedOn, today) > 3 : false;
  return {
    ...policy,
    amount: decimalToString(amount),
    fromCurrency: value.fromCurrency,
    toCurrency: value.toCurrency,
    rate: decimalToString(rate),
    convertedAmount: decimalToString(amount.times(rate)),
    quoteSource: quote ? 'ECB reference' : 'manual',
    rateType: quote ? 'reference' : 'manual',
    cacheState: 'not-cached',
    quotedOn,
    sourceUrl: quote?.sourceUrl ?? null,
    stale,
    fallback: !quote && value.fromCurrency !== value.toCurrency,
    notice: stale
      ? 'The quote is stale; use it only as an illustration or enter a current manual rate.'
      : 'Reference or manual conversion only. Bank, card, remittance and settlement rates may differ.',
  };
}

export type RegulatedUtilityInput =
  HsnInput | GstDueDateInput | DepreciationInput | ProfessionalTaxInput | MsmeInterestInput | CurrencyInput;
