import { z } from 'zod';

import type { ValidationResult } from '@/domain/calculations/types';
import { QrInputError } from '@/domain/qr/types';

export const digitalSignatureInputSchema = z.object({
  penColor: z.enum(['ink', 'teal', 'navy', 'ochre']),
  background: z.enum(['transparent', 'white', 'soft-slate']),
  strokeWidth: z.string(),
});

export type DigitalSignatureInput = z.infer<typeof digitalSignatureInputSchema>;

export interface DigitalSignaturePlan {
  penColor: DigitalSignatureInput['penColor'];
  background: DigitalSignatureInput['background'];
  strokeWidth: number;
}

const MIN_STROKE_WIDTH = 1;
const MAX_STROKE_WIDTH = 8;

export function validateDigitalSignatureInput(
  input: DigitalSignatureInput,
): ValidationResult<DigitalSignatureInput> {
  const parsed = digitalSignatureInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      errors: [
        {
          field: 'form',
          code: 'invalid_input',
          message: 'Choose a supported pen colour, background and stroke width.',
        },
      ],
    };
  }

  const strokeWidth = Number(parsed.data.strokeWidth);
  if (!Number.isInteger(strokeWidth) || strokeWidth < MIN_STROKE_WIDTH || strokeWidth > MAX_STROKE_WIDTH) {
    return {
      success: false,
      errors: [
        {
          field: 'strokeWidth',
          code: 'invalid_width',
          message: `Choose a stroke width from ${MIN_STROKE_WIDTH} to ${MAX_STROKE_WIDTH}px.`,
        },
      ],
    };
  }

  return { success: true, data: parsed.data };
}

export function calculateDigitalSignature(input: DigitalSignatureInput): DigitalSignaturePlan {
  const validation = validateDigitalSignatureInput(input);
  if (!validation.success) {
    throw new QrInputError(
      validation.errors[0].field,
      validation.errors[0].code,
      validation.errors[0].message,
    );
  }

  return {
    penColor: validation.data.penColor,
    background: validation.data.background,
    strokeWidth: Number(validation.data.strokeWidth),
  };
}
