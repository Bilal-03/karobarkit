import { z } from 'zod';

import { parseDecimal } from '@/domain/formatting/decimal';
import {
  getHraPolicy,
  getHraPolicyFreshness,
  HRA_POLICY_ASSESSMENT_YEAR,
  type HraPolicyVersion,
} from '@/domain/policies/income-tax';

import { CalculationInputError, type FieldError, type ValidationResult } from './types';

export const hraTaxRegimes = ['old', 'new'] as const;
export const hraCityTypes = ['mumbai', 'kolkata', 'delhi', 'chennai', 'other'] as const;
export const hraAccommodationStatuses = ['rented', 'owned-or-no-rent'] as const;
export const hraPeriodPatterns = ['stable', 'changed'] as const;

export type HraTaxRegime = (typeof hraTaxRegimes)[number];
export type HraCityType = (typeof hraCityTypes)[number];
export type HraAccommodationStatus = (typeof hraAccommodationStatuses)[number];
export type HraPeriodPattern = (typeof hraPeriodPatterns)[number];

export interface HraCalculatorInput {
  assessmentYear: string;
  taxRegime: HraTaxRegime;
  cityType: HraCityType;
  accommodationStatus: HraAccommodationStatus;
  periodPattern: HraPeriodPattern;
  basicSalary: string;
  dearnessAllowance: string;
  turnoverBasedCommission: string;
  hraReceived: string;
  rentPaid: string;
}

export interface HraMetric {
  label: string;
  value: string;
  format: 'currency' | 'percentage' | 'text';
}

export interface HraCalculationResult {
  policy: HraPolicyVersion;
  policyFreshness: ReturnType<typeof getHraPolicyFreshness>;
  headline: HraMetric;
  tone: 'positive' | 'neutral';
  detail: string;
  details: HraMetric[];
  exportRows: HraMetric[];
  status: 'eligible-rule' | 'not-available-under-regime';
}

export interface HraFieldConfig {
  name: keyof HraCalculatorInput;
  label: string;
  help: string;
  defaultValue: string;
  type?: 'text' | 'select';
  options?: Array<{ value: string; label: string }>;
}

const MAX_ANNUAL_AMOUNT = '999999999999999.99';
const amountSchema = (label: string) =>
  z.string().trim().min(1, `Enter ${label.toLowerCase()}.`).max(40, `${label} is too large.`);

export const hraCalculatorInputSchema = z.object({
  assessmentYear: z.string().trim().min(1, 'Choose an assessment year.'),
  taxRegime: z.enum(hraTaxRegimes),
  cityType: z.enum(hraCityTypes),
  accommodationStatus: z.enum(hraAccommodationStatuses),
  periodPattern: z.enum(hraPeriodPatterns),
  basicSalary: amountSchema('annual basic salary'),
  dearnessAllowance: amountSchema('annual dearness allowance'),
  turnoverBasedCommission: amountSchema('annual turnover-based commission'),
  hraReceived: amountSchema('annual HRA received'),
  rentPaid: amountSchema('annual rent paid'),
});

