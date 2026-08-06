export class QrInputError extends Error {
  readonly field: string;
  readonly code: string;

  constructor(field: string, code: string, message: string) {
    super(message);
    this.name = 'QrInputError';
    this.field = field;
    this.code = code;
  }
}
