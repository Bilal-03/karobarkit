export class DocumentInputError extends Error {
  readonly field: string;
  readonly code: string;

  constructor(field: string, code: string, message: string) {
    super(message);
    this.name = 'DocumentInputError';
    this.field = field;
    this.code = code;
  }
}

export class DocumentExportError extends Error {
  readonly code: 'pdf_failed' | 'image_failed' | 'print_failed' | 'download_failed' | 'unsupported_unicode';

  constructor(code: DocumentExportError['code'], message: string) {
    super(message);
    this.name = 'DocumentExportError';
    this.code = code;
  }
}
