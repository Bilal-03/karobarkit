'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { FieldError } from '@/domain/calculations/types';
import { defaultPolicyContext } from '@/domain/policies/context';
import { formatIndianCurrency } from '@/domain/formatting/indian';
import { GST_CUSTOM_RATE_ID, getGstPolicyFreshness, getActiveGstPolicy } from '@/domain/policies/gst';
import type { SourceReference } from '@/domain/registry/types';
import {
  calculateGstTool,
  getGstRateOptions,
  validateGstInput,
  type GstInput,
  type GstResult,
} from '@/domain/gst';
import { trackEvent } from '@/lib/analytics';
import {
  clearLocalScenarioTransfer,
  readLocalScenarioTransfer,
  type LocalScenarioTransfer,
} from '@/domain/workflows/local-scenario-transfer';

import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/ui/form-error';
import { InputField, RadioGroup } from '@/components/ui/form-field';
import { ResultSummary } from '@/components/ui/result-summary';
import { ExampleButton, emptyPrimaryValues } from '@/components/ui/field-groups';
import { StateBlock } from '@/components/ui/trust-blocks';
import { focusResult, useLiveCalculation } from './use-live-calculation';

interface GstCalculatorToolProps {
  id: string;
  category: string;
  defaultValues: unknown;
  privacyNote: string;
  sources: SourceReference[];
}

interface GstCalculatorFormProps {
  tool: GstCalculatorToolProps;
}

function getFieldError(errors: FieldError[], field: string) {
  return errors.find((error) => error.field === field)?.message;
}

