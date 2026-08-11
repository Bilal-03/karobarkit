import { z } from 'zod';

import type { ValidationResult } from '@/domain/calculations/types';
import { FILE_LIMITS, isAllowedPdfMimeType } from '@/lib/files/limits';

export const pdfOperationModes = ['merge', 'split'] as const;
export type PdfOperationMode = (typeof pdfOperationModes)[number];

export const pdfOperationInputSchema = z.object({
  mode: z.enum(pdfOperationModes),
  splitPages: z.string(),
});

export type PdfOperationInput = z.infer<typeof pdfOperationInputSchema>;

export interface PdfFileInfo {
  name: string;
  type: string;
  bytes: number;
  pages: number;
}

export function validatePdfOperationInput(input: PdfOperationInput): ValidationResult<PdfOperationInput> {
  const parsed = pdfOperationInputSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      errors: [{ field: 'form', code: 'invalid_input', message: 'Choose Merge or Split.' }],
    };
  if (parsed.data.mode === 'split' && !parsed.data.splitPages.trim()) {
    return {
      success: false,
      errors: [
        {
          field: 'splitPages',
          code: 'required',
          message: 'Enter pages such as 1, 3-4 or leave blank to export every page.',
        },
      ],
    };
  }
  return { success: true, data: parsed.data };
}

export function validatePdfFile(file: Pick<File, 'name' | 'type' | 'size'>): ValidationResult<PdfFileInfo> {
  if (!isAllowedPdfMimeType(file.type) && !/\.pdf$/iu.test(file.name)) {
    return {
      success: false,
      errors: [{ field: 'file', code: 'unsupported_type', message: 'Choose a PDF file.' }],
    };
  }
  if (file.size > FILE_LIMITS.maxBytesPerFile) {
    return {
      success: false,
      errors: [
        {
          field: 'file',
          code: 'too_large',
          message: `Keep each PDF at or below ${FILE_LIMITS.maxBytesPerFile / (1024 * 1024)} MB.`,
        },
      ],
    };
  }
  return { success: true, data: { name: file.name, type: file.type, bytes: file.size, pages: 0 } };
}

export function parsePageSelection(value: string, pageCount: number) {
  if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > FILE_LIMITS.maxPdfPages)
    throw new Error(`PDFs are limited to ${FILE_LIMITS.maxPdfPages} pages.`);
  if (!value.trim()) return Array.from({ length: pageCount }, (_, index) => index);
  const selected = new Set<number>();
  for (const token of value.split(/[,\s]+/u).filter(Boolean)) {
    const range = /^(\d+)(?:-(\d+))?$/u.exec(token);
    if (!range) throw new Error(`Use page numbers and ranges such as 1, 3-4. Invalid token: ${token}.`);
    const start = Number(range[1]);
    const end = Number(range[2] ?? range[1]);
    if (start < 1 || end < start || end > pageCount)
      throw new Error(`Page selection must stay between 1 and ${pageCount}.`);
    for (let page = start; page <= end; page += 1) selected.add(page - 1);
  }
  const pages = [...selected].sort((left, right) => left - right);
  if (pages.length > FILE_LIMITS.maxOutputPdfPages)
    throw new Error(`The output is limited to ${FILE_LIMITS.maxOutputPdfPages} pages.`);
  return pages;
}
