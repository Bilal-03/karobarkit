import { z } from 'zod';
import Decimal from 'decimal.js';

import { parseDecimal } from '@/domain/formatting/decimal';
import {
  getIncomeTaxSourceReferences,
  INCOME_TAX_POLICY_AS_OF,
  validateIncomeTaxSourceBundle,
} from '@/domain/policies/income-tax';
import {
  addIsoDays,
  compareIsoDates,
  daysBetweenIsoDates,
  isIsoDate,
} from '@/domain/policies/effective-dated';

import { CalculationInputError, type FieldError, type ValidationResult } from './types';

export const taxCalculatorKinds = [
  'income-tax',
  'tds',
  'corporate-tax',
  'presumptive-tax',
  'ctc',
  'in-hand-salary',
  'pf',
  'gratuity',
] as const;

export type TaxCalculatorKind = (typeof taxCalculatorKinds)[number];
export type TaxCalculatorInput = Record<string, string>;
export type TaxMetricFormat = 'currency' | 'percentage' | 'number' | 'text';
export type TaxFieldType = 'text' | 'select';

export interface TaxFieldOption {
  value: string;
  label: string;
}

export interface TaxFieldConfig {
  name: string;
  label: string;
  help: string;
  defaultValue: string;
  required?: boolean;
  type?: TaxFieldType;
  format?: 'money' | 'percentage' | 'number' | 'text';
  options?: TaxFieldOption[];
}

export interface TaxMetric {
  label: string;
  value: string;
  format: TaxMetricFormat;
}

export interface TaxPolicySnapshot {
  id: string;
  act: string;
  period: string;
  effectiveFrom: string;
  effectiveTo: string;
  lastVerifiedOn: string;
  reviewIntervalDays: number;
}

export interface TaxPolicyFreshness {
  isStale: boolean;
  reviewDueOn: string;
  daysUntilReview: number;
}

export interface TaxCalculationResult {
  kind: TaxCalculatorKind;
  headline: TaxMetric;
  tone: 'positive' | 'negative' | 'neutral';
  detail: string;
  details: TaxMetric[];
  exportRows: TaxMetric[];
  policy: TaxPolicySnapshot;
  policyFreshness: TaxPolicyFreshness;
  warnings: string[];
}

export const taxCalculatorInputSchema = z.record(z.string(), z.string());

const MAX_AMOUNT = new Decimal('999999999999999.99');
const INCOME_TAX_AY_POLICY: TaxPolicySnapshot = {
  id: 'it-individual-ay-2026-27-v1',
  act: 'Income Tax Act, 1961',
  period: 'AY 2026-27 · FY 2025-26',
  effectiveFrom: '2025-04-01',
  effectiveTo: '2026-03-31',
  lastVerifiedOn: INCOME_TAX_POLICY_AS_OF,
  reviewIntervalDays: 30,
};
const INCOME_TAX_TY_POLICY: TaxPolicySnapshot = {
  id: 'income-tax-act-2025-ty-2026-27-v1',
  act: 'Income Tax Act, 2025',
  period: 'Tax Year 2026-27 · FY 2026-27',
  effectiveFrom: '2026-04-01',
  effectiveTo: '2027-03-31',
  lastVerifiedOn: INCOME_TAX_POLICY_AS_OF,
  reviewIntervalDays: 30,
};
const TDS_OLD_POLICY: TaxPolicySnapshot = {
  id: 'it-tds-old-act-fy-2025-26-v1',
  act: 'Income Tax Act, 1961',
  period: 'FY 2025-26 · through 31 March 2026',
  effectiveFrom: '2025-04-01',
  effectiveTo: '2026-03-31',
  lastVerifiedOn: INCOME_TAX_POLICY_AS_OF,
  reviewIntervalDays: 30,
};
const TDS_NEW_POLICY: TaxPolicySnapshot = {
  id: 'it-tds-new-act-ty-2026-27-v1',
  act: 'Income Tax Act, 2025',
  period: 'Tax Year 2026-27 · from 1 April 2026',
  effectiveFrom: '2026-04-01',
  effectiveTo: '2027-03-31',
  lastVerifiedOn: INCOME_TAX_POLICY_AS_OF,
  reviewIntervalDays: 30,
};
const CORPORATE_POLICY: TaxPolicySnapshot = {
  id: 'it-domestic-company-ay-2026-27-v1',
  act: 'Income Tax Act, 1961',
  period: 'AY 2026-27 · FY 2025-26',
  effectiveFrom: '2025-04-01',
  effectiveTo: '2026-03-31',
  lastVerifiedOn: INCOME_TAX_POLICY_AS_OF,
  reviewIntervalDays: 30,
};
const PRESUMPTIVE_POLICY: TaxPolicySnapshot = {
  id: 'it-presumptive-ay-2026-27-v1',
  act: 'Income Tax Act, 1961',
  period: 'AY 2026-27 · FY 2025-26',
  effectiveFrom: '2025-04-01',
  effectiveTo: '2026-03-31',
  lastVerifiedOn: INCOME_TAX_POLICY_AS_OF,
  reviewIntervalDays: 30,
};
const PAYROLL_POLICY: TaxPolicySnapshot = {
  id: 'payroll-policy-2026-v1',
  act: 'EPF and Social Security policy snapshot',
  period: 'Verified 9 August 2026',
  effectiveFrom: '2025-11-21',
  effectiveTo: '2027-03-31',
  lastVerifiedOn: INCOME_TAX_POLICY_AS_OF,
  reviewIntervalDays: 90,
};

const TAX_SOURCE_IDS: Record<TaxCalculatorKind, string[]> = {
  'income-tax': ['it-individual-ay-2026-27', 'it-income-tax-calculator-2026'],
  tds: ['it-tds-transition-2026', 'it-tds-rates-ay-2026-27'],
  'corporate-tax': ['it-domestic-company-ay-2026-27'],
  'presumptive-tax': ['it-presumptive-ay-2026-27'],
  ctc: ['epfo-faq-2026', 'labour-codes-faq-2026'],
  'in-hand-salary': ['it-individual-ay-2026-27', 'it-tds-transition-2026', 'epfo-faq-2026'],
  pf: ['epfo-faq-2026'],
  gratuity: ['labour-codes-faq-2026'],
};

function currentIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function getTaxPolicyFreshness(
  policy: TaxPolicySnapshot,
  asOf = currentIsoDate(),
): TaxPolicyFreshness {
  const reviewDueOn = addIsoDays(policy.lastVerifiedOn, policy.reviewIntervalDays);
  return {
    isStale: !isIsoDate(asOf) || compareIsoDates(asOf, reviewDueOn) > 0,
    reviewDueOn,
    daysUntilReview: isIsoDate(asOf) ? daysBetweenIsoDates(asOf, reviewDueOn) : 0,
  };
}

const amountFields = (fields: Array<[string, string, string, string, boolean?]>) =>
  fields.map(([name, label, defaultValue, help, required]) => ({
    name,
    label,
    defaultValue,
    help,
    required: required ?? true,
    format: 'money' as const,
  }));

