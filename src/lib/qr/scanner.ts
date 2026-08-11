import { assertFileSize, isAllowedImageMimeType } from '@/lib/files/limits';

export interface ScannerDetection {
  rawValue: string;
  format?: string;
}

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string; format?: string }>>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

function detectorConstructor() {
  return (globalThis as typeof globalThis & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
}

export function scannerAvailability() {
  const Detector = detectorConstructor();
  const mediaDevices = typeof navigator === 'undefined' ? undefined : navigator.mediaDevices;
  return { image: Boolean(Detector), camera: Boolean(Detector && mediaDevices?.getUserMedia) };
}

export async function decodeImageFile(file: File): Promise<ScannerDetection[]> {
  if (!isAllowedImageMimeType(file.type)) throw new Error('Choose a JPEG, PNG, WebP or GIF image.');
  assertFileSize(file);
  const Detector = detectorConstructor();
  if (!Detector)
    throw new Error(
      'This browser does not expose a barcode detector. Try another browser or enter the content manually.',
    );
  const detector = new Detector();
  const bitmap = await createImageBitmap(file);
  try {
    const detections = await detector.detect(bitmap);
    return detections
      .map((item) => ({ rawValue: String(item.rawValue ?? '').trim(), format: item.format }))
      .filter((item) => item.rawValue.length > 0);
  } finally {
    bitmap.close();
  }
}

export async function detectFromVideo(video: HTMLVideoElement): Promise<ScannerDetection[]> {
  const Detector = detectorConstructor();
  if (!Detector) throw new Error('This browser does not expose a barcode detector.');
  const detections = await new Detector().detect(video);
  return detections
    .map((item) => ({ rawValue: String(item.rawValue ?? '').trim(), format: item.format }))
    .filter((item) => item.rawValue.length > 0);
}

export async function requestCameraStream() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera scanning is not available in this browser. Use the image-upload fallback.');
  }
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' } },
    audio: false,
  });
}
