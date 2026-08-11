import { z } from 'zod';

import type { FieldError, ValidationResult } from '../types';

export function validationFromSchema<T>(schema: z.ZodType<T>, input: unknown): ValidationResult<T> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { success: true, data: parsed.data };

  return {
    success: false,
    errors: parsed.error.issues.map((issue) => ({
      field: String(issue.path[0] ?? 'form'),
      code: issue.code === 'custom' ? 'invalid_input' : issue.code,
      message: issue.message,
    })),
  };
}

export function fieldError(field: string, code: string, message: string): FieldError {
  return { field, code, message };
}

export function addFieldError(errors: FieldError[], field: string, error: unknown, fallback: string) {
  errors.push(
    fieldError(
      field,
      error instanceof Error && 'code' in error ? String(error.code) : 'invalid_input',
      fallback,
    ),
  );
}

export function dateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}

export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
