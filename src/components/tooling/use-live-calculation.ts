import { useCallback, useEffect, useRef, useState } from 'react';

import type { FieldError, ValidationResult } from '@/domain/calculations/types';

type LiveCalculationSource = 'live' | 'submit';

/**
 * Moves keyboard focus to a generated result without letting a sticky header
 * cover the result heading in the viewport.
 */
export function focusResult(element: HTMLElement | null) {
  if (!element) return;

  element.focus({ preventScroll: true });
  const headerHeight = document.querySelector<HTMLElement>('.site-header')?.getBoundingClientRect().height ?? 0;
  const top = element.getBoundingClientRect().top + window.scrollY - headerHeight - 24;
  window.scrollTo(0, Math.max(0, top));
}

interface UseLiveCalculationOptions<TInput, TResult> {
  values: TInput;
  validate: (values: TInput) => ValidationResult<TInput>;
  calculate: (values: TInput) => TResult;
  debounceMs?: number;
  onResult?: (result: TResult, source: LiveCalculationSource) => void;
  onValidationFailure?: (errors: FieldError[], source: LiveCalculationSource) => void;
}

interface LiveCalculationState<TResult> {
  result: TResult | null;
  errors: FieldError[];
  calculationError: string | null;
  isCalculating: boolean;
  clearFieldError: (field: string) => void;
  clearErrors: () => void;
  submit: () => void;
}

/**
 * Runs a pure calculator against its current values as they change.
 *
 * Live validation intentionally does not replace the form's visible errors:
 * users commonly pass through values such as "1." while typing. Explicit
 * submit still reports the complete validation result and retains the old
 * keyboard/focus behavior.
 */
export function useLiveCalculation<TInput, TResult>({
  values,
  validate,
  calculate,
  debounceMs = 0,
  onResult,
  onValidationFailure,
}: UseLiveCalculationOptions<TInput, TResult>): LiveCalculationState<TResult> {
  const validateRef = useRef(validate);
  const calculateRef = useRef(calculate);
  const onResultRef = useRef(onResult);
  const onValidationFailureRef = useRef(onValidationFailure);

  useEffect(() => {
    validateRef.current = validate;
    calculateRef.current = calculate;
    onResultRef.current = onResult;
    onValidationFailureRef.current = onValidationFailure;
  }, [calculate, onResult, onValidationFailure, validate]);

  const [result, setResult] = useState<TResult | null>(null);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const evaluate = useCallback(
    (source: LiveCalculationSource) => {
      const validation = validateRef.current(values);
      if (!validation.success) {
        setResult(null);
        setCalculationError(null);
        if (source === 'submit') setErrors(validation.errors);
        onValidationFailureRef.current?.(validation.errors, source);
        setIsCalculating(false);
        return;
      }

      try {
        const nextResult = calculateRef.current(validation.data);
        setResult(nextResult);
        setCalculationError(null);
        if (source === 'submit') setErrors([]);
        onResultRef.current?.(nextResult, source);
      } catch (error) {
        setResult(null);
        setCalculationError(
          error instanceof Error ? error.message : 'We could not safely calculate that input. Try again.',
        );
      } finally {
        setIsCalculating(false);
      }
    },
    [values],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => evaluate('live'), debounceMs);
    return () => window.clearTimeout(timer);
  }, [debounceMs, evaluate]);

  const submit = useCallback(() => {
    setIsCalculating(true);
    evaluate('submit');
  }, [evaluate]);

  const clearFieldError = useCallback((field: string) => {
    setErrors((current) =>
      current.filter((error) => error.field !== field && !error.field.startsWith(`${field}.`)),
    );
  }, []);

  const clearErrors = useCallback(() => setErrors([]), []);

  return { result, errors, calculationError, isCalculating, clearFieldError, clearErrors, submit };
}