export const taxCalculatorFields: Record<TaxCalculatorKind, TaxFieldConfig[]> = {
  'income-tax': [
    {
      name: 'taxPeriod',
      label: 'Tax period',
      defaultValue: 'ay-2026-27',
      help: 'AY 2026-27 uses the Income Tax Act, 1961. Tax Year 2026-27 uses the Income Tax Act, 2025 from 1 April 2026.',
      type: 'select',
      options: [
        { value: 'ay-2026-27', label: 'AY 2026-27 · FY 2025-26' },
        { value: 'ty-2026-27', label: 'Tax Year 2026-27 · FY 2026-27' },
      ],
    },
    {
      name: 'taxRegime',
      label: 'Tax regime',
      defaultValue: 'new',
      help: 'Choose the regime supported by your records. The simplified estimate does not infer eligibility to opt out.',
      type: 'select',
      options: [
        { value: 'new', label: 'New regime' },
        { value: 'old', label: 'Old regime' },
      ],
    },
    {
      name: 'residentialStatus',
      label: 'Residential status',
      defaultValue: 'resident',
      help: 'The rebate is applied only for a resident individual in this estimate; non-resident special-rate cases are stopped.',
      type: 'select',
      options: [
        { value: 'resident', label: 'Resident individual' },
        { value: 'non-resident', label: 'Non-resident individual' },
      ],
    },
    {
      name: 'ageCategory',
      label: 'Age category',
      defaultValue: 'below-60',
      help: 'Age on the relevant previous-year dates changes old-regime slabs. New-regime slabs are the same in this supported scope.',
      type: 'select',
      options: [
        { value: 'below-60', label: 'Below 60' },
        { value: '60-79', label: '60 to 79' },
        { value: '80-plus', label: '80 or above' },
      ],
    },
    ...amountFields([
      [
        'salaryIncome',
        'Salary income after salary-record adjustments',
        '900000',
        'Enter salary income after any standard deduction or exemptions you have verified from salary records.',
      ],
      [
        'housePropertyIncome',
        'Income or loss from house property',
        '0',
        'Enter the supported net house-property amount. This version does not calculate interest or loss set-off rules.',
      ],
      [
        'otherIncome',
        'Other-source income',
        '0',
        'Enter interest and other-source income that is within the supported ordinary-income scope.',
      ],
      [
        'deductions',
        'Eligible deductions and exemptions',
        '0',
        'Enter only deductions permitted for the selected regime and supported by your records.',
      ],
      [
        'taxAlreadyPaid',
        'TDS / advance tax already paid',
        '0',
        'Optional credit shown against the estimate; it does not validate Form 26AS or AIS.',
        false,
      ],
    ]),
  ],
  tds: [
    {
      name: 'paymentDate',
      label: 'Payment date',
      defaultValue: '2026-08-09',
      help: 'The earlier of credit or payment determines whether the 1961 or 2025 Act section reference applies.',
    },
    {
      name: 'creditDate',
      label: 'Credit date',
      defaultValue: '2026-08-09',
      help: 'Enter the date the amount was credited. Leave equal to payment date when the same event occurred.',
    },
    {
      name: 'paymentType',
      label: 'Payment type',
      defaultValue: 'contractor',
      help: 'Only the listed common domestic payment categories are supported; property purchase, VDA, salary and non-resident remittances are excluded.',
      type: 'select',
      options: [
        { value: 'contractor', label: 'Contractor / sub-contractor' },
        { value: 'professional', label: 'Professional or technical service' },
        { value: 'rent-building', label: 'Rent of land, building or furniture' },
        { value: 'rent-plant', label: 'Rent of plant, machinery or equipment' },
        { value: 'commission', label: 'Commission or brokerage' },
      ],
    },
    {
      name: 'payeeType',
      label: 'Payee type',
      defaultValue: 'individual',
      help: 'Contractor rate differs for an individual/HUF payee versus other payees.',
      type: 'select',
      options: [
        { value: 'individual', label: 'Individual or HUF' },
        { value: 'other', label: 'Company, firm or other' },
      ],
    },
    {
      name: 'payeeResidency',
      label: 'Payee residency',
      defaultValue: 'resident',
      help: 'Non-resident payments are governed by different provisions and are stopped in this focused TDS guide.',
      type: 'select',
      options: [
        { value: 'resident', label: 'Resident payee' },
        { value: 'non-resident', label: 'Non-resident payee' },
      ],
    },
    {
      name: 'panStatus',
      label: 'PAN status',
      defaultValue: 'available',
      help: 'A missing PAN can trigger the higher statutory rate; the tool does not verify PAN validity.',
      type: 'select',
      options: [
        { value: 'available', label: 'PAN available' },
        { value: 'not-available', label: 'PAN not available' },
      ],
    },
    ...amountFields([
      ['paymentAmount', 'Current payment or credit amount', '100000', 'Amount on which tax may be deducted.'],
      [
        'cumulativeAmount',
        'Cumulative amount for this payee in the relevant year',
        '100000',
        'Use the total paid or credited so far to test the supported threshold.',
      ],
    ]),
  ],
  'corporate-tax': [
    {
      name: 'taxPeriod',
      label: 'Tax period',
      defaultValue: 'ay-2026-27',
      help: 'This release supports the AY 2026-27 domestic-company policy snapshot only.',
      type: 'select',
      options: [{ value: 'ay-2026-27', label: 'AY 2026-27 · FY 2025-26' }],
    },
    {
      name: 'regime',
      label: 'Domestic-company regime',
      defaultValue: 'normal-25',
      help: 'Select a regime already confirmed for the company. This tool does not decide eligibility for a concessional section.',
      type: 'select',
      options: [
        { value: 'normal-25', label: 'Normal rate · turnover condition met (25%)' },
        { value: 'normal-30', label: 'Normal rate · other domestic company (30%)' },
        { value: '115baa', label: 'Section 115BAA · 22%' },
        { value: '115bab-business', label: 'Section 115BAB · business income (15%)' },
        { value: '115bab-other', label: 'Section 115BAB · other income (22%)' },
      ],
    },
    ...amountFields([
      [
        'taxableIncome',
        'Taxable income',
        '5000000',
        'Enter taxable income after company-specific deductions and adjustments verified from records.',
      ],
      [
        'bookProfit',
        'Book profit for MAT warning',
        '5000000',
        'Enter book profit used for the MAT comparison; this version does not validate Schedule MAT.',
        false,
      ],
    ]),
  ],
  'presumptive-tax': [
    {
      name: 'assessmentYear',
      label: 'Assessment year',
      defaultValue: 'ay-2026-27',
      help: 'This release supports the AY 2026-27 presumptive-policy snapshot only.',
      type: 'select',
      options: [{ value: 'ay-2026-27', label: 'AY 2026-27 · FY 2025-26' }],
    },
    {
      name: 'scheme',
      label: 'Presumptive scheme',
      defaultValue: '44ad',
      help: 'Choose only a scheme whose eligibility facts you have confirmed.',
      type: 'select',
      options: [
        { value: '44ad', label: 'Section 44AD · eligible business' },
        { value: '44ada', label: 'Section 44ADA · specified profession' },
        { value: '44ae', label: 'Section 44AE · goods carriage' },
      ],
    },
    {
      name: 'entityType',
      label: 'Entity type',
      defaultValue: 'individual',
      help: 'Eligibility differs by scheme; companies, LLPs and non-residents are stopped in this version.',
      type: 'select',
      options: [
        { value: 'individual', label: 'Resident individual' },
        { value: 'huf', label: 'Resident HUF' },
        { value: 'partnership-firm', label: 'Resident partnership firm' },
        { value: 'company', label: 'Company or LLP' },
      ],
    },
    {
      name: 'activity',
      label: 'Activity type',
      defaultValue: 'business',
      help: 'Specified professions, commission/brokerage and agency businesses are not eligible for 44AD in this tool.',
      type: 'select',
      options: [
        { value: 'business', label: 'Eligible business' },
        { value: 'specified-profession', label: 'Specified profession' },
        { value: 'commission', label: 'Commission or brokerage' },
        { value: 'goods-carriage', label: 'Goods carriage' },
      ],
    },
    {
      name: 'resident',
      label: 'Resident for the relevant period',
      defaultValue: 'yes',
      help: 'The supported presumptive provisions require the specified resident status.',
      type: 'select',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    },
    ...amountFields([
      [
        'turnover',
        'Annual gross receipts / turnover',
        '1000000',
        'Enter gross receipts for the relevant previous year.',
      ],
      [
        'cashReceiptPercent',
        'Cash receipt percentage',
        '0',
        'Enter the percentage of receipts received in cash; the threshold changes at 5%.',
      ],
      [
        'vehicleCount',
        'Number of goods carriages',
        '1',
        'Used only for section 44AE; maximum ten vehicles is supported.',
        false,
      ],
      [
        'vehicleMonths',
        'Vehicle-months per carriage',
        '12',
        'Use the months each vehicle was owned or hired during the year for section 44AE.',
        false,
      ],
    ]),
    {
      name: 'vehicleType',
      label: 'Goods-carriage type',
      defaultValue: 'non-heavy',
      help: 'This release supports the ₹7,500 vehicle-month rule for non-heavy goods carriages only.',
      type: 'select',
      options: [
        { value: 'non-heavy', label: 'Non-heavy goods carriage' },
        { value: 'heavy', label: 'Heavy goods carriage · unsupported here' },
      ],
    },
  ],
  ctc: [
    {
      name: 'policyDate',
      label: 'Payroll policy date',
      defaultValue: '2026-08-09',
      help: 'Use a date covered by the reviewed payroll policy snapshot; this is not a payslip date.',
    },
    ...amountFields([
      ['basicAnnual', 'Annual basic pay', '600000', 'Employer-entered annual basic pay.'],
      [
        'dearnessAllowanceAnnual',
        'Annual dearness allowance',
        '0',
        'Employer-entered DA, if applicable.',
        false,
      ],
      ['hraAnnual', 'Annual HRA', '180000', 'Employer-entered HRA component.', false],
      ['otherAllowancesAnnual', 'Other annual allowances', '120000', 'Employer-entered allowances.', false],
      [
        'bonusAnnual',
        'Annual bonus or variable pay',
        '60000',
        'Employer policy assumption; not guaranteed.',
        false,
      ],
      [
        'employerPfAnnual',
        'Employer PF contribution',
        '72000',
        'Employer-entered or PF-linked contribution.',
        false,
      ],
      [
        'gratuityProvisionAnnual',
        'Gratuity provision',
        '28846',
        'Employer policy provision, not a cash payment in the month.',
        false,
      ],
      ['insuranceAnnual', 'Employer insurance and benefits', '24000', 'Employer policy assumption.', false],
      ['otherBenefitsAnnual', 'Other employer benefits', '0', 'Employer policy assumption.', false],
    ]),
  ],
  'in-hand-salary': [
    {
      name: 'taxPeriod',
      label: 'Tax period for estimated TDS',
      defaultValue: 'ay-2026-27',
      help: 'The tax period chooses the Act and slab snapshot for the estimated TDS only.',
      type: 'select',
      options: [
        { value: 'ay-2026-27', label: 'AY 2026-27 · FY 2025-26' },
        { value: 'ty-2026-27', label: 'Tax Year 2026-27 · FY 2026-27' },
      ],
    },
    {
      name: 'taxRegime',
      label: 'Tax regime',
      defaultValue: 'new',
      help: 'Use the regime selected in the employee declaration; this is an estimate, not payroll filing.',
      type: 'select',
      options: [
        { value: 'new', label: 'New regime' },
        { value: 'old', label: 'Old regime' },
      ],
    },
    {
      name: 'state',
      label: 'Work state',
      defaultValue: 'user-entered',
      help: 'Professional-tax slabs vary by state and employer setup, so the amount remains user-entered.',
      type: 'select',
      options: [{ value: 'user-entered', label: 'State selected; enter professional tax below' }],
    },
    ...amountFields([
      [
        'grossAnnualEarnings',
        'Annual gross earnings',
        '960000',
        'Salary and taxable earnings before employee deductions.',
      ],
      [
        'annualExemptions',
        'Annual salary exemptions',
        '0',
        'Enter verified exemptions such as eligible HRA, if applicable.',
        false,
      ],
      [
        'annualDeductions',
        'Annual tax deductions',
        '0',
        'Enter deductions permitted for the selected regime.',
        false,
      ],
      ['employeePfAnnual', 'Employee PF deduction', '72000', 'Employee-side PF deducted from pay.', false],
      [
        'professionalTaxAnnual',
        'Professional tax',
        '2400',
        'Enter the applicable state/employer amount.',
        false,
      ],
      [
        'otherDeductionsAnnual',
        'Other employee deductions',
        '0',
        'Other payroll deductions, excluding TDS.',
        false,
      ],
    ]),
  ],
  pf: [
    {
      name: 'policyDate',
      label: 'Payroll policy date',
      defaultValue: '2026-08-09',
      help: 'Use a date covered by the reviewed EPFO snapshot.',
    },
    ...amountFields([
      [
        'monthlyBasicDa',
        'Monthly basic + DA wage',
        '50000',
        'EPF wage basis before applying the statutory ceiling or higher-wage choice.',
      ],
      [
        'wageCeiling',
        'Statutory wage ceiling',
        '15000',
        'Current EPFO ceiling used for the default statutory scenario.',
      ],
      ['employeeRate', 'Employee EPF rate (%)', '12', 'EPFO FAQ default contribution rate.', false],
      ['employerRate', 'Employer total PF rate (%)', '12', 'Employer EPF plus EPS contribution rate.', false],
      [
        'epsRate',
        'EPS share (%)',
        '8.33',
        'EPS share of employer contribution when the employee is eligible.',
        false,
      ],
      ['edliRate', 'EDLI rate (%)', '0.5', 'Employer EDLI estimate.', false],
      [
        'adminCharge',
        'EPF administration charge',
        '0',
        'Enter an employee-attributed share if you need it; establishment minimums are not allocated automatically.',
        false,
      ],
    ]),
    {
      name: 'membership',
      label: 'EPF membership',
      defaultValue: 'member',
      help: 'Employees cannot simply opt out when the establishment and membership rules apply; this selector records the user-confirmed status.',
      type: 'select',
      options: [
        { value: 'member', label: 'EPF member' },
        { value: 'excluded', label: 'Excluded / establishment exception' },
      ],
    },
    {
      name: 'higherWageOption',
      label: 'Contribution on higher wages',
      defaultValue: 'no',
      help: 'Choose yes only when the required joint request or employer policy is confirmed.',
      type: 'select',
      options: [
        { value: 'no', label: 'No · apply statutory ceiling' },
        { value: 'yes', label: 'Yes · use full wage' },
      ],
    },
    {
      name: 'epsEligible',
      label: 'EPS eligible',
      defaultValue: 'yes',
      help: 'New employees above the ceiling may be excluded from EPS; confirm this from EPFO records.',
      type: 'select',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    },
  ],
  gratuity: [
    {
      name: 'policyDate',
      label: 'Labour-policy date',
      defaultValue: '2026-08-09',
      help: 'Use a date covered by the reviewed gratuity policy snapshot.',
    },
    {
      name: 'employmentType',
      label: 'Employment type',
      defaultValue: 'regular',
      help: 'This version supports regular and fixed-term employees. Seasonal and piece-rated methods need separate wage rules.',
      type: 'select',
      options: [
        { value: 'regular', label: 'Regular employee' },
        { value: 'fixed-term', label: 'Fixed-term employee' },
        { value: 'seasonal', label: 'Seasonal employee' },
        { value: 'piece-rated', label: 'Piece-rated employee' },
      ],
    },
    {
      name: 'event',
      label: 'Exit or gratuity event',
      defaultValue: 'resignation',
      help: 'Death, disablement and fixed-term expiry have different qualifying-service rules.',
      type: 'select',
      options: [
        { value: 'resignation', label: 'Resignation' },
        { value: 'retirement', label: 'Retirement / superannuation' },
        { value: 'termination', label: 'Termination' },
        { value: 'death', label: 'Death' },
        { value: 'disablement', label: 'Disablement' },
        { value: 'fixed-term-expiry', label: 'Fixed-term contract expiry' },
      ],
    },
    ...amountFields([
      [
        'completedYears',
        'Completed years of service',
        '5',
        'Whole completed years before the additional months.',
      ],
      [
        'additionalMonths',
        'Additional months of service',
        '0',
        'For regular employees, more than six months counts as one additional year.',
        false,
      ],
      [
        'lastDrawnWages',
        'Last-drawn monthly wages',
        '50000',
        'Use the applicable wage definition from your records, not necessarily gross salary.',
      ],
      [
        'gratuityCap',
        'Applicable gratuity cap',
        '2000000',
        'Enter the cap applicable to the relevant law/policy snapshot; verify amendments before relying on it.',
      ],
    ]),
  ],
};