export const hraCalculatorFields: HraFieldConfig[] = [
  {
    name: 'assessmentYear',
    label: 'Assessment year',
    help: 'This first controlled policy bundle supports AY 2026-27 (financial year 2025-26).',
    defaultValue: HRA_POLICY_ASSESSMENT_YEAR,
    type: 'select',
    options: [{ value: HRA_POLICY_ASSESSMENT_YEAR, label: 'AY 2026-27 · FY 2025-26' }],
  },
  {
    name: 'taxRegime',
    label: 'Tax regime',
    help: 'HRA exemption under section 10(13A) is available under the old regime, not the new regime.',
    defaultValue: 'old',
    type: 'select',
    options: [
      { value: 'old', label: 'Old tax regime' },
      { value: 'new', label: 'New tax regime' },
    ],
  },
  {
    name: 'cityType',
    label: 'City category',
    help: 'The 50% cap is limited to Mumbai, Kolkata, Delhi and Chennai under Rule 2A; all other locations use 40%.',
    defaultValue: 'other',
    type: 'select',
    options: [
      { value: 'mumbai', label: 'Mumbai · 50% salary cap' },
      { value: 'kolkata', label: 'Kolkata · 50% salary cap' },
      { value: 'delhi', label: 'Delhi · 50% salary cap' },
      { value: 'chennai', label: 'Chennai · 50% salary cap' },
      { value: 'other', label: 'Other location · 40% salary cap' },
    ],
  },
  {
    name: 'accommodationStatus',
    label: 'Accommodation status',
    help: 'Use rented accommodation only when rent was actually paid for the relevant HRA period; own-house/no-rent cases are not eligible for this illustration.',
    defaultValue: 'rented',
    type: 'select',
    options: [
      { value: 'rented', label: 'Rented accommodation' },
      { value: 'owned-or-no-rent', label: 'Own house or no rent paid' },
    ],
  },
  {
    name: 'periodPattern',
    label: 'Salary, rent and city pattern',
    help: 'This version supports one stable fact pattern for the relevant occupation period. Calculate each changed period separately.',
    defaultValue: 'stable',
    type: 'select',
    options: [
      { value: 'stable', label: 'Same facts for the whole period' },
      { value: 'changed', label: 'Facts changed during the year' },
    ],
  },
  {
    name: 'basicSalary',
    label: 'Annual basic salary',
    help: 'Use the annual basic salary amount relevant to the HRA period.',
    defaultValue: '600000',
  },
  {
    name: 'dearnessAllowance',
    label: 'Annual eligible DA',
    help: 'Include only dearness allowance that forms part of salary for this rule; otherwise enter 0.',
    defaultValue: '0',
  },
  {
    name: 'turnoverBasedCommission',
    label: 'Annual turnover-based commission',
    help: 'Enter commission calculated as a fixed percentage of turnover when it forms part of salary for the HRA rule; otherwise enter 0.',
    defaultValue: '0',
  },
  {
    name: 'hraReceived',
    label: 'Annual HRA received',
    help: 'HRA credited or received for the same period, as declared in your salary records.',
    defaultValue: '180000',
  },
  {
    name: 'rentPaid',
    label: 'Annual rent paid',
    help: 'Rent actually paid for the accommodation during the same period.',
    defaultValue: '180000',
  },
];

export const hraCalculatorDefaultValues: HraCalculatorInput = Object.fromEntries(
  hraCalculatorFields.map((field) => [field.name, field.defaultValue]),
) as unknown as HraCalculatorInput;

function mapZodIssues(issues: z.ZodIssue[]): FieldError[] {
  return issues.map((issue) => ({
    field: String(issue.path[0] ?? 'form'),
    code: 'invalid_input',
    message: issue.message,
  }));
}

function addAmountIssue(
  errors: FieldError[],
  value: string,
  field: keyof HraCalculatorInput,
  label: string,
  options: { positive?: boolean },
) {
  try {
    const parsed = parseDecimal(value);
    if (parsed.decimalPlaces() > 2)
      errors.push({
        field,
        code: 'unsafe_precision',
        message: `${label} can have at most two decimal places.`,
      });
    if (parsed.isNegative())
      errors.push({ field, code: 'must_be_non_negative', message: `${label} cannot be negative.` });
    if (options.positive && parsed.lte(0))
      errors.push({ field, code: 'must_be_positive', message: `${label} must be greater than zero.` });
    if (parsed.gt(parseDecimal(MAX_ANNUAL_AMOUNT)))
      errors.push({ field, code: 'too_large', message: `${label} is above the supported annual limit.` });
    return parsed;
  } catch (error) {
    errors.push({
      field,
      code: 'invalid_number',
      message: error instanceof Error ? error.message : `Enter a valid ${label.toLowerCase()}.`,
    });
    return null;
  }
}

export function validateHraCalculatorInput(input: HraCalculatorInput): ValidationResult<HraCalculatorInput> {
  const parsed = hraCalculatorInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, errors: mapZodIssues(parsed.error.issues) };
  const normalized = Object.fromEntries(
    Object.entries(parsed.data).map(([key, value]) => [key, value.trim()]),
  ) as unknown as HraCalculatorInput;
  const errors: FieldError[] = [];
  if (!getHraPolicy(normalized.assessmentYear)) {
    errors.push({
      field: 'assessmentYear',
      code: 'policy_unavailable',
      message: 'No reviewed HRA policy is available for that assessment year.',
    });
  }
  if (normalized.accommodationStatus !== 'rented') {
    errors.push({
      field: 'accommodationStatus',
      code: 'unsupported_eligibility',
      message: 'HRA exemption is not illustrated for own-house or no-rent cases.',
    });
  }
  if (normalized.periodPattern !== 'stable') {
    errors.push({
      field: 'periodPattern',
      code: 'unsupported_period_pattern',
      message:
        'This version supports one stable salary, rent and city pattern; calculate each changed period separately.',
    });
  }
  addAmountIssue(errors, normalized.basicSalary, 'basicSalary', 'Annual basic salary', { positive: true });
  addAmountIssue(errors, normalized.dearnessAllowance, 'dearnessAllowance', 'Annual eligible DA', {});
  addAmountIssue(
    errors,
    normalized.turnoverBasedCommission,
    'turnoverBasedCommission',
    'Annual turnover-based commission',
    {},
  );
  addAmountIssue(errors, normalized.hraReceived, 'hraReceived', 'Annual HRA received', {});
  addAmountIssue(errors, normalized.rentPaid, 'rentPaid', 'Annual rent paid', {});
  return errors.length ? { success: false, errors } : { success: true, data: normalized };
}

