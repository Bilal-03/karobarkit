import { z } from 'zod';
import Decimal from 'decimal.js';

import { decimalToString, parseDecimal } from '@/domain/formatting/decimal';

import { addFieldError, fieldError, validationFromSchema } from './shared';
import { CalculationInputError, type FieldError, type ValidationResult } from '../types';

export const discountInputSchema = z.object({
  originalPrice: z.string(),
  firstDiscountPercent: z.string(),
  secondDiscountPercent: z.string(),
});

export type DiscountInput = z.infer<typeof discountInputSchema>;

export interface DiscountResult {
  originalPrice: string;
  firstDiscountPercent: string;
  secondDiscountPercent: string;
  firstSavings: string;
  secondSavings: string;
  totalSavings: string;
  finalPrice: string;
  effectiveDiscountPercent: string;
}

function parseDiscount(errors: FieldError[], field: string, value: string, optional = false) {
  if (optional && value.trim() === '') return new Decimal(0);
  try {
    const parsed = parseDecimal(value);
    if (parsed.lt(0) || parsed.gt(100)) {
      errors.push(fieldError(field, 'out_of_range', 'Discount must be between 0% and 100%.'));
      return null;
    }
    return parsed;
  } catch (error) {
    addFieldError(errors, field, error, 'Enter a valid discount percentage.');
    return null;
  }
}

export function validateDiscountInput(input: DiscountInput): ValidationResult<DiscountInput> {
  const parsed = validationFromSchema(discountInputSchema, input);
  if (!parsed.success) return parsed;
  const errors: FieldError[] = [];
  let original: Decimal | null = null;
  try {
    original = parseDecimal(parsed.data.originalPrice);
    if (original.lte(0))
      errors.push(
        fieldError('originalPrice', 'must_be_positive', 'Original price must be greater than zero.'),
      );
  } catch (error) {
    addFieldError(errors, 'originalPrice', error, 'Enter a valid original price.');
  }
  parseDiscount(errors, 'firstDiscountPercent', parsed.data.firstDiscountPercent);
  parseDiscount(errors, 'secondDiscountPercent', parsed.data.secondDiscountPercent, true);
  return errors.length === 0 ? parsed : { success: false, errors };
}

export function calculateDiscount(input: DiscountInput): DiscountResult {
  const validation = validateDiscountInput(input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new CalculationInputError(first.field, first.code, first.message);
  }
  const original = parseDecimal(validation.data.originalPrice);
  const firstPercent = parseDiscountValue(validation.data.firstDiscountPercent);
  const secondPercent = parseDiscountValue(validation.data.secondDiscountPercent);
  const firstPrice = original.times(new Decimal(1).minus(firstPercent.div(100)));
  const finalPrice = firstPrice.times(new Decimal(1).minus(secondPercent.div(100)));
  const firstSavings = original.minus(firstPrice);
  const secondSavings = firstPrice.minus(finalPrice);
  const totalSavings = original.minus(finalPrice);
  const effective = totalSavings.div(original).times(100);
  return {
    originalPrice: decimalToString(original),
    firstDiscountPercent: decimalToString(firstPercent),
    secondDiscountPercent: decimalToString(secondPercent),
    firstSavings: decimalToString(firstSavings),
    secondSavings: decimalToString(secondSavings),
    totalSavings: decimalToString(totalSavings),
    finalPrice: decimalToString(finalPrice),
    effectiveDiscountPercent: decimalToString(effective),
  };
}

function parseDiscountValue(value: string) {
  return value.trim() === '' ? new Decimal(0) : parseDecimal(value);
}
