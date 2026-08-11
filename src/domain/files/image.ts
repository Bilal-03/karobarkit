import { z } from 'zod';

import type { ValidationResult } from '@/domain/calculations/types';
import { FILE_LIMITS, isAllowedImageMimeType } from '@/lib/files/limits';

export const IMAGE_OUTPUT_FORMATS = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type ImageOutputFormat = (typeof IMAGE_OUTPUT_FORMATS)[number];

export const imageProcessingInputSchema = z.object({
  width: z.string(),
  height: z.string(),
  quality: z.string(),
  format: z.enum(IMAGE_OUTPUT_FORMATS),
  stripMetadata: z.boolean(),
});

export type ImageProcessingInput = z.infer<typeof imageProcessingInputSchema>;

export interface ImageProcessingPlan {
  width: number;
  height: number;
  quality: number;
  format: ImageOutputFormat;
  stripMetadata: boolean;
  sourceWidth?: number;
  sourceHeight?: number;
}

export interface ImageFileInfo {
  name: string;
  type: string;
  bytes: number;
  width: number;
  height: number;
}

function positiveInteger(value: string, field: string, max: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max)
    throw new Error(`${field} must be a whole number between 1 and ${max.toLocaleString('en-IN')}.`);
  return parsed;
}

export function validateImageProcessingInput(
  input: ImageProcessingInput,
): ValidationResult<ImageProcessingInput> {
  const parsed = imageProcessingInputSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      errors: [{ field: 'form', code: 'invalid_input', message: 'Choose a supported image output format.' }],
    };
  const errors: Array<{ field: string; code: string; message: string }> = [];
  try {
    positiveInteger(parsed.data.width, 'Width', FILE_LIMITS.maxImageDimension);
  } catch (error) {
    errors.push({
      field: 'width',
      code: 'invalid_width',
      message: error instanceof Error ? error.message : 'Enter a valid width.',
    });
  }
  try {
    positiveInteger(parsed.data.height, 'Height', FILE_LIMITS.maxImageDimension);
  } catch (error) {
    errors.push({
      field: 'height',
      code: 'invalid_height',
      message: error instanceof Error ? error.message : 'Enter a valid height.',
    });
  }
  const quality = Number(parsed.data.quality);
  if (!Number.isFinite(quality) || quality < 0.1 || quality > 1)
    errors.push({ field: 'quality', code: 'invalid_quality', message: 'Quality must be between 0.1 and 1.' });
  return errors.length ? { success: false, errors } : { success: true, data: parsed.data };
}

export function calculateImageProcessingPlan(
  input: ImageProcessingInput,
  source?: { width: number; height: number },
): ImageProcessingPlan {
  const validation = validateImageProcessingInput(input);
  if (!validation.success) throw new Error(validation.errors[0].message);
  const width = positiveInteger(validation.data.width, 'Width', FILE_LIMITS.maxImageDimension);
  const height = positiveInteger(validation.data.height, 'Height', FILE_LIMITS.maxImageDimension);
  const quality = Number(validation.data.quality);
  if (width * height > FILE_LIMITS.maxDecodedImagePixels)
    throw new Error(
      `The output is limited to ${FILE_LIMITS.maxDecodedImagePixels.toLocaleString('en-IN')} pixels.`,
    );
  return {
    width,
    height,
    quality,
    format: validation.data.format,
    // Canvas re-encoding cannot preserve source EXIF/IPTC metadata. Keep the
    // result contract honest even when an older saved input supplied `false`.
    stripMetadata: true,
    sourceWidth: source?.width,
    sourceHeight: source?.height,
  };
}

export function validateImageFile(
  file: Pick<File, 'name' | 'type' | 'size'>,
): ValidationResult<ImageFileInfo> {
  if (!isAllowedImageMimeType(file.type))
    return {
      success: false,
      errors: [
        { field: 'file', code: 'unsupported_type', message: 'Choose a JPEG, PNG, WebP or GIF image.' },
      ],
    };
  if (file.size > FILE_LIMITS.maxBytesPerFile)
    return {
      success: false,
      errors: [
        {
          field: 'file',
          code: 'too_large',
          message: `Keep the image at or below ${FILE_LIMITS.maxBytesPerFile / (1024 * 1024)} MB.`,
        },
      ],
    };
  return { success: true, data: { name: file.name, type: file.type, bytes: file.size, width: 0, height: 0 } };
}

export async function readImageFileInfo(file: File): Promise<ImageFileInfo> {
  const validation = validateImageFile(file);
  if (!validation.success) throw new Error(validation.errors[0].message);
  const bitmap = await createImageBitmap(file);
  try {
    if (
      bitmap.width > FILE_LIMITS.maxImageDimension ||
      bitmap.height > FILE_LIMITS.maxImageDimension ||
      bitmap.width * bitmap.height > FILE_LIMITS.maxDecodedImagePixels
    ) {
      throw new Error(
        `The image is too large to decode safely. Maximum is ${FILE_LIMITS.maxDecodedImagePixels.toLocaleString('en-IN')} pixels.`,
      );
    }
    return { ...validation.data, width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}
