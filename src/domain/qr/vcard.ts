import { z } from 'zod';

import type { ValidationResult } from '@/domain/calculations/types';

import { QrInputError } from './types';

export const VCARD_FIELD_MAX_LENGTH = 160;

const controlCharacterPattern = /[\u0000-\u001F\u007F]/u;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export const vcardInputSchema = z
  .object({
    fullName: z.string(),
    organization: z.string(),
    phone: z.string(),
    email: z.string(),
    website: z.string(),
    address: z.string(),
    note: z.string(),
  })
  .superRefine((input, context) => {
    const values = Object.entries(input) as Array<[keyof VcardInput, string]>;
    if (!input.fullName.trim()) {
      context.addIssue({ code: 'custom', path: ['fullName'], message: 'Enter a contact name.' });
    }
    for (const [field, raw] of values) {
      const value = raw.trim();
      if (Array.from(value).length > VCARD_FIELD_MAX_LENGTH) {
        context.addIssue({
          code: 'custom',
          path: [field],
          message: `Keep this field to ${VCARD_FIELD_MAX_LENGTH} characters or fewer.`,
        });
      }
      if (controlCharacterPattern.test(value)) {
        context.addIssue({
          code: 'custom',
          path: [field],
          message: 'Line breaks and control characters are not supported here.',
        });
      }
    }
    if (input.email.trim() && !emailPattern.test(input.email.trim())) {
      context.addIssue({ code: 'custom', path: ['email'], message: 'Enter a valid email address.' });
    }
    if (input.website.trim()) {
      try {
        const parsed = new URL(
          input.website.trim().match(/^[a-z][a-z\d+.-]*:/iu)
            ? input.website.trim()
            : `https://${input.website.trim()}`,
        );
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('protocol');
        if (!parsed.hostname || parsed.username || parsed.password) throw new Error('host');
      } catch {
        context.addIssue({
          code: 'custom',
          path: ['website'],
          message: 'Use an HTTP or HTTPS website without embedded credentials.',
        });
      }
    }
  });

export type VcardInput = z.infer<typeof vcardInputSchema>;

export interface VcardResult {
  payload: string;
  filename: string;
  normalizedWebsite: string;
}

function escapeVcardText(value: string) {
  return value
    .trim()
    .replace(/\\/gu, '\\\\')
    .replace(/;/gu, '\\;')
    .replace(/,/gu, '\\,')
    .replace(/\r?\n/gu, '\\n');
}

function normalizeWebsite(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.match(/^[a-z][a-z\d+.-]*:/iu) ? trimmed : `https://${trimmed}`;
}

function normalize(input: VcardInput): VcardInput {
  return {
    fullName: input.fullName.trim(),
    organization: input.organization.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    website: normalizeWebsite(input.website),
    address: input.address.trim(),
    note: input.note.trim(),
  };
}

export function validateVcardInput(input: VcardInput): ValidationResult<VcardInput> {
  const parsed = vcardInputSchema.safeParse(input);
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

export function calculateVcard(input: VcardInput): VcardResult {
  const validation = validateVcardInput(input);
  if (!validation.success) {
    const firstError = validation.errors[0];
    throw new QrInputError(firstError.field, firstError.code, firstError.message);
  }

  const value = validation.data;
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVcardText(value.fullName)}`,
    ...(value.organization ? [`ORG:${escapeVcardText(value.organization)}`] : []),
    ...(value.phone ? [`TEL;TYPE=CELL:${escapeVcardText(value.phone)}`] : []),
    ...(value.email ? [`EMAIL;TYPE=INTERNET:${escapeVcardText(value.email)}`] : []),
    ...(value.website ? [`URL:${escapeVcardText(value.website)}`] : []),
    ...(value.address ? [`ADR;TYPE=WORK:;;${escapeVcardText(value.address)};;;;`] : []),
    ...(value.note ? [`NOTE:${escapeVcardText(value.note)}`] : []),
    'END:VCARD',
  ];
  return { payload: `${lines.join('\r\n')}\r\n`, filename: 'contact.vcf', normalizedWebsite: value.website };
}

export { escapeVcardText };
