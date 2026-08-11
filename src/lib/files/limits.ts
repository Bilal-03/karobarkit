/**
 * Shared browser-side safety limits for the file wave.
 *
 * These values are deliberately centralized so a new file workflow cannot
 * accidentally accept a different (or unbounded) payload. They are measured
 * against the supported desktop/mobile browsers during the WP-3 release gate,
 * not a promise that every device can process the maximum in one frame.
 */
export const FILE_LIMITS = {
  maxFileCount: 10,
  maxBytesPerFile: 12 * 1024 * 1024,
  maxTotalBytes: 50 * 1024 * 1024,
  maxDecodedImagePixels: 40_000_000,
  maxImageDimension: 8_192,
  maxPdfPages: 100,
  maxOutputPdfPages: 100,
  workerTimeoutMs: 15_000,
} as const;

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const ALLOWED_PDF_MIME_TYPES = ['application/pdf'] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export function isAllowedImageMimeType(value: string): value is AllowedImageMimeType {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(value);
}

export function isAllowedPdfMimeType(value: string) {
  return (ALLOWED_PDF_MIME_TYPES as readonly string[]).includes(value);
}

export function assertFileSize(file: Pick<File, 'name' | 'size'>, options?: { totalBytes?: number }) {
  if (file.size > FILE_LIMITS.maxBytesPerFile) {
    throw new Error(
      `${file.name || 'This file'} is too large. Keep each file at or below ${formatBytes(FILE_LIMITS.maxBytesPerFile)}.`,
    );
  }

  if (options?.totalBytes !== undefined && options.totalBytes > FILE_LIMITS.maxTotalBytes) {
    throw new Error(
      `Keep the selected files at or below ${formatBytes(FILE_LIMITS.maxTotalBytes)} in total.`,
    );
  }
}

export function assertFileCount(files: readonly unknown[]) {
  if (files.length > FILE_LIMITS.maxFileCount) {
    throw new Error(`Choose no more than ${FILE_LIMITS.maxFileCount} files at a time.`);
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes % (1024 * 1024) ? 1 : 0)} MB`;
}

export async function withFileProcessingTimeout<T>(
  task: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = FILE_LIMITS.workerTimeoutMs,
  externalSignal?: AbortSignal,
) {
  const controller = new AbortController();
  const abortFromExternal = () => controller.abort(externalSignal?.reason);
  externalSignal?.addEventListener('abort', abortFromExternal, { once: true });
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      task(controller.signal),
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort('Local file processing timed out.');
          reject(new Error('Local file processing took too long and was stopped. Try a smaller input.'));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', abortFromExternal);
  }
}
