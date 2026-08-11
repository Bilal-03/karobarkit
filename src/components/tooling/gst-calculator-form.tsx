'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { FieldError } from '@/domain/calculations/types';
import { defaultPolicyContext } from '@/domain/policies/context';
import { formatIndianCurrency, formatIndianDate, formatPercentage } from '@/domain/formatting/indian';
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
import { ResultPanel } from '@/components/ui/result-panel';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';
import { useLiveCalculation } from './use-live-calculation';

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

function modeLabel(mode: GstResult['calculationMode']) {
  return mode === 'exclusive'
    ? 'GST exclusive · entered amount is taxable value'
    : 'GST inclusive · entered amount already includes GST';
}

function supplyLabel(supplyType: GstResult['supplyType']) {
  if (supplyType === 'intra-state') return 'Intra-state · CGST + SGST/UTGST';
  if (supplyType === 'inter-state') return 'Inter-state · IGST';
  return 'Tax split not required · total GST only';
}

function sourceForId(sources: SourceReference[], sourceId: string) {
  return sources.find((source) => source.id === sourceId);
}

export function GstCalculatorForm({ tool }: GstCalculatorFormProps) {
  const initialValues = useMemo(() => tool.defaultValues as GstInput, [tool.defaultValues]);
  const rateOptions = useMemo(() => getGstRateOptions(defaultPolicyContext.asOf), []);
  const policy = useMemo(() => getActiveGstPolicy(defaultPolicyContext.asOf), []);
  const freshness = useMemo(() => getGstPolicyFreshness(policy), [policy]);
  const [values, setValues] = useState<GstInput>(initialValues);
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
    setValues({ ...initialValues });
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
  const sourceIds = result?.sourceIds ?? [];

  return (
    <div className="calculator-layout gst-calculator-layout">
      <section className="calculator-card gst-calculator-card" aria-labelledby="gst-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">GST arithmetic</p>
            <h2 id="gst-form-title">Choose the inputs</h2>
          </div>
          <span className="local-badge">Runs locally</span>
        </div>
        <div className="gst-policy-summary" aria-label="Active GST policy">
          <strong>Active policy: {policy.id}</strong>
          <span>
            Effective {formatIndianDate(policy.effectiveFrom)} · Verified{' '}
            {formatIndianDate(policy.lastVerifiedOn)}
          </span>
        </div>
        {freshness.isStale ? (
          <div className="notice notice--muted gst-policy-warning" role="status">
            <strong>Source review is due</strong>
            <p>
              Review is due on {formatIndianDate(freshness.reviewDueOn)}. This warning does not mean a rate is
              incorrect; verify official sources before relying on the result.
            </p>
          </div>
        ) : null}
        <form
          onSubmit={onSubmit}
          noValidate
          data-interactive={isInteractive ? 'true' : 'false'}
          inert={!isInteractive}
        >
          <ErrorSummary ref={errorSummaryRef} errors={errors} />
          {discountTransfer ? (
            <div className="scenario-transfer" role="status">
              <strong>A final price is ready from {discountTransfer.sourceToolName}</strong>
              <p>Import only the amount, then choose the GST rate, mode and supply type yourself.</p>
              <div className="inline-actions">
                <Button type="button" variant="secondary" onClick={importDiscountResult}>
                  Import final price
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setDiscountTransfer(null);
                    clearLocalScenarioTransfer();
                  }}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ) : null}
          <InputField
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            label="Amount"
            help="Enter a positive currency amount with up to two decimal places. Maximum supported amount: ₹999,999,999,999,999.99."
            value={values.amount}
            onChange={(event) => updateValue('amount', event.target.value)}
            error={getFieldError(errors, 'amount')}
            required
          />
          <RadioGroup
            id="ratePresetId"
            name="ratePresetId"
            label="GST rate"
            options={rateOptions}
            value={values.ratePresetId}
            onChange={(value) => updateValue('ratePresetId', value)}
            help="Presets are source-backed headline choices, not product or service classification. Choose Custom only when you already know the rate to use."
            error={rateError}
          />
          {selectedRateIsCustom ? (
            <InputField
              id="customRate"
              name="customRate"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              label="Custom GST rate (%)"
              help="Enter 0%–100% with up to two decimal places. The tool does not validate whether this rate applies."
              value={values.customRate}
              onChange={(event) => updateValue('customRate', event.target.value)}
              error={getFieldError(errors, 'customRate')}
              required
            />
          ) : null}
          <RadioGroup
            name="mode"
            label="Calculation mode"
            options={[
              { value: 'exclusive', label: 'GST exclusive' },
              { value: 'inclusive', label: 'GST inclusive' },
            ]}
            value={values.mode}
            onChange={(value) => updateValue('mode', value)}
            help="Exclusive treats the entered amount as taxable value. Inclusive treats it as the final amount already containing GST."
          />
          <RadioGroup
            name="supplyType"
            label="Supply type"
            options={[
              { value: 'intra-state', label: 'Intra-state · CGST + SGST/UTGST' },
              { value: 'inter-state', label: 'Inter-state · IGST' },
              { value: 'unspecified', label: 'Tax split not required' },
            ]}
            value={values.supplyType}
            onChange={(value) => updateValue('supplyType', value)}
            help="Select this yourself. The calculator does not infer legal place of supply from an address."
          />
          <div className="gst-form-actions">
            <Button type="submit" fullWidth disabled={isCalculating}>
              {isCalculating ? 'Calculating…' : 'Calculate GST'}
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={reset}>
              Reset form
            </Button>
          </div>
        </form>
      </section>

      <section
        className="calculator-result gst-calculator-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby="gst-result-title"
        aria-live="polite"
      >
        {calculationError ? (
          <StateBlock titleId="gst-result-title" title="We could not calculate that input" tone="error">
            {calculationError}
          </StateBlock>
        ) : result ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Your result</p>
                <h2 id="gst-result-title">GST calculation</h2>
              </div>
              <span className="result-status" aria-label="Live GST calculation complete">
                Live
              </span>
            </div>
            <ResultPanel
              label="GST amount"
              value={formatIndianCurrency(result.gstAmount)}
              tone="neutral"
              detail={supplyLabel(result.supplyType)}
            />
            <table className="gst-breakdown">
              <caption>GST calculation amounts and selected context</caption>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Calculation mode</th>
                  <td>{modeLabel(result.calculationMode)}</td>
                </tr>
                <tr>
                  <th scope="row">Entered amount</th>
                  <td>{formatIndianCurrency(result.enteredAmount)}</td>
                </tr>
                <tr>
                  <th scope="row">GST rate</th>
                  <td>
                    {formatPercentage(result.ratePercent)} · {result.rateLabel}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Taxable value</th>
                  <td>{formatIndianCurrency(result.taxableValue)}</td>
                </tr>
                <tr>
                  <th scope="row">GST amount</th>
                  <td>{formatIndianCurrency(result.gstAmount)}</td>
                </tr>
                {result.cgstAmount ? (
                  <tr>
                    <th scope="row">CGST</th>
                    <td>{formatIndianCurrency(result.cgstAmount)}</td>
                  </tr>
                ) : null}
                {result.sgstOrUtgstAmount ? (
                  <tr>
                    <th scope="row">SGST/UTGST</th>
                    <td>{formatIndianCurrency(result.sgstOrUtgstAmount)}</td>
                  </tr>
                ) : null}
                {result.igstAmount ? (
                  <tr>
                    <th scope="row">IGST</th>
                    <td>{formatIndianCurrency(result.igstAmount)}</td>
                  </tr>
                ) : null}
                <tr>
                  <th scope="row">Total amount</th>
                  <td>{formatIndianCurrency(result.totalAmount)}</td>
                </tr>
              </tbody>
            </table>
            <div className="gst-result-explanation">
              <h3>Calculation breakdown</h3>
              <p>{result.formula}</p>
              <p>Taxable value + GST amount = total amount, after the displayed currency rounding.</p>
              {result.roundingOccurred ? (
                <p>
                  <strong>Rounding note:</strong> the unrounded GST differed from the displayed GST by{' '}
                  {result.roundingAdjustment} currency units. Half-up rounding was applied at the currency
                  boundary; components use the displayed GST total.
                </p>
              ) : (
                <p>
                  <strong>Rounding note:</strong> displayed values reconcile exactly to two decimal places.
                </p>
              )}
            </div>
            <div className="gst-result-policy">
              <h3>Policy context</h3>
              <dl className="result-breakdown">
                <div>
                  <dt>Policy version</dt>
                  <dd>{result.policyVersion}</dd>
                </div>
                <div>
                  <dt>Policy effective from</dt>
                  <dd>
                    {result.policyEffectiveFrom
                      ? formatIndianDate(result.policyEffectiveFrom)
                      : 'Not available'}
                  </dd>
                </div>
                <div>
                  <dt>Last verified</dt>
                  <dd>
                    {result.policyLastVerifiedOn
                      ? formatIndianDate(result.policyLastVerifiedOn)
                      : 'Not available'}
                  </dd>
                </div>
              </dl>
              {result.rateSource === 'custom' ? (
                <div className="notice notice--muted gst-custom-warning" role="note">
                  <strong>Custom-rate warning</strong>
                  <p>
                    This rate was entered by you. KarobarKit did not validate its classification, eligibility
                    or legal applicability.
                  </p>
                </div>
              ) : null}
              {result.policyIsStale ? (
                <div className="notice notice--muted gst-policy-warning" role="status">
                  <strong>Policy review is due</strong>
                  <p>
                    The stored policy review is due on{' '}
                    {result.policyReviewDueOn ? formatIndianDate(result.policyReviewDueOn) : 'a later date'}.
                    Verify official sources before relying on this result.
                  </p>
                </div>
              ) : null}
            </div>
            <section className="gst-result-sources" aria-labelledby="gst-result-sources-title">
              <h3 id="gst-result-sources-title">Supporting official sources</h3>
              <ul>
                {sourceIds.map((sourceId) => {
                  const source = sourceForId(tool.sources, sourceId);
                  if (!source) return null;
                  return (
                    <li key={source.id}>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.title}
                      </a>
                      <span>
                        {source.authority ?? source.publisher} · checked{' '}
                        {formatIndianDate(source.lastChecked)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
            <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
          </>
        ) : (
          <StateBlock titleId="gst-result-title" title="Your GST result will appear here" tone="empty">
            Complete the form to see taxable value, GST, total and the selected allocation. Nothing is sent
            away from this browser.
          </StateBlock>
        )}
      </section>
    </div>
  );
}
