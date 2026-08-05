export class CalculationInputError extends Error {
  readonly field: string;
  readonly code: string;

  constructor(field: string, code: string, message: string) {
    super(message);
    this.name = 'CalculationInputError';
    this.field = field;
    this.code = code;
  }
}

export interface FieldError {
  field: string;
  code: string;
  message: string;
}

export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

export interface ValidationFailure {
  success: false;
  errors: FieldError[];
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;
