import { z } from 'zod';

import { normalizeUrl } from '@/domain/qr/url';

import { isLogoAsset } from './logo';
import type { BrandingPreferences, BusinessIdentity, LogoAsset } from './types';

export const brandingSchema = z.object({
  template: z.enum(['editorial', 'formal']),
  accent: z.enum(['teal', 'navy', 'ochre']),
  logoAlignment: z.enum(['left', 'center', 'right']),
  headerDivider: z.boolean(),
  footerDivider: z.boolean(),
});

export const logoSchema = z.custom<LogoAsset | null>(
  (value) => value === null || isLogoAsset(value),
  'Choose a valid PNG, JPEG or WebP logo processed in this browser.',
);

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${label.toLowerCase()}.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);

export const commonDocumentSchema = z.object({
  businessName: requiredText('the business name', 120),
  businessAddress: requiredText('the business address', 600),
  phone: optionalText('Phone number', 50),
  email: optionalText('Email', 160),
  website: optionalText('Website', 2048),
  tagline: optionalText('Tagline', 180),
  gstin: optionalText('GSTIN', 32),
  cin: optionalText('CIN', 32),
  registrationNumber: optionalText('Registration number', 64),
  additionalContact: optionalText('Additional contact line', 180),
  socialHandle: optionalText('Social handle', 100),
  logo: logoSchema,
  footerText: optionalText('Footer text', 300),
  template: z.enum(['editorial', 'formal']),
  accent: z.enum(['teal', 'navy', 'ochre']),
  logoAlignment: z.enum(['left', 'center', 'right']),
  headerDivider: z.boolean(),
  footerDivider: z.boolean(),
});

export function isValidLocalDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function addCommonDocumentIssues(
  input: z.infer<typeof commonDocumentSchema>,
  context: z.RefinementCtx,
) {
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(input.email)) {
    context.addIssue({ code: 'custom', path: ['email'], message: 'Enter a valid email address.' });
  }

  if (input.website) {
    try {
      normalizeUrl(input.website);
    } catch {
      context.addIssue({
        code: 'custom',
        path: ['website'],
        message: 'Enter an HTTP or HTTPS website address.',
      });
    }
  }
}

export function normalizeCommonDocumentInput<T extends z.infer<typeof commonDocumentSchema>>(input: T) {
  return {
    ...input,
    website: input.website ? normalizeUrl(input.website) : '',
  };
}

export function brandingFromInput(
  input: Pick<BrandingPreferences, keyof BrandingPreferences>,
): BrandingPreferences {
  return {
    template: input.template,
    accent: input.accent,
    logoAlignment: input.logoAlignment,
    headerDivider: input.headerDivider,
    footerDivider: input.footerDivider,
  };
}

export function identityFromInput(input: {
  businessName: string;
  businessAddress: string;
  phone: string;
  email: string;
  website: string;
  tagline: string;
  gstin: string;
  cin: string;
  registrationNumber: string;
  additionalContact: string;
  socialHandle: string;
}): BusinessIdentity {
  return {
    name: input.businessName,
    tagline: input.tagline,
    address: { text: input.businessAddress },
    contact: {
      phone: input.phone,
      email: input.email,
      website: input.website,
      additionalLine: input.additionalContact,
      socialHandle: input.socialHandle,
    },
    gstin: input.gstin,
    cin: input.cin,
    registrationNumber: input.registrationNumber,
  };
}

export function mapIssuesToFields(issues: z.ZodIssue[], aliases: Record<string, string> = {}) {
  return issues.map((issue) => {
    const rawField = String(issue.path[0] ?? 'form');
    return {
      field: aliases[rawField] ?? rawField,
      code: 'invalid_input',
      message: issue.message,
    };
  });
}
