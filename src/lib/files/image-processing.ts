import {
  calculateImageProcessingPlan,
  readImageFileInfo,
  type ImageProcessingInput,
} from '@/domain/files/image';
import { FILE_LIMITS } from './limits';
import { safeFilename } from '@/lib/security/safe-filename';

export class ImageProcessingError extends Error {
  readonly code = 'image_processing_failed';

  constructor(message: string) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new ImageProcessingError('Local image processing was cancelled.');
}

export async function resizeAndCompressImage(
  file: File,
  input: ImageProcessingInput,
  options?: { signal?: AbortSignal },
) {
  assertNotAborted(options?.signal);
  const info = await readImageFileInfo(file);
  assertNotAborted(options?.signal);
  const plan = calculateImageProcessingPlan(input, info);
  if (plan.width * plan.height > FILE_LIMITS.maxDecodedImagePixels)
    throw new ImageProcessingError('The requested output exceeds the safe pixel limit.');

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    assertNotAborted(options?.signal);
    const canvas = document.createElement('canvas');
    canvas.width = plan.width;
    canvas.height = plan.height;
    const context = canvas.getContext('2d', { alpha: plan.format !== 'image/jpeg' });
    if (!context) throw new ImageProcessingError('This browser could not create a local image canvas.');
    if (plan.format === 'image/jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, plan.width, plan.height);
    }
    context.drawImage(bitmap, 0, 0, plan.width, plan.height);
    assertNotAborted(options?.signal);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) =>
          value
            ? resolve(value)
            : reject(new ImageProcessingError('The browser could not encode the resized image.')),
        plan.format,
        plan.quality,
      );
    });
    assertNotAborted(options?.signal);
    const extension = plan.format === 'image/jpeg' ? 'jpg' : plan.format.split('/')[1];
    return {
      blob,
      filename: safeFilename(file.name.replace(/\.[a-z\d]+$/iu, ''), 'karobarkit-image', extension),
      width: plan.width,
      height: plan.height,
      bytes: blob.size,
      metadataRemoved: true,
    };
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error;
    throw new ImageProcessingError(
      error instanceof Error ? error.message : 'The image could not be processed locally.',
    );
  } finally {
    bitmap?.close();
  }
}
