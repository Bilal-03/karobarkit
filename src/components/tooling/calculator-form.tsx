'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { CagrInput, CagrResult } from '@/domain/calculations/cagr';
import { calculateCagr, validateCagrInput } from '@/domain/calculations/cagr';
import type { FieldError } from '@/domain/calculations/types';
import type { RoiInput, RoiResult } from '@/domain/calculations/roi';
import { calculateRoi, validateRoiInput } from '@/domain/calculations/roi';
import { formatIndianCurrency, formatPercentage } from '@/domain/formatting/indian';
import { trackEvent } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/ui/form-error';
import { InputField } from '@/components/ui/form-field';
import { ResultPanel } from '@/components/ui/result-panel';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';

type CalculatorKind = 'cagr' | 'roi';

interface CalculatorToolProps {
  id: string;
  category: string;
  defaultValues: unknown;
  privacyNote: string;
}

interface CalculatorFormProps {
  kind: CalculatorKind;
  tool: CalculatorToolProps;
}

type CalculatorResult = CagrResult | RoiResult;

function getFieldError(errors: FieldError[], field: string) {
  return errors.find((error) => error.field === field)?.message;
}

export function CalculatorForm({ kind, tool }: CalculatorFormProps) {
  const initialValues = useMemo(() => {
    if (kind === 'cagr') {
      return tool.defaultValues as unknown as CagrInput;
    }
    return tool.defaultValues as unknown as RoiInput;
  }, [kind, tool]);

  const [values, setValues] = useState<CagrInput | RoiInput>(initialValues);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
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
    if (errors.length === 0) {
      return;
    }

    const frame = window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [errors]);

  function updateValue(field: string, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => current.filter((error) => error.field !== field));
    setResult(null);
    setCalculationError(null);
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
        if (kind === 'cagr') {
          const input = values as CagrInput;
          const validation = validateCagrInput(input);
          if (!validation.success) {
            setErrors(validation.errors);
            trackEvent('tool_validation_failed', {
              toolId: tool.id,
              errorCodes: validation.errors.map((error) => error.code),
            });
            setIsCalculating(false);
            return;
          }
          const nextResult = calculateCagr(validation.data);
          setResult(nextResult);
          trackEvent('tool_completed', { toolId: tool.id });
          trackEvent('result_generated', { toolId: tool.id });
        } else {
          const input = values as RoiInput;
          const validation = validateRoiInput(input);
          if (!validation.success) {
            setErrors(validation.errors);
            trackEvent('tool_validation_failed', {
              toolId: tool.id,
              errorCodes: validation.errors.map((error) => error.code),
            });
            setIsCalculating(false);
            return;
          }
          const nextResult = calculateRoi(validation.data);
          setResult(nextResult);
          trackEvent('tool_completed', { toolId: tool.id });
          trackEvent('result_generated', { toolId: tool.id });
        }
      } catch (error) {
        setCalculationError(
          error instanceof Error ? error.message : 'We could not safely calculate that input. Try again.',
        );
      }
      setIsCalculating(false);
      window.requestAnimationFrame(() => resultRef.current?.focus());
    }, 120);
  }

  const isCagr = kind === 'cagr';
  const cagrResult = isCagr ? (result as CagrResult | null) : null;
  const roiResult = !isCagr ? (result as RoiResult | null) : null;
  const resultTone =
    cagrResult?.direction === 'decline' || roiResult?.direction === 'loss' ? 'negative' : 'positive';

  return (
    <div className="calculator-layout">
      <section className="calculator-card" aria-labelledby="calculator-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Calculator</p>
            <h2 id="calculator-form-title">Enter your numbers</h2>
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
          {isCagr ? (
            <>
              <InputField
                id="beginningValue"
                name="beginningValue"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                label="Beginning value"
                help="Use the value at the start of the period. Currency is optional, but keep the unit consistent."
                value={(values as CagrInput).beginningValue}
                onChange={(event) => updateValue('beginningValue', event.target.value)}
                error={getFieldError(errors, 'beginningValue')}
                required
              />
              <InputField
                id="endingValue"
                name="endingValue"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                label="Ending value"
                help="Use the value at the end of the period. Positive values are required for standard CAGR."
                value={(values as CagrInput).endingValue}
                onChange={(event) => updateValue('endingValue', event.target.value)}
                error={getFieldError(errors, 'endingValue')}
                required
              />
              <InputField
                id="years"
                name="years"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                label="Duration in years"
                help="The number of years between the beginning and ending values."
                value={(values as CagrInput).years}
                onChange={(event) => updateValue('years', event.target.value)}
                error={getFieldError(errors, 'years')}
                required
              />
            </>
          ) : (
            <>
              <InputField
                id="investmentCost"
                name="investmentCost"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                label="Investment cost"
                help="The total amount invested at the start. It must be greater than zero."
                value={(values as RoiInput).investmentCost}
                onChange={(event) => updateValue('investmentCost', event.target.value)}
                error={getFieldError(errors, 'investmentCost')}
                required
              />
              <InputField
                id="finalValue"
                name="finalValue"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                label="Final value (not profit)"
                help="Enter the complete value at the end. The tool subtracts investment cost to find profit or loss."
                value={(values as RoiInput).finalValue}
                onChange={(event) => updateValue('finalValue', event.target.value)}
                error={getFieldError(errors, 'finalValue')}
                required
              />
            </>
          )}
          <Button type="submit" fullWidth disabled={isCalculating}>
            {isCalculating ? 'Calculating…' : 'Calculate result'}
          </Button>
        </form>
      </section>

      <section
        className="calculator-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby="calculator-result-title"
      >
        {calculationError ? (
          <StateBlock
            titleId="calculator-result-title"
            title="We could not calculate that input"
            tone="error"
          >
            {calculationError}
          </StateBlock>
        ) : result ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Your result</p>
                <h2 id="calculator-result-title">A clearer view of the number</h2>
              </div>
              <span className="result-status" aria-label="Calculation complete">
                Complete
              </span>
            </div>
            {isCagr && cagrResult ? (
              <ResultPanel
                label="Compound annual growth rate"
                value={formatPercentage(cagrResult.percentage)}
                tone={resultTone}
                detail={
                  cagrResult.direction === 'growth'
                    ? 'Smoothed annual growth across the period.'
                    : 'Smoothed annual change across the period.'
                }
              >
                <dl className="result-breakdown">
                  <div>
                    <dt>Beginning value</dt>
                    <dd>{formatIndianCurrency(cagrResult.beginningValue)}</dd>
                  </div>
                  <div>
                    <dt>Ending value</dt>
                    <dd>{formatIndianCurrency(cagrResult.endingValue)}</dd>
                  </div>
                  <div>
                    <dt>Duration</dt>
                    <dd>{cagrResult.years} years</dd>
                  </div>
                </dl>
              </ResultPanel>
            ) : null}
            {!isCagr && roiResult ? (
              <>
                <ResultPanel
                  label="Profit or loss"
                  value={formatIndianCurrency(roiResult.profit)}
                  tone={resultTone}
                  detail={
                    roiResult.direction === 'profit'
                      ? 'The final value is above the original cost.'
                      : roiResult.direction === 'loss'
                        ? 'The final value is below the original cost.'
                        : 'The final value matches the original cost.'
                  }
                />
                <ResultPanel
                  label="Basic ROI"
                  value={formatPercentage(roiResult.percentage)}
                  tone={resultTone}
                >
                  <dl className="result-breakdown">
                    <div>
                      <dt>Investment cost</dt>
                      <dd>{formatIndianCurrency(roiResult.investmentCost)}</dd>
                    </div>
                    <div>
                      <dt>Final value</dt>
                      <dd>{formatIndianCurrency(roiResult.finalValue)}</dd>
                    </div>
                  </dl>
                </ResultPanel>
              </>
            ) : null}
            <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
          </>
        ) : (
          <StateBlock titleId="calculator-result-title" title="Your result will appear here" tone="empty">
            Complete the short form to see the answer, breakdown and interpretation. Nothing is sent away from
            this browser.
          </StateBlock>
        )}
      </section>
    </div>
  );
}
