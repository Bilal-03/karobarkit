import { z } from 'zod';
import Decimal from 'decimal.js';

import { decimalToString, parseDecimal } from '@/domain/formatting/decimal';

import { CalculationInputError, type FieldError, type ValidationResult } from './types';

export const businessCalculatorKinds = [
  'margin',
  'markup',
  'break-even',
  'pricing',
  'cash-flow',
  'burn-rate',
  'runway',
  'marketplace-margin',
  'roas',
  'cod-cost',
] as const;

export type BusinessCalculatorKind = (typeof businessCalculatorKinds)[number];
export type BusinessCalculatorInput = Record<string, string>;

export type BusinessMetricFormat = 'currency' | 'percentage' | 'number' | 'multiple' | 'text';

export interface BusinessFieldConfig {
  name: string;
  label: string;
  help: string;
  defaultValue: string;
  required?: boolean;
  format?: 'money' | 'percentage' | 'number';
}

export interface BusinessMetric {
  label: string;
  value: string;
  format: BusinessMetricFormat;
}

export interface BusinessCalculationResult {
  kind: BusinessCalculatorKind;
  headline: BusinessMetric;
  tone: 'positive' | 'negative' | 'neutral';
  detail: string;
  details: BusinessMetric[];
  exportRows: BusinessMetric[];
}

export const businessCalculatorInputSchema = z.record(z.string(), z.string());

