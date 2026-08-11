import { z } from 'zod';

import type { ValidationResult } from '@/domain/calculations/types';
import { QrInputError } from '@/domain/qr/types';

export const emailSignatureInputSchema = z.object({
  name: z.string(),
  role: z.string(),
  company: z.string(),
  phone: z.string(),
  email: z.string(),
  website: z.string(),
  linkedin: z.string(),
  accent: z.enum(['teal', 'navy', 'ochre']),
});

export type EmailSignatureInput = z.infer<typeof emailSignatureInputSchema>;

export interface EmailSignatureResult {
  html: string;
  plainText: string;
  links: Array<{ label: string; href: string }>;
}

const safeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/gu,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character,
  );
}

function safeHttpUrl(value: string, field: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  let parsed: URL;
  try {
    parsed = new URL(trimmed.match(/^[a-z][a-z\d+.-]*:/iu) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new QrInputError(field, 'invalid_url', 'Use a valid HTTP or HTTPS URL.');
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password
  )
    throw new QrInputError(
      field,
      'invalid_url',
      'Only HTTP and HTTPS links without embedded credentials are supported.',
    );
  return parsed.toString();
}

export function validateEmailSignatureInput(
  input: EmailSignatureInput,
): ValidationResult<EmailSignatureInput> {
  const parsed = emailSignatureInputSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      errors: [
        {
          field: 'form',
          code: 'invalid_input',
          message: 'Complete the signature fields using supported values.',
        },
      ],
    };
  const errors = [] as Array<{ field: string; code: string; message: string }>;
  if (!parsed.data.name.trim()) errors.push({ field: 'name', code: 'required', message: 'Enter a name.' });
  if (parsed.data.email.trim() && !safeEmail.test(parsed.data.email.trim()))
    errors.push({ field: 'email', code: 'invalid_email', message: 'Enter a valid email address.' });
  for (const field of ['website', 'linkedin'] as const) {
    try {
      safeHttpUrl(parsed.data[field], field);
    } catch (error) {
      errors.push({
        field,
        code: 'invalid_url',
        message: error instanceof Error ? error.message : 'Enter a valid URL.',
      });
    }
  }
  return errors.length
    ? { success: false, errors }
    : { success: true, data: { ...parsed.data, name: parsed.data.name.trim() } };
}

export function calculateEmailSignature(input: EmailSignatureInput): EmailSignatureResult {
  const validation = validateEmailSignatureInput(input);
  if (!validation.success)
    throw new QrInputError(
      validation.errors[0].field,
      validation.errors[0].code,
      validation.errors[0].message,
    );
  const value = validation.data;
  const links = [
    value.website ? { label: 'Website', href: safeHttpUrl(value.website, 'website') } : null,
    value.linkedin ? { label: 'LinkedIn', href: safeHttpUrl(value.linkedin, 'linkedin') } : null,
  ].filter((link): link is { label: string; href: string } => Boolean(link));
  const color = value.accent === 'navy' ? '#27435a' : value.accent === 'ochre' ? '#a66310' : '#0d8076';
  const identity = [value.name, value.role, value.company].filter(Boolean).join(' · ');
  const contact = [value.phone, value.email].filter(Boolean).join(' · ');
  const html = `<table role="presentation" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;color:#16212b"><tr><td style="border-left:4px solid ${color};padding:8px 12px"><strong style="font-size:16px">${escapeHtml(value.name)}</strong>${value.role || value.company ? `<br><span>${escapeHtml([value.role, value.company].filter(Boolean).join(' · '))}</span>` : ''}${contact ? `<br><span>${escapeHtml(contact)}</span>` : ''}${links.length ? `<br>${links.map((link) => `<a href="${escapeHtml(link.href)}" style="color:${color}">${escapeHtml(link.label)}</a>`).join(' · ')}` : ''}</td></tr></table>`;
  return {
    html,
    plainText: [identity, contact, ...links.map((link) => `${link.label}: ${link.href}`)]
      .filter(Boolean)
      .join('\n'),
    links,
  };
}

export { escapeHtml, safeHttpUrl };
