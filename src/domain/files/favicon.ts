import { z } from 'zod';

import type { ValidationResult } from '@/domain/calculations/types';
import { FILE_LIMITS } from '@/lib/files/limits';

export const FAVICON_OUTPUT_SIZES = [16, 32, 48, 180, 192, 512] as const;

export const faviconInputSchema = z.object({
  mode: z.enum(['initials', 'image']),
  initials: z.string(),
  background: z.string(),
  foreground: z.string(),
});

export type FaviconInput = z.infer<typeof faviconInputSchema>;

export interface FaviconPlan {
  initials: string;
  background: string;
  foreground: string;
  sizes: readonly number[];
}

const colorPattern = /^#[0-9a-f]{6}$/iu;

export function validateFaviconInput(input: FaviconInput): ValidationResult<FaviconInput> {
  const parsed = faviconInputSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      errors: [{ field: 'form', code: 'invalid_input', message: 'Choose a favicon source and colors.' }],
    };
  const errors = [] as Array<{ field: string; code: string; message: string }>;
  const initials = parsed.data.initials.trim();
  if (parsed.data.mode === 'initials' && !initials)
    errors.push({ field: 'initials', code: 'required', message: 'Enter one to three initials.' });
  if (Array.from(initials).length > 3)
    errors.push({ field: 'initials', code: 'too_long', message: 'Use no more than three initials.' });
  if (!colorPattern.test(parsed.data.background))
    errors.push({
      field: 'background',
      code: 'invalid_color',
      message: 'Use a six-digit hex color such as #0f766e.',
    });
  if (!colorPattern.test(parsed.data.foreground))
    errors.push({
      field: 'foreground',
      code: 'invalid_color',
      message: 'Use a six-digit hex color such as #ffffff.',
    });
  return errors.length ? { success: false, errors } : { success: true, data: { ...parsed.data, initials } };
}

export function calculateFaviconPlan(input: FaviconInput): FaviconPlan {
  const validation = validateFaviconInput(input);
  if (!validation.success) throw new Error(validation.errors[0].message);
  if (FAVICON_OUTPUT_SIZES.at(-1)! * FAVICON_OUTPUT_SIZES.at(-1)! > FILE_LIMITS.maxDecodedImagePixels)
    throw new Error('Favicon output exceeds the safe pixel limit.');
  return {
    initials: validation.data.initials.toUpperCase(),
    background: validation.data.background,
    foreground: validation.data.foreground,
    sizes: FAVICON_OUTPUT_SIZES,
  };
}