export const businessCalculatorFields: Record<BusinessCalculatorKind, BusinessFieldConfig[]> = {
  margin: [
    {
      name: 'revenue',
      label: 'Revenue',
      help: 'Total revenue for the same period and scope as the cost figure.',
      defaultValue: '100000',
      format: 'money',
    },
    {
      name: 'totalCost',
      label: 'Total cost',
      help: 'Enter the costs you want this margin view to include.',
      defaultValue: '70000',
      format: 'money',
    },
  ],
  markup: [
    {
      name: 'unitCost',
      label: 'Unit cost',
      help: 'Your cost for one unit, before the selling price is applied.',
      defaultValue: '700',
      format: 'money',
    },
    {
      name: 'sellingPrice',
      label: 'Selling price',
      help: 'The price charged for one unit, before any tax or discount scenario.',
      defaultValue: '1000',
      format: 'money',
    },
  ],
  'break-even': [
    {
      name: 'fixedCosts',
      label: 'Fixed costs',
      help: 'Costs for the selected period that do not change with units sold.',
      defaultValue: '100000',
      format: 'money',
    },
    {
      name: 'sellingPricePerUnit',
      label: 'Selling price per unit',
      help: 'Revenue received for one unit, before tax unless you include tax in your own assumption.',
      defaultValue: '1000',
      format: 'money',
    },
    {
      name: 'variableCostPerUnit',
      label: 'Variable cost per unit',
      help: 'Cost that changes with each additional unit sold.',
      defaultValue: '600',
      format: 'money',
    },
  ],
  pricing: [
    {
      name: 'unitCost',
      label: 'Unit cost',
      help: 'The cost base for one unit. Add all costs you want the price to recover.',
      defaultValue: '600',
      format: 'money',
    },
    {
      name: 'targetMargin',
      label: 'Target margin',
      help: 'Desired margin as a percentage of the pre-tax selling price, not markup on cost.',
      defaultValue: '40',
      format: 'percentage',
    },
    {
      name: 'discountPercent',
      label: 'Expected discount',
      help: 'Optional customer discount applied to the list price.',
      defaultValue: '10',
      required: false,
      format: 'percentage',
    },
    {
      name: 'taxRate',
      label: 'User-supplied tax rate',
      help: 'Optional arithmetic input. This tool does not determine whether any GST or tax rate applies.',
      defaultValue: '18',
      required: false,
      format: 'percentage',
    },
  ],
  'cash-flow': [
    {
      name: 'openingCash',
      label: 'Opening cash',
      help: 'Cash available at the start of the selected planning period.',
      defaultValue: '250000',
      format: 'money',
    },
    {
      name: 'cashInflows',
      label: 'Cash inflows',
      help: 'Expected cash actually received during the period.',
      defaultValue: '180000',
      format: 'money',
    },
    {
      name: 'cashOutflows',
      label: 'Operating cash outflows',
      help: 'Expected cash paid during the period for normal operations.',
      defaultValue: '150000',
      format: 'money',
    },
    {
      name: 'oneOffOutflows',
      label: 'One-off outflows',
      help: 'Exceptional cash payments you want to include in this scenario.',
      defaultValue: '10000',
      required: false,
      format: 'money',
    },
  ],
  'burn-rate': [
    {
      name: 'periodMonths',
      label: 'Period length in months',
      help: 'Use an explicit period so one-off items are not mistaken for a monthly trend.',
      defaultValue: '3',
      format: 'number',
    },
    {
      name: 'totalOutflows',
      label: 'Total cash outflows',
      help: 'All cash outflows recorded across the selected period.',
      defaultValue: '450000',
      format: 'money',
    },
    {
      name: 'totalInflows',
      label: 'Total cash inflows',
      help: 'All cash inflows received across the selected period.',
      defaultValue: '150000',
      format: 'money',
    },
  ],
  runway: [
    {
      name: 'currentCash',
      label: 'Current cash',
      help: 'Cash available for this planning scenario.',
      defaultValue: '900000',
      format: 'money',
    },
    {
      name: 'monthlyOutflows',
      label: 'Monthly cash outflows',
      help: 'Expected monthly cash paid at the current operating pace.',
      defaultValue: '300000',
      format: 'money',
    },
    {
      name: 'monthlyInflows',
      label: 'Monthly cash inflows',
      help: 'Expected monthly cash received at the current operating pace.',
      defaultValue: '100000',
      format: 'money',
    },
  ],
  'marketplace-margin': [
    {
      name: 'sellingPrice',
      label: 'Selling price',
      help: 'Customer selling price for one order.',
      defaultValue: '1500',
      format: 'money',
    },
    {
      name: 'productCost',
      label: 'Product cost',
      help: 'Cost of the product supplied in this order.',
      defaultValue: '600',
      format: 'money',
    },
    {
      name: 'platformFeePercent',
      label: 'Platform fee',
      help: 'User-supplied percentage charged on the selling price.',
      defaultValue: '18',
      format: 'percentage',
    },
    {
      name: 'shippingCost',
      label: 'Shipping cost',
      help: 'Fulfilment or shipping cost paid per order.',
      defaultValue: '90',
      format: 'money',
    },
    {
      name: 'paymentFeePercent',
      label: 'Payment fee',
      help: 'User-supplied payment fee percentage on the selling price.',
      defaultValue: '2',
      format: 'percentage',
    },
    {
      name: 'returnCost',
      label: 'Return allowance',
      help: 'Expected return-related cost per order.',
      defaultValue: '30',
      format: 'money',
    },
    {
      name: 'taxCost',
      label: 'Tax cost',
      help: 'User-supplied tax cost included for this scenario; classification is not assessed.',
      defaultValue: '0',
      required: false,
      format: 'money',
    },
  ],
  roas: [
    {
      name: 'adSpend',
      label: 'Ad spend',
      help: 'Advertising spend for the attribution window.',
      defaultValue: '50000',
      format: 'money',
    },
    {
      name: 'attributedRevenue',
      label: 'Attributed revenue',
      help: 'Revenue attributed by the ad platform; it may differ from collected revenue.',
      defaultValue: '200000',
      format: 'money',
    },
    {
      name: 'productCost',
      label: 'Product cost',
      help: 'Product or delivery cost connected to attributed orders.',
      defaultValue: '80000',
      format: 'money',
    },
    {
      name: 'otherVariableCosts',
      label: 'Other variable costs',
      help: 'Other costs that scale with the attributed revenue.',
      defaultValue: '20000',
      format: 'money',
    },
  ],
  'cod-cost': [
    {
      name: 'orderValue',
      label: 'Order value',
      help: 'Expected customer order value before the COD scenario costs below.',
      defaultValue: '1200',
      format: 'money',
    },
    {
      name: 'productCost',
      label: 'Product cost',
      help: 'Product cost for one order.',
      defaultValue: '500',
      format: 'money',
    },
    {
      name: 'codFee',
      label: 'COD collection fee',
      help: 'Cash-on-delivery fee charged per order.',
      defaultValue: '25',
      format: 'money',
    },
    {
      name: 'forwardShipping',
      label: 'Forward shipping',
      help: 'Shipping cost for sending the order to the customer.',
      defaultValue: '70',
      format: 'money',
    },
    {
      name: 'returnShipping',
      label: 'Return shipping',
      help: 'Shipping cost incurred when an order returns.',
      defaultValue: '70',
      format: 'money',
    },
    {
      name: 'rtoRate',
      label: 'RTO rate',
      help: 'Expected return-to-origin rate from 0% to 100%.',
      defaultValue: '8',
      format: 'percentage',
    },
    {
      name: 'returnLoss',
      label: 'Return loss per RTO',
      help: 'Expected product or handling loss when an order returns.',
      defaultValue: '40',
      format: 'money',
    },
    {
      name: 'cashCycleCost',
      label: 'Cash-cycle cost',
      help: 'User-supplied financing or working-capital cost per order.',
      defaultValue: '10',
      format: 'money',
    },
  ],
};

