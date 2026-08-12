'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  calculatePhase5,
  phase5CalculatorFields,
  type Phase5CalculationResult,
  type Phase5CalculatorInput,
  type Phase5CalculatorKind,
  type Phase5FieldConfig,
  type Phase5Metric,
  validatePhase5CalculatorInput,
} from '@/domain/calculations/phase5';
import {
  formatIndianCurrency,
  formatIndianNumber,
  formatPercentage,
  formatIndianDate,
} from '@/domain/formatting/indian';
import type { FieldError } from '@/domain/calculations/types';
import { trackEvent } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/ui/form-error';
import { InputField, SelectField } from '@/components/ui/form-field';
import { ResultPanel } from '@/components/ui/result-panel';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';
import { focusResult, useLiveCalculation } from './use-live-calculation';

interface Phase5CalculatorFormProps {
  kind: Phase5CalculatorKind;
  tool: {
    id: string;
    name: string;
    category: string;
    defaultValues: unknown;
    privacyNote: string;
  };
}

function getFieldError(errors: FieldError[], field: string) {
  return errors.find((error) => error.field === field)?.message;
}

function formatMetric(metric: Phase5Metric) {
  if (metric.format === 'currency') return formatIndianCurrency(metric.value);
  if (metric.format === 'percentage') return formatPercentage(metric.value);
  if (metric.format === 'multiple') return `${formatIndianNumber(metric.value, { decimals: 2 })}x`;
  if (metric.format === 'number') return formatIndianNumber(metric.value, { decimals: 2 });
  return metric.value;
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadCsv(
  kind: Phase5CalculatorKind,
  values: Phase5CalculatorInput,
  result: Phase5CalculationResult,
) {
  const fields = phase5CalculatorFields[kind];
  const rows: string[][] = [
    ['Business Toolkit Phase 5 scenario', kind],
    ['Input', 'Value'],
    ...fields.map((field) => [field.label, values[field.name] ?? '']),
    [],
    ['Result', 'Value'],
    ...result.exportRows.map((row) => [row.label, formatMetric(row)]),
  ];
  const csv = rows.map((row) => row.map((cell) => escapeCsv(String(cell))).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${kind}-scenario.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function renderField(
  field: Phase5FieldConfig,
  values: Phase5CalculatorInput,
  errors: FieldError[],
  updateValue: (field: string, value: string) => void,
) {
  const common = {
    id: field.name,
    name: field.name,
    label: field.label,
    help: field.help,
    value: values[field.name] ?? '',
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      updateValue(field.name, event.target.value),
    error: getFieldError(errors, field.name),
    required: field.required !== false,
  };

  if (field.type === 'select') {
    return (
      <SelectField key={field.name} {...common}>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>
    );
  }

  return (
    <InputField
      key={field.name}
      {...common}
      type={field.type === 'date' ? 'date' : 'text'}
      inputMode={field.type === 'date' ? undefined : field.format === 'text' ? 'text' : 'decimal'}
      autoComplete="off"
    />
  );
}

export function Phase5CalculatorForm({ kind, tool }: Phase5CalculatorFormProps) {
  const fields = phase5CalculatorFields[kind];
  const initialValues = useMemo(
    () =>
      (tool.defaultValues as Phase5CalculatorInput) ??
      Object.fromEntries(fields.map((field) => [field.name, field.defaultValue])),
    [fields, tool.defaultValues],
  );
  const [values, setValues] = useState<Phase5CalculatorInput>(initialValues);
  const [isInteractive, setIsInteractive] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const { result, errors, calculationError, isCalculating, clearFieldError, submit } = useLiveCalculation<
    Phase5CalculatorInput,
    Phase5CalculationResult
  >({
    values,
    debounceMs: 80,
    validate: (input) => validatePhase5CalculatorInput(kind, input),
    calculate: (input) => calculatePhase5(kind, input),
    onResult: (_nextResult, source) => {
      if (source === 'submit') {
        trackEvent('tool_completed', { toolId: tool.id });
        trackEvent('result_generated', { toolId: tool.id });
        window.requestAnimationFrame(() => focusResult(resultRef.current));
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
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    trackEvent('tool_viewed', { toolId: tool.id, category: tool.category });
  }, [tool.category, tool.id]);

  useEffect(() => {
    if (errors.length === 0) return;
    const frame = window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [errors]);

  function updateValue(field: string, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    trackEvent('tool_started', { toolId: tool.id });
    submit();
  }

  return (
    <div className="calculator-layout">
      <section className="calculator-card" aria-labelledby="phase5-calculator-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Phase 5 toolkit beta</p>
            <h2 id="phase5-calculator-form-title">Enter your assumptions</h2>
          </div>
          <span className="local-badge">Runs locally</span>
        </div>
        <form
          onSubmit={onSubmit}
          noValidate
          data-interactive={isInteractive ? 'true' : 'false'}
          inert={!isInteractive}
        >
          <ErrorSummary ref={errorSummaryRef} errors={errors} />
          {fields.map((field) => renderField(field, values, errors, updateValue))}
          <Button type="submit" fullWidth disabled={isCalculating}>
            {isCalculating ? 'Calculating…' : 'Calculate scenario'}
          </Button>
        </form>
      </section>

      <section
        className="calculator-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby="phase5-calculator-result-title"
      >
        {calculationError ? (
          <StateBlock
            titleId="phase5-calculator-result-title"
            title="We could not calculate that scenario"
            tone="error"
          >
            {calculationError}
          </StateBlock>
        ) : result ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Your scenario</p>
                <h2 id="phase5-calculator-result-title">A transparent Phase 5 view</h2>
              </div>
              <span className="result-status" aria-label="Live calculation complete">
                Live
              </span>
            </div>
            <ResultPanel
              label={result.headline.label}
              value={formatMetric(result.headline)}
              tone={result.tone}
              detail={result.detail}
            >
              <dl className="result-breakdown">
                {result.details.map((detail) => (
                  <div key={detail.label}>
                    <dt>{detail.label}</dt>
                    <dd>{formatMetric(detail)}</dd>
                  </div>
                ))}
              </dl>
            </ResultPanel>
            {result.warnings.length > 0 ? (
              <div className="warning-block" role="note">
                <strong>Read the boundaries</strong>
                <ul className="plain-list">
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.policy && result.policyFreshness ? (
              <div className="gst-policy-summary" role="note">
                <strong>Bundled marketplace policy</strong>
                <span>
                  {result.policy.id} · effective {formatIndianDate(result.policy.effectiveFrom)}
                  {result.policy.effectiveTo
                    ? ` to ${formatIndianDate(result.policy.effectiveTo)}`
                    : ' onward'}{' '}
                  · verified {formatIndianDate(result.policy.lastVerifiedOn)} · review due{' '}
                  {formatIndianDate(result.policyFreshness.reviewDueOn)}
                </span>
                {result.policyFreshness.isStale ? (
                  <span className="gst-policy-warning">{result.policyFreshness.message}</span>
                ) : null}
              </div>
            ) : null}
            <div className="inline-actions scenario-actions">
              <Button type="button" variant="secondary" onClick={() => downloadCsv(kind, values, result)}>
                Download CSV
              </Button>
              <Button type="button" variant="ghost" onClick={() => window.print()}>
                Print summary
              </Button>
            </div>
            <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
          </>
        ) : (
          <StateBlock
            titleId="phase5-calculator-result-title"
            title="Your scenario will appear here"
            tone="empty"
          >
            Complete the form to see the result, assumptions and interpretation. Nothing is sent away from
            this browser.
          </StateBlock>
        )}
      </section>
    </div>
  );
}
