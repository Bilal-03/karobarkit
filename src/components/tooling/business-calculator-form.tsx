'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  businessCalculatorFields,
  calculateBusinessEconomics,
  type BusinessCalculationResult,
  type BusinessCalculatorInput,
  type BusinessCalculatorKind,
  type BusinessMetric,
  validateBusinessCalculatorInput,
} from '@/domain/calculations/business-economics';
import { formatIndianCurrency, formatIndianNumber, formatPercentage } from '@/domain/formatting/indian';
import type { FieldError } from '@/domain/calculations/types';
import {
  clearLocalScenarioTransfer,
  readLocalScenarioTransfer,
  saveLocalScenarioTransfer,
  selectSharedScenarioValues,
  type LocalScenarioTransfer,
} from '@/domain/workflows/local-scenario-transfer';
import { trackEvent } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/ui/form-error';
import { InputField } from '@/components/ui/form-field';
import { ResultPanel } from '@/components/ui/result-panel';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';

interface BusinessCalculatorFormProps {
  kind: BusinessCalculatorKind;
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

function formatMetric(metric: BusinessMetric) {
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
  kind: BusinessCalculatorKind,
  values: BusinessCalculatorInput,
  result: BusinessCalculationResult,
) {
  const fields = businessCalculatorFields[kind];
  const rows = [
    ['Business Toolkit scenario', kind],
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

export function BusinessCalculatorForm({ kind, tool }: BusinessCalculatorFormProps) {
  const fields = businessCalculatorFields[kind];
  const initialValues = useMemo(
    () =>
      (tool.defaultValues as BusinessCalculatorInput) ??
      Object.fromEntries(fields.map((field) => [field.name, field.defaultValue])),
    [fields, tool.defaultValues],
  );
  const [values, setValues] = useState<BusinessCalculatorInput>(initialValues);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [result, setResult] = useState<BusinessCalculationResult | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [transferSaved, setTransferSaved] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<
    (LocalScenarioTransfer & { sharedValues: Record<string, string> }) | null
  >(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsInteractive(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    trackEvent('tool_viewed', { toolId: tool.id, category: tool.category });
  }, [tool.category, tool.id]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const transfer = readLocalScenarioTransfer();
      if (!transfer || transfer.sourceToolId === tool.id) return;
      const sharedValues = selectSharedScenarioValues(
        transfer.values,
        fields.map((field) => field.name),
      );
      if (Object.keys(sharedValues).length > 0) setPendingTransfer({ ...transfer, sharedValues });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [fields, tool.id]);

  useEffect(() => {
    if (errors.length === 0) return;
    const frame = window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [errors]);

  function updateValue(field: string, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => current.filter((error) => error.field !== field));
    setResult(null);
    setCalculationError(null);
  }

  function importScenario() {
    if (!pendingTransfer) return;
    setValues((current) => ({ ...current, ...pendingTransfer.sharedValues }));
    setPendingTransfer(null);
    clearLocalScenarioTransfer();
    setResult(null);
    setErrors([]);
  }

  function saveScenarioForRelatedTool() {
    const saved = saveLocalScenarioTransfer({
      sourceToolId: tool.id,
      sourceToolName: tool.name,
      sourceKind: kind,
      values,
    });
    setTransferSaved(saved);
  }

  function printScenario() {
    window.print();
    trackEvent('result_printed', { toolId: tool.id, pageSize: 'summary' });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCalculating(true);
    setErrors([]);
    setResult(null);
    setCalculationError(null);
    trackEvent('tool_started', { toolId: tool.id });

    window.setTimeout(() => {
      try {
        const validation = validateBusinessCalculatorInput(kind, values);
        if (!validation.success) {
          setErrors(validation.errors);
          trackEvent('tool_validation_failed', {
            toolId: tool.id,
            errorCodes: validation.errors.map((error) => error.code),
          });
          setIsCalculating(false);
          return;
        }
        const nextResult = calculateBusinessEconomics(kind, validation.data);
        setResult(nextResult);
        trackEvent('tool_completed', { toolId: tool.id });
        trackEvent('result_generated', { toolId: tool.id });
      } catch (error) {
        setCalculationError(
          error instanceof Error ? error.message : 'We could not safely calculate that scenario. Try again.',
        );
      }
      setIsCalculating(false);
      window.requestAnimationFrame(() => resultRef.current?.focus());
    }, 120);
  }

  return (
    <div className="calculator-layout">
      <section className="calculator-card" aria-labelledby="business-calculator-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Scenario calculator</p>
            <h2 id="business-calculator-form-title">Enter your assumptions</h2>
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
          {pendingTransfer ? (
            <div className="scenario-transfer" role="status">
              <strong>Scenario ready from {pendingTransfer.sourceToolName}</strong>
              <p>
                Import only the matching assumptions into this tool. Nothing is sent to a server, and you can
                edit every value before calculating.
              </p>
              <div className="inline-actions">
                <Button type="button" variant="secondary" onClick={importScenario}>
                  Import matching inputs
                </Button>
                <Button type="button" variant="ghost" onClick={() => setPendingTransfer(null)}>
                  Dismiss
                </Button>
              </div>
            </div>
          ) : null}
          {fields.map((field) => (
            <InputField
              key={field.name}
              id={field.name}
              name={field.name}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              label={field.label}
              help={field.help}
              value={values[field.name] ?? ''}
              onChange={(event) => updateValue(field.name, event.target.value)}
              error={getFieldError(errors, field.name)}
              required={field.required !== false}
            />
          ))}
          <Button type="submit" fullWidth disabled={isCalculating}>
            {isCalculating ? 'Calculating…' : 'Calculate scenario'}
          </Button>
        </form>
      </section>

      <section
        className="calculator-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby="business-calculator-result-title"
      >
        {calculationError ? (
          <StateBlock
            titleId="business-calculator-result-title"
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
                <h2 id="business-calculator-result-title">A decision-ready view</h2>
              </div>
              <span className="result-status" aria-label="Calculation complete">
                Complete
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
            <div className="inline-actions scenario-actions">
              <Button type="button" variant="secondary" onClick={() => downloadCsv(kind, values, result)}>
                Download CSV
              </Button>
              <Button type="button" variant="ghost" onClick={printScenario}>
                Print summary
              </Button>
              <Button type="button" variant="ghost" onClick={saveScenarioForRelatedTool}>
                {transferSaved ? 'Saved for this tab' : 'Save for a related tool'}
              </Button>
            </div>
            {transferSaved ? (
              <p className="scenario-transfer__note" role="status">
                Saved only in this browser tab until it closes or you replace it. A related tool can import
                matching fields after you choose to do so.
              </p>
            ) : null}
            <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
          </>
        ) : (
          <StateBlock
            titleId="business-calculator-result-title"
            title="Your scenario will appear here"
            tone="empty"
          >
            Complete the short form to see the result, assumptions and interpretation. Nothing is sent away
            from this browser.
          </StateBlock>
        )}
      </section>
    </div>
  );
}
