import { z } from 'zod';

import type { ValidationResult } from '@/domain/calculations/types';

import { QrInputError } from './types';

export const WHATSAPP_MESSAGE_MAX_LENGTH = 2_000;
export const WHATSAPP_PHONE_MAX_DIGITS = 15;

const controlCharacterPattern = /[\u0000-\u001F\u007F]/u;

export const whatsappInputSchema = z
  .object({
    countryCode: z.string(),
    phone: z.string(),
    message: z.string(),
  })
  .superRefine((input, context) => {
    const countryCode = input.countryCode.replace(/\D/g, '');
    const phone = input.phone.replace(/\D/g, '');
    const message = input.message.trim();

    if (!/^\d{1,4}$/u.test(countryCode)) {
      context.addIssue({
        code: 'custom',
        path: ['countryCode'],
        message: 'Enter a country code such as 91.',
      });
    }
    if (!/^\d{7,15}$/u.test(phone)) {
      context.addIssue({
        code: 'custom',
        path: ['phone'],
        message: 'Enter 7 to 15 digits after the country code. Do not include + or spaces.',
      });
    }
    if (countryCode === '0') {
      context.addIssue({ code: 'custom', path: ['countryCode'], message: 'Country code cannot be zero.' });
    }
    if (countryCode.length + phone.length > WHATSAPP_PHONE_MAX_DIGITS) {
      context.addIssue({
        code: 'custom',
        path: ['phone'],
        message: `The international number must be ${WHATSAPP_PHONE_MAX_DIGITS} digits or fewer.`,
      });
    }
    if (Array.from(message).length > WHATSAPP_MESSAGE_MAX_LENGTH) {
      context.addIssue({
        code: 'custom',
        path: ['message'],
        message: `Keep the optional message to ${WHATSAPP_MESSAGE_MAX_LENGTH.toLocaleString('en-IN')} characters or fewer.`,
      });
    }
    if (controlCharacterPattern.test(message)) {
      context.addIssue({
        code: 'custom',
        path: ['message'],
        message: 'The message cannot contain control characters.',
      });
    }
  });

export type WhatsappInput = z.infer<typeof whatsappInputSchema>;

export interface WhatsappResult {
  internationalNumber: string;
  payload: string;
  message: string;
}

function normalize(input: WhatsappInput): WhatsappInput {
  return {
    countryCode: input.countryCode.replace(/\D/g, ''),
    phone: input.phone.replace(/\D/g, ''),
    message: input.message.trim(),
  };
}

export function validateWhatsappInput(input: WhatsappInput): ValidationResult<WhatsappInput> {
  const parsed = whatsappInputSchema.safeParse(input);
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
  return { success: true, data: normalize(parsed.data) };
}

export function calculateWhatsapp(input: WhatsappInput): WhatsappResult {
  const validation = validateWhatsappInput(input);
  if (!validation.success) {
    const firstError = validation.errors[0];
    throw new QrInputError(firstError.field, firstError.code, firstError.message);
  }

  const value = validation.data;
  const internationalNumber = `${value.countryCode}${value.phone}`;
  const payload = `https://wa.me/${internationalNumber}${value.message ? `?text=${encodeURIComponent(value.message)}` : ''}`;
  return { internationalNumber, payload, message: value.message };
}
