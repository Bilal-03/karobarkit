import { z } from 'zod';

import type { ValidationResult } from '@/domain/calculations/types';

import { DOCUMENT_PAGE_LAYOUT, LETTERHEAD_BODY_MAX_LENGTH, LETTERHEAD_BODY_PAGE_LIMIT } from './constants';
import { DocumentInputError } from './errors';
import { formatDocumentDate, splitTextIntoPages } from './formatting';
import type { LetterheadDocument, LetterheadInput } from './types';
import {
  addCommonDocumentIssues,
  brandingFromInput,
  commonDocumentSchema,
  identityFromInput,
  isValidLocalDate,
  mapIssuesToFields,
  normalizeCommonDocumentInput,
} from './validation';

export type { LetterheadDocument, LetterheadInput } from './types';

const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);

export const letterheadInputSchema = commonDocumentSchema
  .extend({
    letterDate: optionalText('Letter date', 10),
    recipientName: optionalText('Recipient name', 160),
    recipientAddress: optionalText('Recipient address', 600),
    subject: optionalText('Subject', 240),
    body: optionalText('Letter body', LETTERHEAD_BODY_MAX_LENGTH),
    signatoryName: optionalText('Signatory name', 160),
    signatoryDesignation: optionalText('Signatory designation', 160),
    signaturePlaceholder: z.boolean(),
  })
  .superRefine((input, context) => {
    addCommonDocumentIssues(input, context);
    if (input.letterDate && !isValidLocalDate(input.letterDate)) {
      context.addIssue({ code: 'custom', path: ['letterDate'], message: 'Enter a valid calendar date.' });
    }
  });

export const letterheadDefaultValues: LetterheadInput = {
  businessName: '',
  businessAddress: '',
  phone: '',
  email: '',
  website: '',
  tagline: '',
  gstin: '',
  cin: '',
  registrationNumber: '',
  additionalContact: '',
  socialHandle: '',
  logo: null,
  footerText: '',
  template: 'editorial',
  accent: 'teal',
  logoAlignment: 'left',
  headerDivider: true,
  footerDivider: true,
  letterDate: '',
  recipientName: '',
  recipientAddress: '',
  subject: '',
  body: '',
  signatoryName: '',
  signatoryDesignation: '',
  signaturePlaceholder: true,
};

export function validateLetterheadInput(input: LetterheadInput): ValidationResult<LetterheadInput> {
  const parsed = letterheadInputSchema.safeParse(input);
  if (parsed.success) {
    return { success: true, data: normalizeCommonDocumentInput(parsed.data) };
  }

  return {
    success: false,
    errors: mapIssuesToFields(parsed.error.issues),
  };
}

export function calculateLetterhead(input: LetterheadInput): LetterheadDocument {
  const validation = validateLetterheadInput(input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new DocumentInputError(
      first?.field ?? 'form',
      first?.code ?? 'invalid_input',
      first?.message ?? 'Check the highlighted fields.',
    );
  }

  const value = validation.data;
  return {
    type: 'letterhead',
    identity: identityFromInput(value),
    logo: value.logo,
    branding: brandingFromInput(value),
    footerText: value.footerText,
    metadata: {
      title: 'Letter',
      number: '',
      date: value.letterDate,
      subject: value.subject,
    },
    recipient: {
      name: value.recipientName,
      address: { text: value.recipientAddress },
    },
    body: value.body,
    signature: {
      name: value.signatoryName,
      designation: value.signatoryDesignation,
      showPlaceholder: value.signaturePlaceholder,
    },
    displayDate: value.letterDate ? formatDocumentDate(value.letterDate) : '',
    bodyPages: splitTextIntoPages(value.body, LETTERHEAD_BODY_PAGE_LIMIT),
    layout: DOCUMENT_PAGE_LAYOUT,
    exportSettings: { baseFilename: 'karobarkit-letterhead', formats: ['pdf'] },
  };
}
