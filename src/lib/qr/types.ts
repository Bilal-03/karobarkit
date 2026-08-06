export interface QrRenderOptions {
  size: number;
  margin?: number;
}

export class QrRenderError extends Error {
  readonly code = 'qr_render_failed';

  constructor(message = 'We could not render this QR code. Try a shorter value.') {
    super(message);
    this.name = 'QrRenderError';
  }
}

export class QrExportError extends Error {
  readonly code: 'invalid_data' | 'download_failed' | 'print_failed';

  constructor(code: 'invalid_data' | 'download_failed' | 'print_failed', message: string) {
    super(message);
    this.name = 'QrExportError';
    this.code = code;
  }
}
