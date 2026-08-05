import { describe, expect, it } from 'vitest';

import {
  formatIndianCurrency,
  formatIndianDate,
  formatIndianNumber,
  formatPercentage,
} from '@/domain/formatting/indian';
import { normalizeDecimalInput } from '@/domain/formatting/decimal';

describe('Indian formatting and parsing', () => {
  it('groups numbers using Indian digit grouping', () => {
    expect(formatIndianNumber('100000')).toBe('1,00,000');
    expect(formatIndianCurrency('100000')).toBe('₹1,00,000.00');
    expect(formatIndianCurrency('-25000')).toBe('-₹25,000.00');
  });

  it('formats percentages and dates consistently', () => {
    expect(formatPercentage('10')).toBe('10.00%');
    expect(formatIndianDate('2026-08-06')).toBe('6 August 2026');
  });

  it('accepts rupee symbols and grouping without changing the numeric value', () => {
    expect(normalizeDecimalInput('₹ 1,23,456.78')).toBe('123456.78');
  });

  it.each(['', '1.2.3', '12abc', '1e5'])('rejects malformed locale input %s', (value) => {
    expect(() => normalizeDecimalInput(value)).toThrow();
  });
});
