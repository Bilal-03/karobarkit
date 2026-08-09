import { z } from 'zod';

import type { FieldError, ValidationResult } from '@/domain/calculations/types';

export interface InvoiceNumberInput {
  prefix: string;
  financialYear: string;
  nextNumber: string;
  padding: string;
}

export interface InvoiceNumberResult {
  value: string;
  prefix: string;
  financialYear: string;
  sequence: number;
  padding: number;
  limitation: string;
}

const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);
export const invoiceNumberInputSchema = z.object({
  prefix: optionalText('Prefix', 24),
  financialYear: z
    .string()
    .trim()
    .regex(/^20\d{2}-\d{2}$/u, 'Use a financial year such as 2026-27.'),
  nextNumber: z
    .string()
    .trim()
    .min(1, 'Enter the next sequence number.')
    .max(9, 'Sequence number is too large.'),
  padding: z.string().trim().min(1, 'Enter a padding width.').max(2, 'Padding width is too large.'),
});

const prefixPattern = /^[\p{L}\p{N}][\p{L}\p{N}_/-]*$/u;

export const invoiceNumberDefaultValues: InvoiceNumberInput = {
  prefix: 'INV',
  financialYear: '2026-27',
  nextNumber: '1',
  padding: '4',
};

export function validateInvoiceNumberInput(input: InvoiceNumberInput): ValidationResult<InvoiceNumberInput> {
  const parsed = invoiceNumberInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map((item) => ({
        field: String(item.path[0] ?? 'form'),
        code: 'invalid_input',
        message: item.message,
      })),
    };
  }
  const value = {
    ...parsed.data,
    prefix: parsed.data.prefix.trim(),
    financialYear: parsed.data.financialYear.trim(),
    nextNumber: parsed.data.nextNumber.trim(),
    padding: parsed.data.padding.trim(),
  };
  const errors: FieldError[] = [];
  if (value.prefix && !prefixPattern.test(value.prefix))
    errors.push({
      field: 'prefix',
      code: 'invalid_prefix',
      message: 'Use letters, numbers, underscores, hyphens or slashes in the prefix.',
    });
  const sequence = Number(value.nextNumber);
  if (
    !/^\d+$/u.test(value.nextNumber) ||
    !Number.isSafeInteger(sequence) ||
    sequence < 1 ||
    sequence > 999999999
  )
    errors.push({
      field: 'nextNumber',
      code: 'invalid_sequence',
      message: 'Enter a whole sequence number from 1 to 999,999,999.',
    });
  const padding = Number(value.padding);
  if (!/^\d+$/u.test(value.padding) || !Number.isInteger(padding) || padding < 1 || padding > 9)
    errors.push({
      field: 'padding',
      code: 'invalid_padding',
      message: 'Padding must be a whole number from 1 to 9.',
    });
  return errors.length ? { success: false, errors } : { success: true, data: value };
}

export function createInvoiceNumber(input: InvoiceNumberInput): InvoiceNumberResult {
  const validation = validateInvoiceNumberInput(input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new Error(first?.message ?? 'Check the invoice number fields.');
  }
  const value = validation.data;
  const sequence = Number(value.nextNumber);
  const padding = Number(value.padding);
  return {
    value: `${value.prefix ? `${value.prefix}/` : ''}${value.financialYear}/${String(sequence).padStart(padding, '0')}`,
    prefix: value.prefix,
    financialYear: value.financialYear,
    sequence,
    padding,
    limitation:
      'Preview only. This browser does not reserve or guarantee uniqueness across devices, users or accounting systems.',
  };
}