function parseMoney(
  value: string,
  field: string,
  errors: FieldError[],
  options: { required?: boolean } = {},
) {
  if (value.trim() === '' && options.required === false) return new Decimal(0);
  try {
    const parsed = parseDecimal(value);
    if (parsed.isNegative())
      errors.push({ field, code: 'must_be_non_negative', message: `${field} cannot be negative.` });
    if (parsed.decimalPlaces() > 2)
      errors.push({
        field,
        code: 'unsafe_precision',
        message: `${field} can have at most two decimal places.`,
      });
    if (parsed.gt(MAX_AMOUNT))
      errors.push({ field, code: 'too_large', message: `${field} is above the supported limit.` });
    return parsed;
  } catch (error) {
    errors.push({
      field,
      code: 'invalid_number',
      message: error instanceof Error ? error.message : `Enter a valid ${field}.`,
    });
    return new Decimal(0);
  }
}

function parseRate(value: string, field: string, errors: FieldError[]) {
  const parsed = parseMoney(value, field, errors);
  if (parsed.gt(100))
    errors.push({ field, code: 'rate_out_of_range', message: `${field} must be between 0% and 100%.` });
  return parsed;
}

function parseInteger(value: string, field: string, errors: FieldError[], min = 0, max = 1000000) {
  const parsed = parseMoney(value, field, errors);
  if (!parsed.isInteger() || parsed.lt(min) || parsed.gt(max)) {
    errors.push({
      field,
      code: 'whole_number_required',
      message: `${field} must be a whole number between ${min} and ${max}.`,
    });
  }
  return parsed;
}

