import { validatePdfFile, type PdfOperationInput } from '@/domain/files/pdf';
import { FILE_LIMITS, assertFileCount } from '@/lib/files/limits';
import { safeFilename } from '@/lib/security/safe-filename';

export class PdfProcessingError extends Error {
  readonly code = 'pdf_processing_failed';

  constructor(message: string) {
    super(message);
    this.name = 'PdfProcessingError';
  }
}

type PdfWorkerRequest =
  | { id: string; mode: 'merge'; buffers: ArrayBuffer[] }
  | { id: string; mode: 'split'; buffers: [ArrayBuffer]; splitPages: string };

type PdfWorkerResponse =
  { id: string; ok: true; bytes: ArrayBuffer; pages: number } | { id: string; ok: false; message: string };

function abortMessage(signal: AbortSignal) {
  return typeof signal.reason === 'string' && signal.reason
    ? signal.reason
    : 'Local PDF processing was cancelled.';
}

async function fileBuffers(files: readonly File[], signal: AbortSignal) {
  const buffers: ArrayBuffer[] = [];
  for (const file of files) {
    if (signal.aborted) throw new PdfProcessingError(abortMessage(signal));
    const validation = validatePdfFile(file);
    if (!validation.success)
      throw new PdfProcessingError(validation.errors[0]?.message ?? 'Choose a valid PDF.');
    buffers.push(await file.arrayBuffer());
  }
  return buffers;
}

function runPdfWorker(request: PdfWorkerRequest, externalSignal?: AbortSignal) {
  if (typeof Worker === 'undefined') {
    return Promise.reject(
      new PdfProcessingError('This browser cannot run the local PDF worker. Try a current browser.'),
    );
  }

  return new Promise<{ bytes: ArrayBuffer; pages: number }>((resolve, reject) => {
    const worker = new Worker(new URL('./pdf-processing.worker.ts', import.meta.url), {
      type: 'module',
      name: 'karobarkit-pdf-processor',
    });
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', abort);
      worker.terminate();
      callback();
    };
    const abort = () =>
      finish(() =>
        reject(new PdfProcessingError(abortMessage(externalSignal ?? new AbortController().signal))),
      );
    const timeoutId = window.setTimeout(() => {
      finish(() =>
        reject(
          new PdfProcessingError('Local PDF processing took too long and was stopped. Try a smaller input.'),
        ),
      );
    }, FILE_LIMITS.workerTimeoutMs);

    worker.addEventListener('message', (event: MessageEvent<PdfWorkerResponse>) => {
      const response = event.data;
      if (response.id !== request.id) return;
      if (response.ok) {
        finish(() => resolve({ bytes: response.bytes, pages: response.pages }));
      } else {
        finish(() => reject(new PdfProcessingError(response.message)));
      }
    });
    worker.addEventListener('error', () => {
      finish(() => reject(new PdfProcessingError('The local PDF worker stopped unexpectedly.')));
    });
    if (externalSignal?.aborted) {
      abort();
      return;
    }
    externalSignal?.addEventListener('abort', abort, { once: true });
    worker.postMessage(request, { transfer: request.buffers });
  });
}

function outputBlob(bytes: ArrayBuffer) {
  return new Blob([bytes], { type: 'application/pdf' });
}

export async function mergePdfFiles(files: readonly File[], options?: { signal?: AbortSignal }) {
  assertFileCount(files);
  if (files.length < 2) throw new PdfProcessingError('Choose at least two PDFs to merge.');
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > FILE_LIMITS.maxTotalBytes) {
    throw new PdfProcessingError(
      `Keep the selected PDFs at or below ${FILE_LIMITS.maxTotalBytes / (1024 * 1024)} MB in total.`,
    );
  }
  const controller = new AbortController();
  const onAbort = () => controller.abort(options?.signal?.reason);
  options?.signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const buffers = await fileBuffers(files, controller.signal);
    const result = await runPdfWorker({ id: crypto.randomUUID(), mode: 'merge', buffers }, controller.signal);
    return {
      blob: outputBlob(result.bytes),
      filename: safeFilename(files[0]?.name.replace(/\.pdf$/iu, '') ?? 'merged', 'karobarkit-merged', 'pdf'),
      pages: result.pages,
    };
  } finally {
    options?.signal?.removeEventListener('abort', onAbort);
  }
}

export async function splitPdfFile(file: File, input: PdfOperationInput, options?: { signal?: AbortSignal }) {
  const controller = new AbortController();
  const onAbort = () => controller.abort(options?.signal?.reason);
  options?.signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const buffers = await fileBuffers([file], controller.signal);
    const result = await runPdfWorker(
      { id: crypto.randomUUID(), mode: 'split', buffers: [buffers[0]!], splitPages: input.splitPages },
      controller.signal,
    );
    return {
      blob: outputBlob(result.bytes),
      filename: safeFilename(file.name.replace(/\.pdf$/iu, ''), 'karobarkit-split', 'pdf'),
      pages: result.pages,
    };
  } finally {
    options?.signal?.removeEventListener('abort', onAbort);
  }
}
