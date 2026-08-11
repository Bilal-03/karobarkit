import { z } from 'zod';
import { decimalToString, parseDecimal } from '@/domain/formatting/decimal';

import { addFieldError, fieldError, validationFromSchema } from './shared';
import { CalculationInputError, type FieldError, type ValidationResult } from '../types';

export const percentageModes = ['percentage-of', 'what-percent', 'percentage-change'] as const;
export type PercentageMode = (typeof percentageModes)[number];

export const percentageInputSchema = z.object({
  mode: z.enum(percentageModes),
  base: z.string(),
  value: z.string(),
  percentage: z.string(),
});

export type PercentageInput = z.infer<typeof percentageInputSchema>;

export interface PercentageResult {
  mode: PercentageMode;
  base: string;
  value: string;
  percentage: string;
  result: string;
  resultUnit: 'number' | 'percentage';
  formula: string;
  direction: 'increase' | 'decrease' | 'flat';
}

function parseRequired(errors: FieldError[], field: string, value: string, label: string) {
  try {
    return parseDecimal(value);
  } catch (error) {
    addFieldError(errors, field, error, `Enter a valid ${label.toLowerCase()}.`);
    return null;
  }
}

export function validatePercentageInput(input: PercentageInput): ValidationResult<PercentageInput> {
  const parsed = validationFromSchema(percentageInputSchema, input);
  if (!parsed.success) return parsed;

  const errors: FieldError[] = [];
  const base = parseRequired(errors, 'base', parsed.data.base, 'base value');
  const needsValue = parsed.data.mode !== 'percentage-of';
  const needsPercentage = parsed.data.mode === 'percentage-of';
  const value = needsValue ? parseRequired(errors, 'value', parsed.data.value, 'value') : null;
  const percentage = needsPercentage
    ? parseRequired(errors, 'percentage', parsed.data.percentage, 'percentage')
    : null;

  if (base && parsed.data.mode !== 'percentage-of' && base.isZero()) {
    errors.push(fieldError('base', 'zero_denominator', 'Base value must not be zero for this mode.'));
  }
  if (percentage && !percentage.isFinite()) {
    errors.push(fieldError('percentage', 'invalid_input', 'Enter a finite percentage.'));
  }
  if (value && !value.isFinite()) {
    errors.push(fieldError('value', 'invalid_input', 'Enter a finite value.'));
  }

  return errors.length === 0 ? parsed : { success: false, errors };
}

export function calculatePercentage(input: PercentageInput): PercentageResult {
  const validation = validatePercentageInput(input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new CalculationInputError(first.field, first.code, first.message);
  }

  const base = parseDecimal(validation.data.base);
  const value = parseDecimal(validation.data.value || '0');
  const percentage = parseDecimal(validation.data.percentage || '0');
  if (validation.data.mode === 'percentage-of') {
    const result = base.times(percentage).div(100);
    return {
      mode: validation.data.mode,
      base: decimalToString(base),
      value: decimalToString(result),
      percentage: decimalToString(percentage),
      result: decimalToString(result),
      resultUnit: 'number',
      formula: `${decimalToString(base)} × ${decimalToString(percentage)} ÷ 100 = ${decimalToString(result)}`,
      direction: result.gt(0) ? 'increase' : result.lt(0) ? 'decrease' : 'flat',
    };
  }

  if (validation.data.mode === 'what-percent') {
    const result = value.div(base).times(100);
    return {
      mode: validation.data.mode,
      base: decimalToString(base),
      value: decimalToString(value),
      percentage: decimalToString(result),
      result: decimalToString(result),
      resultUnit: 'percentage',
      formula: `${decimalToString(value)} ÷ ${decimalToString(base)} × 100 = ${decimalToString(result)}%`,
      direction: result.gt(0) ? 'increase' : result.lt(0) ? 'decrease' : 'flat',
    };
  }

  const result = value.minus(base).div(base).times(100);
  return {
    mode: validation.data.mode,
    base: decimalToString(base),
    value: decimalToString(value),
    percentage: decimalToString(result),
    result: decimalToString(result),
    resultUnit: 'percentage',
    formula: `(${decimalToString(value)} − ${decimalToString(base)}) ÷ ${decimalToString(base)} × 100 = ${decimalToString(result)}%`,
    direction: result.gt(0) ? 'increase' : result.lt(0) ? 'decrease' : 'flat',
  };
}