function parseDate(value: string, field: string, errors: FieldError[]) {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/u.test(value) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    errors.push({ field, code: 'invalid_date', message: `Enter a valid ${field}.` });
    return undefined;
  }
  return value;
}

function mapZodIssues(issues: z.ZodIssue[]): FieldError[] {
  return issues.map((issue) => ({
    field: String(issue.path[0] ?? 'form'),
    code: 'invalid_input',
    message: issue.message,
  }));
}

function normalizedInput(input: TaxCalculatorInput) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, String(value ?? '').trim()]));
}

export function validateTaxCalculatorInput(
  kind: TaxCalculatorKind,
  input: TaxCalculatorInput,
): ValidationResult<TaxCalculatorInput> {
  const parsed = taxCalculatorInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, errors: mapZodIssues(parsed.error.issues) };
  const value = normalizedInput(parsed.data);
  const errors: FieldError[] = [];
  const requireField = (field: string, message = `Enter ${field}.`) => {
    if (!value[field]) errors.push({ field, code: 'required', message });
  };
  const commonMoney = (fields: string[]) =>
    fields.forEach((field) => parseMoney(value[field] ?? '', field, errors));

  if (kind === 'income-tax') {
    requireField('taxPeriod', 'Choose a tax period.');
    requireField('taxRegime', 'Choose a tax regime.');
    requireField('residentialStatus', 'Choose a residential status.');
    requireField('ageCategory', 'Choose an age category.');
    commonMoney(['salaryIncome', 'housePropertyIncome', 'otherIncome', 'deductions', 'taxAlreadyPaid']);
    if (value.taxPeriod === 'ty-2026-27' && value.taxRegime === 'old') {
      errors.push({
        field: 'taxRegime',
        code: 'unsupported_regime_period',
        message: 'The Tax Year 2026-27 path in this release supports the new Act/new regime only.',
      });
    }
    if (value.residentialStatus === 'non-resident') {
      errors.push({
        field: 'residentialStatus',
        code: 'unsupported_residency',
        message: 'Non-resident special-rate and treaty cases are outside this estimate.',
      });
    }
  } else if (kind === 'tds') {
    for (const field of ['paymentDate', 'creditDate']) requireField(field);
    const paymentDate = parseDate(value.paymentDate ?? '', 'payment date', errors);
    const creditDate = parseDate(value.creditDate ?? '', 'credit date', errors);
    if (paymentDate && creditDate) {
      const triggerDate = paymentDate < creditDate ? paymentDate : creditDate;
      if (triggerDate < '2025-04-01' || triggerDate > '2027-03-31') {
        errors.push({
          field: 'paymentDate',
          code: 'policy_unavailable',
          message: 'The TDS policy snapshot covers triggers from 1 April 2025 through 31 March 2027.',
        });
      }
    }
    requireField('paymentType', 'Choose a payment type.');
    requireField('payeeType', 'Choose a payee type.');
    requireField('payeeResidency', 'Choose payee residency.');
    requireField('panStatus', 'Choose PAN status.');
    commonMoney(['paymentAmount', 'cumulativeAmount']);
    if (value.payeeResidency === 'non-resident')
      errors.push({
        field: 'payeeResidency',
        code: 'unsupported_residency',
        message: 'Non-resident remittances require a separate section 195 / treaty workflow.',
      });
  } else if (kind === 'corporate-tax') {
    requireField('taxPeriod', 'Choose a tax period.');
    if (value.taxPeriod !== 'ay-2026-27')
      errors.push({
        field: 'taxPeriod',
        code: 'unsupported_period',
        message: 'Only the AY 2026-27 domestic-company policy snapshot is available in this release.',
      });
    requireField('regime', 'Choose a company tax regime.');
    commonMoney(['taxableIncome', 'bookProfit']);
  } else if (kind === 'presumptive-tax') {
    requireField('assessmentYear', 'Choose an assessment year.');
    if (value.assessmentYear !== 'ay-2026-27')
      errors.push({
        field: 'assessmentYear',
        code: 'unsupported_period',
        message: 'Only the AY 2026-27 presumptive-policy snapshot is available in this release.',
      });
    requireField('scheme', 'Choose a presumptive scheme.');
    requireField('entityType', 'Choose an entity type.');
    requireField('activity', 'Choose an activity type.');
    requireField('resident', 'Choose resident status.');
    commonMoney(['turnover', 'vehicleCount', 'vehicleMonths']);
    const vehicleCount = parseInteger(value.vehicleCount ?? '', 'vehicleCount', errors, 0, 10);
    parseInteger(value.vehicleMonths ?? '', 'vehicleMonths', errors, 0, 12);
    const turnover = parseMoney(value.turnover ?? '', 'turnover', errors);
    const cashPercent = parseRate(value.cashReceiptPercent ?? '', 'cashReceiptPercent', errors);
    if (value.resident !== 'yes') {
      errors.push({
        field: 'resident',
        code: 'unsupported_residency',
        message: 'The supported presumptive paths require resident status.',
      });
    }
    if (value.scheme === '44ad') {
      if (!['individual', 'huf', 'partnership-firm'].includes(value.entityType ?? '')) {
        errors.push({
          field: 'entityType',
          code: 'ineligible_entity',
          message: '44AD is limited to the supported individual, HUF or partnership-firm choices.',
        });
      }
      if (value.activity !== 'business') {
        errors.push({
          field: 'activity',
          code: 'ineligible_activity',
          message:
            'Specified professions, commission/brokerage and goods-carriage activities are not supported under this 44AD path.',
        });
      }
      const limit = cashPercent.lte(5) ? new Decimal('30000000') : new Decimal('20000000');
      if (turnover.gt(limit))
        errors.push({
          field: 'turnover',
          code: 'threshold_exceeded',
          message: `44AD receipts exceed the supported threshold of ₹${limit.toFixed(0)} for this cash-receipt share.`,
        });
    } else if (value.scheme === '44ada') {
      if (!['individual', 'partnership-firm'].includes(value.entityType ?? ''))
        errors.push({
          field: 'entityType',
          code: 'ineligible_entity',
          message: '44ADA is limited to the supported resident individual or partnership-firm choices.',
        });
      if (value.activity !== 'specified-profession')
        errors.push({
          field: 'activity',
          code: 'ineligible_activity',
          message: '44ADA requires a specified profession in the supported path.',
        });
      const limit = cashPercent.lte(5) ? new Decimal('7500000') : new Decimal('5000000');
      if (turnover.gt(limit))
        errors.push({
          field: 'turnover',
          code: 'threshold_exceeded',
          message: `44ADA receipts exceed the supported threshold of ₹${limit.toFixed(0)} for this cash-receipt share.`,
        });
    } else {
      if (value.activity !== 'goods-carriage')
        errors.push({
          field: 'activity',
          code: 'ineligible_activity',
          message: '44AE requires the goods-carriage activity selection.',
        });
      if (vehicleCount.lte(0))
        errors.push({
          field: 'vehicleCount',
          code: 'required',
          message: 'Enter at least one goods carriage for 44AE.',
        });
      if (value.vehicleType !== 'non-heavy')
        errors.push({
          field: 'vehicleType',
          code: 'unsupported_vehicle_type',
          message: 'Heavy goods-carriage calculations are outside this 44AE scope.',
        });
    }
  } else if (kind === 'ctc') {
    const policyDate = parseDate(value.policyDate ?? '', 'payroll policy date', errors);
    if (policyDate && (policyDate < '2025-11-21' || policyDate > '2027-03-31'))
      errors.push({
        field: 'policyDate',
        code: 'policy_unavailable',
        message: 'The payroll policy snapshot covers dates from 21 November 2025 through 31 March 2027.',
      });
    commonMoney([
      'basicAnnual',
      'dearnessAllowanceAnnual',
      'hraAnnual',
      'otherAllowancesAnnual',
      'bonusAnnual',
      'employerPfAnnual',
      'gratuityProvisionAnnual',
      'insuranceAnnual',
      'otherBenefitsAnnual',
    ]);
  } else if (kind === 'in-hand-salary') {
    requireField('taxPeriod', 'Choose a tax period.');
    requireField('taxRegime', 'Choose a tax regime.');
    requireField('state', 'Choose a work state.');
    commonMoney([
      'grossAnnualEarnings',
      'annualExemptions',
      'annualDeductions',
      'employeePfAnnual',
      'professionalTaxAnnual',
      'otherDeductionsAnnual',
    ]);
    if (value.taxPeriod === 'ty-2026-27' && value.taxRegime === 'old')
      errors.push({
        field: 'taxRegime',
        code: 'unsupported_regime_period',
        message: 'The Tax Year 2026-27 payroll estimate supports the new Act/new regime only.',
      });
  } else if (kind === 'pf') {
    const policyDate = parseDate(value.policyDate ?? '', 'payroll policy date', errors);
    if (policyDate && (policyDate < '2025-11-21' || policyDate > '2027-03-31'))
      errors.push({
        field: 'policyDate',
        code: 'policy_unavailable',
        message: 'The EPFO policy snapshot covers dates from 21 November 2025 through 31 March 2027.',
      });
    commonMoney([
      'monthlyBasicDa',
      'wageCeiling',
      'employeeRate',
      'employerRate',
      'epsRate',
      'edliRate',
      'adminCharge',
    ]);
    parseRate(value.employeeRate ?? '', 'employeeRate', errors);
    parseRate(value.employerRate ?? '', 'employerRate', errors);
    parseRate(value.epsRate ?? '', 'epsRate', errors);
    parseRate(value.edliRate ?? '', 'edliRate', errors);
    requireField('membership', 'Choose EPF membership.');
    requireField('higherWageOption', 'Choose the wage-basis option.');
    requireField('epsEligible', 'Choose EPS eligibility.');
  } else if (kind === 'gratuity') {
    const policyDate = parseDate(value.policyDate ?? '', 'labour-policy date', errors);
    if (policyDate && (policyDate < '2025-11-21' || policyDate > '2027-03-31'))
      errors.push({
        field: 'policyDate',
        code: 'policy_unavailable',
        message: 'The gratuity policy snapshot covers dates from 21 November 2025 through 31 March 2027.',
      });
    requireField('employmentType', 'Choose employment type.');
    requireField('event', 'Choose the gratuity event.');
    commonMoney(['completedYears', 'additionalMonths', 'lastDrawnWages', 'gratuityCap']);
    parseInteger(value.completedYears ?? '', 'completedYears', errors, 0, 80);
    parseInteger(value.additionalMonths ?? '', 'additionalMonths', errors, 0, 11);
    if (value.employmentType === 'seasonal' || value.employmentType === 'piece-rated')
      errors.push({
        field: 'employmentType',
        code: 'unsupported_employment_type',
        message:
          'Seasonal and piece-rated gratuity methods require separate wage calculations and are not included.',
      });
  }

  return errors.length ? { success: false, errors } : { success: true, data: value };
}

