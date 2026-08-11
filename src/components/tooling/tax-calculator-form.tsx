'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  calculateHra,
  hraCalculatorFields,
  type HraCalculationResult,
  type HraCalculatorInput,
  validateHraCalculatorInput,
} from '@/domain/calculations/hra';
import {
  calculateTax,
  taxCalculatorFields,
  type TaxCalculationResult,
  type TaxCalculatorInput,
  type TaxCalculatorKind,
  type TaxFieldConfig,
  validateTaxCalculatorInput,
} from '@/domain/calculations/tax';
import { formatIndianCurrency, formatIndianNumber, formatPercentage } from '@/domain/formatting/indian';
import type { FieldError } from '@/domain/calculations/types';
import { trackEvent } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/ui/form-error';
import { InputField, SelectField } from '@/components/ui/form-field';
import { ResultPanel } from '@/components/ui/result-panel';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';

type TaxKind = 'hra' | TaxCalculatorKind;

interface TaxCalculatorFormProps {
  kind: TaxKind;
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

function formatMetric(metric: { value: string; format: 'currency' | 'percentage' | 'number' | 'text' }) {
  if (metric.format === 'currency') return formatIndianCurrency(metric.value);
  if (metric.format === 'percentage') return formatPercentage(metric.value);
  if (metric.format === 'number') return formatIndianNumber(metric.value, { decimals: 2 });
  return metric.value;
}

function HraForm({ tool }: Omit<TaxCalculatorFormProps, 'kind'>) {
  const fields = hraCalculatorFields;
  const initialValues = useMemo(
    () =>
      (tool.defaultValues as HraCalculatorInput) ??
      (Object.fromEntries(
        fields.map((field) => [field.name, field.defaultValue]),
      ) as unknown as HraCalculatorInput),
    [fields, tool.defaultValues],
  );
  const [values, setValues] = useState<HraCalculatorInput>(initialValues);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [result, setResult] = useState<HraCalculationResult | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
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
    if (!errors.length) return;
    const frame = window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [errors]);

  function updateValue(field: keyof HraCalculatorInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => current.filter((error) => error.field !== field));
    setResult(null);
    setCalculationError(null);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setResult(null);
    setCalculationError(null);
    trackEvent('tool_started', { toolId: tool.id });
    const validation = validateHraCalculatorInput(values);
    if (!validation.success) {
      setErrors(validation.errors);
      trackEvent('tool_validation_failed', {
        toolId: tool.id,
        errorCodes: validation.errors.map((error) => error.code),
      });
      return;
    }
    try {
      const nextResult = calculateHra(validation.data);
      setResult(nextResult);
      trackEvent('tool_completed', { toolId: tool.id });
      trackEvent('result_generated', { toolId: tool.id });
      window.requestAnimationFrame(() => resultRef.current?.focus());
    } catch (error) {
      setCalculationError(
        error instanceof Error ? error.message : 'We could not safely calculate that HRA view.',
      );
    }
  }

  return (
    <div className="calculator-layout">
      <section className="calculator-card" aria-labelledby="hra-calculator-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Tax calculator · controlled beta</p>
            <h2 id="hra-calculator-form-title">Enter your HRA records</h2>
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
          {fields.map((field) => {
            const value = values[field.name] ?? '';
            if (field.type === 'select') {
              return (
                <SelectField
                  key={field.name}
                  id={field.name}
                  name={field.name}
                  label={field.label}
                  help={field.help}
                  value={value}
                  onChange={(event) => updateValue(field.name, event.target.value)}
                  error={getFieldError(errors, field.name)}
                  required
                >
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
                id={field.name}
                name={field.name}
                label={field.label}
                help={field.help}
                value={value}
                onChange={(event) => updateValue(field.name, event.target.value)}
                error={getFieldError(errors, field.name)}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                required
              />
            );
          })}
          <Button type="submit" fullWidth>
            Calculate HRA exemption
          </Button>
        </form>
      </section>
      <section
        className="calculator-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby="hra-calculator-result-title"
      >
        {calculationError ? (
          <StateBlock
            titleId="hra-calculator-result-title"
            title="We could not calculate that HRA view"
            tone="error"
          >
            {calculationError}
          </StateBlock>
        ) : result ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Your policy-scoped result</p>
                <h2 id="hra-calculator-result-title">HRA exemption illustration</h2>
              </div>
              <span className="result-status">
                {result.status === 'eligible-rule' ? 'Old regime rule' : 'No exemption'}
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
            <div className="content-card">
              <h3>Policy snapshot</h3>
              <p>
                {result.policy.id} · effective {result.policy.effectiveFrom} to {result.policy.effectiveTo} ·
                last verified {result.policy.lastVerifiedOn} · review due {result.policyFreshness.reviewDueOn}
              </p>
              <p>
                This is an estimate from declared values for one stable rented-accommodation period. Confirm
                the result with payroll or a qualified tax professional.
              </p>
            </div>
            <div className="inline-actions scenario-actions">
              <Button type="button" variant="ghost" onClick={() => window.print()}>
                Print summary
              </Button>
            </div>
            <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
          </>
        ) : (
          <StateBlock
            titleId="hra-calculator-result-title"
            title="Your HRA result will appear here"
            tone="empty"
          >
            Enter salary, HRA, rent and policy selections to see the controlled lowest-of-three illustration.
            Nothing is sent away from this browser.
          </StateBlock>
        )}
      </section>
    </div>
  );
}

