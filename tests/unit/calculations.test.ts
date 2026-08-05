import { describe, expect, it } from 'vitest';

import { calculateCagr, validateCagrInput } from '@/domain/calculations/cagr';
import { calculateRoi, validateRoiInput } from '@/domain/calculations/roi';

describe('CAGR calculation', () => {
  it('matches the independent required example', () => {
    const result = calculateCagr({ beginningValue: '100000', endingValue: '161051', years: '5' });
    expect(Number(result.percentage)).toBeCloseTo(10, 8);
    expect(result.direction).toBe('growth');
  });

  it('accepts Indian grouping and decimal values', () => {
    const result = calculateCagr({ beginningValue: '₹1,00,000.50', endingValue: '161051.25', years: '5.5' });
    expect(Number(result.percentage)).toBeGreaterThan(0);
  });

  it('rejects empty values and zero denominators', () => {
    const empty = validateCagrInput({ beginningValue: '', endingValue: '100', years: '5' });
    expect(empty.success).toBe(false);

    const zeroBeginning = validateCagrInput({ beginningValue: '0', endingValue: '100', years: '5' });
    expect(zeroBeginning.success).toBe(false);
  });

  it.each([
    ['zero beginning value', { beginningValue: '0', endingValue: '100', years: '5' }, 'beginningValue'],
    [
      'negative beginning value',
      { beginningValue: '-100', endingValue: '100', years: '5' },
      'beginningValue',
    ],
    ['zero ending value', { beginningValue: '100', endingValue: '0', years: '5' }, 'endingValue'],
    ['negative ending value', { beginningValue: '100', endingValue: '-1', years: '5' }, 'endingValue'],
    ['zero duration', { beginningValue: '100', endingValue: '120', years: '0' }, 'years'],
    ['negative duration', { beginningValue: '100', endingValue: '120', years: '-2' }, 'years'],
  ])('rejects %s', (_label, input, field) => {
    const validation = validateCagrInput(input);
    expect(validation.success).toBe(false);
    if (!validation.success) expect(validation.errors.some((error) => error.field === field)).toBe(true);
  });

  it.each(['not-a-number', 'NaN', 'Infinity', '1.23456789012345678901'])(
    'rejects invalid or unsafe input %s',
    (value) => {
      const validation = validateCagrInput({ beginningValue: value, endingValue: '100', years: '5' });
      expect(validation.success).toBe(false);
    },
  );

  it('rejects excessive significant digits while accepting an extremely large bounded value', () => {
    const unsafe = validateCagrInput({
      beginningValue: '123456789012345678901234567890123',
      endingValue: '100',
      years: '5',
    });
    expect(unsafe.success).toBe(false);

    const result = calculateCagr({
      beginningValue: '99999999999999999999999999999999',
      endingValue: '10000000000000000000000000000000',
      years: '5',
    });
    expect(Number.isFinite(Number(result.percentage))).toBe(true);
  });

  it('handles a large but bounded value without floating-point overflow', () => {
    const result = calculateCagr({
      beginningValue: '9999999999999999999999999999',
      endingValue: '10000000000000000000000000000',
      years: '10',
    });
    expect(Number.isFinite(Number(result.percentage))).toBe(true);
  });
});

describe('ROI calculation', () => {
  it('matches the independent required example', () => {
    const result = calculateRoi({ investmentCost: '100000', finalValue: '125000' });
    expect(result.profit).toBe('25000');
    expect(Number(result.percentage)).toBeCloseTo(25, 8);
    expect(result.direction).toBe('profit');
  });

  it('handles a negative return and a complete loss', () => {
    const loss = calculateRoi({ investmentCost: '100000', finalValue: '80000' });
    expect(loss.profit).toBe('-20000');
    expect(Number(loss.percentage)).toBeCloseTo(-20, 8);
    expect(loss.direction).toBe('loss');

    const completeLoss = calculateRoi({ investmentCost: '100000', finalValue: '0' });
    expect(completeLoss.profit).toBe('-100000');
    expect(Number(completeLoss.percentage)).toBeCloseTo(-100, 8);
  });

  it('accepts decimal inputs', () => {
    const result = calculateRoi({ investmentCost: '₹10,000.50', finalValue: '12,500.75' });
    expect(Number(result.percentage)).toBeCloseTo(25.00125, 5);
  });

  it('rejects empty values and invalid numeric strings', () => {
    const empty = validateRoiInput({ investmentCost: '', finalValue: '100' });
    expect(empty.success).toBe(false);

    const invalid = validateRoiInput({ investmentCost: 'not-a-number', finalValue: '100' });
    expect(invalid.success).toBe(false);
  });

  it.each([
    ['zero cost', { investmentCost: '0', finalValue: '100' }, 'investmentCost'],
    ['negative cost', { investmentCost: '-1', finalValue: '100' }, 'investmentCost'],
    ['negative final value', { investmentCost: '100', finalValue: '-1' }, 'finalValue'],
    ['invalid cost', { investmentCost: 'NaN', finalValue: '100' }, 'investmentCost'],
    ['infinite final value', { investmentCost: '100', finalValue: 'Infinity' }, 'finalValue'],
  ])('rejects %s', (_label, input, field) => {
    const validation = validateRoiInput(input);
    expect(validation.success).toBe(false);
    if (!validation.success) expect(validation.errors.some((error) => error.field === field)).toBe(true);
  });

  it('handles a large but bounded value without infinity', () => {
    const result = calculateRoi({
      investmentCost: '1000000000000000000000000000',
      finalValue: '1250000000000000000000000000',
    });
    expect(Number(result.percentage)).toBeCloseTo(25, 8);
  });

  it('rejects unsafe precision and direct non-finite values', () => {
    const unsafe = validateRoiInput({
      investmentCost: '1.23456789012345678901',
      finalValue: '2',
    });
    expect(unsafe.success).toBe(false);

    expect(() => calculateRoi({ investmentCost: 'NaN', finalValue: '100' })).toThrow();
    expect(() => calculateRoi({ investmentCost: '100', finalValue: 'Infinity' })).toThrow();
  });
});