function moneyMetric(label: string, value: Decimal): TaxMetric {
  return { label, value: value.toFixed(2), format: 'currency' };
}

function percentMetric(label: string, value: Decimal): TaxMetric {
  return { label, value: value.toFixed(2), format: 'percentage' };
}

function result(
  kind: TaxCalculatorKind,
  policy: TaxPolicySnapshot,
  headline: TaxMetric,
  detail: string,
  details: TaxMetric[],
  warnings: string[] = [],
  tone: TaxCalculationResult['tone'] = 'neutral',
): TaxCalculationResult {
  return {
    kind,
    headline,
    tone,
    detail,
    details,
    exportRows: [headline, ...details],
    policy,
    policyFreshness: getTaxPolicyFreshness(policy),
    warnings,
  };
}

function taxBySlabs(income: Decimal, regime: string, ageCategory: string) {
  const brackets =
    regime === 'new'
      ? [
          ['400000', '0'],
          ['800000', '5'],
          ['1200000', '10'],
          ['1600000', '15'],
          ['2000000', '20'],
          ['2400000', '25'],
        ]
      : ageCategory === '80-plus'
        ? [
            ['500000', '0'],
            ['1000000', '20'],
          ]
        : ageCategory === '60-79'
          ? [
              ['300000', '0'],
              ['500000', '5'],
              ['1000000', '20'],
            ]
          : [
              ['250000', '0'],
              ['500000', '5'],
              ['1000000', '20'],
            ];
  let previous = new Decimal(0);
  let tax = new Decimal(0);
  for (const [upper, rate] of brackets) {
    const upperValue = new Decimal(upper);
    const taxable = Decimal.min(Decimal.max(income.minus(previous), 0), upperValue.minus(previous));
    tax = tax.plus(taxable.times(rate).div(100));
    previous = upperValue;
    if (income.lte(upperValue)) return tax;
  }
  const lastRate = regime === 'new' ? '30' : '30';
  return tax.plus(income.minus(previous).times(lastRate).div(100));
}