function renderTaxField(
  field: TaxFieldConfig,
  values: TaxCalculatorInput,
  errors: FieldError[],
  updateValue: (name: string, value: string) => void,
) {
  const value = values[field.name] ?? '';
  if (field.type === 'select')
    return (
      <SelectField
        key={field.name}
        id={field.name}
        name={field.name}
        label={field.label}
        help={field.help}
        value={value}
        onChange={(event) => updateValue(field.name, event.target.value)}
        error={getFieldError(errors, field.name)}
        required={field.required !== false}
      >
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>
    );
  return (
    <InputField
      key={field.name}
      id={field.name}
      name={field.name}
      label={field.label}
      help={field.help}
      value={value}
      onChange={(event) => updateValue(field.name, event.target.value)}
      error={getFieldError(errors, field.name)}
      type="text"
      inputMode={
        field.format === 'money' || field.format === 'percentage' || field.format === 'number'
          ? 'decimal'
          : 'text'
      }
      autoComplete="off"
      required={field.required !== false}
    />
  );
}

function GenericTaxForm({
  kind,
  tool,
}: {
  kind: TaxCalculatorKind;
  tool: Omit<TaxCalculatorFormProps, 'kind'>['tool'];
}) {
  const fields = taxCalculatorFields[kind];
  const initialValues = useMemo(
    () =>
      (tool.defaultValues as TaxCalculatorInput) ??
      Object.fromEntries(fields.map((field) => [field.name, field.defaultValue])),
    [fields, tool.defaultValues],
  );
  const [values, setValues] = useState<TaxCalculatorInput>(initialValues);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [result, setResult] = useState<TaxCalculationResult | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
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
    if (!errors.length) return;
    const frame = window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [errors]);

  function updateValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => current.filter((error) => error.field !== name));
    setResult(null);
    setCalculationError(null);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setResult(null);
    setCalculationError(null);
    trackEvent('tool_started', { toolId: tool.id });
    const validation = validateTaxCalculatorInput(kind, values);
    if (!validation.success) {
      setErrors(validation.errors);
      trackEvent('tool_validation_failed', {
        toolId: tool.id,
        errorCodes: validation.errors.map((error) => error.code),
      });
      return;
    }
    try {
      const nextResult = calculateTax(kind, validation.data);
      setResult(nextResult);
      trackEvent('tool_completed', { toolId: tool.id });
      trackEvent('result_generated', { toolId: tool.id });
      window.requestAnimationFrame(() => resultRef.current?.focus());
    } catch (error) {
      setCalculationError(
        error instanceof Error ? error.message : 'We could not safely calculate that scenario.',
      );
    }
  }

  return (
    <div className="calculator-layout">
      <section className="calculator-card" aria-labelledby={`${kind}-calculator-form-title`}>
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">India tax and payroll · controlled beta</p>
            <h2 id={`${kind}-calculator-form-title`}>Enter your declared records</h2>
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
          {fields.map((field) => renderTaxField(field, values, errors, updateValue))}
          <Button type="submit" fullWidth>
            Calculate estimate
          </Button>
        </form>
      </section>
      <section
        className="calculator-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby={`${kind}-calculator-result-title`}
      >
        {calculationError ? (
          <StateBlock
            titleId={`${kind}-calculator-result-title`}
            title="We could not calculate that estimate"
            tone="error"
          >
            {calculationError}
          </StateBlock>
        ) : result ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Your policy-scoped result</p>
                <h2 id={`${kind}-calculator-result-title`}>{result.headline.label}</h2>
              </div>
              <span className="result-status">Estimate</span>
            </div>
            <ResultPanel
              label={result.headline.label}
              value={formatMetric(result.headline)}
              tone={result.tone}
              detail={result.detail}
            >
              <dl className="result-breakdown">
                {result.details.map((detail) => (
                  <div key={`${detail.label}-${detail.value}`}>
                    <dt>{detail.label}</dt>
                    <dd>{formatMetric(detail)}</dd>
                  </div>
                ))}
              </dl>
            </ResultPanel>
            {result.warnings.length > 0 ? (
              <div className="content-card">
                <h3>Important boundaries</h3>
                <ul className="plain-list">
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="content-card">
              <h3>Policy snapshot</h3>
              <p>
                {result.policy.id} · {result.policy.act} · effective {result.policy.effectiveFrom} to{' '}
                {result.policy.effectiveTo} · last verified {result.policy.lastVerifiedOn} · review due{' '}
                {result.policyFreshness.reviewDueOn}
              </p>
              {result.policyFreshness.isStale ? (
                <p role="status">
                  This estimate is disabled until the official source bundle is re-verified.
                </p>
              ) : null}
            </div>
            <div className="inline-actions scenario-actions">
              <Button type="button" variant="ghost" onClick={() => window.print()}>
                Print summary
              </Button>
            </div>
            <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
          </>
        ) : (
          <StateBlock
            titleId={`${kind}-calculator-result-title`}
            title="Your estimate will appear here"
            tone="empty"
          >
            Complete the form to see the result, policy snapshot and boundaries. Nothing is sent away from
            this browser.
          </StateBlock>
        )}
      </section>
    </div>
  );
}

export function TaxCalculatorForm({ kind, tool }: TaxCalculatorFormProps) {
  if (kind === 'hra') return <HraForm tool={tool} />;
  return <GenericTaxForm kind={kind} tool={tool} />;
}