function currency(value: string): HraMetric {
  return { label: '', value, format: 'currency' };
}

export function calculateHra(input: HraCalculatorInput): HraCalculationResult {
  const validation = validateHraCalculatorInput(input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new CalculationInputError(
      first?.field ?? 'form',
      first?.code ?? 'invalid_input',
      first?.message ?? 'Check the highlighted HRA fields.',
    );
  }
  const value = validation.data;
  const policy = getHraPolicy(value.assessmentYear);
  if (!policy)
    throw new CalculationInputError(
      'assessmentYear',
      'policy_unavailable',
      'No reviewed HRA policy covers this assessment year.',
    );

  const basic = parseDecimal(value.basicSalary);
  const da = parseDecimal(value.dearnessAllowance);
  const turnoverBasedCommission = parseDecimal(value.turnoverBasedCommission);
  const hra = parseDecimal(value.hraReceived);
  const rent = parseDecimal(value.rentPaid);
  const salaryBase = basic.plus(da).plus(turnoverBasedCommission);
  const rentLessTenPercent = rent.minus(salaryBase.times(parseDecimal(policy.rentReductionPercent).div(100)));
  const rentCondition = maxZero(rentLessTenPercent);
  const salaryCapPercent = ['mumbai', 'kolkata', 'delhi', 'chennai'].includes(value.cityType)
    ? policy.metroSalaryPercent
    : policy.nonMetroSalaryPercent;
  const salaryCap = salaryBase.times(parseDecimal(salaryCapPercent).div(100));
  const exemption = value.taxRegime === 'old' ? minDecimal(hra, rentCondition, salaryCap) : parseDecimal('0');
  const taxableHra = hra.minus(exemption);
  const status = value.taxRegime === 'old' ? 'eligible-rule' : 'not-available-under-regime';
  const detail =
    value.taxRegime === 'old'
      ? 'This is the lowest-of-three HRA exemption illustration under the selected assessment-year policy.'
      : 'HRA exemption under section 10(13A) is not available in the new tax regime; this view reports no exemption under that rule.';
  const details = [
    { ...currency(salaryBase.toFixed(2)), label: 'Basic salary + eligible DA + turnover commission' },
    { ...currency(hra.toFixed(2)), label: 'Actual HRA received' },
    { ...currency(rentCondition.toFixed(2)), label: 'Rent paid − 10% of salary' },
    {
      ...currency(salaryCap.toFixed(2)),
      label: `${salaryCapPercent}% of salary (${['mumbai', 'kolkata', 'delhi', 'chennai'].includes(value.cityType) ? value.cityType : 'other location'})`,
    },
    { ...currency(taxableHra.toFixed(2)), label: 'HRA not exempt under this view' },
  ];
  const exportRows = [{ ...currency(exemption.toFixed(2)), label: 'Estimated HRA exemption' }, ...details];
  return {
    policy,
    policyFreshness: getHraPolicyFreshness(),
    headline: { label: 'Estimated HRA exemption', value: exemption.toFixed(2), format: 'currency' },
    tone: exemption.gt(0) ? 'positive' : 'neutral',
    detail,
    details,
    exportRows,
    status,
  };
}

function maxZero(value: ReturnType<typeof parseDecimal>) {
  return value.gt(0) ? value : parseDecimal('0');
}

function minDecimal(...values: Array<ReturnType<typeof parseDecimal>>) {
  return values.reduce((minimum, value) => (value.lt(minimum) ? value : minimum), values[0]!);
}