function surchargeRate(income: Decimal, regime: string) {
  if (income.lte(5000000)) return new Decimal(0);
  if (income.lte(10000000)) return new Decimal(10);
  if (income.lte(20000000)) return new Decimal(15);
  return regime === 'old' && income.gt(50000000) ? new Decimal(37) : new Decimal(25);
}

function calculateIndividualTax(value: TaxCalculatorInput) {
  const policy = value.taxPeriod === 'ty-2026-27' ? INCOME_TAX_TY_POLICY : INCOME_TAX_AY_POLICY;
  const salary = parseDecimal(value.salaryIncome ?? '0');
  const houseProperty = parseDecimal(value.housePropertyIncome ?? '0');
  const other = parseDecimal(value.otherIncome ?? '0');
  const deductions = parseDecimal(value.deductions ?? '0');
  const taxableIncome = Decimal.max(salary.plus(houseProperty).plus(other).minus(deductions), 0);
  const taxBeforeRebate = taxBySlabs(
    taxableIncome,
    value.taxRegime ?? 'new',
    value.ageCategory ?? 'below-60',
  );
  const resident = value.residentialStatus === 'resident';
  const rebateLimit = value.taxRegime === 'new' ? new Decimal('1200000') : new Decimal('500000');
  const rebateCap = value.taxRegime === 'new' ? new Decimal('60000') : new Decimal('12500');
  const rebate =
    resident && taxableIncome.lte(rebateLimit) ? Decimal.min(taxBeforeRebate, rebateCap) : new Decimal(0);
  const taxAfterRebate = taxBeforeRebate.minus(rebate);
  const surchargePercent = surchargeRate(taxableIncome, value.taxRegime ?? 'new');
  const surcharge = taxAfterRebate.times(surchargePercent).div(100);
  const cess = taxAfterRebate.plus(surcharge).times('4').div(100);
  const grossTax = taxAfterRebate.plus(surcharge).plus(cess);
  const paid = parseDecimal(value.taxAlreadyPaid ?? '0');
  return {
    policy,
    taxableIncome,
    taxBeforeRebate,
    rebate,
    surchargePercent,
    surcharge,
    cess,
    grossTax,
    paid,
    net: grossTax.minus(paid),
  };
}

function calculateIncomeTax(value: TaxCalculatorInput) {
  const computed = calculateIndividualTax(value);
  const warnings = [
    'This is a simplified ordinary-income estimate. Capital gains, business income, special-rate income, loss set-off, marginal relief and filing validation are excluded.',
    'Deductions and salary adjustments are user-entered; verify them against the applicable Act, Form 16 and return validation rules.',
  ];
  return result(
    'income-tax',
    computed.policy,
    moneyMetric('Estimated total tax', computed.grossTax),
    'Estimated income tax after the selected slab, rebate, surcharge and 4% health and education cess.',
    [
      moneyMetric('Taxable income', computed.taxableIncome),
      moneyMetric('Tax before rebate', computed.taxBeforeRebate),
      moneyMetric('Section 87A rebate', computed.rebate),
      percentMetric('Surcharge rate', computed.surchargePercent),
      moneyMetric('Surcharge', computed.surcharge),
      moneyMetric('Health and education cess', computed.cess),
      moneyMetric('Tax already paid', computed.paid),
      moneyMetric('Estimated balance after credit', computed.net),
    ],
    warnings,
    computed.grossTax.isZero() ? 'positive' : 'neutral',
  );
}

const tdsRules: Record<
  string,
  { threshold: Decimal; singleThreshold?: Decimal; rate: Decimal; alternateRate?: Decimal; label: string }
> = {
  contractor: {
    threshold: new Decimal('100000'),
    singleThreshold: new Decimal('30000'),
    rate: new Decimal('1'),
    alternateRate: new Decimal('2'),
    label: 'Contractor / sub-contractor',
  },
  professional: {
    threshold: new Decimal('50000'),
    rate: new Decimal('10'),
    label: 'Professional or technical service',
  },
  'rent-building': {
    threshold: new Decimal('240000'),
    rate: new Decimal('10'),
    label: 'Rent of land, building or furniture',
  },
  'rent-plant': {
    threshold: new Decimal('240000'),
    rate: new Decimal('2'),
    label: 'Rent of plant, machinery or equipment',
  },
  commission: { threshold: new Decimal('20000'), rate: new Decimal('2'), label: 'Commission or brokerage' },
};

