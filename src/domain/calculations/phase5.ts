import { z } from 'zod';
import Decimal from 'decimal.js';

import {
  getMarketplacePolicy,
  getMarketplacePolicyFreshness,
  getMarketplacePriceBand,
  MARKETPLACE_POLICY_AS_OF,
  type MarketplaceKind,
  type MarketplacePolicyFreshness,
} from '@/domain/policies/marketplace-fees';
import { decimalToString, parseDecimal } from '@/domain/formatting/decimal';

import { CalculationInputError, type FieldError, type ValidationResult } from './types';

export const phase5CalculatorKinds = [
  'cac',
  'ltv',
  'saas-metrics',
  'valuation',
  'equity-dilution',
  'esop',
  'amazon-fees',
  'flipkart-fees',
] as const;

export type Phase5CalculatorKind = (typeof phase5CalculatorKinds)[number];
export type Phase5CalculatorInput = Record<string, string>;
export type Phase5MetricFormat = 'currency' | 'percentage' | 'number' | 'multiple' | 'text';
export type Phase5FieldType = 'number' | 'select' | 'text' | 'date';

export interface Phase5FieldOption {
  value: string;
  label: string;
}

export interface Phase5FieldConfig {
  name: string;
  label: string;
  help: string;
  defaultValue: string;
  required?: boolean;
  allowNegative?: boolean;
  type?: Phase5FieldType;
  format?: 'money' | 'percentage' | 'number' | 'text';
  options?: Phase5FieldOption[];
}

export interface Phase5Metric {
  label: string;
  value: string;
  format: Phase5MetricFormat;
}

export interface Phase5PolicySnapshot {
  id: string;
  effectiveFrom: string;
  effectiveTo?: string;
  lastVerifiedOn: string;
  sourceIds: string[];
}

export interface Phase5CalculationResult {
  kind: Phase5CalculatorKind;
  headline: Phase5Metric;
  tone: 'positive' | 'negative' | 'neutral';
  detail: string;
  details: Phase5Metric[];
  exportRows: Phase5Metric[];
  warnings: string[];
  policy?: Phase5PolicySnapshot;
  policyFreshness?: MarketplacePolicyFreshness;
}

export const phase5CalculatorInputSchema = z.record(z.string(), z.string());

const MAX_VALUE = new Decimal('999999999999999.99');

const select = (value: string, label: string, options: Phase5FieldOption[]) => ({
  name: value,
  label,
  help: '',
  defaultValue: options[0]?.value ?? '',
  type: 'select' as const,
  options,
});

const amazonCategoryOptions: Phase5FieldOption[] = [
  { value: 'sandals', label: 'Sandals (official Easy Ship examples)' },
  { value: 'apparel-shorts', label: 'Apparel — shorts (official FC example)' },
  { value: 'apparel-shirts', label: 'Apparel — shirts (official Self-Ship example)' },
  { value: 'beverages', label: 'Beverages (official FC example)' },
  { value: 'facewash', label: 'Facewash (official Self-Ship example)' },
  { value: 'other', label: 'Other category — enter current closing fee override' },
];

const flipkartCategoryOptions: Phase5FieldOption[] = [
  { value: 'general', label: 'Category from seller dashboard' },
  { value: 'fashion', label: 'Fashion (dashboard commission required)' },
  { value: 'home', label: 'Home and kitchen (dashboard commission required)' },
  { value: 'electronics', label: 'Electronics (dashboard commission required)' },
  { value: 'books', label: 'Books (dashboard commission required)' },
];

