import { z } from 'zod';

import type { ValidationResult } from '@/domain/calculations/types';
import { QrInputError } from '@/domain/qr/types';

export const reviewRequestInputSchema = z.object({
  businessName: z.string(),
  reviewUrl: z.string(),
  tone: z.enum(['warm', 'direct', 'formal']),
  whatsappCountryCode: z.string(),
  whatsappPhone: z.string(),
});

export type ReviewRequestInput = z.infer<typeof reviewRequestInputSchema>;

export interface ReviewRequestResult {
  subject: string;
  message: string;
  whatsappUrl: string | null;
  destination: string;
}

const MAX_NAME = 120;

function validateDestination(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error('Enter a complete review URL.');
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password
  )
    throw new Error('Only HTTP and HTTPS review links without embedded credentials are supported.');
  return parsed.toString();
}

export function validateReviewRequestInput(input: ReviewRequestInput): ValidationResult<ReviewRequestInput> {
  const parsed = reviewRequestInputSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      errors: [{ field: 'form', code: 'invalid_input', message: 'Complete the review request fields.' }],
    };
  const errors = [] as Array<{ field: string; code: string; message: string }>;
  if (!parsed.data.businessName.trim())
    errors.push({ field: 'businessName', code: 'required', message: 'Enter a business name.' });
  if (Array.from(parsed.data.businessName.trim()).length > MAX_NAME)
    errors.push({
      field: 'businessName',
      code: 'too_long',
      message: `Keep the business name to ${MAX_NAME} characters or fewer.`,
    });
  try {
    validateDestination(parsed.data.reviewUrl);
  } catch (error) {
    errors.push({
      field: 'reviewUrl',
      code: 'invalid_url',
      message: error instanceof Error ? error.message : 'Enter a valid review URL.',
    });
  }
  const phone = parsed.data.whatsappPhone.replace(/\D/g, '');
  const country = parsed.data.whatsappCountryCode.replace(/\D/g, '');
  if (
    phone &&
    (!/^\d{7,15}$/u.test(phone) ||
      !/^\d{1,4}$/u.test(country) ||
      country === '0' ||
      country.length + phone.length > 15)
  )
    errors.push({
      field: 'whatsappPhone',
      code: 'invalid_phone',
      message: 'Enter a valid international WhatsApp number or leave it blank.',
    });
  return errors.length
    ? { success: false, errors }
    : { success: true, data: { ...parsed.data, businessName: parsed.data.businessName.trim() } };
}

export function calculateReviewRequest(input: ReviewRequestInput): ReviewRequestResult {
  const validation = validateReviewRequestInput(input);
  if (!validation.success)
    throw new QrInputError(
      validation.errors[0].field,
      validation.errors[0].code,
      validation.errors[0].message,
    );
  const value = validation.data;
  const destination = validateDestination(value.reviewUrl);
  const messages = {
    warm: {
      subject: `We’d love your feedback on ${value.businessName}`,
      body: `Hi there,\n\nThank you for choosing ${value.businessName}. We hope you had a good experience. If you have a moment, we’d really appreciate your honest feedback:\n\n${destination}\n\nYour review helps us improve and helps future customers.\n\nThank you for your support.`,
    },
    direct: {
      subject: `A quick review for ${value.businessName}`,
      body: `Could you leave a quick, honest review for ${value.businessName}?\n\n${destination}\n\nYour feedback helps us improve. Thank you.`,
    },
    formal: {
      subject: `Feedback request for ${value.businessName}`,
      body: `Dear customer,\n\nThank you for choosing ${value.businessName}. We would appreciate an honest review of your experience using the link below:\n\n${destination}\n\nYour feedback will help us improve our service.\n\nKind regards,\n${value.businessName}`,
    },
  } as const;
  const message = messages[value.tone].body;
  const phone = value.whatsappPhone.replace(/\D/g, '');
  const country = value.whatsappCountryCode.replace(/\D/g, '');
  return {
    subject: messages[value.tone].subject,
    message,
    whatsappUrl: phone ? `https://wa.me/${country}${phone}?text=${encodeURIComponent(message)}` : null,
    destination,
  };
}