export const businessCalculatorInputSchemaByKind = Object.fromEntries(
  businessCalculatorKinds.map((kind) => [kind, businessCalculatorInputSchema]),
) as Record<BusinessCalculatorKind, typeof businessCalculatorInputSchema>;

function fieldLabel(kind: BusinessCalculatorKind, name: string) {
  return businessCalculatorFields[kind].find((field) => field.name === name)?.label ?? name;
}

function parseField(input: BusinessCalculatorInput, kind: BusinessCalculatorKind, name: string) {
  const raw = input[name] ?? '';
  try {
    const value = parseDecimal(raw);
    if (value.lt(0)) {
      throw new CalculationInputError(
        name,
        'must_not_be_negative',
        `${fieldLabel(kind, name)} cannot be negative.`,
      );
    }
    if (value.gt('999999999999999.99')) {
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

function parsePercentage(input: BusinessCalculatorInput, kind: BusinessCalculatorKind, name: string) {
  const value = parseField(input, kind, name);
  if (value.gt(100)) {
    throw new CalculationInputError(
      name,
      'percentage_out_of_range',
      `${fieldLabel(kind, name)} must be between 0% and 100%.`,
    );
  }
  return value;
}

function parsePositive(input: BusinessCalculatorInput, kind: BusinessCalculatorKind, name: string) {
  const value = parseField(input, kind, name);
  if (value.lte(0)) {
    throw new CalculationInputError(
      name,
      'must_be_positive',
      `${fieldLabel(kind, name)} must be greater than zero.`,
    );
  }
  return value;
}

function validateWithCalculationError(
  kind: BusinessCalculatorKind,
  input: BusinessCalculatorInput,
): ValidationResult<BusinessCalculatorInput> {
  const errors: FieldError[] = [];
  const fields = businessCalculatorFields[kind];
  for (const field of fields) {
    const raw = (input[field.name] ?? '').trim();
    if (!raw && field.required === false) continue;
    try {
      if (field.format === 'percentage') parsePercentage(input, kind, field.name);
      else parseField(input, kind, field.name);
    } catch (error) {
      errors.push({
        field: error instanceof CalculationInputError ? error.field : field.name,
        code: error instanceof CalculationInputError ? error.code : 'invalid_number',
        message: error instanceof Error ? error.message : `Enter a valid ${field.label.toLowerCase()}.`,
      });
    }
  }

  const requiredPositive: Partial<Record<BusinessCalculatorKind, string[]>> = {
    margin: ['revenue'],
    markup: ['unitCost'],
    'break-even': ['sellingPricePerUnit'],
    pricing: ['unitCost'],
    'burn-rate': ['periodMonths'],
    'marketplace-margin': ['sellingPrice'],
    roas: ['adSpend'],
    'cod-cost': ['orderValue'],
  };
  for (const field of requiredPositive[kind] ?? []) {
    try {
      parsePositive(input, kind, field);
    } catch (error) {
      if (!errors.some((candidate) => candidate.field === field)) {
        errors.push({
          field,
          code: error instanceof CalculationInputError ? error.code : 'must_be_positive',
          message:
            error instanceof Error ? error.message : `${fieldLabel(kind, field)} must be greater than zero.`,
        });
      }
    }
  }

  if (kind === 'break-even') {
    try {
      const price = parsePositive(input, kind, 'sellingPricePerUnit');
      const variableCost = parseField(input, kind, 'variableCostPerUnit');
      if (price.lte(variableCost)) {
        errors.push({
          field: 'variableCostPerUnit',
          code: 'no_contribution',
          message: 'Variable cost must be lower than selling price to calculate break-even.',
        });
      }
    } catch {
      // Field errors above are sufficient.
    }
  }

  if (kind === 'pricing') {
    try {
      const targetMargin = parsePercentage(input, kind, 'targetMargin');
      if (targetMargin.gte(100)) {
        errors.push({
          field: 'targetMargin',
          code: 'margin_out_of_range',
          message: 'Target margin must be below 100%.',
        });
      }
    } catch {
      // Field errors above are sufficient.
    }
    try {
      const discount = parsePercentage(input, kind, 'discountPercent');
      if (discount.gte(100)) {
        errors.push({
          field: 'discountPercent',
          code: 'discount_out_of_range',
          message: 'Expected discount must be below 100%.',
        });
      }
    } catch {
      // Field errors above are sufficient.
    }
  }

  return errors.length === 0
    ? {
        success: true,
        data: Object.fromEntries(
          fields.map((field) => [
            field.name,
            (input[field.name] ?? '').trim() || (field.required === false ? '0' : ''),
          ]),
        ),
      }
    : { success: false, errors };
}

export function validateBusinessCalculatorInput(
  kind: BusinessCalculatorKind,
  input: BusinessCalculatorInput,
): ValidationResult<BusinessCalculatorInput> {
  const parsed = businessCalculatorInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      errors: [{ field: 'form', code: 'invalid_input', message: 'Enter values for this scenario.' }],
    };
  }
  return validateWithCalculationError(kind, parsed.data);
}

function money(value: Decimal): string {
  return decimalToString(value);
}

function percentage(value: Decimal): string {
  return decimalToString(value);
}

function metric(label: string, value: Decimal | string, format: BusinessMetricFormat): BusinessMetric {
  return { label, value: typeof value === 'string' ? value : decimalToString(value), format };
}

function result(
  kind: BusinessCalculatorKind,
  headline: BusinessMetric,
  tone: BusinessCalculationResult['tone'],
  detail: string,
  details: BusinessMetric[],
): BusinessCalculationResult {
  return { kind, headline, tone, detail, details, exportRows: [headline, ...details] };
}

export function calculateBusinessEconomics(
  kind: BusinessCalculatorKind,
  input: BusinessCalculatorInput,
): BusinessCalculationResult {
  const validation = validateBusinessCalculatorInput(kind, input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new CalculationInputError(
      first?.field ?? 'form',
      first?.code ?? 'invalid_input',
      first?.message ?? 'Check the inputs.',
    );
  }
  const values = validation.data;

  if (kind === 'margin') {
    const revenue = parsePositive(values, kind, 'revenue');
    const totalCost = parseField(values, kind, 'totalCost');
    const profit = revenue.minus(totalCost);
    const margin = profit.div(revenue).times(100);
    return result(
      kind,
      metric('Contribution margin', percentage(margin), 'percentage'),
      profit.gt(0) ? 'positive' : profit.lt(0) ? 'negative' : 'neutral',
      'Revenue less the selected costs, expressed as a percentage of revenue.',
      [
        metric('Revenue', money(revenue), 'currency'),
        metric('Total cost', money(totalCost), 'currency'),
        metric('Contribution profit', money(profit), 'currency'),
      ],
    );
  }

  if (kind === 'markup') {
    const unitCost = parsePositive(values, kind, 'unitCost');
    const sellingPrice = parseField(values, kind, 'sellingPrice');
    const profit = sellingPrice.minus(unitCost);
    const markup = profit.div(unitCost).times(100);
    const margin = sellingPrice.isZero() ? new Decimal(0) : profit.div(sellingPrice).times(100);
    return result(
      kind,
      metric('Markup', percentage(markup), 'percentage'),
      profit.gt(0) ? 'positive' : profit.lt(0) ? 'negative' : 'neutral',
      'Markup is profit as a percentage of cost; it is not the same as margin.',
      [
        metric('Unit cost', money(unitCost), 'currency'),
        metric('Selling price', money(sellingPrice), 'currency'),
        metric('Profit per unit', money(profit), 'currency'),
        metric('Margin', percentage(margin), 'percentage'),
      ],
    );
  }

  if (kind === 'break-even') {
    const fixedCosts = parseField(values, kind, 'fixedCosts');
    const price = parsePositive(values, kind, 'sellingPricePerUnit');
    const variableCost = parseField(values, kind, 'variableCostPerUnit');
    const contribution = price.minus(variableCost);
    if (contribution.lte(0))
      throw new CalculationInputError(
        'variableCostPerUnit',
        'no_contribution',
        'Variable cost must be lower than selling price.',
      );
    const exactUnits = fixedCosts.div(contribution);
    const wholeUnits = exactUnits.ceil();
    return result(
      kind,
      metric('Break-even units', wholeUnits, 'number'),
      'neutral',
      'Minimum whole units needed to cover the selected fixed costs.',
      [
        metric('Exact break-even units', exactUnits, 'number'),
        metric('Contribution per unit', money(contribution), 'currency'),
        metric('Break-even revenue', money(wholeUnits.times(price)), 'currency'),
      ],
    );
  }

  if (kind === 'pricing') {
    const unitCost = parsePositive(values, kind, 'unitCost');
    const targetMargin = parsePercentage(values, kind, 'targetMargin');
    const discount = parsePercentage(values, kind, 'discountPercent');
    const taxRate = parsePercentage(values, kind, 'taxRate');
    if (targetMargin.gte(100))
      throw new CalculationInputError(
        'targetMargin',
        'margin_out_of_range',
        'Target margin must be below 100%.',
      );
    if (discount.gte(100))
      throw new CalculationInputError(
        'discountPercent',
        'discount_out_of_range',
        'Expected discount must be below 100%.',
      );
    const preTaxPrice = unitCost.div(new Decimal(1).minus(targetMargin.div(100)));
    const listPrice = preTaxPrice.div(new Decimal(1).minus(discount.div(100)));
    const discountAmount = listPrice.times(discount.div(100));
    const discountedPreTax = listPrice.minus(discountAmount);
    const taxAmount = discountedPreTax.times(taxRate.div(100));
    const customerPrice = discountedPreTax.plus(taxAmount);
    return result(
      kind,
      metric('Recommended customer price', money(customerPrice), 'currency'),
      'positive',
      'A cost-plus scenario using a target margin, expected discount and user-supplied tax rate.',
      [
        metric('Target pre-tax price', money(preTaxPrice), 'currency'),
        metric('List price before discount', money(listPrice), 'currency'),
        metric('Discount amount', money(discountAmount), 'currency'),
        metric('Tax amount', money(taxAmount), 'currency'),
      ],
    );
  }

  if (kind === 'cash-flow') {
    const openingCash = parseField(values, kind, 'openingCash');
    const inflows = parseField(values, kind, 'cashInflows');
    const outflows = parseField(values, kind, 'cashOutflows');
    const oneOff = parseField(values, kind, 'oneOffOutflows');
    const netCashFlow = inflows.minus(outflows).minus(oneOff);
    const closingCash = openingCash.plus(netCashFlow);
    return result(
      kind,
      metric('Closing cash', money(closingCash), 'currency'),
      closingCash.gt(0) ? 'positive' : closingCash.lt(0) ? 'negative' : 'neutral',
      'A planning forecast from opening cash and the selected inflow/outflow assumptions.',
      [
        metric('Opening cash', money(openingCash), 'currency'),
        metric('Net cash flow', money(netCashFlow), 'currency'),
        metric('Cash inflows', money(inflows), 'currency'),
        metric('Total outflows', money(outflows.plus(oneOff)), 'currency'),
      ],
    );
  }

  if (kind === 'burn-rate') {
    const months = parsePositive(values, kind, 'periodMonths');
    const outflows = parseField(values, kind, 'totalOutflows');
    const inflows = parseField(values, kind, 'totalInflows');
    const netCashChange = inflows.minus(outflows);
    const grossBurn = outflows.div(months);
    const netBurn = outflows.minus(inflows).div(months);
    return result(
      kind,
      metric('Net burn per month', money(netBurn), 'currency'),
      netBurn.gt(0) ? 'negative' : 'positive',
      netBurn.gt(0)
        ? 'Average monthly cash consumption after inflows.'
        : 'The scenario has no net monthly burn at this pace.',
      [
        metric('Gross burn per month', money(grossBurn), 'currency'),
        metric('Net cash change', money(netCashChange), 'currency'),
        metric('Period', decimalToString(months), 'number'),
      ],
    );
  }

  if (kind === 'runway') {
    const currentCash = parseField(values, kind, 'currentCash');
    const outflows = parseField(values, kind, 'monthlyOutflows');
    const inflows = parseField(values, kind, 'monthlyInflows');
    const netBurn = outflows.minus(inflows);
    const runway = netBurn.gt(0) ? currentCash.div(netBurn) : null;
    return result(
      kind,
      runway ? metric('Runway', money(runway), 'number') : metric('Runway', 'No burn', 'text'),
      runway && runway.lt(3) ? 'negative' : 'neutral',
      runway
        ? 'Estimated months until the current cash balance is consumed at this net burn.'
        : 'This scenario does not consume cash at the selected monthly pace.',
      [
        metric('Current cash', money(currentCash), 'currency'),
        metric('Net burn per month', money(netBurn), 'currency'),
        metric('Monthly outflows', money(outflows), 'currency'),
        metric('Monthly inflows', money(inflows), 'currency'),
      ],
    );
  }

  if (kind === 'marketplace-margin') {
    const sellingPrice = parsePositive(values, kind, 'sellingPrice');
    const productCost = parseField(values, kind, 'productCost');
    const platformRate = parsePercentage(values, kind, 'platformFeePercent');
    const shipping = parseField(values, kind, 'shippingCost');
    const paymentRate = parsePercentage(values, kind, 'paymentFeePercent');
    const returnCost = parseField(values, kind, 'returnCost');
    const taxCost = parseField(values, kind, 'taxCost');
    const platformFee = sellingPrice.times(platformRate.div(100));
    const paymentFee = sellingPrice.times(paymentRate.div(100));
    const totalCost = productCost
      .plus(platformFee)
      .plus(shipping)
      .plus(paymentFee)
      .plus(returnCost)
      .plus(taxCost);
    const profit = sellingPrice.minus(totalCost);
    const margin = profit.div(sellingPrice).times(100);
    return result(
      kind,
      metric('Marketplace contribution margin', percentage(margin), 'percentage'),
      profit.gt(0) ? 'positive' : profit.lt(0) ? 'negative' : 'neutral',
      'Vendor-neutral contribution economics using user-supplied platform, fulfilment, payment, return and tax assumptions.',
      [
        metric('Contribution profit', money(profit), 'currency'),
        metric('Platform fee', money(platformFee), 'currency'),
        metric('Payment fee', money(paymentFee), 'currency'),
        metric('Total cost', money(totalCost), 'currency'),
      ],
    );
  }

  if (kind === 'roas') {
    const adSpend = parsePositive(values, kind, 'adSpend');
    const revenue = parseField(values, kind, 'attributedRevenue');
    const productCost = parseField(values, kind, 'productCost');
    const otherCosts = parseField(values, kind, 'otherVariableCosts');
    const roas = revenue.div(adSpend);
    const contribution = revenue.minus(adSpend).minus(productCost).minus(otherCosts);
    const contributionMargin = revenue.isZero() ? new Decimal(0) : contribution.div(revenue).times(100);
    const variableRate = revenue.isZero() ? new Decimal(0) : productCost.plus(otherCosts).div(revenue);
    const breakEvenRoas =
      revenue.gt(0) && variableRate.lt(1) ? new Decimal(1).div(new Decimal(1).minus(variableRate)) : null;
    return result(
      kind,
      metric('ROAS', roas, 'multiple'),
      contribution.gt(0) ? 'positive' : contribution.lt(0) ? 'negative' : 'neutral',
      'Revenue attributed by an ad platform divided by ad spend; attribution is not proof of collected cash.',
      [
        metric('Attributed revenue', money(revenue), 'currency'),
        metric('Contribution profit', money(contribution), 'currency'),
        metric('Contribution margin', percentage(contributionMargin), 'percentage'),
        metric(
          'Break-even ROAS',
          breakEvenRoas ? decimalToString(breakEvenRoas) : 'Not available',
          breakEvenRoas ? 'multiple' : 'text',
        ),
      ],
    );
  }

  const orderValue = parsePositive(values, kind, 'orderValue');
  const productCost = parseField(values, kind, 'productCost');
  const codFee = parseField(values, kind, 'codFee');
  const forwardShipping = parseField(values, kind, 'forwardShipping');
  const returnShipping = parseField(values, kind, 'returnShipping');
  const rtoRate = parsePercentage(values, kind, 'rtoRate');
  const returnLoss = parseField(values, kind, 'returnLoss');
  const cashCycleCost = parseField(values, kind, 'cashCycleCost');
  const expectedRtoCost = rtoRate.div(100).times(returnShipping.plus(returnLoss));
  const expectedCost = productCost
    .plus(codFee)
    .plus(forwardShipping)
    .plus(expectedRtoCost)
    .plus(cashCycleCost);
  const expectedContribution = orderValue.minus(expectedCost);
  const expectedMargin = expectedContribution.div(orderValue).times(100);
  return result(
    kind,
    metric(
      'Expected COD cost',
      money(codFee.plus(forwardShipping).plus(expectedRtoCost).plus(cashCycleCost)),
      'currency',
    ),
    expectedContribution.gt(0) ? 'positive' : expectedContribution.lt(0) ? 'negative' : 'neutral',
    'Expected-value estimate using the user-supplied RTO rate and per-order cost assumptions.',
    [
      metric('Expected contribution', money(expectedContribution), 'currency'),
      metric('Expected RTO cost', money(expectedRtoCost), 'currency'),
      metric('Expected contribution margin', percentage(expectedMargin), 'percentage'),
      metric('Product cost', money(productCost), 'currency'),
    ],
  );
}
