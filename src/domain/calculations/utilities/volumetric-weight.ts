import { z } from 'zod';
import Decimal from 'decimal.js';

import { decimalToString, parseDecimal } from '@/domain/formatting/decimal';

import { addFieldError, fieldError, validationFromSchema } from './shared';
import { CalculationInputError, type FieldError, type ValidationResult } from '../types';

export const dimensionUnits = ['cm', 'in'] as const;
export type DimensionUnit = (typeof dimensionUnits)[number];
export const actualWeightUnits = ['kg', 'lb'] as const;
export type ActualWeightUnit = (typeof actualWeightUnits)[number];

export const volumetricWeightInputSchema = z.object({
  length: z.string(),
  width: z.string(),
  height: z.string(),
  dimensionUnit: z.enum(dimensionUnits),
  actualWeight: z.string(),
  actualWeightUnit: z.enum(actualWeightUnits),
  divisor: z.string(),
});

export type VolumetricWeightInput = z.infer<typeof volumetricWeightInputSchema>;

export interface VolumetricWeightResult {
  dimensionsCm: string;
  dimensionalWeightKg: string;
  actualWeightKg: string;
  chargeableWeightKg: string;
  divisor: string;
  basis: 'dimensional' | 'actual';
}

function positive(errors: FieldError[], field: string, value: string, label: string) {
  try {
    const parsed = parseDecimal(value);
    if (parsed.lte(0)) {
      errors.push(fieldError(field, 'must_be_positive', `${label} must be greater than zero.`));
      return null;
    }
    return parsed;
  } catch (error) {
    addFieldError(errors, field, error, `Enter a valid ${label.toLowerCase()}.`);
    return null;
  }
}

function nonNegative(errors: FieldError[], field: string, value: string, label: string) {
  try {
    const parsed = parseDecimal(value);
    if (parsed.lt(0)) {
      errors.push(fieldError(field, 'must_be_non_negative', `${label} cannot be negative.`));
      return null;
    }
    return parsed;
  } catch (error) {
    addFieldError(errors, field, error, `Enter a valid ${label.toLowerCase()}.`);
    return null;
  }
}

export function validateVolumetricWeightInput(
  input: VolumetricWeightInput,
): ValidationResult<VolumetricWeightInput> {
  const parsed = validationFromSchema(volumetricWeightInputSchema, input);
  if (!parsed.success) return parsed;
  const errors: FieldError[] = [];
  positive(errors, 'length', parsed.data.length, 'Length');
  positive(errors, 'width', parsed.data.width, 'Width');
  positive(errors, 'height', parsed.data.height, 'Height');
  nonNegative(errors, 'actualWeight', parsed.data.actualWeight, 'Actual weight');
  positive(errors, 'divisor', parsed.data.divisor, 'Divisor');
  return errors.length === 0 ? parsed : { success: false, errors };
}

export function calculateVolumetricWeight(input: VolumetricWeightInput): VolumetricWeightResult {
  const validation = validateVolumetricWeightInput(input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new CalculationInputError(first.field, first.code, first.message);
  }
  const unitFactor = validation.data.dimensionUnit === 'in' ? new Decimal('2.54') : new Decimal(1);
  const length = parseDecimal(validation.data.length).times(unitFactor);
  const width = parseDecimal(validation.data.width).times(unitFactor);
  const height = parseDecimal(validation.data.height).times(unitFactor);
  const actualWeight = parseDecimal(validation.data.actualWeight).times(
    validation.data.actualWeightUnit === 'lb' ? new Decimal('0.45359237') : 1,
  );
  const dimensional = length.times(width).times(height).div(parseDecimal(validation.data.divisor));
  const chargeable = Decimal.max(dimensional, actualWeight);
  return {
    dimensionsCm: `${decimalToString(length)} × ${decimalToString(width)} × ${decimalToString(height)}`,
    dimensionalWeightKg: decimalToString(dimensional),
    actualWeightKg: decimalToString(actualWeight),
    chargeableWeightKg: decimalToString(chargeable),
    divisor: decimalToString(parseDecimal(validation.data.divisor)),
    basis: dimensional.gte(actualWeight) ? 'dimensional' : 'actual',
  };
}
