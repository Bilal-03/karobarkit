/// <reference lib="webworker" />

import { PDFDocument } from 'pdf-lib';

import { parsePageSelection } from '@/domain/files/pdf';
import { FILE_LIMITS } from '@/lib/files/limits';

type PdfWorkerRequest =
  | { id: string; mode: 'merge'; buffers: ArrayBuffer[] }
  | { id: string; mode: 'split'; buffers: [ArrayBuffer]; splitPages: string };

type PdfWorkerResponse =
  { id: string; ok: true; bytes: ArrayBuffer; pages: number } | { id: string; ok: false; message: string };

async function loadPdf(buffer: ArrayBuffer) {
  const document = await PDFDocument.load(buffer, {
    ignoreEncryption: false,
    updateMetadata: false,
  });
  if (document.getPageCount() > FILE_LIMITS.maxPdfPages) {
    throw new Error(`PDFs are limited to ${FILE_LIMITS.maxPdfPages} pages.`);
  }
  return document;
}

async function processRequest(request: PdfWorkerRequest) {
  const sources = await Promise.all(request.buffers.map(loadPdf));
  const output = await PDFDocument.create();

  if (request.mode === 'merge') {
    const pageCount = sources.reduce((sum, document) => sum + document.getPageCount(), 0);
    if (pageCount > FILE_LIMITS.maxOutputPdfPages) {
      throw new Error(`The output is limited to ${FILE_LIMITS.maxOutputPdfPages} pages.`);
    }
    for (const source of sources) {
      const pages = await output.copyPages(source, source.getPageIndices());
      pages.forEach((page) => output.addPage(page));
    }
    return { output, pages: pageCount };
  }

  const source = sources[0];
  if (!source) throw new Error('Choose a PDF first.');
  const selected = parsePageSelection(request.splitPages, source.getPageCount());
  const pages = await output.copyPages(source, selected);
  pages.forEach((page) => output.addPage(page));
  return { output, pages: selected.length };
}

self.addEventListener('message', (event: MessageEvent<PdfWorkerRequest>) => {
  const request = event.data;
  void processRequest(request)
    .then(async ({ output, pages }) => {
      const bytes = await output.save({ useObjectStreams: true, addDefaultPage: false });
      const transferable = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      const response: PdfWorkerResponse = { id: request.id, ok: true, bytes: transferable, pages };
      self.postMessage(response, { transfer: [transferable] });
    })
    .catch((error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : 'This PDF is invalid, encrypted or could not be decoded in the browser.';
      const response: PdfWorkerResponse = { id: request.id, ok: false, message };
      self.postMessage(response);
    });
});

export {};
