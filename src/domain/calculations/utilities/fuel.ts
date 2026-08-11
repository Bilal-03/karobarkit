import { z } from 'zod';
import Decimal from 'decimal.js';

import { decimalToString, parseDecimal } from '@/domain/formatting/decimal';

import { addFieldError, fieldError, validationFromSchema } from './shared';
import { CalculationInputError, type FieldError, type ValidationResult } from '../types';

export const fuelDistanceUnits = ['km', 'mi'] as const;
export type FuelDistanceUnit = (typeof fuelDistanceUnits)[number];
export const fuelMileageUnits = ['km-per-litre', 'miles-per-gallon'] as const;
export type FuelMileageUnit = (typeof fuelMileageUnits)[number];

export const fuelInputSchema = z.object({
  distance: z.string(),
  distanceUnit: z.enum(fuelDistanceUnits),
  mileage: z.string(),
  mileageUnit: z.enum(fuelMileageUnits),
  fuelPricePerLitre: z.string(),
  trips: z.string(),
  markupPercent: z.string(),
});

export type FuelInput = z.infer<typeof fuelInputSchema>;

export interface FuelResult {
  distanceKm: string;
  mileageKmPerLitre: string;
  trips: string;
  litres: string;
  fuelCost: string;
  markupPercent: string;
  customerCost: string;
}

function parseNonNegative(
  errors: FieldError[],
  field: string,
  value: string,
  label: string,
  positive = false,
) {
  try {
    const parsed = parseDecimal(value);
    if (parsed.lt(0) || (positive && parsed.lte(0))) {
      errors.push(
        fieldError(
          field,
          positive ? 'must_be_positive' : 'must_be_non_negative',
          `${label} must be ${positive ? 'greater than zero' : 'zero or greater'}.`,
        ),
      );
      return null;
    }
    return parsed;
  } catch (error) {
    addFieldError(errors, field, error, `Enter a valid ${label.toLowerCase()}.`);
    return null;
  }
}

function parseTrips(errors: FieldError[], value: string) {
  const parsed = parseNonNegative(errors, 'trips', value, 'Trip count', true);
  if (parsed && !parsed.isInteger())
    errors.push(fieldError('trips', 'must_be_integer', 'Trip count must be a whole number.'));
  return parsed;
}

export function validateFuelInput(input: FuelInput): ValidationResult<FuelInput> {
  const parsed = validationFromSchema(fuelInputSchema, input);
  if (!parsed.success) return parsed;
  const errors: FieldError[] = [];
  parseNonNegative(errors, 'distance', parsed.data.distance, 'Distance');
  parseNonNegative(errors, 'mileage', parsed.data.mileage, 'Mileage', true);
  parseNonNegative(errors, 'fuelPricePerLitre', parsed.data.fuelPricePerLitre, 'Fuel price');
  parseTrips(errors, parsed.data.trips);
  parseNonNegative(errors, 'markupPercent', parsed.data.markupPercent, 'Markup');
  return errors.length === 0 ? parsed : { success: false, errors };
}

export function calculateFuelExpense(input: FuelInput): FuelResult {
  const validation = validateFuelInput(input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new CalculationInputError(first.field, first.code, first.message);
  }
  const distance = parseDecimal(validation.data.distance);
  const distanceKm = validation.data.distanceUnit === 'mi' ? distance.times('1.609344') : distance;
  const mileage = parseDecimal(validation.data.mileage);
  const mileageKmPerLitre =
    validation.data.mileageUnit === 'miles-per-gallon' ? mileage.times('0.4251437075') : mileage;
  const trips = parseDecimal(validation.data.trips);
  const litres = distanceKm.div(mileageKmPerLitre).times(trips);
  const price = parseDecimal(validation.data.fuelPricePerLitre);
  const markup = parseDecimal(validation.data.markupPercent);
  const fuelCost = litres.times(price);
  const customerCost = fuelCost.times(new Decimal(1).plus(markup.div(100)));
  return {
    distanceKm: decimalToString(distanceKm),
    mileageKmPerLitre: decimalToString(mileageKmPerLitre),
    trips: decimalToString(trips),
    litres: decimalToString(litres),
    fuelCost: decimalToString(fuelCost),
    markupPercent: decimalToString(markup),
    customerCost: decimalToString(customerCost),
  };
}
