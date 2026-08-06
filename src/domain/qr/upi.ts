import Decimal from 'decimal.js';
import { z } from 'zod';

import { decimalToString, parseDecimal } from '@/domain/formatting/decimal';
import { type ValidationResult } from '@/domain/calculations/types';

import { QrInputError } from './types';

export const UPI_NOTE_MAX_LENGTH = 80;
export const UPI_PAYEE_NAME_MAX_LENGTH = 100;
export const UPI_AMOUNT_MAX = '999999999999.99';

const upiIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,255}@[A-Za-z][A-Za-z0-9.-]{0,63}$/;
const controlCharacterPattern = /[\u0000-\u001F\u007F]/u;

export const upiInputSchema = z
  .object({
    payeeName: z.string(),
    upiId: z.string(),
    amount: z.string(),
    note: z.string(),
  })
  .superRefine((input, context) => {
    const payeeName = input.payeeName.trim();
    const upiId = input.upiId.trim();
    const amount = input.amount.trim();
    const note = input.note.trim();

    if (payeeName.length === 0) {
      context.addIssue({ code: 'custom', path: ['payeeName'], message: 'Enter the payee name.' });
    } else if (Array.from(payeeName).length > UPI_PAYEE_NAME_MAX_LENGTH) {
      context.addIssue({
        code: 'custom',
        path: ['payeeName'],
        message: `Keep the payee name to ${UPI_PAYEE_NAME_MAX_LENGTH} characters or fewer.`,
      });
    } else if (controlCharacterPattern.test(payeeName)) {
      context.addIssue({
        code: 'custom',
        path: ['payeeName'],
        message: 'Payee name cannot contain control characters or line breaks.',
      });
    }

    if (upiId.length === 0) {
      context.addIssue({ code: 'custom', path: ['upiId'], message: 'Enter the UPI ID.' });
    } else if (!upiIdPattern.test(upiId)) {
      context.addIssue({
        code: 'custom',
        path: ['upiId'],
        message:
          'Enter a UPI ID in the format name@handle using supported letters, numbers, dots, hyphens or underscores.',
      });
    }

    if (amount.length > 0) {
      try {
        const parsedAmount = parseDecimal(amount);
        if (parsedAmount.lte(0)) {
          context.addIssue({
            code: 'custom',
            path: ['amount'],
            message: 'Fixed amount must be greater than zero. Leave it blank for an open amount.',
          });
        } else if (parsedAmount.decimalPlaces() > 2) {
          context.addIssue({
            code: 'custom',
            path: ['amount'],
            message: 'Fixed amount can have at most two decimal places.',
          });
        } else if (parsedAmount.gt(new Decimal(UPI_AMOUNT_MAX))) {
          context.addIssue({
            code: 'custom',
            path: ['amount'],
            message: `Fixed amount must be ${UPI_AMOUNT_MAX} or less for a reliable QR payload.`,
          });
        }
      } catch (error) {
        context.addIssue({
          code: 'custom',
          path: ['amount'],
          message: error instanceof Error ? error.message : 'Enter a valid fixed amount.',
        });
      }
    }

    if (Array.from(note).length > UPI_NOTE_MAX_LENGTH) {
      context.addIssue({
        code: 'custom',
        path: ['note'],
        message: `Keep the payment note to ${UPI_NOTE_MAX_LENGTH} characters or fewer.`,
      });
    } else if (controlCharacterPattern.test(note)) {
      context.addIssue({
        code: 'custom',
        path: ['note'],
        message: 'Payment note cannot contain control characters or line breaks.',
      });
    }
  });

export type UpiInput = z.infer<typeof upiInputSchema>;

export interface UpiResult {
  payeeName: string;
  upiId: string;
  amount: string | null;
  note: string;
  payload: string;
}

function normalizedUpiInput(input: UpiInput): UpiInput {
  const amount = input.amount.trim();
  return {
    payeeName: input.payeeName.trim(),
    upiId: input.upiId.trim(),
    amount: amount.length > 0 ? decimalToString(parseDecimal(amount)) : '',
    note: input.note.trim(),
  };
}

function encodeQueryValue(value: string) {
  return encodeURIComponent(value);
}

export function validateUpiInput(input: UpiInput): ValidationResult<UpiInput> {
  const parsed = upiInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map((issue) => ({
        field: String(issue.path[0] ?? 'form'),
        code: `invalid_${String(issue.path[0] ?? 'input')}`,
        message: issue.message,
      })),
    };
  }

  return { success: true, data: normalizedUpiInput(parsed.data) };
}

export function buildUpiPaymentUri(input: UpiInput): string {
  const validation = validateUpiInput(input);
  if (!validation.success) {
    const firstError = validation.errors[0];
    throw new QrInputError(firstError.field, firstError.code, firstError.message);
  }

  const values = validation.data;
  const parameters = [
    ['pa', values.upiId],
    ['pn', values.payeeName],
    ...(values.amount ? [['am', values.amount]] : []),
    ['cu', 'INR'],
    ...(values.note ? [['tn', values.note]] : []),
  ];

  return `upi://pay?${parameters.map(([key, value]) => `${key}=${encodeQueryValue(value)}`).join('&')}`;
}

export function calculateUpi(input: UpiInput): UpiResult {
  const validation = validateUpiInput(input);
  if (!validation.success) {
    const firstError = validation.errors[0];
    throw new QrInputError(firstError.field, firstError.code, firstError.message);
  }

  const values = validation.data;
  return {
    payeeName: values.payeeName,
    upiId: values.upiId,
    amount: values.amount || null,
    note: values.note,
    payload: buildUpiPaymentUri(values),
  };
}
