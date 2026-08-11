import { safeFilename } from '@/lib/security/safe-filename';

import { DocumentExportError } from '@/domain/documents/errors';
import type { BusinessDocument } from '@/domain/documents/types';

export function downloadDocumentBlob(blob: Blob, filename: string) {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    throw new DocumentExportError('download_failed', 'Downloads are only available in a browser.');
  }

  try {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.rel = 'noreferrer';
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => {
      link.remove();
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  } catch {
    throw new DocumentExportError('download_failed', 'We could not start the download. Try Print instead.');
  }
}

export async function downloadDocumentPdf(documentValue: BusinessDocument) {
  const { createDocumentPdf } = await import('./pdf');
  const blob = await createDocumentPdf(documentValue);
  downloadDocumentBlob(
    blob,
    safeFilename(documentValue.exportSettings.baseFilename, 'karobarkit-document', 'pdf'),
  );
}

export function prepareDocumentPrint(targetId: string) {
  if (typeof document === 'undefined') {
    throw new DocumentExportError('print_failed', 'Printing is only available in a browser.');
  }
  const target = document.getElementById(targetId);
  if (!target) throw new DocumentExportError('print_failed', 'The document preview is not available.');
  document.body.classList.add('is-printing-document');
  target.classList.add('document-print-target');
  return () => {
    document.body.classList.remove('is-printing-document');
    target.classList.remove('document-print-target');
  };
}

export function printDocument(targetId: string) {
  if (typeof window === 'undefined') {
    throw new DocumentExportError('print_failed', 'Printing is only available in a browser.');
  }
  const cleanup = prepareDocumentPrint(targetId);
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
    throw new DocumentExportError('print_failed', 'We could not open the print dialog. Try again.');
  }
}

export function documentExportErrorMessage(error: unknown) {
  if (error instanceof DocumentExportError) return error.message;
  return 'We could not prepare that export. Try PDF download or Print again.';
}