export const phase5CalculatorFields: Record<Phase5CalculatorKind, Phase5FieldConfig[]> = {
  cac: [
    {
      name: 'salesMarketingCost',
      label: 'Sales and marketing cost',
      help: 'Include only the costs you want attributed to this acquisition window.',
      defaultValue: '100000',
      format: 'money',
    },
    {
      name: 'attributionWindowMonths',
      label: 'Attribution window in months',
      help: 'Use the same time window for costs and customer counts.',
      defaultValue: '3',
      format: 'number',
    },
    {
      name: 'newCustomers',
      label: 'New customers in the window',
      help: 'Blended CAC uses all new customers attributed to the window.',
      defaultValue: '20',
      format: 'number',
    },
    {
      name: 'paidNewCustomers',
      label: 'Paid-channel new customers (optional)',
      help: 'Optional denominator for a paid-only CAC view. Leave at zero when unavailable.',
      defaultValue: '15',
      required: false,
      format: 'number',
    },
    {
      name: 'paidAcquisitionCost',
      label: 'Paid-channel acquisition cost (optional)',
      help: 'Use only spend attributed to the paid channels represented by paid customers; leave blank when there are no paid customers.',
      defaultValue: '60000',
      required: false,
      format: 'money',
    },
  ],
  ltv: [
    {
      name: 'arpuMonthly',
      label: 'Monthly ARPU',
      help: 'Average recurring revenue per customer for the declared period.',
      defaultValue: '2000',
      format: 'money',
    },
    {
      name: 'grossMarginPercent',
      label: 'Gross margin',
      help: 'Use the margin after direct delivery costs, expressed as a percentage.',
      defaultValue: '70',
      format: 'percentage',
    },
    {
      name: 'monthlyChurnPercent',
      label: 'Base monthly customer churn',
      help: 'The simple scenario uses monthly churn as a decimal denominator.',
      defaultValue: '5',
      format: 'percentage',
    },
    {
      name: 'churnLowPercent',
      label: 'Low churn scenario',
      help: 'Lower churn produces the upper end of the scenario range.',
      defaultValue: '3',
      format: 'percentage',
    },
    {
      name: 'churnHighPercent',
      label: 'High churn scenario',
      help: 'Higher churn produces the lower end of the scenario range.',
      defaultValue: '8',
      format: 'percentage',
    },
    {
      name: 'churnStability',
      label: 'Churn stability',
      help: 'Unstable churn keeps the output explicitly scenario-only.',
      defaultValue: 'stable',
      type: 'select',
      options: [
        { value: 'stable', label: 'Stable enough for an illustration' },
        { value: 'unstable', label: 'Unstable or still changing' },
      ],
    },
  ],
  'saas-metrics': [
    {
      name: 'periodMonths',
      label: 'Measurement period in months',
      help: 'Every metric is interpreted over this declared period.',
      defaultValue: '1',
      format: 'number',
    },
    {
      name: 'mrr',
      label: 'Current MRR',
      help: 'Monthly recurring revenue at the end of the measurement period.',
      defaultValue: '500000',
      format: 'money',
    },
    {
      name: 'priorMrr',
      label: 'Prior-period MRR',
      help: 'MRR at the comparable starting point.',
      defaultValue: '450000',
      format: 'money',
    },
    {
      name: 'newMrr',
      label: 'New MRR',
      help: 'MRR from new customers during the period; shown for reconciliation.',
      defaultValue: '70000',
      format: 'money',
    },
    {
      name: 'expansionMrr',
      label: 'Expansion MRR',
      help: 'Upsell or expansion MRR from existing customers.',
      defaultValue: '20000',
      format: 'money',
    },
    {
      name: 'contractionMrr',
      label: 'Contraction MRR',
      help: 'Downgrade MRR from existing customers.',
      defaultValue: '5000',
      format: 'money',
    },
    {
      name: 'churnedMrr',
      label: 'Churned MRR',
      help: 'MRR lost from customers who churned.',
      defaultValue: '35000',
      format: 'money',
    },
    {
      name: 'customers',
      label: 'Current customers',
      help: 'Customers at the end of the period.',
      defaultValue: '250',
      format: 'number',
    },
    {
      name: 'priorCustomers',
      label: 'Prior-period customers',
      help: 'Customers at the comparable starting point.',
      defaultValue: '230',
      format: 'number',
    },
    {
      name: 'newCustomers',
      label: 'New customers',
      help: 'New customers acquired during the period.',
      defaultValue: '30',
      format: 'number',
    },
    {
      name: 'churnedCustomers',
      label: 'Churned customers',
      help: 'Customers lost during the period.',
      defaultValue: '10',
      format: 'number',
    },
    {
      name: 'salesMarketingCost',
      label: 'Sales and marketing cost',
      help: 'Cost attributed to the same measurement period for CAC payback.',
      defaultValue: '90000',
      format: 'money',
    },
    {
      name: 'grossMarginPercent',
      label: 'Gross margin',
      help: 'Gross margin used for contribution and CAC-payback illustrations.',
      defaultValue: '70',
      format: 'percentage',
    },
    {
      name: 'profitMarginPercent',
      label: 'Operating or profit margin',
      help: 'User-entered margin used only in the Rule of 40 illustration.',
      defaultValue: '10',
      allowNegative: true,
      format: 'percentage',
    },
  ],
  valuation: [
    {
      name: 'annualRevenue',
      label: 'Annual revenue',
      help: 'Revenue base for a user-selected multiple scenario.',
      defaultValue: '6000000',
      format: 'money',
    },
    {
      name: 'revenueMultipleLow',
      label: 'Low revenue multiple',
      help: 'Lower scenario multiple; not a market recommendation.',
      defaultValue: '3',
      format: 'number',
    },
    {
      name: 'revenueMultipleHigh',
      label: 'High revenue multiple',
      help: 'Upper scenario multiple; not a registered valuation.',
      defaultValue: '5',
      format: 'number',
    },
    {
      name: 'preMoneyValuation',
      label: 'Declared pre-money valuation',
      help: 'Used only for the funding ownership illustration.',
      defaultValue: '24000000',
      format: 'money',
    },
    {
      name: 'investmentAmount',
      label: 'New investment amount',
      help: 'Amount used to show post-money and investor ownership.',
      defaultValue: '6000000',
      format: 'money',
    },
  ],
  'equity-dilution': [
    {
      name: 'preMoneyValuation',
      label: 'Pre-money valuation',
      help: 'Declared scenario value before the new investment.',
      defaultValue: '24000000',
      format: 'money',
    },
    {
      name: 'investmentAmount',
      label: 'New investment amount',
      help: 'New investor capital in the scenario.',
      defaultValue: '6000000',
      format: 'money',
    },
    {
      name: 'founderOwnershipPercent',
      label: 'Founder ownership before investment',
      help: 'Existing cap-table share. Existing holder percentages must total 100%.',
      defaultValue: '80',
      format: 'percentage',
    },
    {
      name: 'existingInvestorOwnershipPercent',
      label: 'Existing investor ownership before investment',
      help: 'Existing investor share before this financing.',
      defaultValue: '15',
      format: 'percentage',
    },
    {
      name: 'otherOwnershipPercent',
      label: 'Other holder ownership before investment',
      help: 'Employees or other existing holders, if any.',
      defaultValue: '5',
      format: 'percentage',
    },
    {
      name: 'postMoneyOptionPoolPercent',
      label: 'Target option pool after investment',
      help: 'The model treats this as a post-money pool and dilutes existing holders pro rata.',
      defaultValue: '10',
      format: 'percentage',
    },
  ],
  esop: [
    {
      name: 'fullyDilutedSharesBefore',
      label: 'Fully diluted shares before grant',
      help: 'Use the company’s declared fully diluted share count for this illustration.',
      defaultValue: '1000000',
      format: 'number',
    },
    {
      name: 'grantShares',
      label: 'ESOP grant shares',
      help: 'Shares or options in the proposed grant.',
      defaultValue: '10000',
      format: 'number',
    },
    {
      name: 'vestedPercent',
      label: 'Vested percentage',
      help: 'Use the vesting percentage you want to illustrate.',
      defaultValue: '25',
      format: 'percentage',
    },
    {
      name: 'exercisedShares',
      label: 'Exercised / allotted shares (optional)',
      help: 'Enter the shares actually exercised or allotted for the tax event; this is not assumed to equal all vested shares.',
      defaultValue: '',
      required: false,
      format: 'number',
    },
    {
      name: 'exerciseDate',
      label: 'Exercise / allotment date (optional)',
      help: 'Use the date tied to the FMV supplied below when illustrating a tax event.',
      defaultValue: '',
      required: false,
      type: 'date',
      format: 'text',
    },
    {
      name: 'exercisePrice',
      label: 'Exercise price per share',
      help: 'Price the employee pays per share under the plan terms.',
      defaultValue: '10',
      format: 'money',
    },
    {
      name: 'fairMarketValue',
      label: 'Illustrative fair market value per share',
      help: 'Enter a value from the relevant plan or valuation advice; the tool does not determine FMV.',
      defaultValue: '50',
      format: 'money',
    },
    {
      name: 'salePrice',
      label: 'Illustrative sale price per share (optional)',
      help: 'Leave blank when you only want the grant and exercise view.',
      defaultValue: '',
      required: false,
      format: 'money',
    },
    {
      name: 'taxTreatment',
      label: 'Tax display',
      help: 'Any tax amount is only an arithmetic illustration using your supplied rate.',
      defaultValue: 'no-tax-estimate',
      type: 'select',
      options: [
        { value: 'no-tax-estimate', label: 'Do not estimate tax' },
        { value: 'illustrative', label: 'Show illustrative rate-based tax' },
      ],
    },
    {
      name: 'illustrativeTaxRatePercent',
      label: 'Illustrative tax rate (optional)',
      help: 'Not a tax determination; enter a rate only for a simple spread illustration.',
      defaultValue: '30',
      required: false,
      format: 'percentage',
    },
  ],
  'amazon-fees': [
    {
      name: 'salePrice',
      label: 'Sale price',
      help: 'Customer-facing item price used to select the official price-band closing fee.',
      defaultValue: '299',
      format: 'money',
    },
    {
      name: 'productCost',
      label: 'Product cost',
      help: 'Your product cost before marketplace fees.',
      defaultValue: '500',
      format: 'money',
    },
    {
      ...select('category', 'Product category', amazonCategoryOptions),
      help: 'The bundled closing-fee examples are keyed to the selected official example category. Other categories require a current closing-fee override.',
    },
    {
      name: 'fulfillment',
      label: 'Fulfilment channel',
      help: 'Select the channel whose closing-fee schedule you are checking.',
      defaultValue: 'easy-ship',
      type: 'select',
      options: [
        { value: 'fba', label: 'Fulfilment by Amazon (FBA)' },
        { value: 'easy-ship', label: 'Easy Ship' },
        { value: 'self-ship', label: 'Self-Ship' },
      ],
    },
    {
      name: 'referralFeePercent',
      label: 'Category referral fee override',
      help: 'Enter the current category percentage from Seller Central. The prefilled 10% is illustrative; it is not a universal category claim.',
      defaultValue: '10',
      format: 'percentage',
    },
    {
      name: 'shippingFee',
      label: 'Weight-handling / shipping fee',
      help: 'Enter the rate-card amount for your packed weight, size and distance. The prefilled ₹60 is illustrative.',
      defaultValue: '60',
      format: 'money',
    },
    {
      name: 'closingFeeOverride',
      label: 'Closing fee override (optional)',
      help: 'Use this when Seller Central shows a category, price-band or fulfilment rate not included in the verified examples.',
      defaultValue: '',
      required: false,
      format: 'money',
    },
    {
      name: 'otherFee',
      label: 'Other marketplace fees (optional)',
      help: 'Add optional services or fulfilment fees that are not otherwise entered.',
      defaultValue: '0',
      required: false,
      format: 'money',
    },
    {
      name: 'feeGstRatePercent',
      label: 'GST on marketplace fees',
      help: 'The official page displays marketplace fees exclusive of GST; verify your applicable treatment.',
      defaultValue: '18',
      format: 'percentage',
    },
    {
      name: 'policyDate',
      label: 'Fee policy snapshot date',
      help: `The bundled Amazon snapshot is verified through ${MARKETPLACE_POLICY_AS_OF}. Future dates are rejected.`,
      defaultValue: MARKETPLACE_POLICY_AS_OF,
      type: 'date',
      format: 'text',
    },
  ],
  'flipkart-fees': [
    {
      name: 'salePrice',
      label: 'Sale price',
      help: 'Customer-facing item price used to select the fixed-fee price band.',
      defaultValue: '2000',
      format: 'money',
    },
    {
      name: 'productCost',
      label: 'Product cost',
      help: 'Your product cost before marketplace fees.',
      defaultValue: '900',
      format: 'money',
    },
    {
      ...select('category', 'Product category', flipkartCategoryOptions),
      help: 'Category is carried into the estimate as context; the commission must be copied from the current seller dashboard.',
    },
    {
      name: 'fulfillment',
      label: 'Fulfilment channel',
      help: 'The official standard card has separate FBF and NFBF fixed fees.',
      defaultValue: 'nfbf',
      type: 'select',
      options: [
        { value: 'fbf', label: 'Fulfilment by Flipkart (FBF)' },
        { value: 'nfbf', label: 'Non-FBF' },
      ],
    },
    {
      name: 'paymentMode',
      label: 'Collection mode',
      help: 'The actual collection rate should be confirmed in your seller dashboard.',
      defaultValue: 'prepaid',
      type: 'select',
      options: [
        { value: 'prepaid', label: 'Prepaid' },
        { value: 'cod', label: 'Cash on delivery' },
      ],
    },
    {
      name: 'commissionFeePercent',
      label: 'Category commission override',
      help: 'Enter the current category commission from your seller dashboard. The prefilled 5% is illustrative; no universal rate is assumed.',
      defaultValue: '5',
      format: 'percentage',
    },
    {
      name: 'collectionFeePercent',
      label: 'Collection fee override',
      help: 'Enter the current prepaid or COD collection percentage from your seller dashboard. The prefilled 2% is illustrative.',
      defaultValue: '2',
      format: 'percentage',
    },
    {
      name: 'shippingFee',
      label: 'Shipping fee',
      help: 'Enter packed-weight and destination shipping from your current rate card. The prefilled ₹80 is illustrative.',
      defaultValue: '80',
      format: 'money',
    },
    {
      name: 'fixedFeeOverride',
      label: 'Fixed fee override (optional)',
      help: 'Use this when your seller dashboard shows a category or programme exception.',
      defaultValue: '',
      required: false,
      format: 'money',
    },
    {
      name: 'otherFee',
      label: 'Other marketplace fees (optional)',
      help: 'Add any other fee shown by the seller dashboard.',
      defaultValue: '0',
      required: false,
      format: 'money',
    },
    {
      name: 'feeGstRatePercent',
      label: 'GST on marketplace fees',
      help: 'The standard card is displayed before GST; verify your applicable treatment.',
      defaultValue: '18',
      format: 'percentage',
    },
    {
      name: 'policyDate',
      label: 'Fee policy snapshot date',
      help: `The bundled Flipkart snapshot is verified through ${MARKETPLACE_POLICY_AS_OF}. Future dates are rejected.`,
      defaultValue: MARKETPLACE_POLICY_AS_OF,
      type: 'date',
      format: 'text',
    },
  ],
};

