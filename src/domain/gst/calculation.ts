import Decimal from 'decimal.js';

import { decimalToString, parseDecimal, type DecimalInput } from '@/domain/formatting/decimal';
import { CalculationInputError } from '@/domain/calculations/types';

export const GST_CURRENCY_DECIMALS = 2;
export const GST_AMOUNT_MAX = '999999999999999.99';
export const GST_RATE_MAX = '100';
export const GST_RATE_DECIMAL_PLACES = 2;

export type GstCalculationMode = 'exclusive' | 'inclusive';
export type GstSupplyType = 'intra-state' | 'inter-state' | 'unspecified';

export interface GstCalculationInput {
  amount: DecimalInput;
  ratePercent: DecimalInput;
  mode: GstCalculationMode;
  supplyType: GstSupplyType;
}

export interface GstCalculationResult {
  enteredAmount: string;
  taxableValue: string;
  gstAmount: string;
  totalAmount: string;
  cgstAmount?: string;
  sgstOrUtgstAmount?: string;
  igstAmount?: string;
  ratePercent: string;
  calculationMode: GstCalculationMode;
  supplyType: GstSupplyType;
  roundingAdjustment?: string;
  roundingOccurred: boolean;
}

function currency(value: Decimal) {
  return value.toDecimalPlaces(GST_CURRENCY_DECIMALS, Decimal.ROUND_HALF_UP);
}

function parseCurrency(value: DecimalInput, field: string) {
  let parsed: Decimal;
  try {
    parsed = parseDecimal(value);
  } catch (error) {
    throw new CalculationInputError(
      field,
      'invalid_number',
      error instanceof Error ? error.message : 'Enter a valid finite number.',
    );
  }
  if (parsed.decimalPlaces() > GST_CURRENCY_DECIMALS) {
    throw new CalculationInputError(
      field,
      'unsafe_precision',
      'Currency amounts can have at most two decimal places.',
    );
  }
  if (parsed.lte(0)) {
    throw new CalculationInputError(field, 'must_be_positive', 'Amount must be greater than zero.');
  }
  if (parsed.gt(parseDecimal(GST_AMOUNT_MAX))) {
    throw new CalculationInputError(field, 'too_large', 'Amount is above the supported practical maximum.');
  }
  return parsed;
}

function parseRate(value: DecimalInput) {
  let parsed: Decimal;
  try {
    parsed = parseDecimal(value);
  } catch (error) {
    throw new CalculationInputError(
      'ratePercent',
      'invalid_rate',
      error instanceof Error ? error.message : 'Enter a valid finite percentage.',
    );
  }
  if (parsed.decimalPlaces() > GST_RATE_DECIMAL_PLACES) {
    throw new CalculationInputError(
      'ratePercent',
      'unsafe_precision',
      'Rates can have at most two decimal places.',
    );
  }
  if (parsed.lt(0)) {
    throw new CalculationInputError('ratePercent', 'negative_rate', 'GST rate cannot be negative.');
  }
  if (parsed.gt(parseDecimal(GST_RATE_MAX))) {
    throw new CalculationInputError('ratePercent', 'rate_too_large', 'GST rate must be 100% or less.');
  }
  return parsed;
}

function assertChoice(input: GstCalculationInput) {
  if (!['exclusive', 'inclusive'].includes(input.mode)) {
    throw new CalculationInputError('mode', 'invalid_mode', 'Choose GST exclusive or GST inclusive.');
  }
  if (!['intra-state', 'inter-state', 'unspecified'].includes(input.supplyType)) {
    throw new CalculationInputError('supplyType', 'invalid_supply_type', 'Choose a valid supply type.');
  }
}

export function calculateGst(input: GstCalculationInput): GstCalculationResult {
  assertChoice(input);
  const enteredAmount = parseCurrency(input.amount, 'amount');
  const ratePercent = parseRate(input.ratePercent);
  const rateFactor = ratePercent.div(100);
  let taxableValue: Decimal;
  let gstAmount: Decimal;
  let totalAmount: Decimal;
  let rawGstAmount: Decimal;

  if (input.mode === 'exclusive') {
    taxableValue = currency(enteredAmount);
    rawGstAmount = taxableValue.times(rateFactor);
    gstAmount = currency(rawGstAmount);
    totalAmount = currency(taxableValue.plus(gstAmount));
  } else {
    totalAmount = currency(enteredAmount);
    const rawTaxableValue = enteredAmount.div(new Decimal(1).plus(rateFactor));
    rawGstAmount = enteredAmount.minus(rawTaxableValue);
    taxableValue = currency(rawTaxableValue);
    gstAmount = currency(totalAmount.minus(taxableValue));
  }

  const result: GstCalculationResult = {
    enteredAmount: decimalToString(enteredAmount),
    taxableValue: taxableValue.toFixed(GST_CURRENCY_DECIMALS),
    gstAmount: gstAmount.toFixed(GST_CURRENCY_DECIMALS),
    totalAmount: totalAmount.toFixed(GST_CURRENCY_DECIMALS),
    ratePercent: decimalToString(ratePercent),
    calculationMode: input.mode,
    supplyType: input.supplyType,
    roundingOccurred: !rawGstAmount.eq(gstAmount),
  };

  if (result.roundingOccurred) {
    result.roundingAdjustment = decimalToString(rawGstAmount.minus(gstAmount));
  }

  if (input.supplyType === 'intra-state') {
    const cgst = currency(gstAmount.div(2));
    const sgstOrUtgst = currency(gstAmount.minus(cgst));
    result.cgstAmount = cgst.toFixed(GST_CURRENCY_DECIMALS);
    result.sgstOrUtgstAmount = sgstOrUtgst.toFixed(GST_CURRENCY_DECIMALS);
  }

  if (input.supplyType === 'inter-state') {
    result.igstAmount = result.gstAmount;
  }

  return result;
}
