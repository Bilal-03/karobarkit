import { decimalToString, parseDecimal, type DecimalInput } from './decimal';

function trimTrailingZeros(value: string) {
  return value.replace(/(\.\d*?[1-9])0+$/u, '$1').replace(/\.0+$/u, '');
}

function groupIndianInteger(integer: string) {
  if (integer.length <= 3) {
    return integer;
  }

  const lastThree = integer.slice(-3);
  const prefix = integer.slice(0, -3);
  const groups: string[] = [];

  for (let index = prefix.length; index > 0; index -= 2) {
    groups.unshift(prefix.slice(Math.max(0, index - 2), index));
  }

  return `${groups.join(',')},${lastThree}`;
}

export function formatIndianNumber(
  value: DecimalInput,
  options: { decimals?: number; minimumFractionDigits?: number } = {},
) {
  const decimal = parseDecimal(value);
  const sign = decimal.isNegative() ? '-' : '';
  const absolute = decimal.abs();
  const serialized =
    options.decimals === undefined ? decimalToString(absolute) : absolute.toFixed(options.decimals);
  const [integerPart, fractionPart] = serialized.split('.');
  const grouped = groupIndianInteger(integerPart ?? '0');
  const minimumFractionDigits = options.minimumFractionDigits ?? 0;
  const fraction = fractionPart ?? '';
  const paddedFraction = fraction.padEnd(minimumFractionDigits, '0');

  const formattedFraction =
    options.decimals === undefined ? trimTrailingZeros(paddedFraction) : paddedFraction;
  return `${sign}${grouped}${formattedFraction ? `.${formattedFraction}` : ''}`;
}

export function formatIndianCurrency(value: DecimalInput, decimals = 2) {
  const decimal = parseDecimal(value);
  const sign = decimal.isNegative() ? '-' : '';
  return `${sign}₹${formatIndianNumber(decimal.abs().toString(), { decimals })}`;
}

export function formatPercentage(value: DecimalInput, decimals = 2) {
  return `${formatIndianNumber(value, { decimals })}%`;
}

export function formatIndianDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date supplied to formatIndianDate.');
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatDecimalForInput(value: DecimalInput) {
  const decimal = parseDecimal(value);
  return decimal.toFixed(2).replace(/\.00$/u, '');
}
