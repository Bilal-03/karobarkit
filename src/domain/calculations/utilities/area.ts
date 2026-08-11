import { z } from 'zod';
import Decimal from 'decimal.js';

import { decimalToString, parseDecimal } from '@/domain/formatting/decimal';

import { addFieldError, fieldError, validationFromSchema } from './shared';
import { CalculationInputError, type FieldError, type ValidationResult } from '../types';

export const areaUnits = [
  'sqm',
  'sqft',
  'sqyd',
  'acre',
  'hectare',
  'cent',
  'guntha',
  'bigha',
  'katha',
] as const;
export type AreaUnit = (typeof areaUnits)[number];
export const areaRegions = ['north-india', 'uttar-pradesh', 'bihar', 'west-bengal', 'assam'] as const;
export type AreaRegion = (typeof areaRegions)[number];

export const areaUnitOptions: { value: AreaUnit; label: string; regional: boolean }[] = [
  { value: 'sqm', label: 'Square metre (m²)', regional: false },
  { value: 'sqft', label: 'Square foot (ft²)', regional: false },
  { value: 'sqyd', label: 'Square yard (yd²)', regional: false },
  { value: 'acre', label: 'Acre', regional: false },
  { value: 'hectare', label: 'Hectare', regional: false },
  { value: 'cent', label: 'Cent', regional: false },
  { value: 'guntha', label: 'Guntha', regional: false },
  { value: 'bigha', label: 'Bigha (region-defined)', regional: true },
  { value: 'katha', label: 'Katha (region-defined)', regional: true },
];

export const areaRegionOptions: { value: AreaRegion; label: string }[] = [
  { value: 'north-india', label: 'North India reference (27,000 ft²/bigha)' },
  { value: 'uttar-pradesh', label: 'Uttar Pradesh reference (27,000 ft²/bigha)' },
  { value: 'bihar', label: 'Bihar reference (27,216 ft²/bigha)' },
  { value: 'west-bengal', label: 'West Bengal reference (14,400 ft²/bigha)' },
  { value: 'assam', label: 'Assam reference (14,400 ft²/bigha)' },
];

const squareMetresPerUnit: Record<Exclude<AreaUnit, 'bigha' | 'katha'>, Decimal> = {
  sqm: new Decimal(1),
  sqft: new Decimal('0.09290304'),
  sqyd: new Decimal('0.83612736'),
  acre: new Decimal('4046.8564224'),
  hectare: new Decimal(10000),
  cent: new Decimal('40.468564224'),
  guntha: new Decimal('101.17141056'),
};

const bighaSquareFeet: Record<AreaRegion, Decimal> = {
  'north-india': new Decimal(27000),
  'uttar-pradesh': new Decimal(27000),
  bihar: new Decimal(27216),
  'west-bengal': new Decimal(14400),
  assam: new Decimal(14400),
};

export const areaInputSchema = z.object({
  value: z.string(),
  fromUnit: z.enum(areaUnits),
  toUnit: z.enum(areaUnits),
  region: z.enum(areaRegions),
});

export type AreaInput = z.infer<typeof areaInputSchema>;

export interface AreaResult {
  value: string;
  fromUnit: AreaUnit;
  toUnit: AreaUnit;
  region: AreaRegion | null;
  convertedValue: string;
  conversionFactor: string;
  regionalWarning: string | null;
}

function isRegional(unit: AreaUnit) {
  return unit === 'bigha' || unit === 'katha';
}

function metresPerUnit(unit: AreaUnit, region: AreaRegion | undefined) {
  if (unit === 'bigha') {
    if (!region) throw new CalculationInputError('region', 'required', 'Choose a region for bigha.');
    return bighaSquareFeet[region].times(squareMetresPerUnit.sqft);
  }
  if (unit === 'katha') {
    if (!region) throw new CalculationInputError('region', 'required', 'Choose a region for katha.');
    return bighaSquareFeet[region].div(20).times(squareMetresPerUnit.sqft);
  }
  return squareMetresPerUnit[unit];
}

export function validateAreaInput(input: AreaInput): ValidationResult<AreaInput> {
  const parsed = validationFromSchema(areaInputSchema, input);
  if (!parsed.success) return parsed;
  const errors: FieldError[] = [];
  try {
    const value = parseDecimal(parsed.data.value);
    if (value.lt(0)) errors.push(fieldError('value', 'must_be_non_negative', 'Area cannot be negative.'));
  } catch (error) {
    addFieldError(errors, 'value', error, 'Enter a valid area.');
  }
  if ((isRegional(parsed.data.fromUnit) || isRegional(parsed.data.toUnit)) && !parsed.data.region) {
    errors.push(fieldError('region', 'required', 'Choose the regional definition for bigha or katha.'));
  }
  return errors.length === 0 ? parsed : { success: false, errors };
}

export function calculateArea(input: AreaInput): AreaResult {
  const validation = validateAreaInput(input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new CalculationInputError(first.field, first.code, first.message);
  }
  const value = parseDecimal(validation.data.value);
  const region =
    isRegional(validation.data.fromUnit) || isRegional(validation.data.toUnit)
      ? validation.data.region
      : null;
  const fromMetres = metresPerUnit(validation.data.fromUnit, region ?? undefined);
  const toMetres = metresPerUnit(validation.data.toUnit, region ?? undefined);
  const factor = fromMetres.div(toMetres);
  const converted = value.times(factor);
  return {
    value: decimalToString(value),
    fromUnit: validation.data.fromUnit,
    toUnit: validation.data.toUnit,
    region,
    convertedValue: decimalToString(converted),
    conversionFactor: decimalToString(factor),
    regionalWarning: region
      ? 'Bigha and katha vary by locality. This result uses the selected reference definition; verify the local land record before relying on it.'
      : null,
  };
}
