'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { FieldError } from '@/domain/calculations/types';
import {
  createInvoiceNumber,
  invoiceNumberDefaultValues,
  type InvoiceNumberInput,
  type InvoiceNumberResult,
  validateInvoiceNumberInput,
} from '@/domain/documents/sequence';
import { trackEvent } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/ui/form-error';
import { InputField } from '@/components/ui/form-field';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';
import { useLiveCalculation } from '@/components/tooling/use-live-calculation';

interface InvoiceNumberToolProps {
  id: string;
  category: string;
  defaultValues: unknown;
}
function fieldError(errors: FieldError[], field: string) {
  return errors.find((error) => error.field === field)?.message;
}

export function InvoiceNumberGeneratorForm({ tool }: { tool: InvoiceNumberToolProps }) {
  const initialValues = useMemo(
    () => ({ ...((tool.defaultValues as InvoiceNumberInput | undefined) ?? invoiceNumberDefaultValues) }),
    [tool.defaultValues],
  );
  const [values, setValues] = useState<InvoiceNumberInput>(initialValues);
  const [isInteractive, setIsInteractive] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const { result, errors, clearFieldError, clearErrors, submit } = useLiveCalculation<
    InvoiceNumberInput,
    InvoiceNumberResult
  >({
    values,
    validate: (input) => validateInvoiceNumberInput(input),
    calculate: (input) => createInvoiceNumber(input),
    onResult: (_nextResult, source) => {
      if (source === 'submit') {
        trackEvent('tool_completed', { toolId: tool.id });
        trackEvent('result_generated', { toolId: tool.id });
      }
    },
    onValidationFailure: (validationErrors, source) => {
      if (source === 'submit') {
        trackEvent('tool_validation_failed', {
          toolId: tool.id,
          errorCodes: validationErrors.map((error) => error.code),
        });
      }
    },
  });
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsInteractive(true));
    trackEvent('tool_viewed', { toolId: tool.id, category: tool.category });
    return () => window.cancelAnimationFrame(frame);
  }, [tool.category, tool.id]);
  useEffect(() => {
    if (!errors.length) return;
    const frame = window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [errors]);
  function updateValue(field: keyof InvoiceNumberInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
  }
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    trackEvent('tool_started', { toolId: tool.id });
    submit();
  }
  function reset() {
    setValues({ ...initialValues });
    clearErrors();
  }
  async function copy() {
    if (!result || typeof navigator === 'undefined' || !navigator.clipboard) return;
    await navigator.clipboard.writeText(result.value);
    trackEvent('result_copied', { toolId: tool.id });
  }
  return (
    <div className="calculator-layout generator-layout">
      <section className="calculator-card" aria-labelledby="invoice-number-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Sequence helper</p>
            <h2 id="invoice-number-form-title">Preview an invoice number</h2>
          </div>
          <span className="local-badge">Runs locally</span>
        </div>
        <form onSubmit={onSubmit} noValidate data-interactive={isInteractive ? 'true' : 'false'}>
          <ErrorSummary ref={errorSummaryRef} errors={errors} />
          <InputField
            id="prefix"
            label="Prefix (optional)"
            value={values.prefix}
            onChange={(event) => updateValue('prefix', event.target.value)}
            error={fieldError(errors, 'prefix')}
            help="Letters, numbers, underscores, hyphens and slashes only."
          />
          <InputField
            id="financialYear"
            label="Financial year"
            value={values.financialYear}
            onChange={(event) => updateValue('financialYear', event.target.value)}
            error={fieldError(errors, 'financialYear')}
            placeholder="2026-27"
            required
          />
          <InputField
            id="nextNumber"
            label="Sequence number"
            value={values.nextNumber}
            onChange={(event) => updateValue('nextNumber', event.target.value)}
            error={fieldError(errors, 'nextNumber')}
            inputMode="numeric"
            required
          />
          <InputField
            id="padding"
            label="Zero-padding width"
            value={values.padding}
            onChange={(event) => updateValue('padding', event.target.value)}
            error={fieldError(errors, 'padding')}
            inputMode="numeric"
            help="For example, 4 formats 1 as 0001."
            required
          />
          <div className="generator-form__actions">
            <Button type="submit" fullWidth>
              Generate invoice number
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={reset}>
              Reset
            </Button>
          </div>
        </form>
        <PrivacyBlock>
          These values stay in this browser. The tool does not reserve numbers, store them by default or send
          them to analytics.
        </PrivacyBlock>
      </section>
      <section className="calculator-result" aria-labelledby="invoice-number-result-title">
        {result ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Deterministic preview</p>
                <h2 id="invoice-number-result-title">Your invoice number</h2>
              </div>
              <span className="result-status">Live · preview</span>
            </div>
            <div className="sequence-result">
              <strong data-testid="invoice-number-result">{result.value}</strong>
              <p>{result.limitation}</p>
              <Button type="button" variant="secondary" onClick={copy}>
                Copy number
              </Button>
            </div>
            <PrivacyBlock>{result.limitation}</PrivacyBlock>
          </>
        ) : (
          <StateBlock
            titleId="invoice-number-result-title"
            title="Your invoice number will appear here"
            tone="empty"
          >
            Choose the prefix, financial year, sequence and padding to preview a number.
          </StateBlock>
        )}
      </section>
    </div>
  );
}