function calculateTds(value: TaxCalculatorInput) {
  const triggerDate =
    (value.paymentDate ?? '') < (value.creditDate ?? '') ? value.paymentDate! : value.creditDate!;
  const isNewAct = triggerDate >= '2026-04-01';
  const policy = isNewAct ? TDS_NEW_POLICY : TDS_OLD_POLICY;
  const rule = tdsRules[value.paymentType ?? 'contractor'] ?? tdsRules.contractor!;
  const amount = parseDecimal(value.paymentAmount ?? '0');
  const cumulative = parseDecimal(value.cumulativeAmount ?? '0');
  const thresholdMet =
    cumulative.gt(rule.threshold) || Boolean(rule.singleThreshold && amount.gt(rule.singleThreshold));
  const baseRate =
    value.paymentType === 'contractor' && value.payeeType === 'other' ? rule.alternateRate! : rule.rate;
  const rate = value.panStatus === 'not-available' ? Decimal.max(baseRate, 20) : baseRate;
  const tds = thresholdMet ? amount.times(rate).div(100) : new Decimal(0);
  const section = isNewAct
    ? 'Section 393 table reference under the Income Tax Act, 2025'
    : value.paymentType === 'contractor'
      ? 'Section 194C'
      : value.paymentType === 'professional'
        ? 'Section 194J'
        : value.paymentType === 'commission'
          ? 'Section 194H'
          : value.paymentType === 'rent-building'
            ? 'Section 194-I'
            : 'Section 194-I';
  return result(
    'tds',
    policy,
    moneyMetric('Estimated TDS', tds),
    `Estimated withholding for ${rule.label}. The trigger is the earlier of the credit or payment date.`,
    [
      moneyMetric('Current payment or credit', amount),
      moneyMetric('Cumulative amount', cumulative),
      moneyMetric('Annual threshold used', rule.threshold),
      ...(rule.singleThreshold ? [moneyMetric('Single-payment threshold', rule.singleThreshold)] : []),
      percentMetric('Applicable rate', rate),
      { label: 'Act / section reference', value: `${policy.act} · ${section}`, format: 'text' },
    ],
    [
      'Rates and thresholds are limited to the listed domestic categories. The tool does not create a TDS return, challan, certificate or PAN validation.',
      ...(value.panStatus === 'not-available'
        ? ['The 20% higher-rate rule is an estimate; verify exceptions and documentation.']
        : []),
    ],
    tds.isZero() ? 'neutral' : 'negative',
  );
}

function calculateCorporateTax(value: TaxCalculatorInput) {
  const policy = CORPORATE_POLICY;
  const income = parseDecimal(value.taxableIncome ?? '0');
  const bookProfit = parseDecimal(value.bookProfit ?? '0');
  const rate =
    value.regime === 'normal-30'
      ? new Decimal(30)
      : value.regime === 'normal-25'
        ? new Decimal(25)
        : value.regime === '115baa'
          ? new Decimal(22)
          : new Decimal(value.regime === '115bab-business' ? 15 : 22);
  const base = income.times(rate).div(100);
  const surchargePercent = income.lte(10000000)
    ? new Decimal(0)
    : income.lte(100000000)
      ? new Decimal(7)
      : new Decimal(12);
  const surcharge = base.times(surchargePercent).div(100);
  const cess = base.plus(surcharge).times(4).div(100);
  const normalTax = base.plus(surcharge).plus(cess);
  const specialRegime = value.regime === '115baa' || value.regime?.startsWith('115bab');
  const mat = specialRegime ? new Decimal(0) : bookProfit.times(15).div(100);
  const tax = Decimal.max(normalTax, mat.plus(mat.times(surchargePercent).div(100)).times(1.04));
  return result(
    'corporate-tax',
    policy,
    moneyMetric('Estimated corporate tax', tax),
    'Scenario estimate using the selected domestic-company rate, surcharge, 4% cess and MAT comparison where applicable.',
    [
      moneyMetric('Taxable income', income),
      percentMetric('Base tax rate', rate),
      moneyMetric('Base tax', base),
      percentMetric('Surcharge rate', surchargePercent),
      moneyMetric('Surcharge', surcharge),
      moneyMetric('Health and education cess', cess),
      moneyMetric('MAT comparison amount', mat),
    ],
    [
      'The tool does not determine eligibility for sections 115BAA/115BAB, turnover conditions, deductions, book-profit adjustments, marginal relief or filing position.',
      ...(specialRegime
        ? [
            'MAT is not applied for the selected 115BAA/115BAB scenario according to the cited company guidance.',
          ]
        : ['MAT comparison is illustrative and does not validate book-profit schedules.']),
    ],
    tax.isZero() ? 'neutral' : 'negative',
  );
}

function calculatePresumptiveTax(value: TaxCalculatorInput) {
  const policy = PRESUMPTIVE_POLICY;
  const scheme = value.scheme ?? '44ad';
  const turnover = parseDecimal(value.turnover ?? '0');
  const cashPercent = parseDecimal(value.cashReceiptPercent ?? '0');
  const cashReceipts = turnover.times(cashPercent).div(100);
  const digitalReceipts = turnover.minus(cashReceipts);
  let income = new Decimal(0);
  let detail = '';
  if (scheme === '44ad') {
    income = digitalReceipts.times(6).div(100).plus(cashReceipts.times(8).div(100));
    detail =
      'Estimated presumptive income under section 44AD: 6% of eligible non-cash receipts and 8% of other receipts.';
  } else if (scheme === '44ada') {
    income = turnover.times(50).div(100);
    detail = 'Estimated presumptive income under section 44ADA at 50% of gross receipts.';
  } else {
    const vehicles = parseDecimal(value.vehicleCount ?? '0');
    const months = parseDecimal(value.vehicleMonths ?? '0');
    income = vehicles.times(months).times(7500);
    detail =
      'Estimated presumptive income under section 44AE at ₹7,500 per vehicle-month for the supported non-heavy-vehicle case.';
  }
  const warnings = [
    'This is an eligibility-screened estimate, not a return or audit result. Confirm activity, entity, receipt mode, books and thresholds with a tax professional.',
  ];
  if (scheme === '44ad' && (value.entityType === 'company' || value.activity !== 'business'))
    warnings.push(
      'The selected entity/activity combination is outside the supported 44AD path; review the validation message before relying on this output.',
    );
  if (scheme === '44ada' && value.activity !== 'specified-profession')
    warnings.push('44ADA applies only to specified professions in the supported scope.');
  return result(
    'presumptive-tax',
    policy,
    moneyMetric('Estimated presumptive income', income),
    detail,
    [
      moneyMetric('Gross receipts / turnover', turnover),
      percentMetric('Cash receipts', cashPercent),
      moneyMetric('Non-cash receipts', digitalReceipts),
      moneyMetric('Cash receipts', cashReceipts),
    ],
    warnings,
    income.isZero() ? 'neutral' : 'positive',
  );
}

function calculateCtc(value: TaxCalculatorInput) {
  const fields = [
    'basicAnnual',
    'dearnessAllowanceAnnual',
    'hraAnnual',
    'otherAllowancesAnnual',
    'bonusAnnual',
    'employerPfAnnual',
    'gratuityProvisionAnnual',
    'insuranceAnnual',
    'otherBenefitsAnnual',
  ];
  const annual = fields.reduce(
    (total, field) => total.plus(parseDecimal(value[field] ?? '0')),
    new Decimal(0),
  );
  const fixed = ['basicAnnual', 'dearnessAllowanceAnnual', 'hraAnnual', 'otherAllowancesAnnual'].reduce(
    (total, field) => total.plus(parseDecimal(value[field] ?? '0')),
    new Decimal(0),
  );
  return result(
    'ctc',
    PAYROLL_POLICY,
    moneyMetric('Annual CTC', annual),
    'Configurable employer-cost view. Components are employer policy inputs, not a universal legal salary structure.',
    [
      moneyMetric('Monthly CTC', annual.div(12)),
      moneyMetric('Annual fixed earnings', fixed),
      moneyMetric('Annual variable pay', parseDecimal(value.bonusAnnual ?? '0')),
      moneyMetric('Employer statutory contributions', parseDecimal(value.employerPfAnnual ?? '0')),
      moneyMetric('Gratuity provision', parseDecimal(value.gratuityProvisionAnnual ?? '0')),
    ],
    [
      'Employer benefits, bonus, gratuity provision and contribution policies vary. This does not determine tax, payroll compliance or employment rights.',
    ],
    'positive',
  );
}