function fieldLabel(kind: Phase5CalculatorKind, name: string) {
  return phase5CalculatorFields[kind].find((field) => field.name === name)?.label ?? name;
}

function optionValues(kind: Phase5CalculatorKind, name: string) {
  return (
    phase5CalculatorFields[kind]
      .find((field) => field.name === name)
      ?.options?.map((option) => option.value) ?? []
  );
}

function parseNumber(
  input: Phase5CalculatorInput,
  kind: Phase5CalculatorKind,
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

function parseNonNegative(input: Phase5CalculatorInput, kind: Phase5CalculatorKind, name: string) {
  const value = parseNumber(input, kind, name);
  if (value.lt(0)) {
    throw new CalculationInputError(
      name,
      'must_not_be_negative',
      `${fieldLabel(kind, name)} cannot be negative.`,
    );
  }
  return value;
}

function parsePositive(input: Phase5CalculatorInput, kind: Phase5CalculatorKind, name: string) {
  const value = parseNonNegative(input, kind, name);
  if (value.lte(0)) {
    throw new CalculationInputError(
      name,
      'must_be_positive',
      `${fieldLabel(kind, name)} must be greater than zero.`,
    );
  }
  return value;
}

function parseInteger(
  input: Phase5CalculatorInput,
  kind: Phase5CalculatorKind,
  name: string,
  minimum = 0,
  maximum = 1_000_000,
) {
  const value = parseNonNegative(input, kind, name);
  if (!value.isInteger() || value.lt(minimum) || value.gt(maximum)) {
    throw new CalculationInputError(
      name,
      'whole_number_out_of_range',
      `${fieldLabel(kind, name)} must be a whole number between ${minimum} and ${maximum}.`,
    );
  }
  return value;
}

function parseRate(
  input: Phase5CalculatorInput,
  kind: Phase5CalculatorKind,
  name: string,
  minimum = 0,
  maximum = 100,
) {
  const value = parseNumber(input, kind, name, { allowNegative: minimum < 0 });
  if (value.lt(minimum) || value.gt(maximum)) {
    throw new CalculationInputError(
      name,
      'rate_out_of_range',
      `${fieldLabel(kind, name)} must be between ${minimum}% and ${maximum}%.`,
    );
  }
  return value;
}

function parseDate(input: Phase5CalculatorInput, kind: Phase5CalculatorKind, name: string) {
  const value = (input[name] ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw new CalculationInputError(name, 'invalid_date', `${fieldLabel(kind, name)} must use YYYY-MM-DD.`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new CalculationInputError(name, 'invalid_date', `${fieldLabel(kind, name)} is not a valid date.`);
  }
  return value;
}

function parseOptionalNumber(input: Phase5CalculatorInput, kind: Phase5CalculatorKind, name: string) {
  if (!(input[name] ?? '').trim()) return new Decimal(0);
  return parseNonNegative(input, kind, name);
}

function safeOptionalNumber(input: Phase5CalculatorInput, kind: Phase5CalculatorKind, name: string) {
  try {
    return parseOptionalNumber(input, kind, name);
  } catch {
    return new Decimal(0);
  }
}

function metric(label: string, value: Decimal | string, format: Phase5MetricFormat): Phase5Metric {
  return { label, value: typeof value === 'string' ? value : decimalToString(value), format };
}

function makeResult(
  kind: Phase5CalculatorKind,
  headline: Phase5Metric,
  tone: Phase5CalculationResult['tone'],
  detail: string,
  details: Phase5Metric[],
  warnings: string[] = [],
  policy?: Phase5PolicySnapshot,
  policyFreshness?: MarketplacePolicyFreshness,
): Phase5CalculationResult {
  return {
    kind,
    headline,
    tone,
    detail,
    details,
    exportRows: [headline, ...details],
    warnings,
    policy,
    policyFreshness,
  };
}

function addError(errors: FieldError[], field: string, error: unknown, fallback: string) {
  errors.push({
    field,
    code: error instanceof CalculationInputError ? error.code : 'invalid_input',
    message: error instanceof Error ? error.message : fallback,
  });
}

function validateWithErrors(kind: Phase5CalculatorKind, input: Phase5CalculatorInput) {
  const errors: FieldError[] = [];
  const fields = phase5CalculatorFields[kind];
  for (const field of fields) {
    const raw = (input[field.name] ?? '').trim();
    if (!raw && field.required === false) continue;
    if (!raw) {
      addError(
        errors,
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
      } else if (field.type === 'date') {
        parseDate(input, kind, field.name);
      } else if (field.type !== 'text') {
        parseNumber(input, kind, field.name, { allowNegative: field.allowNegative });
      }
    } catch (error) {
      addError(errors, field.name, error, `Enter a valid ${field.label.toLowerCase()}.`);
    }
  }

  const check = (field: string, action: () => unknown, fallback: string) => {
    try {
      action();
    } catch (error) {
      if (!errors.some((candidate) => candidate.field === field)) addError(errors, field, error, fallback);
    }
  };

  if (kind === 'cac') {
    check(
      'salesMarketingCost',
      () => parsePositive(input, kind, 'salesMarketingCost'),
      'Cost must be greater than zero.',
    );
    check(
      'attributionWindowMonths',
      () => parseInteger(input, kind, 'attributionWindowMonths', 1, 120),
      'Use a whole attribution window from 1 to 120 months.',
    );
    check(
      'newCustomers',
      () => parseInteger(input, kind, 'newCustomers', 1, 100_000_000),
      'New customers must be a positive whole number.',
    );
    if ((input.paidNewCustomers ?? '').trim())
      check(
        'paidNewCustomers',
        () => parseInteger(input, kind, 'paidNewCustomers', 0, 100_000_000),
        'Paid customers must be a non-negative whole number.',
      );
    if ((input.paidAcquisitionCost ?? '').trim())
      check(
        'paidAcquisitionCost',
        () => parseNonNegative(input, kind, 'paidAcquisitionCost'),
        'Paid-channel acquisition cost cannot be negative.',
      );
    if (
      safeOptionalNumber(input, kind, 'paidNewCustomers').gt(safeOptionalNumber(input, kind, 'newCustomers'))
    ) {
      addError(
        errors,
        'paidNewCustomers',
        new CalculationInputError(
          'paidNewCustomers',
          'exceeds_total',
          'Paid-channel customers cannot exceed all new customers.',
        ),
        'Paid-channel customers cannot exceed all new customers.',
      );
    }
    const paidCustomers = safeOptionalNumber(input, kind, 'paidNewCustomers');
    const paidCost = safeOptionalNumber(input, kind, 'paidAcquisitionCost');
    if (paidCustomers.gt(0) && paidCost.lte(0)) {
      addError(
        errors,
        'paidAcquisitionCost',
        new CalculationInputError(
          'paidAcquisitionCost',
          'required_for_paid_cac',
          'Enter paid-channel spend when paid-channel customers are supplied; blended cost cannot be reused for paid CAC.',
        ),
        'Enter paid-channel spend for paid CAC.',
      );
    }
  }

  if (kind === 'ltv') {
    check('arpuMonthly', () => parsePositive(input, kind, 'arpuMonthly'), 'ARPU must be greater than zero.');
    check(
      'grossMarginPercent',
      () => parseRate(input, kind, 'grossMarginPercent'),
      'Gross margin must be between 0% and 100%.',
    );
    for (const name of ['monthlyChurnPercent', 'churnLowPercent', 'churnHighPercent']) {
      check(
        name,
        () => parseRate(input, kind, name, 0.01, 100),
        `${fieldLabel(kind, name)} must be above 0% and at most 100%.`,
      );
    }
    const low = safeOptionalNumber(input, kind, 'churnLowPercent');
    const base = safeOptionalNumber(input, kind, 'monthlyChurnPercent');
    const high = safeOptionalNumber(input, kind, 'churnHighPercent');
    if (low.gt(base) || base.gt(high)) {
      addError(
        errors,
        'monthlyChurnPercent',
        new CalculationInputError(
          'monthlyChurnPercent',
          'range_order',
          'Use low churn ≤ base churn ≤ high churn.',
        ),
        'Use low churn ≤ base churn ≤ high churn.',
      );
    }
  }

  if (kind === 'saas-metrics') {
    check(
      'periodMonths',
      () => parseInteger(input, kind, 'periodMonths', 1, 120),
      'Measurement period must be a whole number from 1 to 120 months.',
    );
    for (const name of ['mrr', 'priorMrr'])
      check(
        name,
        () => parsePositive(input, kind, name),
        `${fieldLabel(kind, name)} must be greater than zero.`,
      );
    for (const name of ['newMrr', 'expansionMrr', 'contractionMrr', 'churnedMrr', 'salesMarketingCost'])
      check(name, () => parseNonNegative(input, kind, name), `${fieldLabel(kind, name)} cannot be negative.`);
    for (const name of ['customers', 'priorCustomers'])
      check(
        name,
        () => parseInteger(input, kind, name, 1, 100_000_000),
        `${fieldLabel(kind, name)} must be a positive whole number.`,
      );
    for (const name of ['newCustomers', 'churnedCustomers'])
      check(
        name,
        () => parseInteger(input, kind, name, 0, 100_000_000),
        `${fieldLabel(kind, name)} must be a non-negative whole number.`,
      );
    check(
      'grossMarginPercent',
      () => parseRate(input, kind, 'grossMarginPercent'),
      'Gross margin must be between 0% and 100%.',
    );
    check(
      'profitMarginPercent',
      () => parseRate(input, kind, 'profitMarginPercent', -100, 100),
      'Profit margin must be between -100% and 100%.',
    );
    if (
      safeOptionalNumber(input, kind, 'churnedMrr')
        .plus(safeOptionalNumber(input, kind, 'contractionMrr'))
        .gt(safeOptionalNumber(input, kind, 'priorMrr'))
    ) {
      addError(
        errors,
        'churnedMrr',
        new CalculationInputError(
          'churnedMrr',
          'exceeds_prior_mrr',
          'Churned plus contraction MRR cannot exceed prior MRR.',
        ),
        'Churned plus contraction MRR cannot exceed prior MRR.',
      );
    }
    if (
      safeOptionalNumber(input, kind, 'churnedCustomers').gt(
        safeOptionalNumber(input, kind, 'priorCustomers'),
      )
    ) {
      addError(
        errors,
        'churnedCustomers',
        new CalculationInputError(
          'churnedCustomers',
          'exceeds_prior_customers',
          'Churned customers cannot exceed prior customers.',
        ),
        'Churned customers cannot exceed prior customers.',
      );
    }
  }

  if (kind === 'valuation') {
    check(
      'annualRevenue',
      () => parsePositive(input, kind, 'annualRevenue'),
      'Annual revenue must be greater than zero.',
    );
    for (const name of ['revenueMultipleLow', 'revenueMultipleHigh'])
      check(
        name,
        () => parsePositive(input, kind, name),
        `${fieldLabel(kind, name)} must be greater than zero.`,
      );
    check(
      'preMoneyValuation',
      () => parsePositive(input, kind, 'preMoneyValuation'),
      'Pre-money valuation must be greater than zero.',
    );
    check(
      'investmentAmount',
      () => parseNonNegative(input, kind, 'investmentAmount'),
      'Investment cannot be negative.',
    );
    if (
      safeOptionalNumber(input, kind, 'revenueMultipleLow').gt(
        safeOptionalNumber(input, kind, 'revenueMultipleHigh'),
      )
    ) {
      addError(
        errors,
        'revenueMultipleLow',
        new CalculationInputError(
          'revenueMultipleLow',
          'range_order',
          'Low multiple must not exceed high multiple.',
        ),
        'Low multiple must not exceed high multiple.',
      );
    }
  }

  if (kind === 'equity-dilution') {
    check(
      'preMoneyValuation',
      () => parsePositive(input, kind, 'preMoneyValuation'),
      'Pre-money valuation must be greater than zero.',
    );
    check(
      'investmentAmount',
      () => parsePositive(input, kind, 'investmentAmount'),
      'Investment amount must be greater than zero.',
    );
    for (const name of [
      'founderOwnershipPercent',
      'existingInvestorOwnershipPercent',
      'otherOwnershipPercent',
    ])
      check(
        name,
        () => parseRate(input, kind, name),
        `${fieldLabel(kind, name)} must be between 0% and 100%.`,
      );
    check(
      'postMoneyOptionPoolPercent',
      () => parseRate(input, kind, 'postMoneyOptionPoolPercent', 0, 50),
      'Option pool must be between 0% and 50%.',
    );
    const existingTotal = [
      'founderOwnershipPercent',
      'existingInvestorOwnershipPercent',
      'otherOwnershipPercent',
    ].reduce((total, name) => total.plus(safeOptionalNumber(input, kind, name)), new Decimal(0));
    if (!existingTotal.eq(100)) {
      addError(
        errors,
        'founderOwnershipPercent',
        new CalculationInputError(
          'founderOwnershipPercent',
          'cap_table_not_reconciled',
          'Existing holder percentages must total exactly 100%.',
        ),
        'Existing holder percentages must total exactly 100%.',
      );
    }
    const investment = safeOptionalNumber(input, kind, 'investmentAmount');
    const preMoney = safeOptionalNumber(input, kind, 'preMoneyValuation');
    const investorShare = preMoney.plus(investment).isZero()
      ? new Decimal(100)
      : investment.div(preMoney.plus(investment)).times(100);
    if (investorShare.plus(safeOptionalNumber(input, kind, 'postMoneyOptionPoolPercent')).gte(100)) {
      addError(
        errors,
        'postMoneyOptionPoolPercent',
        new CalculationInputError(
          'postMoneyOptionPoolPercent',
          'invalid_pool',
          'Option pool must leave room for the new investor.',
        ),
        'Option pool must leave room for the new investor.',
      );
    }
  }

  if (kind === 'esop') {
    check(
      'fullyDilutedSharesBefore',
      () => parsePositive(input, kind, 'fullyDilutedSharesBefore'),
      'Existing share count must be greater than zero.',
    );
    check(
      'grantShares',
      () => parsePositive(input, kind, 'grantShares'),
      'Grant shares must be greater than zero.',
    );
    check(
      'vestedPercent',
      () => parseRate(input, kind, 'vestedPercent'),
      'Vested percentage must be between 0% and 100%.',
    );
    for (const name of ['exercisePrice', 'fairMarketValue'])
      check(name, () => parseNonNegative(input, kind, name), `${fieldLabel(kind, name)} cannot be negative.`);
    check(
      'fairMarketValue',
      () => parsePositive(input, kind, 'fairMarketValue'),
      'Fair market value must be greater than zero.',
    );
    if ((input.salePrice ?? '').trim())
      check('salePrice', () => parseNonNegative(input, kind, 'salePrice'), 'Sale price cannot be negative.');
    if ((input.exercisedShares ?? '').trim())
      check(
        'exercisedShares',
        () => parseNonNegative(input, kind, 'exercisedShares'),
        'Exercised shares cannot be negative.',
      );
    if ((input.exerciseDate ?? '').trim())
      check(
        'exerciseDate',
        () => parseDate(input, kind, 'exerciseDate'),
        'Enter a valid exercise or allotment date.',
      );
    const grant = safeOptionalNumber(input, kind, 'grantShares');
    const vested = grant.times(safeOptionalNumber(input, kind, 'vestedPercent')).div(100);
    const exercised = safeOptionalNumber(input, kind, 'exercisedShares');
    if (exercised.gt(vested)) {
      addError(
        errors,
        'exercisedShares',
        new CalculationInputError(
          'exercisedShares',
          'exceeds_vested',
          'Exercised or allotted shares cannot exceed vested shares.',
        ),
        'Exercised shares cannot exceed vested shares.',
      );
    }
    if (input.taxTreatment === 'illustrative' && exercised.lte(0)) {
      addError(
        errors,
        'exercisedShares',
        new CalculationInputError(
          'exercisedShares',
          'required_for_tax_event',
          'Enter the shares actually exercised or allotted before showing a tax-event illustration.',
        ),
        'Enter exercised or allotted shares for the tax illustration.',
      );
    }
    if (exercised.gt(0) && !(input.exerciseDate ?? '').trim()) {
      addError(
        errors,
        'exerciseDate',
        new CalculationInputError(
          'exerciseDate',
          'required_for_tax_event',
          'Enter the exercise or allotment date used for the supplied FMV.',
        ),
        'Enter the exercise or allotment date.',
      );
    }
    if (input.taxTreatment === 'illustrative' && !(input.illustrativeTaxRatePercent ?? '').trim()) {
      addError(
        errors,
        'illustrativeTaxRatePercent',
        new CalculationInputError(
          'illustrativeTaxRatePercent',
          'required',
          'Enter an illustrative tax rate or choose not to estimate tax.',
        ),
        'Enter an illustrative tax rate or choose not to estimate tax.',
      );
    } else if ((input.illustrativeTaxRatePercent ?? '').trim())
      check(
        'illustrativeTaxRatePercent',
        () => parseRate(input, kind, 'illustrativeTaxRatePercent'),
        'Illustrative tax rate must be between 0% and 100%.',
      );
  }

  if (kind === 'amazon-fees' || kind === 'flipkart-fees') {
    check(
      'salePrice',
      () => parsePositive(input, kind, 'salePrice'),
      'Sale price must be greater than zero.',
    );
    for (const name of ['productCost', 'shippingFee'])
      check(name, () => parseNonNegative(input, kind, name), `${fieldLabel(kind, name)} cannot be negative.`);
    for (const name of ['otherFee', 'feeGstRatePercent'])
      check(
        name,
        () =>
          name === 'feeGstRatePercent' ? parseRate(input, kind, name) : parseNonNegative(input, kind, name),
        `${fieldLabel(kind, name)} is invalid.`,
      );
    check(
      'policyDate',
      () => {
        const policyDate = parseDate(input, kind, 'policyDate');
        if (policyDate > MARKETPLACE_POLICY_AS_OF)
          throw new CalculationInputError(
            'policyDate',
            'future_policy_date',
            `Policy dates after ${MARKETPLACE_POLICY_AS_OF} are not supported.`,
          );
        if (!getMarketplacePolicy(kind === 'amazon-fees' ? 'amazon' : 'flipkart', policyDate))
          throw new CalculationInputError(
            'policyDate',
            'policy_unavailable',
            'No verified marketplace policy is available for that date.',
          );
      },
      'Choose a supported marketplace policy date.',
    );
    if (kind === 'amazon-fees') {
      check(
        'referralFeePercent',
        () => parseRate(input, kind, 'referralFeePercent'),
        'Referral fee must be between 0% and 100%.',
      );
      if ((input.closingFeeOverride ?? '').trim())
        check(
          'closingFeeOverride',
          () => parseNonNegative(input, kind, 'closingFeeOverride'),
          'Closing fee override cannot be negative.',
        );
      const salePrice = safeOptionalNumber(input, kind, 'salePrice');
      const policyDate = (input.policyDate ?? '').trim();
      const selectedPolicy = policyDate ? getMarketplacePolicy('amazon', policyDate) : undefined;
      const selectedCategory = input.category as keyof NonNullable<
        NonNullable<typeof selectedPolicy>['amazon']
      >['closingFeesByCategory'];
      const bundledClosingFee =
        selectedPolicy?.amazon?.closingFeesByCategory[selectedCategory]?.[
          input.fulfillment as 'fba' | 'easy-ship' | 'self-ship'
        ]?.[getMarketplacePriceBand(salePrice.toString())] ?? null;
      if (!(input.closingFeeOverride ?? '').trim() && bundledClosingFee === null) {
        addError(
          errors,
          'closingFeeOverride',
          new CalculationInputError(
            'closingFeeOverride',
            'override_required',
            'The selected Amazon category/channel/price band has no bundled rate; enter the current Seller Central closing fee override.',
          ),
          'Enter the current Amazon closing fee override for this category and channel.',
        );
      }
    } else {
      for (const name of ['commissionFeePercent', 'collectionFeePercent'])
        check(
          name,
          () => parseRate(input, kind, name),
          `${fieldLabel(kind, name)} must be between 0% and 100%.`,
        );
      if ((input.fixedFeeOverride ?? '').trim())
        check(
          'fixedFeeOverride',
          () => parseNonNegative(input, kind, 'fixedFeeOverride'),
          'Fixed fee override cannot be negative.',
        );
    }
  }

  if (errors.length > 0) return { success: false as const, errors };
  return {
    success: true as const,
    data: Object.fromEntries(fields.map((field) => [field.name, (input[field.name] ?? '').trim()])),
  };
}

export function validatePhase5CalculatorInput(
  kind: Phase5CalculatorKind,
  input: Phase5CalculatorInput,
): ValidationResult<Phase5CalculatorInput> {
  const parsed = phase5CalculatorInputSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      errors: [{ field: 'form', code: 'invalid_input', message: 'Enter values for this scenario.' }],
    };
  return validateWithErrors(kind, parsed.data);
}

function calculateCac(input: Phase5CalculatorInput) {
  const kind = 'cac' as const;
  const cost = parsePositive(input, kind, 'salesMarketingCost');
  const window = parseInteger(input, kind, 'attributionWindowMonths', 1, 120);
  const customers = parseInteger(input, kind, 'newCustomers', 1, 100_000_000);
  const paidCustomers = (input.paidNewCustomers ?? '').trim()
    ? parseInteger(input, kind, 'paidNewCustomers', 0, 100_000_000)
    : new Decimal(0);
  const paidCost = paidCustomers.gt(0) ? parsePositive(input, kind, 'paidAcquisitionCost') : new Decimal(0);
  const blended = cost.div(customers);
  const details = [
    metric('Attributed cost', cost, 'currency'),
    metric('Attribution window', window.toString(), 'number'),
    metric('New customers', customers.toString(), 'number'),
    metric('Blended CAC', blended, 'currency'),
  ];
  if (paidCustomers.gt(0)) {
    details.splice(1, 0, metric('Paid-channel acquisition cost', paidCost, 'currency'));
    details.push(metric('Paid-channel CAC', paidCost.div(paidCustomers), 'currency'));
  }
  return makeResult(
    kind,
    metric('Blended CAC', blended, 'currency'),
    'neutral',
    'CAC is the included acquisition cost divided by the customers attributed to the same declared window.',
    details,
    paidCustomers.isZero()
      ? ['A paid-only CAC is not shown because no paid-channel customer denominator was supplied.']
      : [],
  );
}

function calculateLtv(input: Phase5CalculatorInput) {
  const kind = 'ltv' as const;
  const arpu = parsePositive(input, kind, 'arpuMonthly');
  const margin = parseRate(input, kind, 'grossMarginPercent');
  const churn = parseRate(input, kind, 'monthlyChurnPercent', 0.01, 100);
  const lowChurn = parseRate(input, kind, 'churnLowPercent', 0.01, 100);
  const highChurn = parseRate(input, kind, 'churnHighPercent', 0.01, 100);
  const contribution = arpu.times(margin).div(100);
  const baseLtv = contribution.div(churn.div(100));
  const lowLtv = contribution.div(highChurn.div(100));
  const highLtv = contribution.div(lowChurn.div(100));
  const warnings =
    input.churnStability === 'unstable'
      ? ['Churn is marked unstable; treat the range as a sensitivity illustration, not a forecast.']
      : [];
  return makeResult(
    'ltv',
    metric('Illustrated LTV', baseLtv, 'currency'),
    'neutral',
    'Simple LTV = monthly ARPU × gross margin ÷ monthly churn. This is a scenario range, not a precise customer forecast.',
    [
      metric('Monthly ARPU', arpu, 'currency'),
      metric('Gross-margin contribution', contribution, 'currency'),
      metric('Base monthly churn', churn, 'percentage'),
      metric('LTV range — lower case', lowLtv, 'currency'),
      metric('LTV range — upper case', highLtv, 'currency'),
    ],
    warnings,
  );
}

function calculateSaasMetrics(input: Phase5CalculatorInput) {
  const kind = 'saas-metrics' as const;
  const period = parseInteger(input, kind, 'periodMonths', 1, 120);
  const mrr = parsePositive(input, kind, 'mrr');
  const priorMrr = parsePositive(input, kind, 'priorMrr');
  const newMrr = parseNonNegative(input, kind, 'newMrr');
  const expansion = parseNonNegative(input, kind, 'expansionMrr');
  const contraction = parseNonNegative(input, kind, 'contractionMrr');
  const churned = parseNonNegative(input, kind, 'churnedMrr');
  const customers = parseInteger(input, kind, 'customers', 1, 100_000_000);
  const priorCustomers = parseInteger(input, kind, 'priorCustomers', 1, 100_000_000);
  const newCustomers = parseInteger(input, kind, 'newCustomers', 0, 100_000_000);
  const churnedCustomers = parseInteger(input, kind, 'churnedCustomers', 0, 100_000_000);
  const salesMarketingCost = parseNonNegative(input, kind, 'salesMarketingCost');
  const grossMargin = parseRate(input, kind, 'grossMarginPercent');
  const profitMargin = parseRate(input, kind, 'profitMarginPercent', -100, 100);
  const arpu = mrr.div(customers);
  const revenueGrowth = mrr.minus(priorMrr).div(priorMrr).times(100);
  const annualizedRevenueGrowth = mrr.div(priorMrr).pow(new Decimal(12).div(period)).minus(1).times(100);
  const logoChurn = churnedCustomers.div(priorCustomers).times(100);
  const monthlyLogoChurn = new Decimal(1)
    .minus(new Decimal(1).minus(logoChurn.div(100)).pow(new Decimal(1).div(period)))
    .times(100);
  const grr = priorMrr.minus(churned).minus(contraction).div(priorMrr).times(100);
  const nrr = priorMrr.minus(churned).minus(contraction).plus(expansion).div(priorMrr).times(100);
  const bridgedMrr = priorMrr.plus(newMrr).plus(expansion).minus(contraction).minus(churned);
  const bridgeVariance = mrr.minus(bridgedMrr);
  const cac = newCustomers.isZero() ? null : salesMarketingCost.div(newCustomers);
  const contributionPerCustomer = arpu.times(grossMargin).div(100);
  const cacPayback = cac && contributionPerCustomer.gt(0) ? cac.div(contributionPerCustomer) : null;
  const ltv = monthlyLogoChurn.isZero() ? null : contributionPerCustomer.div(monthlyLogoChurn.div(100));
  const ltvToCac = ltv && cac && cac.gt(0) ? ltv.div(cac) : null;
  const ruleOf40 = annualizedRevenueGrowth.plus(profitMargin);
  const bridgedCustomers = priorCustomers.plus(newCustomers).minus(churnedCustomers);
  const customerBridgeVariance = customers.minus(bridgedCustomers);
  const details = [
    metric('Measurement period', period.toString(), 'number'),
    metric('ARR', mrr.times(12), 'currency'),
    metric('ARPU', arpu, 'currency'),
    metric('New MRR', newMrr, 'currency'),
    metric('MRR growth (window)', revenueGrowth, 'percentage'),
    metric('Annualized revenue growth', annualizedRevenueGrowth, 'percentage'),
    metric('Logo churn (window)', logoChurn, 'percentage'),
    metric('Monthly logo churn', monthlyLogoChurn, 'percentage'),
    metric('GRR', grr, 'percentage'),
    metric('NRR', nrr, 'percentage'),
    metric('Rule of 40 illustration (annualized)', ruleOf40, 'percentage'),
  ];
  if (cac) details.push(metric('CAC', cac, 'currency'));
  if (cacPayback) details.push(metric('CAC payback', cacPayback, 'number'));
  if (ltv) details.push(metric('Illustrated LTV', ltv, 'currency'));
  if (ltvToCac) details.push(metric('LTV:CAC', ltvToCac, 'multiple'));
  const warnings = [
    ...(period.eq(1)
      ? []
      : [
          'The window is normalized: revenue growth is annualized and logo churn/LTV use an equivalent monthly churn rate.',
        ]),
    ...(newCustomers.isZero() ? ['CAC and CAC payback are omitted because new customers are zero.'] : []),
    ...(logoChurn.isZero()
      ? ['LTV:CAC is omitted because logo churn is zero; zero churn is not treated as a stable forecast.']
      : []),
    ...(bridgeVariance.isZero()
      ? []
      : [
          `The MRR bridge differs from the entered MRR by ${decimalToString(bridgeVariance)}; check new, expansion, contraction and churned MRR inputs.`,
        ]),
    ...(customerBridgeVariance.isZero()
      ? []
      : [
          `The customer bridge differs from the entered customer count by ${decimalToString(customerBridgeVariance)}; check new and churned customer inputs.`,
        ]),
  ];
  return makeResult(
    'saas-metrics',
    metric('MRR', mrr, 'currency'),
    'neutral',
    'A definition-led SaaS snapshot. Each metric is calculated from the same declared measurement period and user-supplied inputs.',
    details,
    warnings,
  );
}

function calculateValuation(input: Phase5CalculatorInput) {
  const kind = 'valuation' as const;
  const revenue = parsePositive(input, kind, 'annualRevenue');
  const lowMultiple = parsePositive(input, kind, 'revenueMultipleLow');
  const highMultiple = parsePositive(input, kind, 'revenueMultipleHigh');
  const preMoney = parsePositive(input, kind, 'preMoneyValuation');
  const investment = parseNonNegative(input, kind, 'investmentAmount');
  const postMoney = preMoney.plus(investment);
  const investorOwnership = investment.div(postMoney).times(100);
  return makeResult(
    'valuation',
    metric(
      'Scenario valuation range',
      `${decimalToString(revenue.times(lowMultiple))}–${decimalToString(revenue.times(highMultiple))}`,
      'text',
    ),
    'neutral',
    'A user-selected revenue-multiple and funding scenario. It is not a fair-value opinion, registered valuation or investment recommendation.',
    [
      metric('Annual revenue', revenue, 'currency'),
      metric('Low multiple', lowMultiple, 'multiple'),
      metric('High multiple', highMultiple, 'multiple'),
      metric('Low scenario value', revenue.times(lowMultiple), 'currency'),
      metric('High scenario value', revenue.times(highMultiple), 'currency'),
      metric('Declared pre-money', preMoney, 'currency'),
      metric('Post-money', postMoney, 'currency'),
      metric('Illustrated investor ownership', investorOwnership, 'percentage'),
    ],
    [
      'Revenue multiples are user-selected assumptions; compare them with qualified corporate and finance advice before using them in a transaction.',
    ],
  );
}

function calculateEquityDilution(input: Phase5CalculatorInput) {
  const kind = 'equity-dilution' as const;
  const preMoney = parsePositive(input, kind, 'preMoneyValuation');
  const investment = parsePositive(input, kind, 'investmentAmount');
  const founder = parseRate(input, kind, 'founderOwnershipPercent');
  const existingInvestor = parseRate(input, kind, 'existingInvestorOwnershipPercent');
  const other = parseRate(input, kind, 'otherOwnershipPercent');
  const optionPool = parseRate(input, kind, 'postMoneyOptionPoolPercent', 0, 50);
  const postMoney = preMoney.plus(investment);
  const investor = investment.div(postMoney).times(100);
  const residual = new Decimal(100).minus(investor).minus(optionPool);
  const scale = residual.div(100);
  const founderPost = founder.times(scale);
  const existingInvestorPost = existingInvestor.times(scale);
  const otherPost = other.times(scale);
  return makeResult(
    'equity-dilution',
    metric('New investor ownership', investor, 'percentage'),
    'neutral',
    'This cap-table preview treats the option pool as a post-money target and dilutes existing holders pro rata. It does not issue securities or approve a corporate action.',
    [
      metric('Pre-money valuation', preMoney, 'currency'),
      metric('Investment', investment, 'currency'),
      metric('Post-money valuation', postMoney, 'currency'),
      metric('Founder after financing', founderPost, 'percentage'),
      metric('Existing investor after financing', existingInvestorPost, 'percentage'),
      metric('Other holders after financing', otherPost, 'percentage'),
      metric('Target option pool', optionPool, 'percentage'),
      metric(
        'Reconciled total',
        founderPost.plus(existingInvestorPost).plus(otherPost).plus(optionPool).plus(investor),
        'percentage',
      ),
    ],
    [
      'Confirm the company’s articles, shareholder approvals, cap table and any registered-valuer requirements with a qualified corporate/legal professional.',
    ],
  );
}

function calculateEsop(input: Phase5CalculatorInput) {
  const kind = 'esop' as const;
  const before = parsePositive(input, kind, 'fullyDilutedSharesBefore');
  const grant = parsePositive(input, kind, 'grantShares');
  const vestedPercent = parseRate(input, kind, 'vestedPercent');
  const exercisePrice = parseNonNegative(input, kind, 'exercisePrice');
  const fairMarketValue = parsePositive(input, kind, 'fairMarketValue');
  const exercisedShares = (input.exercisedShares ?? '').trim()
    ? parseNonNegative(input, kind, 'exercisedShares')
    : new Decimal(0);
  const exerciseDate = (input.exerciseDate ?? '').trim() ? parseDate(input, kind, 'exerciseDate') : null;
  const salePrice = (input.salePrice ?? '').trim() ? parseNonNegative(input, kind, 'salePrice') : null;
  const taxRate = (input.illustrativeTaxRatePercent ?? '').trim()
    ? parseRate(input, kind, 'illustrativeTaxRatePercent')
    : new Decimal(0);
  const totalAfter = before.plus(grant);
  const ownership = grant.div(totalAfter).times(100);
  const vestedShares = grant.times(vestedPercent).div(100);
  const exerciseCost = vestedShares.times(exercisePrice);
  const exercisedCost = exercisedShares.times(exercisePrice);
  const spread = Decimal.max(fairMarketValue.minus(exercisePrice), 0).times(exercisedShares);
  const illustrativeTax = input.taxTreatment === 'illustrative' ? spread.times(taxRate).div(100) : null;
  const capitalGain = salePrice ? salePrice.minus(fairMarketValue).times(exercisedShares) : null;
  const details = [
    metric('Ownership after grant', ownership, 'percentage'),
    metric('Vested shares', vestedShares, 'number'),
    metric('Exercised / allotted shares', exercisedShares, 'number'),
    metric('Exercise cost for vested shares', exerciseCost, 'currency'),
    metric('Exercise cost for exercised / allotted shares', exercisedCost, 'currency'),
    metric('Illustrated exercise spread', spread, 'currency'),
    metric('Fair market value per share', fairMarketValue, 'currency'),
  ];
  if (exerciseDate) details.push(metric('Exercise / allotment date', exerciseDate, 'text'));
  if (illustrativeTax) details.push(metric('Illustrative tax on spread', illustrativeTax, 'currency'));
  if (capitalGain) details.push(metric('Illustrative capital gain before tax', capitalGain, 'currency'));
  const warnings = [
    'FMV, vesting, exercise, plan terms and tax timing require the company’s approved ESOP documents and professional review.',
  ];
  if (exercisedShares.isZero())
    warnings.push(
      'No exercised or allotted shares were supplied; the tax-event spread is shown as zero rather than assuming all vested options were exercised.',
    );
  if (input.taxTreatment === 'illustrative')
    warnings.push(
      'The tax figure is only spread × your entered rate; it is not an Income Tax Department determination.',
    );
  if (!salePrice) warnings.push('No sale price was supplied, so a later transfer gain is not shown.');
  return makeResult(
    'esop',
    metric('Illustrated exercise spread', spread, 'currency'),
    'neutral',
    'An educational grant, vesting, ownership and tax-event scenario. It does not establish FMV, eligibility, allotment or a tax liability.',
    details,
    warnings,
  );
}

export interface Phase5CalculationOptions {
  asOf?: string;
}

function calculateMarketplaceFees(
  kind: 'amazon-fees' | 'flipkart-fees',
  input: Phase5CalculatorInput,
  options: Phase5CalculationOptions = {},
) {
  const marketplaceKind: MarketplaceKind = kind === 'amazon-fees' ? 'amazon' : 'flipkart';
  const salePrice = parsePositive(input, kind, 'salePrice');
  const productCost = parseNonNegative(input, kind, 'productCost');
  const shipping = parseNonNegative(input, kind, 'shippingFee');
  const otherFee = parseOptionalNumber(input, kind, 'otherFee');
  const gstRate = parseRate(input, kind, 'feeGstRatePercent');
  const policyDate = parseDate(input, kind, 'policyDate');
  if (policyDate > MARKETPLACE_POLICY_AS_OF)
    throw new CalculationInputError(
      'policyDate',
      'future_policy_date',
      `Policy dates after ${MARKETPLACE_POLICY_AS_OF} are not supported.`,
    );
  const policy = getMarketplacePolicy(marketplaceKind, policyDate);
  if (!policy)
    throw new CalculationInputError(
      'policyDate',
      'policy_unavailable',
      'No verified marketplace policy is available for that date.',
    );
  // Freshness is evaluated against the runtime date so a bundled snapshot becomes
  // visibly stale after its review window, while the selected policy date remains
  // bounded by the last verified snapshot above.
  const freshness = getMarketplacePolicyFreshness(policy, options.asOf);
  const band = getMarketplacePriceBand(salePrice.toString());
  let fixedFee: Decimal;
  let variableFee: Decimal;
  let referralFee = new Decimal(0);
  let commissionFee = new Decimal(0);
  let collectionFee = new Decimal(0);
  const closingOverride = (input.closingFeeOverride ?? '').trim();
  const fixedOverride = (input.fixedFeeOverride ?? '').trim();
  if (freshness.isStale && !closingOverride && !fixedOverride) {
    const overrideField = kind === 'amazon-fees' ? 'closingFeeOverride' : 'fixedFeeOverride';
    throw new CalculationInputError(
      overrideField,
      'stale_policy_override_required',
      `${freshness.message} Enter a current seller-dashboard ${kind === 'amazon-fees' ? 'closing fee' : 'fixed fee'} override before calculating with a stale bundled policy.`,
    );
  }
  if (kind === 'amazon-fees') {
    const fulfillment = input.fulfillment as 'fba' | 'easy-ship' | 'self-ship';
    const category = input.category as keyof NonNullable<
      NonNullable<typeof policy>['amazon']
    >['closingFeesByCategory'];
    const policyClosingFee = policy.amazon?.closingFeesByCategory[category]?.[fulfillment]?.[band] ?? null;
    fixedFee = closingOverride
      ? parseNonNegative(input, kind, 'closingFeeOverride')
      : policyClosingFee === null
        ? (() => {
            throw new CalculationInputError(
              'closingFeeOverride',
              'override_required',
              'Enter a current Seller Central closing fee override for this category, channel and price band.',
            );
          })()
        : new Decimal(policyClosingFee);
    const referral = parseRate(input, kind, 'referralFeePercent');
    referralFee = salePrice.times(referral).div(100);
    variableFee = referralFee;
  } else {
    const fulfillment = input.fulfillment as 'fbf' | 'nfbf';
    const category = input.category ?? 'general';
    const paymentMode = input.paymentMode as 'prepaid' | 'cod';
    const policyFixedFee = policy.flipkart?.fixedFees[fulfillment][band] ?? null;
    fixedFee = fixedOverride
      ? parseNonNegative(input, kind, 'fixedFeeOverride')
      : policyFixedFee === null
        ? (() => {
            throw new CalculationInputError(
              'fixedFeeOverride',
              'override_required',
              'Enter a current fixed fee override.',
            );
          })()
        : new Decimal(policyFixedFee);
    const policyCommission = policy.flipkart?.commissionFeesByCategory?.[category]?.[band] ?? null;
    const policyCollection = policy.flipkart?.collectionFeesByPaymentMode?.[paymentMode]?.[band] ?? null;
    const commission =
      policyCommission === null
        ? parseRate(input, kind, 'commissionFeePercent')
        : new Decimal(policyCommission);
    const collection =
      policyCollection === null
        ? parseRate(input, kind, 'collectionFeePercent')
        : new Decimal(policyCollection);
    commissionFee = salePrice.times(commission).div(100);
    collectionFee = salePrice.times(collection).div(100);
    variableFee = commissionFee.plus(collectionFee);
  }
  const preTaxFees = fixedFee.plus(variableFee).plus(shipping).plus(otherFee);
  const gst = preTaxFees.times(gstRate).div(100);
  const totalFees = preTaxFees.plus(gst);
  const payout = salePrice.minus(totalFees);
  const contribution = payout.minus(productCost);
  const margin = contribution.div(salePrice).times(100);
  const warnings = [
    'Marketplace rates vary by category, programme, fulfilment, weight, distance, seller level and account terms. Confirm the current seller dashboard before relying on this estimate.',
    ...(freshness.isStale
      ? [
          `${freshness.message} This estimate used explicit seller overrides instead of the stale bundled fee where required.`,
        ]
      : []),
  ];
  const category = input.category ?? '';
  return makeResult(
    kind,
    metric('Estimated contribution after fees', contribution, 'currency'),
    contribution.gte(0) ? 'positive' : 'negative',
    `${kind === 'amazon-fees' ? 'Amazon' : 'Flipkart'} fee estimate using the selected policy snapshot and your overrides.`,
    [
      metric('Sale price', salePrice, 'currency'),
      metric('Product cost', productCost, 'currency'),
      metric('Category context', category, 'text'),
      metric('Price band', band, 'text'),
      ...(kind === 'amazon-fees'
        ? [metric('Referral fee', referralFee, 'currency')]
        : [
            metric('Commission fee', commissionFee, 'currency'),
            metric('Collection fee', collectionFee, 'currency'),
            metric('Collection mode', input.paymentMode ?? '', 'text'),
          ]),
      metric('Fixed/closing fee', fixedFee, 'currency'),
      metric('Shipping fee', shipping, 'currency'),
      metric('Other fees', otherFee, 'currency'),
      metric('GST on fees', gst, 'currency'),
      metric('Total marketplace fees', totalFees, 'currency'),
      metric('Estimated payout before product cost', payout, 'currency'),
      metric('Contribution margin', margin, 'percentage'),
    ],
    warnings,
    {
      id: policy.id,
      effectiveFrom: policy.effectiveFrom,
      effectiveTo: policy.effectiveTo,
      lastVerifiedOn: policy.lastVerifiedOn,
      sourceIds: policy.sourceIds,
    },
    freshness,
  );
}

export function calculatePhase5(
  kind: Phase5CalculatorKind,
  input: Phase5CalculatorInput,
  options: Phase5CalculationOptions = {},
): Phase5CalculationResult {
  const validation = validatePhase5CalculatorInput(kind, input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new CalculationInputError(
      first?.field ?? 'form',
      first?.code ?? 'invalid_input',
      first?.message ?? 'Check the inputs.',
    );
  }
  const values = validation.data;
  switch (kind) {
    case 'cac':
      return calculateCac(values);
    case 'ltv':
      return calculateLtv(values);
    case 'saas-metrics':
      return calculateSaasMetrics(values);
    case 'valuation':
      return calculateValuation(values);
    case 'equity-dilution':
      return calculateEquityDilution(values);
    case 'esop':
      return calculateEsop(values);
    case 'amazon-fees':
    case 'flipkart-fees':
      return calculateMarketplaceFees(kind, values, options);
  }
}
