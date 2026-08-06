import { z } from 'zod';

import { type ValidationResult } from '@/domain/calculations/types';

import { QrInputError } from './types';

export const URL_QR_MAX_LENGTH = 2048;

export const URL_QR_SIZES = [
  { value: '256', label: '256 px · compact' },
  { value: '512', label: '512 px · standard' },
  { value: '1024', label: '1024 px · large' },
] as const;

const urlQrSizeValues = URL_QR_SIZES.map((option) => option.value) as [string, ...string[]];

export const urlQrInputSchema = z
  .object({
    url: z.string(),
    size: z.enum(urlQrSizeValues),
  })
  .superRefine((input, context) => {
    try {
      normalizeUrl(input.url);
    } catch (error) {
      context.addIssue({
        code: 'custom',
        path: ['url'],
        message: error instanceof Error ? error.message : 'Enter a valid HTTP or HTTPS URL.',
      });
    }
  });

export type UrlQrInput = z.infer<typeof urlQrInputSchema>;

export interface UrlQrResult {
  normalizedUrl: string;
  payload: string;
  size: number;
}

function hasExplicitScheme(value: string) {
  return /^[a-z][a-z\d+.-]*:/i.test(value);
}

export function normalizeUrl(value: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new QrInputError('url', 'required', 'Enter a URL to encode.');
  }

  const trimmed = value.trim();
  if (trimmed.length > URL_QR_MAX_LENGTH) {
    throw new QrInputError(
      'url',
      'too_long',
      `Keep the URL to ${URL_QR_MAX_LENGTH.toLocaleString('en-IN')} characters or fewer for a reliable QR code.`,
    );
  }

  if (hasExplicitScheme(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    throw new QrInputError(
      'url',
      'unsupported_protocol',
      'Only HTTP and HTTPS URLs are supported. JavaScript, data, file and other protocols are not encoded.',
    );
  }

  const candidate = hasExplicitScheme(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new QrInputError('url', 'invalid_url', 'Enter a complete, valid HTTP or HTTPS URL.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new QrInputError(
      'url',
      'unsupported_protocol',
      'Only HTTP and HTTPS URLs are supported. JavaScript, data, file and other protocols are not encoded.',
    );
  }

  if (!parsed.hostname) {
    throw new QrInputError('url', 'missing_hostname', 'The URL must include a hostname.');
  }

  if (parsed.username || parsed.password) {
    throw new QrInputError(
      'url',
      'embedded_credentials',
      'URLs containing embedded usernames or passwords are not supported.',
    );
  }

  return parsed.toString();
}

export function parseUrlQrSize(value: string): number {
  const size = Number(value);
  if (!Number.isInteger(size) || !URL_QR_SIZES.some((option) => Number(option.value) === size)) {
    throw new QrInputError('size', 'invalid_size', 'Choose a supported QR output size.');
  }
  return size;
}

export function validateUrlQrInput(input: UrlQrInput): ValidationResult<UrlQrInput> {
  const parsed = urlQrInputSchema.safeParse(input);
  if (parsed.success) {
    return {
      success: true,
      data: { url: parsed.data.url.trim(), size: parsed.data.size },
    };
  }

  return {
    success: false,
    errors: parsed.error.issues.map((issue) => ({
      field: String(issue.path[0] ?? 'form'),
      code: issue.path[0] === 'url' ? 'invalid_url' : 'invalid_size',
      message: issue.message,
    })),
  };
}

export function calculateUrlQr(input: UrlQrInput): UrlQrResult {
  const normalizedUrl = normalizeUrl(input.url);
  const size = parseUrlQrSize(input.size);

  return { normalizedUrl, payload: normalizedUrl, size };
}
