import Decimal from 'decimal.js';

export type DecimalInput = string | number;

export const MAX_SIGNIFICANT_DIGITS = 32;
export const MAX_DECIMAL_PLACES = 18;

export class DecimalInputError extends Error {
  readonly code: 'empty' | 'invalid' | 'nonFinite' | 'unsafePrecision';

  constructor(code: 'empty' | 'invalid' | 'nonFinite' | 'unsafePrecision', message: string) {
    super(message);
    this.name = 'DecimalInputError';
    this.code = code;
  }
}

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

function countSignificantDigits(normalized: string) {
  const digits = normalized.replace(/^[+-]/, '').replace('.', '').replace(/^0+/, '');
  return digits.length;
}

export function normalizeDecimalInput(value: DecimalInput): string {
  const raw = typeof value === 'number' ? String(value) : value;

  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new DecimalInputError('empty', 'Enter a number.');
  }

  const normalized = raw.trim().replace(/^₹\s*/u, '').replace(/\s/g, '').replace(/,/g, '');

  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) {
    throw new DecimalInputError('invalid', 'Enter a valid number without letters or extra symbols.');
  }

  const decimalPlaces = normalized.includes('.') ? (normalized.split('.')[1]?.length ?? 0) : 0;
  if (countSignificantDigits(normalized) > MAX_SIGNIFICANT_DIGITS || decimalPlaces > MAX_DECIMAL_PLACES) {
    throw new DecimalInputError(
      'unsafePrecision',
      `Use at most ${MAX_SIGNIFICANT_DIGITS} significant digits and ${MAX_DECIMAL_PLACES} decimal places.`,
    );
  }

  const decimal = new Decimal(normalized);
  if (!decimal.isFinite() || decimal.isNaN()) {
    throw new DecimalInputError('nonFinite', 'Enter a finite number.');
  }

  return normalized;
}

export function parseDecimal(value: DecimalInput): Decimal {
  return new Decimal(normalizeDecimalInput(value));
}

export function decimalToString(value: Decimal, significantDigits = 20): string {
  const serialized = value.toSignificantDigits(significantDigits).toString();
  if (!serialized.includes('e')) {
    return serialized;
  }

  return value.toFixed(Math.min(MAX_DECIMAL_PLACES, significantDigits));
}

export function decimalIsZero(value: Decimal) {
  return value.isZero();
}
