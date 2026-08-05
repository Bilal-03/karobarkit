import { forwardRef } from 'react';

import type { FieldError } from '@/domain/calculations/types';

interface ErrorSummaryProps {
  errors: FieldError[];
}

export const ErrorSummary = forwardRef<HTMLDivElement, ErrorSummaryProps>(function ErrorSummary(
  { errors },
  ref,
) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div
      className="error-summary"
      ref={ref}
      role="alert"
      tabIndex={-1}
      aria-live="assertive"
      aria-labelledby="error-summary-title"
    >
      <strong id="error-summary-title">Check the highlighted fields</strong>
      <ul>
        {errors.map((error, index) => (
          <li key={`${error.field}-${index}`}>
            <a href={`#${error.field}`}>{error.message}</a>
          </li>
        ))}
      </ul>
    </div>
  );
});

export function FormError({ message }: { message?: string }) {
  return message ? (
    <div className="field__error" role="alert">
      {message}
    </div>
  ) : null;
}
