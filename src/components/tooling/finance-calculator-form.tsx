'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  calculateFinance,
  financeCalculatorFields,
  type FinanceCalculationResult,
  type FinanceCalculatorInput,
  type FinanceCalculatorKind,
  type FinanceFieldConfig,
  type FinanceMetric,
  validateFinanceCalculatorInput,
} from '@/domain/calculations/finance';
import { formatIndianCurrency, formatIndianNumber, formatPercentage } from '@/domain/formatting/indian';
import type { FieldError } from '@/domain/calculations/types';
import { trackEvent } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/ui/form-error';
import { InputField, SelectField, TextareaField } from '@/components/ui/form-field';
import { ResultPanel } from '@/components/ui/result-panel';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';
import { useLiveCalculation } from './use-live-calculation';

interface FinanceCalculatorFormProps {
  kind: FinanceCalculatorKind;
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

function formatMetric(metric: FinanceMetric) {
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
  kind: FinanceCalculatorKind,
  values: FinanceCalculatorInput,
  result: FinanceCalculationResult,
) {
  const fields = financeCalculatorFields[kind];
  const rows: string[][] = [
    ['Business Toolkit finance scenario', kind],
    ['Input', 'Value'],
    ...fields.map((field) => [field.label, values[field.name] ?? '']),
    [],
    ['Result', 'Value'],
    ...result.exportRows.map((row) => [row.label, formatMetric(row)]),
  ];
  if (result.schedule && result.schedule.length > 0) {
    rows.push([], ['Amortization schedule'], ['Period', 'Payment', 'Interest', 'Principal', 'Balance']);
    rows.push(
      ...result.schedule.map((row) => [row.period, row.payment, row.interest, row.principal, row.balance]),
    );
  }
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
  field: FinanceFieldConfig,
  values: FinanceCalculatorInput,
  errors: FieldError[],
  updateValue: (field: string, value: string) => void,
) {
  const common = {
    id: field.name,
    name: field.name,
    label: field.label,
    help: field.help,
    value: values[field.name] ?? '',
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
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

  if (field.type === 'textarea') {
    return (
      <TextareaField
        key={field.name}
        {...common}
        rows={7}
        spellCheck={false}
        autoComplete="off"
        placeholder="2024-01-01,-100000\n2025-01-01,110000"
      />
    );
  }

  return <InputField key={field.name} {...common} type="text" inputMode="decimal" autoComplete="off" />;
}

export function FinanceCalculatorForm({ kind, tool }: FinanceCalculatorFormProps) {
  const fields = financeCalculatorFields[kind];
  const initialValues = useMemo(
    () =>
      (tool.defaultValues as FinanceCalculatorInput) ??
      Object.fromEntries(fields.map((field) => [field.name, field.defaultValue])),
    [fields, tool.defaultValues],
  );
  const [values, setValues] = useState<FinanceCalculatorInput>(initialValues);
  const [isInteractive, setIsInteractive] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const { result, errors, calculationError, isCalculating, clearFieldError, submit } = useLiveCalculation<
    FinanceCalculatorInput,
    FinanceCalculationResult
  >({
    values,
    debounceMs: kind === 'emi' || kind === 'loan-comparison' ? 80 : 0,
    validate: (input) => validateFinanceCalculatorInput(kind, input),
    calculate: (input) => calculateFinance(kind, input),
    onResult: (_nextResult, source) => {
      if (source === 'submit') {
        trackEvent('tool_completed', { toolId: tool.id });
        trackEvent('result_generated', { toolId: tool.id });
        window.requestAnimationFrame(() => resultRef.current?.focus());
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

  function printScenario() {
    window.print();
    trackEvent('result_printed', { toolId: tool.id, pageSize: 'summary' });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    trackEvent('tool_started', { toolId: tool.id });
    submit();
  }

  return (
    <div className="calculator-layout">
      <section className="calculator-card" aria-labelledby="finance-calculator-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Finance calculator</p>
            <h2 id="finance-calculator-form-title">Enter your assumptions</h2>
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
        aria-labelledby="finance-calculator-result-title"
      >
        {calculationError ? (
          <StateBlock
            titleId="finance-calculator-result-title"
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
                <h2 id="finance-calculator-result-title">A transparent finance view</h2>
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
            {result.schedule && result.schedule.length > 0 ? (
              <details className="content-card schedule-preview">
                <summary>Preview amortization schedule ({result.schedule.length} periods)</summary>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Period</th>
                        <th scope="col">Payment</th>
                        <th scope="col">Interest</th>
                        <th scope="col">Principal</th>
                        <th scope="col">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ...result.schedule.slice(0, 3),
                        ...(result.schedule.length > 3 ? [result.schedule.at(-1)!] : []),
                      ].map((row, index) => (
                        <tr key={`${row.period}-${index}`}>
                          <td>{row.period}</td>
                          <td>{formatIndianCurrency(row.payment)}</td>
                          <td>{formatIndianCurrency(row.interest)}</td>
                          <td>{formatIndianCurrency(row.principal)}</td>
                          <td>{formatIndianCurrency(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="field__help">Download CSV for the complete schedule.</p>
              </details>
            ) : null}
            <div className="inline-actions scenario-actions">
              <Button type="button" variant="secondary" onClick={() => downloadCsv(kind, values, result)}>
                Download CSV
              </Button>
              <Button type="button" variant="ghost" onClick={printScenario}>
                Print summary
              </Button>
            </div>
            <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
          </>
        ) : (
          <StateBlock
            titleId="finance-calculator-result-title"
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
