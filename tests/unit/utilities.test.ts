import { describe, expect, it } from 'vitest';

import {
  calculateArea,
  calculateBusinessDays,
  calculateDiscount,
  calculateFuelExpense,
  calculatePercentage,
  calculateVolumetricWeight,
  validateAreaInput,
  validateBusinessDaysInput,
  validateDiscountInput,
  validateFuelInput,
  validatePercentageInput,
  validateVolumetricWeightInput,
} from '@/domain/calculations/utilities';
import { calculateWordCounter } from '@/domain/utilities/word-counter';
import {
  calculatePasswordToolkit,
  estimatePasswordStrength,
  generatePassword,
} from '@/domain/utilities/password';
import { calculateTodoChecklist, createTodoTask } from '@/domain/utilities/todo';

describe('everyday utility calculation engines', () => {
  it('supports all percentage modes with decimal-safe substitutions', () => {
    expect(
      calculatePercentage({ mode: 'percentage-of', base: '1000', value: '', percentage: '20' }).result,
    ).toBe('200');
    expect(
      calculatePercentage({ mode: 'what-percent', base: '1000', value: '200', percentage: '' }).result,
    ).toBe('20');
    expect(
      calculatePercentage({ mode: 'percentage-change', base: '1000', value: '1200', percentage: '' }).result,
    ).toBe('20');
    expect(
      validatePercentageInput({ mode: 'percentage-change', base: '0', value: '1', percentage: '' }).success,
    ).toBe(false);
  });

  it('applies successive discounts to the reduced price', () => {
    const result = calculateDiscount({
      originalPrice: '1000',
      firstDiscountPercent: '10',
      secondDiscountPercent: '5',
    });
    expect(result.finalPrice).toBe('855');
    expect(result.totalSavings).toBe('145');
    expect(result.effectiveDiscountPercent).toBe('14.5');
    expect(
      validateDiscountInput({ originalPrice: '1000', firstDiscountPercent: '101', secondDiscountPercent: '' })
        .success,
    ).toBe(false);
  });

  it('converts standard area units reciprocally and requires a land region', () => {
    const squareFeet = calculateArea({ value: '1', fromUnit: 'sqm', toUnit: 'sqft', region: 'north-india' });
    const back = calculateArea({
      value: squareFeet.convertedValue,
      fromUnit: 'sqft',
      toUnit: 'sqm',
      region: 'north-india',
    });
    expect(Number(back.convertedValue)).toBeCloseTo(1, 8);
    expect(
      validateAreaInput({ value: '1', fromUnit: 'bigha', toUnit: 'sqm', region: '' as never }).success,
    ).toBe(false);
    expect(
      calculateArea({ value: '1', fromUnit: 'bigha', toUnit: 'sqm', region: 'west-bengal' }).regionalWarning,
    ).toContain('vary');
  });

  it('handles same-day, leap-year, weekend and reversed business-day ranges', () => {
    const leapWeek = calculateBusinessDays({
      startDate: '2024-02-26',
      endDate: '2024-03-01',
      includeStart: true,
      includeEnd: true,
      weekendPattern: 'saturday-sunday',
      holidayPreset: 'none',
      customHolidays: '',
    });
    expect(leapWeek.businessDays).toBe(5);
    const weekend = calculateBusinessDays({
      startDate: '2024-02-24',
      endDate: '2024-02-24',
      includeStart: true,
      includeEnd: true,
      weekendPattern: 'saturday-sunday',
      holidayPreset: 'none',
      customHolidays: '',
    });
    expect(weekend.businessDays).toBe(0);
    expect(
      calculateBusinessDays({
        startDate: '2024-02-29',
        endDate: '2024-02-29',
        includeStart: true,
        includeEnd: true,
        weekendPattern: 'none',
        holidayPreset: 'none',
        customHolidays: '',
      }).businessDays,
    ).toBe(1);
    expect(
      validateBusinessDaysInput({
        startDate: '2024-03-02',
        endDate: '2024-03-01',
        includeStart: true,
        includeEnd: true,
        weekendPattern: 'saturday-sunday',
        holidayPreset: 'none',
        customHolidays: '',
      }).success,
    ).toBe(false);
  });

  it('normalizes metric and imperial fuel assumptions and allows zero distance', () => {
    const zero = calculateFuelExpense({
      distance: '0',
      distanceUnit: 'km',
      mileage: '15',
      mileageUnit: 'km-per-litre',
      fuelPricePerLitre: '100',
      trips: '1',
      markupPercent: '10',
    });
    expect(zero.litres).toBe('0');
    expect(zero.customerCost).toBe('0');
    const imperial = calculateFuelExpense({
      distance: '62.1371192',
      distanceUnit: 'mi',
      mileage: '35.215',
      mileageUnit: 'miles-per-gallon',
      fuelPricePerLitre: '100',
      trips: '1',
      markupPercent: '0',
    });
    expect(Number(imperial.distanceKm)).toBeCloseTo(100, 6);
    expect(Number(imperial.mileageKmPerLitre)).toBeCloseTo(14.97, 2);
    expect(
      validateFuelInput({
        distance: '1',
        distanceUnit: 'km',
        mileage: '0',
        mileageUnit: 'km-per-litre',
        fuelPricePerLitre: '100',
        trips: '1',
        markupPercent: '0',
      }).success,
    ).toBe(false);
  });

  it('uses the larger of dimensional and actual shipping weight', () => {
    const result = calculateVolumetricWeight({
      length: '30',
      width: '20',
      height: '15',
      dimensionUnit: 'cm',
      actualWeight: '2',
      actualWeightUnit: 'kg',
      divisor: '5000',
    });
    expect(result.dimensionalWeightKg).toBe('1.8');
    expect(result.chargeableWeightKg).toBe('2');
    expect(result.basis).toBe('actual');
    expect(
      validateVolumetricWeightInput({
        length: '1',
        width: '1',
        height: '1',
        dimensionUnit: 'cm',
        actualWeight: '0',
        actualWeightUnit: 'kg',
        divisor: '0',
      }).success,
    ).toBe(false);
  });

  it('counts Unicode text without persisting the source text', () => {
    const result = calculateWordCounter({ text: 'Hello दुनिया\nनमस्ते world' });
    expect(result.words).toBe(4);
    expect(result.charactersWithoutSpaces).toBeLessThan(result.characters);
    expect(result.lines).toBe(2);
  });

  it('generates with injected Web Crypto and labels estimates honestly', () => {
    const cryptoSource = {
      getRandomValues: <T extends ArrayBufferView>(array: T) => {
        new Uint32Array(array.buffer, array.byteOffset, 1)[0] = 0;
        return array;
      },
    };
    const input = {
      mode: 'generate' as const,
      length: '16',
      includeLowercase: true,
      includeUppercase: true,
      includeNumbers: true,
      includeSymbols: true,
      strengthInput: '',
    };
    const password = generatePassword(input, cryptoSource);
    expect(password).toHaveLength(16);
    expect(calculatePasswordToolkit(input, cryptoSource).password).toHaveLength(16);
    expect(estimatePasswordStrength('password').label).toBe('Very weak');
    expect(() =>
      calculatePasswordToolkit(
        { ...input, mode: 'assess', strengthInput: 'CorrectHorseBatteryStaple!' },
        cryptoSource,
      ),
    ).not.toThrow();
    expect(() => generatePassword(input, { getRandomValues: undefined as never })).toThrow(/Web Crypto/);
  });

  it('derives checklist progress in memory', () => {
    const first = createTodoTask('Send quotation', 'high');
    const second = { ...createTodoTask('Review margin', 'normal'), completed: true };
    const summary = calculateTodoChecklist({ tasks: [first, second] });
    expect(summary.total).toBe(2);
    expect(summary.completed).toBe(1);
    expect(summary.progressPercent).toBe(50);
    expect(summary.highPriorityRemaining).toBe(1);
  });
});
