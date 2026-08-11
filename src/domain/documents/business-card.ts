import { z } from 'zod';

import type { ValidationResult } from '@/domain/calculations/types';
import { normalizeUrl } from '@/domain/qr/url';

import { DOCUMENT_PAGE_LAYOUT } from './constants';
import { DocumentInputError } from './errors';
import type { BusinessCardDocument, BusinessCardInput } from './types';
import {
  addCommonDocumentIssues,
  brandingFromInput,
  commonDocumentSchema,
  identityFromInput,
  mapIssuesToFields,
  normalizeCommonDocumentInput,
} from './validation';

export type { BusinessCardDocument, BusinessCardInput } from './types';

const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);
const requiredText = (label: string, max: number) =>
  optionalText(label, max).min(1, `Enter ${label.toLowerCase()}.`);

export const businessCardInputSchema = commonDocumentSchema
  .extend({
    personName: requiredText('person name', 120),
    designation: optionalText('Designation', 120),
    cardPhone: optionalText('Card phone', 50),
    cardEmail: optionalText('Card email', 160),
    cardWebsite: optionalText('Card website', 2048),
    cardAddress: optionalText('Card address', 240),
    cardTagline: optionalText('Card tagline', 180),
    cardNote: optionalText('Card note', 240),
  })
  .superRefine((input, context) => {
    addCommonDocumentIssues(input, context);
    if (input.cardEmail && !/^\S+@\S+\.\S+$/u.test(input.cardEmail)) {
      context.addIssue({ code: 'custom', path: ['cardEmail'], message: 'Enter a valid card email address.' });
    }
    if (input.cardWebsite) {
      try {
        normalizeUrl(input.cardWebsite);
      } catch {
        context.addIssue({
          code: 'custom',
          path: ['cardWebsite'],
          message: 'Enter an HTTP or HTTPS card website address.',
        });
      }
    }
  });

export const businessCardDefaultValues: BusinessCardInput = {
  businessName: 'KarobarKit Demo',
  businessAddress: 'India',
  phone: '+91 9876543210',
  email: 'hello@example.com',
  website: 'https://example.com',
  tagline: 'Simple tools for small businesses',
  gstin: '',
  cin: '',
  registrationNumber: '',
  additionalContact: '',
  socialHandle: '',
  logo: null,
  footerText: '',
  template: 'formal',
  accent: 'teal',
  logoAlignment: 'left',
  headerDivider: false,
  footerDivider: false,
  personName: 'KarobarKit Demo',
  designation: 'Business owner',
  cardPhone: '+91 9876543210',
  cardEmail: 'hello@example.com',
  cardWebsite: 'https://example.com',
  cardAddress: 'India',
  cardTagline: 'Simple tools for small businesses',
  cardNote: 'Sample proof — replace with your details.',
};

export function validateBusinessCardInput(input: BusinessCardInput): ValidationResult<BusinessCardInput> {
  const parsed = businessCardInputSchema.safeParse(input);
  if (parsed.success) {
    const normalized = normalizeCommonDocumentInput(parsed.data);
    return {
      success: true,
      data: {
        ...normalized,
        cardWebsite: parsed.data.cardWebsite ? normalizeUrl(parsed.data.cardWebsite) : '',
      },
    };
  }
  return { success: false, errors: mapIssuesToFields(parsed.error.issues) };
}

export function calculateBusinessCard(input: BusinessCardInput): BusinessCardDocument {
  const validation = validateBusinessCardInput(input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new DocumentInputError(
      first?.field ?? 'form',
      first?.code ?? 'invalid_input',
      first?.message ?? 'Check the highlighted card fields.',
    );
  }
  const value = validation.data;
  return {
    type: 'business-card',
    identity: identityFromInput(value),
    logo: value.logo,
    branding: brandingFromInput(value),
    footerText: value.footerText,
    personName: value.personName,
    designation: value.designation,
    contact: {
      phone: value.cardPhone,
      email: value.cardEmail,
      website: value.cardWebsite,
      additionalLine: '',
      socialHandle: '',
    },
    address: value.cardAddress,
    tagline: value.cardTagline,
    note: value.cardNote,
    layout: DOCUMENT_PAGE_LAYOUT,
    exportSettings: { baseFilename: 'karobarkit-business-card', formats: ['pdf'] },
  };
}
