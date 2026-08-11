import type { BarcodeResult } from '@/domain/qr/barcode';

export class BarcodeRenderError extends Error {
  readonly code = 'barcode_render_failed';

  constructor(message = 'We could not render this barcode. Try a shorter value.') {
    super(message);
    this.name = 'BarcodeRenderError';
  }
}

function escapeXml(value: string) {
  return value.replace(
    /[&<>"']/gu,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character] ?? character,
  );
}

export function renderBarcodeSvg(result: BarcodeResult, options: { height?: number } = {}) {
  const height = options.height ?? (result.showLabel ? 150 : 120);
  if (!Number.isFinite(height) || height < 40 || height > 800)
    throw new BarcodeRenderError('Choose a supported barcode height.');
  if (!result.modulePattern || !/^[1-9]+$/u.test(result.modulePattern)) throw new BarcodeRenderError();

  const quiet = 12;
  const moduleWidth = result.width;
  const barcodeWidth =
    Array.from(result.modulePattern, Number).reduce((sum, value) => sum + value, 0) * moduleWidth;
  const labelHeight = result.showLabel ? 28 : 0;
  const width = barcodeWidth + quiet * 2;
  let x = quiet;
  let bars = '';
  for (let index = 0; index < result.modulePattern.length; index += 1) {
    const barWidth = Number(result.modulePattern[index]) * moduleWidth;
    if (index % 2 === 0)
      bars += `<rect x="${x}" y="8" width="${barWidth}" height="${height - labelHeight - 16}" fill="#16212b"/>`;
    x += barWidth;
  }
  if (result.showLabel) {
    bars += `<text x="${width / 2}" y="${height - 6}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="16" fill="#16212b">${escapeXml(result.humanReadable)}</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(result.symbology)} barcode for ${escapeXml(result.humanReadable)}"><rect width="100%" height="100%" fill="#fff"/>${bars}</svg>`;
}
