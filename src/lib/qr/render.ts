import QRCode from 'qrcode';

import { QrRenderError, type QrRenderOptions } from './types';

const DEFAULT_MARGIN = 4;

function rendererOptions({ size, margin = DEFAULT_MARGIN }: QrRenderOptions) {
  return {
    width: size,
    margin,
    errorCorrectionLevel: 'M' as const,
    color: {
      dark: '#16212bff',
      light: '#ffffffff',
    },
  };
}

export async function renderQrPngDataUrl(payload: string, options: QrRenderOptions): Promise<string> {
  if (payload.trim().length === 0) {
    throw new QrRenderError('A QR payload is required before rendering.');
  }

  try {
    return await QRCode.toDataURL(payload, {
      type: 'image/png',
      ...rendererOptions(options),
    });
  } catch {
    throw new QrRenderError();
  }
}

export async function renderQrSvg(payload: string, options: QrRenderOptions): Promise<string> {
  if (payload.trim().length === 0) {
    throw new QrRenderError('A QR payload is required before rendering.');
  }

  try {
    return await QRCode.toString(payload, {
      type: 'svg',
      ...rendererOptions(options),
    });
  } catch {
    throw new QrRenderError();
  }
}
