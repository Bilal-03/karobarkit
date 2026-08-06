import { MAX_LOGO_BYTES, MAX_LOGO_DIMENSION, MAX_LOGO_OUTPUT_DIMENSION } from './constants';
import type { LogoAsset } from './types';

const SUPPORTED_LOGO_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
} as const;

export type SupportedLogoMime = keyof typeof SUPPORTED_LOGO_TYPES;

export class LogoValidationError extends Error {
  readonly code:
    | 'unsupported_type'
    | 'extension_mismatch'
    | 'too_large'
    | 'invalid_image'
    | 'dimensions_too_large'
    | 'browser_only';

  constructor(code: LogoValidationError['code'], message: string) {
    super(message);
    this.name = 'LogoValidationError';
    this.code = code;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new LogoValidationError('invalid_image', 'We could not read that logo file.'));
    reader.readAsDataURL(file);
  });
}

function getExtension(name: string) {
  return name.toLowerCase().split('.').pop() ?? '';
}

async function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  const candidate = blob as Blob & { arrayBuffer?: () => Promise<ArrayBuffer> };
  if (typeof candidate.arrayBuffer === 'function') return candidate.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () =>
      reject(new LogoValidationError('invalid_image', 'We could not read that logo file.'));
    reader.readAsArrayBuffer(blob);
  });
}

async function readHeader(file: File) {
  return new Uint8Array(await readBlobAsArrayBuffer(file.slice(0, 16)));
}

function hasSignature(mime: SupportedLogoMime, header: Uint8Array) {
  if (mime === 'image/png') {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => header[index] === byte);
  }
  if (mime === 'image/jpeg') {
    return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  }
  return (
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50
  );
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  if (typeof Image === 'undefined') {
    return Promise.reject(
      new LogoValidationError('browser_only', 'Logo processing is available in your browser.'),
    );
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new LogoValidationError('invalid_image', 'That logo file could not be decoded.'));
    image.src = dataUrl;
  });
}

function normalizeImage(image: HTMLImageElement, sourceDataUrl: string, mime: SupportedLogoMime) {
  const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
  if (!longestSide || longestSide > MAX_LOGO_DIMENSION) {
    throw new LogoValidationError(
      'dimensions_too_large',
      `Keep the logo dimensions at or below ${MAX_LOGO_DIMENSION} px on its longest side.`,
    );
  }

  const scale = Math.min(1, MAX_LOGO_OUTPUT_DIMENSION / longestSide);
  if (scale === 1 && mime !== 'image/webp') {
    return { dataUrl: sourceDataUrl, mimeType: mime === 'image/jpeg' ? 'image/jpeg' : 'image/png' } as const;
  }

  if (typeof document === 'undefined') {
    throw new LogoValidationError('browser_only', 'Logo processing is available in your browser.');
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new LogoValidationError('invalid_image', 'We could not prepare that logo preview.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { dataUrl: canvas.toDataURL('image/png'), mimeType: 'image/png' as const };
}

export async function processLogoFile(file: File): Promise<LogoAsset> {
  if (typeof File === 'undefined' || !(file instanceof File)) {
    throw new LogoValidationError('invalid_image', 'Choose an image file for the logo.');
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new LogoValidationError('too_large', 'Keep the logo file at or below 2 MB.');
  }

  const mime = file.type as SupportedLogoMime;
  const expectedExtension = SUPPORTED_LOGO_TYPES[mime];
  if (!expectedExtension) {
    throw new LogoValidationError(
      'unsupported_type',
      'Use a PNG, JPEG or WebP logo image. SVG files are not accepted.',
    );
  }
  if (
    getExtension(file.name) !== expectedExtension &&
    !(mime === 'image/jpeg' && getExtension(file.name) === 'jpeg')
  ) {
    throw new LogoValidationError('extension_mismatch', 'The file extension does not match its image type.');
  }

  const header = await readHeader(file);
  if (!hasSignature(mime, header)) {
    throw new LogoValidationError('invalid_image', 'That file does not contain a valid image signature.');
  }

  const dataUrl = await readAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const normalized = normalizeImage(image, dataUrl, mime);
  return {
    dataUrl: normalized.dataUrl,
    mimeType: normalized.mimeType,
    width: Math.max(
      1,
      Math.round(
        image.naturalWidth *
          (normalized.dataUrl === dataUrl
            ? 1
            : Math.min(1, MAX_LOGO_OUTPUT_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight))),
      ),
    ),
    height: Math.max(
      1,
      Math.round(
        image.naturalHeight *
          (normalized.dataUrl === dataUrl
            ? 1
            : Math.min(1, MAX_LOGO_OUTPUT_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight))),
      ),
    ),
    originalName: file.name.slice(0, 120),
  };
}

export function isLogoAsset(value: unknown): value is LogoAsset {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<LogoAsset>;
  return (
    typeof candidate.dataUrl === 'string' &&
    /^data:image\/(?:png|jpeg);base64,/u.test(candidate.dataUrl) &&
    (candidate.mimeType === 'image/png' || candidate.mimeType === 'image/jpeg') &&
    typeof candidate.width === 'number' &&
    typeof candidate.height === 'number' &&
    typeof candidate.originalName === 'string'
  );
}