function calculateInHandSalary(value: TaxCalculatorInput) {
  const gross = parseDecimal(value.grossAnnualEarnings ?? '0');
  const exemptions = parseDecimal(value.annualExemptions ?? '0');
  const deductions = parseDecimal(value.annualDeductions ?? '0');
  const taxEstimate = calculateIndividualTax({
    taxPeriod: value.taxPeriod,
    taxRegime: value.taxRegime,
    residentialStatus: 'resident',
    ageCategory: 'below-60',
    salaryIncome: gross.minus(exemptions).toFixed(2),
    housePropertyIncome: '0',
    otherIncome: '0',
    deductions: deductions.toFixed(2),
    taxAlreadyPaid: '0',
  });
  const pf = parseDecimal(value.employeePfAnnual ?? '0');
  const professionalTax = parseDecimal(value.professionalTaxAnnual ?? '0');
  const otherDeductions = parseDecimal(value.otherDeductionsAnnual ?? '0');
  const annualTakeHome = gross
    .minus(pf)
    .minus(professionalTax)
    .minus(otherDeductions)
    .minus(taxEstimate.grossTax);
  return result(
    'in-hand-salary',
    taxEstimate.policy,
    moneyMetric('Estimated annual in-hand salary', annualTakeHome),
    'Estimated take-home after declared PF, professional tax, other deductions and an ordinary-income TDS estimate.',
    [
      moneyMetric('Monthly in-hand estimate', annualTakeHome.div(12)),
      moneyMetric('Gross annual earnings', gross),
      moneyMetric('Estimated TDS', taxEstimate.grossTax),
      moneyMetric('Employee PF', pf),
      moneyMetric('Professional tax', professionalTax),
      moneyMetric('Other deductions', otherDeductions),
    ],
    [
      'State professional tax is user-entered. Bonus timing, payroll calendars, surcharge relief, exemptions and employer-specific deductions can change take-home pay.',
    ],
    annualTakeHome.gte(0) ? 'positive' : 'negative',
  );
}

function calculatePf(value: TaxCalculatorInput) {
  const wage = parseDecimal(value.monthlyBasicDa ?? '0');
  const ceiling = parseDecimal(value.wageCeiling ?? '15000');
  const higher = value.higherWageOption === 'yes';
  const membership = value.membership === 'member';
  const epfWage = membership ? (higher ? wage : Decimal.min(wage, ceiling)) : new Decimal(0);
  const employeeRate = parseDecimal(value.employeeRate ?? '12');
  const employerRate = parseDecimal(value.employerRate ?? '12');
  const epsRate = parseDecimal(value.epsRate ?? '8.33');
  const edliRate = parseDecimal(value.edliRate ?? '0.5');
  const employee = epfWage.times(employeeRate).div(100);
  const employerTotal = epfWage.times(employerRate).div(100);
  const epsWage = value.epsEligible === 'yes' ? Decimal.min(epfWage, ceiling) : new Decimal(0);
  const eps = epsWage.times(epsRate).div(100);
  const employerEpf = Decimal.max(employerTotal.minus(eps), 0);
  const edli = epfWage.times(edliRate).div(100);
  const admin = parseDecimal(value.adminCharge ?? '0');
  return result(
    'pf',
    PAYROLL_POLICY,
    moneyMetric('Employee monthly EPF', employee),
    'Monthly EPF/EPS/EDLI estimate using the selected wage basis and establishment assumptions.',
    [
      moneyMetric('EPF wage used', epfWage),
      moneyMetric('Employer total PF', employerTotal),
      moneyMetric('Employer EPF share', employerEpf),
      moneyMetric('EPS share', eps),
      moneyMetric('EDLI estimate', edli),
      moneyMetric('Administration charge entered', admin),
    ],
    [
      'EPFO membership, higher-wage options, EPS eligibility, rounding and establishment-level minimum administrative charges require record-level confirmation.',
    ],
    'neutral',
  );
}

function calculateGratuity(value: TaxCalculatorInput) {
  const years = parseDecimal(value.completedYears ?? '0');
  const months = parseDecimal(value.additionalMonths ?? '0');
  const wages = parseDecimal(value.lastDrawnWages ?? '0');
  const cap = parseDecimal(value.gratuityCap ?? '0');
  const fixedTerm = value.employmentType === 'fixed-term' || value.event === 'fixed-term-expiry';
  const deathOrDisablement = value.event === 'death' || value.event === 'disablement';
  const serviceMonths = years.times(12).plus(months);
  const qualifyingYears = fixedTerm ? serviceMonths.div(12) : years.plus(months.gt(6) ? 1 : 0);
  const eligible = fixedTerm ? serviceMonths.gte(12) : deathOrDisablement || qualifyingYears.gte(5);
  const gross = eligible ? wages.times(15).div(26).times(qualifyingYears) : new Decimal(0);
  const payable = Decimal.min(gross, cap);
  return result(
    'gratuity',
    PAYROLL_POLICY,
    moneyMetric('Estimated gratuity', payable),
    eligible
      ? 'Estimated gratuity using 15 days of last-drawn wages for each qualifying year or pro-rata fixed-term service.'
      : 'The selected event and service period do not meet the supported qualifying-service gate.',
    [
      moneyMetric('Last-drawn wages', wages),
      moneyMetric('Qualifying service years', qualifyingYears),
      moneyMetric('Gross formula amount', gross),
      moneyMetric('Applicable cap', cap),
    ],
    [
      'Verify wage components, continuous service, employment terms, better contractual benefits and the current statutory cap before relying on this result.',
    ],
    eligible ? 'positive' : 'neutral',
  );
}

export function calculateTax(kind: TaxCalculatorKind, input: TaxCalculatorInput): TaxCalculationResult {
  const validation = validateTaxCalculatorInput(kind, input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new CalculationInputError(
      first?.field ?? 'form',
      first?.code ?? 'invalid_input',
      first?.message ?? 'Check the highlighted fields.',
    );
  }
  const sourceIds = TAX_SOURCE_IDS[kind];
  const sourceErrors = validateIncomeTaxSourceBundle(sourceIds, getIncomeTaxSourceReferences(sourceIds));
  if (sourceErrors.length > 0) {
    throw new CalculationInputError(
      'form',
      'policy_sources_unavailable',
      'The reviewed official source bundle is unavailable. This calculator is disabled until the source metadata is corrected.',
    );
  }
  const calculated = (() => {
    switch (kind) {
      case 'income-tax':
        return calculateIncomeTax(validation.data);
      case 'tds':
        return calculateTds(validation.data);
      case 'corporate-tax':
        return calculateCorporateTax(validation.data);
      case 'presumptive-tax':
        return calculatePresumptiveTax(validation.data);
      case 'ctc':
        return calculateCtc(validation.data);
      case 'in-hand-salary':
        return calculateInHandSalary(validation.data);
      case 'pf':
        return calculatePf(validation.data);
      case 'gratuity':
        return calculateGratuity(validation.data);
    }
  })();
  if (calculated.policyFreshness.isStale) {
    throw new CalculationInputError(
      'form',
      'policy_stale',
      `The policy review is due (${calculated.policyFreshness.reviewDueOn}). This calculator is disabled until the official source bundle is re-verified.`,
    );
  }
  return calculated;
}

export function getTaxSourceReferences(kind: TaxCalculatorKind) {
  return getIncomeTaxSourceReferences(TAX_SOURCE_IDS[kind]);
}