export function GstCalculatorForm({ tool }: GstCalculatorFormProps) {
  const initialValues = useMemo(() => tool.defaultValues as GstInput, [tool.defaultValues]);
  const rateOptions = useMemo(() => getGstRateOptions(defaultPolicyContext.asOf), []);
  const policy = useMemo(() => getActiveGstPolicy(defaultPolicyContext.asOf), []);
  const freshness = useMemo(() => getGstPolicyFreshness(policy), [policy]);
  const [values, setValues] = useState<GstInput>(() => emptyPrimaryValues(tool.id, initialValues));
  const [isInteractive, setIsInteractive] = useState(false);
  const [discountTransfer, setDiscountTransfer] = useState<LocalScenarioTransfer | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const { result, errors, calculationError, isCalculating, clearFieldError, clearErrors, submit } =
    useLiveCalculation<GstInput, GstResult>({
      values,
      validate: (input) => validateGstInput(input, defaultPolicyContext.asOf),
      calculate: (input) => calculateGstTool(input, defaultPolicyContext),
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
    const frame = window.requestAnimationFrame(() => {
      const transfer = readLocalScenarioTransfer();
      if (transfer?.sourceKind === 'discount-to-gst' && transfer.values.amount) {
        setDiscountTransfer(transfer);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (errors.length === 0) return;
    const frame = window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [errors]);

  function updateValue(field: keyof GstInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
  }

  function reset() {
    setValues(emptyPrimaryValues(tool.id, initialValues));
    clearErrors();
  }

  function importDiscountResult() {
    if (!discountTransfer?.values.amount) return;
    setValues((current) => ({ ...current, amount: discountTransfer.values.amount! }));
    setDiscountTransfer(null);
    clearLocalScenarioTransfer();
    clearErrors();
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    trackEvent('tool_started', { toolId: tool.id });
    submit();
  }

  const selectedRateIsCustom = values.ratePresetId === GST_CUSTOM_RATE_ID;
  const rateError = getFieldError(errors, 'ratePresetId');
  return (
    <div className="calculator-layout gst-calculator-layout">
      <section className="calculator-card" aria-label="GST inputs">
        <div className="studio-card-heading">
          <h2>Calculate GST</h2>
          <ExampleButton onClick={() => setValues({ ...initialValues })} />
        </div>
        {freshness.isStale && (
          <p className="notice" role="status">
            Rate review is due. Verify the rate before using this estimate.
          </p>
        )}
        <form
          onSubmit={onSubmit}
          noValidate
          data-interactive={isInteractive ? 'true' : 'false'}
          inert={!isInteractive}
        >
          <ErrorSummary ref={errorSummaryRef} errors={errors} />
          {discountTransfer && (
            <div className="scenario-transfer">
              <span>Use the amount from your discount calculation?</span>
              <Button type="button" onClick={importDiscountResult}>
                Import amount
              </Button>
            </div>
          )}
          <InputField
            id="amount"
            name="amount"
            label="Amount (₹)"
            value={values.amount}
            onChange={(event) => updateValue('amount', event.target.value)}
            error={getFieldError(errors, 'amount')}
            inputMode="decimal"
            placeholder="0.00"
            required
          />
          <RadioGroup
            id="ratePresetId"
            name="ratePresetId"
            label="GST rate"
            options={rateOptions.map((option) => ({
              ...option,
              label: option.value === GST_CUSTOM_RATE_ID ? 'Custom' : option.label.split(' · ')[0],
            }))}
            value={values.ratePresetId}
            onChange={(value) => updateValue('ratePresetId', value)}
            error={rateError}
          />
          {selectedRateIsCustom && (
            <>
              <InputField
                id="customRate"
                label="Custom rate (%)"
                inputMode="decimal"
                value={values.customRate}
                onChange={(event) => updateValue('customRate', event.target.value)}
                error={getFieldError(errors, 'customRate')}
                required
              />
              <p className="context-note">Use a rate you have verified for your transaction.</p>
            </>
          )}
          <RadioGroup
            name="mode"
            label="Calculation"
            options={[
              { value: 'exclusive', label: 'Add GST' },
              { value: 'inclusive', label: 'Remove GST' },
            ]}
            value={values.mode}
            onChange={(value) => updateValue('mode', value)}
          />
          <details className="field-group">
            <summary>Split tax components</summary>
            <RadioGroup
              name="supplyType"
              label="Tax split"
              options={[
                { value: 'unspecified', label: 'Total only' },
                { value: 'intra-state', label: 'Within state' },
                { value: 'inter-state', label: 'Between states' },
              ]}
              value={values.supplyType}
              onChange={(value) => updateValue('supplyType', value)}
            />
            <p className="context-note">Choose the supply type that applies to your transaction.</p>
          </details>
          <div className="studio-form-actions">
            <Button type="submit" fullWidth disabled={isCalculating}>
              {isCalculating ? 'Calculating…' : 'Calculate GST'}
            </Button>
            <Button type="button" variant="ghost" onClick={reset}>
              Clear
            </Button>
          </div>
        </form>
      </section>
      <section
        className="calculator-result"
        ref={resultRef}
        tabIndex={-1}
        aria-label="GST result"
        aria-live="polite"
      >
        {calculationError ? (
          <StateBlock title="Check your details" tone="error">
            {calculationError}
          </StateBlock>
        ) : result ? (
          <>
            <ResultSummary label="Total amount" value={formatIndianCurrency(result.totalAmount)} />
            <dl className="summary-metrics">
              <div>
                <dt>Before GST</dt>
                <dd>{formatIndianCurrency(result.taxableValue)}</dd>
              </div>
              <div>
                <dt>GST amount</dt>
                <dd>{formatIndianCurrency(result.gstAmount)}</dd>
              </div>
            </dl>
            {result.supplyType !== 'unspecified' && (
              <details className="field-group">
                <summary>Tax components</summary>
                <dl className="summary-metrics">
                  {result.cgstAmount && (
                    <div>
                      <dt>CGST</dt>
                      <dd>{formatIndianCurrency(result.cgstAmount)}</dd>
                    </div>
                  )}
                  {result.sgstOrUtgstAmount && (
                    <div>
                      <dt>SGST / UTGST</dt>
                      <dd>{formatIndianCurrency(result.sgstOrUtgstAmount)}</dd>
                    </div>
                  )}
                  {result.igstAmount && (
                    <div>
                      <dt>IGST</dt>
                      <dd>{formatIndianCurrency(result.igstAmount)}</dd>
                    </div>
                  )}
                </dl>
              </details>
            )}
            <p className="context-note">Check that your selected rate applies to the transaction.</p>
          </>
        ) : (
          <div className="quiet-result">
            <span className="quiet-result-symbol">₹</span>
            <h2>Your total, right here</h2>
            <p>Enter an amount to get started.</p>
          </div>
        )}
      </section>
    </div>
  );
}
