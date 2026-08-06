import { QrExportError } from './types';

export function safeFilename(value: string, fallback = 'karobarkit-qr', extension = 'png') {
  const safeBase = value
    .normalize('NFKC')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .toLowerCase();
  const normalizedExtension = extension.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
  return `${safeBase || fallback}.${normalizedExtension}`;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) {
    throw new QrExportError('invalid_data', 'The QR image is not available for download.');
  }

  const mimeType = match[1] || 'application/octet-stream';
  const isBase64 = Boolean(match[2]);
  try {
    if (isBase64) {
      const binary = atob(match[3]);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      return new Blob([bytes], { type: mimeType });
    }

    return new Blob([decodeURIComponent(match[3])], { type: mimeType });
  } catch {
    throw new QrExportError('invalid_data', 'The QR image is not available for download.');
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    throw new QrExportError('download_failed', 'Downloads are only available in a browser.');
  }

  try {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.rel = 'noreferrer';
    link.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    throw new QrExportError('download_failed', 'We could not start the download. Try again or use Print.');
  }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  downloadBlob(dataUrlToBlob(dataUrl), filename);
}

export function downloadText(content: string, filename: string, mimeType = 'text/plain') {
  if (!content) {
    throw new QrExportError('invalid_data', 'The export content is empty.');
  }
  downloadBlob(new Blob([content], { type: mimeType }), filename);
}

export function downloadSvg(svg: string, filename: string) {
  downloadText(svg, filename, 'image/svg+xml;charset=utf-8');
}

export function preparePrint(targetId: string) {
  if (typeof document === 'undefined') {
    throw new QrExportError('print_failed', 'Printing is only available in a browser.');
  }

  const target = document.getElementById(targetId);
  if (!target) {
    throw new QrExportError('print_failed', 'The printable preview is not available.');
  }

  const body = document.body;
  body.classList.add('is-printing');
  target.classList.add('print-target');

  return () => {
    body.classList.remove('is-printing');
    target.classList.remove('print-target');
  };
}

export function printElement(targetId: string) {
  if (typeof window === 'undefined') {
    throw new QrExportError('print_failed', 'Printing is only available in a browser.');
  }

  const cleanup = preparePrint(targetId);
  const finish = () => {
    cleanup();
    window.removeEventListener('afterprint', finish);
  };

  try {
    window.addEventListener('afterprint', finish, { once: true });
    window.print();
    window.setTimeout(finish, 1000);
  } catch {
    finish();
    throw new QrExportError('print_failed', 'We could not open the print dialog. Try again.');
  }
}

export function exportErrorMessage(error: unknown) {
  if (error instanceof QrExportError) {
    return error.message;
  }
  return 'We could not prepare that export. Try again or use the other export option.';
}
