import { z } from 'zod';

import { CalculationInputError, type FieldError, type ValidationResult } from '../types';
import { dateOnly, fieldError, isoDate, validationFromSchema } from './shared';

export const weekendPatterns = ['saturday-sunday', 'sunday', 'none'] as const;
export type WeekendPattern = (typeof weekendPatterns)[number];
export const holidayPresets = ['none', 'india-national-2026'] as const;
export type HolidayPreset = (typeof holidayPresets)[number];

export const businessDaysInputSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  includeStart: z.boolean(),
  includeEnd: z.boolean(),
  weekendPattern: z.enum(weekendPatterns),
  holidayPreset: z.enum(holidayPresets),
  customHolidays: z.string(),
});

export type BusinessDaysInput = z.infer<typeof businessDaysInputSchema>;

export interface ExcludedBusinessDay {
  date: string;
  reason: 'weekend' | 'holiday';
}

export interface BusinessDaysResult {
  startDate: string;
  endDate: string;
  calendarDays: number;
  businessDays: number;
  excludedDays: ExcludedBusinessDay[];
  holidayCount: number;
  weekendCount: number;
  holidayPreset: HolidayPreset;
}

const versionedNationalHolidays: Record<HolidayPreset, string[]> = {
  none: [],
  'india-national-2026': ['2026-01-26', '2026-08-15', '2026-10-02'],
};

export const versionedHolidayPresetLabels: Record<HolidayPreset, string> = {
  none: 'Weekends only (no holiday preset)',
  'india-national-2026': 'India national reference holidays — 2026',
};

function parseHolidayList(value: string, field: string, errors: FieldError[]) {
  const trimmed = value
    .split(/[\n,;]/u)
    .map((item) => item.trim())
    .filter(Boolean);
  const dates: string[] = [];
  for (const candidate of trimmed) {
    if (!dateOnly(candidate)) {
      errors.push(fieldError(field, 'invalid_date', `Use YYYY-MM-DD for holiday dates: ${candidate}.`));
    } else if (!dates.includes(candidate)) {
      dates.push(candidate);
    }
  }
  return dates;
}

function isWeekend(date: Date, pattern: WeekendPattern) {
  const day = date.getUTCDay();
  if (pattern === 'none') return false;
  if (pattern === 'sunday') return day === 0;
  return day === 0 || day === 6;
}

export function validateBusinessDaysInput(input: BusinessDaysInput): ValidationResult<BusinessDaysInput> {
  const parsed = validationFromSchema(businessDaysInputSchema, input);
  if (!parsed.success) return parsed;
  const errors: FieldError[] = [];
  const start = dateOnly(parsed.data.startDate);
  const end = dateOnly(parsed.data.endDate);
  if (!start)
    errors.push(fieldError('startDate', 'invalid_date', 'Use a valid start date in YYYY-MM-DD format.'));
  if (!end) errors.push(fieldError('endDate', 'invalid_date', 'Use a valid end date in YYYY-MM-DD format.'));
  if (start && end && start.getTime() > end.getTime()) {
    errors.push(fieldError('endDate', 'reversed_range', 'End date must be on or after the start date.'));
  }
  parseHolidayList(parsed.data.customHolidays, 'customHolidays', errors);
  return errors.length === 0 ? parsed : { success: false, errors };
}

export function calculateBusinessDays(input: BusinessDaysInput): BusinessDaysResult {
  const validation = validateBusinessDaysInput(input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new CalculationInputError(first.field, first.code, first.message);
  }
  const { data } = validation;
  const start = dateOnly(data.startDate);
  const end = dateOnly(data.endDate);
  if (!start || !end) throw new CalculationInputError('form', 'invalid_date', 'Enter valid dates.');
  const holidays = new Set([
    ...versionedNationalHolidays[data.holidayPreset],
    ...parseHolidayList(data.customHolidays, 'customHolidays', []),
  ]);
  const excludedDays: ExcludedBusinessDay[] = [];
  let businessDays = 0;
  const cursor = new Date(start.getTime());
  let calendarDays = 0;
  while (cursor.getTime() <= end.getTime()) {
    const current = isoDate(cursor);
    const isBoundaryExcluded =
      (cursor.getTime() === start.getTime() && !data.includeStart) ||
      (cursor.getTime() === end.getTime() && !data.includeEnd);
    if (!isBoundaryExcluded) {
      if (isWeekend(cursor, data.weekendPattern)) {
        excludedDays.push({ date: current, reason: 'weekend' });
      } else if (holidays.has(current)) {
        excludedDays.push({ date: current, reason: 'holiday' });
      } else {
        businessDays += 1;
      }
    }
    calendarDays += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return {
    startDate: data.startDate,
    endDate: data.endDate,
    calendarDays,
    businessDays,
    excludedDays,
    holidayCount: excludedDays.filter((item) => item.reason === 'holiday').length,
    weekendCount: excludedDays.filter((item) => item.reason === 'weekend').length,
    holidayPreset: data.holidayPreset,
  };
}
