'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  calculateCurrencyConversion,
  calculateDepreciation,
  calculateGstDueDate,
  calculateHsn,
  calculateMsmeInterest,
  calculateProfessionalTax,
  type CurrencyInput,
  type CurrencyQuote,
  type CurrencyResult,
  type DepreciationInput,
  type DepreciationResult,
  type GstDueDateInput,
  type GstDueDateResult,
  type HsnInput,
  type HsnResult,
  type MsmeInterestInput,
  type MsmeInterestResult,
  type ProfessionalTaxInput,
  type ProfessionalTaxResult,
  type RegulatedResultBase,
  supportedCurrencyCodes,
  validateCurrencyInput,
  validateDepreciationInput,
  validateGstDueDateInput,
  validateHsnInput,
  validateMsmeInterestInput,
  validateProfessionalTaxInput,
} from '@/domain/calculations/regulated-utilities';
import type { FieldError } from '@/domain/calculations/types';
import { formatIndianCurrency, formatIndianDate, formatIndianNumber } from '@/domain/formatting/indian';
import type { ToolUiAdapter } from '@/domain/registry/types';
import { fetchEcbReferenceQuote } from '@/lib/regulated/currency-rates';
import { trackEvent } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/ui/form-error';
import { InputField, SelectField } from '@/components/ui/form-field';
import { ResultPanel } from '@/components/ui/result-panel';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';

type RegulatedUtilityKind = Extract<ToolUiAdapter, { adapter: 'regulated-utility' }>['variant'];
type Values = Record<string, string>;
type RegulatedResult =
  | HsnResult
  | GstDueDateResult
  | DepreciationResult
  | ProfessionalTaxResult
  | MsmeInterestResult
  | CurrencyResult;
type Outcome = { success: true; result: RegulatedResult } | { success: false; errors: FieldError[] };

interface RegulatedUtilityFormProps {
  kind: RegulatedUtilityKind;
  tool: {
    id: string;
    category: string;
    defaultValues: unknown;
    privacyNote: string;
  };
}

function getValue(values: Values, field: string) {
  return values[field] ?? '';
}

function fieldError(errors: FieldError[], field: string) {
  return errors.find((error) => error.field === field)?.message;
}

function calculate(kind: RegulatedUtilityKind, values: Values, quote?: CurrencyQuote): Outcome {
  if (kind === 'hsn-sac') {
    const input = values as unknown as HsnInput;
    const validation = validateHsnInput(input);
    return validation.success ? { success: true, result: calculateHsn(validation.data) } : validation;
  }
  if (kind === 'gst-due-date') {
    const input = values as unknown as GstDueDateInput;
    const validation = validateGstDueDateInput(input);
    return validation.success ? { success: true, result: calculateGstDueDate(validation.data) } : validation;
  }
  if (kind === 'depreciation') {
    const input = values as unknown as DepreciationInput;
    const validation = validateDepreciationInput(input);
    return validation.success
      ? { success: true, result: calculateDepreciation(validation.data) }
      : validation;
  }
  if (kind === 'professional-tax') {
    const input = values as unknown as ProfessionalTaxInput;
    const validation = validateProfessionalTaxInput(input);
    return validation.success
      ? { success: true, result: calculateProfessionalTax(validation.data) }
      : validation;
  }
  if (kind === 'msme-interest') {
    const input = values as unknown as MsmeInterestInput;
    const validation = validateMsmeInterestInput(input);
    return validation.success
      ? { success: true, result: calculateMsmeInterest(validation.data) }
      : validation;
  }
  const input = values as unknown as CurrencyInput;
  const validation = validateCurrencyInput(input);
  return validation.success
    ? { success: true, result: calculateCurrencyConversion(validation.data, quote) }
    : validation;
}

function CommonPolicyNote({ result }: { result: RegulatedResultBase }) {
  const tone = result.policyState === 'fresh' ? 'success' : 'error';
  return (
    <StateBlock title="Policy snapshot" tone={tone}>
      {`${result.policyMessage} Last verified ${formatIndianDate(result.lastVerifiedOn)}.`}
    </StateBlock>
  );
}

function ResultView({ kind, result }: { kind: RegulatedUtilityKind; result: RegulatedResult }) {
  if (kind === 'hsn-sac') {
    const hsn = result as HsnResult;
    return (
      <>
        <ResultPanel
          label="Reference matches"
          value={formatIndianNumber(hsn.matches.length)}
          detail={`Dataset ${hsn.datasetVersion}`}
        >
          {hsn.matches.length ? (
            <ul className="result-list">
              {hsn.matches.map((match) => (
                <li key={match.code}>
                  <strong>{match.code}</strong> — {match.description} ({match.kind})
                </li>
              ))}
            </ul>
          ) : (
            <p className="field__help">No row in the bounded bundled fixture matched this query.</p>
          )}
        </ResultPanel>
        <p className="field__help">{hsn.classificationNotice}</p>
      </>
    );
  }
  if (kind === 'gst-due-date') {
    const gst = result as GstDueDateResult;
    return (
      <ResultPanel
        label="Reference due date"
        value={formatIndianDate(gst.referenceDueDate)}
        detail={`${gst.returnType.toUpperCase()} · ${gst.taxpayerType} · ${gst.period}`}
      >
        <p className="field__help">
          Dataset {gst.datasetVersion}. {gst.notice}
        </p>
      </ResultPanel>
    );
  }
  if (kind === 'depreciation') {
    const depreciation = result as DepreciationResult;
    return (
      <ResultPanel
        label="Illustrative depreciation"
        value={formatIndianCurrency(depreciation.annualDepreciation)}
        detail={`${depreciation.mode === 'companies-act' ? 'Companies Act / SLM' : 'Income Tax / WDV'} · ${depreciation.policyVersion}`}
      >
        <dl className="result-breakdown">
          <div>
            <dt>Base value</dt>
            <dd>{formatIndianCurrency(depreciation.baseValue)}</dd>
          </div>
          <div>
            <dt>Closing value</dt>
            <dd>{formatIndianCurrency(depreciation.closingValue)}</dd>
          </div>
        </dl>
        <p className="field__help">{depreciation.notice}</p>
      </ResultPanel>
    );
  }
  if (kind === 'professional-tax') {
    const professionalTax = result as ProfessionalTaxResult;
    return (
      <ResultPanel
        label="Monthly professional-tax reference"
        value={formatIndianCurrency(professionalTax.monthlyTax)}
        detail={`Monthly salary basis ${formatIndianCurrency(professionalTax.monthlySalary)} · ${professionalTax.datasetVersion}`}
      >
        <dl className="result-breakdown">
          <div>
            <dt>Annual illustration</dt>
            <dd>{formatIndianCurrency(professionalTax.annualIllustration)}</dd>
          </div>
          <div>
            <dt>Salary definition</dt>
            <dd>{professionalTax.salaryDefinition}</dd>
          </div>
        </dl>
        <p className="field__help">{professionalTax.notice}</p>
      </ResultPanel>
    );
  }
  if (kind === 'msme-interest') {
    const msme = result as MsmeInterestResult;
    return (
      <ResultPanel
        label="Estimated interest"
        value={formatIndianCurrency(msme.estimatedInterest)}
        tone={msme.eligible ? 'positive' : 'neutral'}
        detail={`${msme.eligibilityStatus} · due ${formatIndianDate(msme.dueDate)}`}
      >
        <dl className="result-breakdown">
          <div>
            <dt>Overdue days</dt>
            <dd>{formatIndianNumber(msme.overdueDays)}</dd>
          </div>
          <div>
            <dt>Annual interest rate</dt>
            <dd>{formatIndianNumber(msme.annualInterestRate)}%</dd>
          </div>
          <div>
            <dt>Bank-rate effective date</dt>
            <dd>{formatIndianDate(msme.bankRateEffectiveOn)}</dd>
          </div>
          <div>
            <dt>Estimated total</dt>
            <dd>{formatIndianCurrency(msme.estimatedTotal)}</dd>
          </div>
        </dl>
        <p className="field__help">{msme.notice}</p>
      </ResultPanel>
    );
  }
  const currency = result as CurrencyResult;
  return (
    <ResultPanel
      label="Converted amount"
      value={`${formatIndianNumber(currency.convertedAmount)} ${currency.toCurrency}`}
      detail={`${currency.quoteSource === 'manual' ? 'Manual rate' : 'ECB reference'} · 1 ${currency.fromCurrency} = ${currency.rate} ${currency.toCurrency}`}
    >
      <dl className="result-breakdown">
        <div>
          <dt>Quote date</dt>
          <dd>{currency.quotedOn ? formatIndianDate(currency.quotedOn) : 'Not applicable'}</dd>
        </div>
        <div>
          <dt>Quote state</dt>
          <dd>
            {currency.stale
              ? 'Stale — refresh or enter a current manual rate'
              : currency.fallback
                ? 'Manual fallback'
                : 'Current for this session'}
          </dd>
        </div>
        <div>
          <dt>Rate/cache type</dt>
          <dd>
            {currency.rateType} · {currency.cacheState}
          </dd>
        </div>
      </dl>
      <p className="field__help">{currency.notice}</p>
    </ResultPanel>
  );
}

function FormFields({
  kind,
  values,
  errors,
  update,
}: {
  kind: RegulatedUtilityKind;
  values: Values;
  errors: FieldError[];
  update: (field: string, value: string) => void;
}) {
  if (kind === 'hsn-sac') {
    return (
      <>
        <InputField
          id="query"
          label="Code or keyword"
          value={getValue(values, 'query')}
          onChange={(event) => update('query', event.target.value)}
          error={fieldError(errors, 'query')}
          help="The bundled fixture is intentionally bounded; verify any candidate against current official material."
          required
        />
        <SelectField
          id="kind"
          label="Classification type"
          value={getValue(values, 'kind')}
          onChange={(event) => update('kind', event.target.value)}
          error={fieldError(errors, 'kind')}
        >
          <option value="all">Goods and services</option>
          <option value="goods">Goods only</option>
          <option value="services">Services only</option>
        </SelectField>
      </>
    );
  }
  if (kind === 'gst-due-date') {
    return (
      <>
        <SelectField
          id="financialYear"
          label="Financial year"
          value={getValue(values, 'financialYear')}
          onChange={(event) => update('financialYear', event.target.value)}
          error={fieldError(errors, 'financialYear')}
        >
          <option value="2026-27">FY 2026–27 (provisional)</option>
        </SelectField>
        <div className="form-grid form-grid--two">
          <SelectField
            id="returnType"
            label="Return type"
            value={getValue(values, 'returnType')}
            onChange={(event) => update('returnType', event.target.value)}
            error={fieldError(errors, 'returnType')}
          >
            <option value="gstr-1">GSTR-1</option>
            <option value="gstr-3b">GSTR-3B</option>
          </SelectField>
          <SelectField
            id="taxpayerType"
            label="Taxpayer cadence"
            value={getValue(values, 'taxpayerType')}
            onChange={(event) => update('taxpayerType', event.target.value)}
            error={fieldError(errors, 'taxpayerType')}
          >
            <option value="regular-monthly">Regular monthly</option>
            <option value="qrmp-quarterly">QRMP quarterly</option>
          </SelectField>
        </div>
        <InputField
          id="period"
          label="Return period"
          type="month"
          value={getValue(values, 'period')}
          onChange={(event) => update('period', event.target.value)}
          error={fieldError(errors, 'period')}
          min="2026-04"
          max="2027-03"
          required
        />
        {getValue(values, 'taxpayerType') === 'qrmp-quarterly' &&
        getValue(values, 'returnType') === 'gstr-3b' ? (
          <SelectField
            id="qrmpDueDateGroup"
            label="QRMP state/UT due-date group"
            value={getValue(values, 'qrmpDueDateGroup')}
            onChange={(event) => update('qrmpDueDateGroup', event.target.value)}
            error={fieldError(errors, 'qrmpDueDateGroup')}
            help="Choose the official 22nd or 24th group for the principal place of business."
          >
            <option value="22">22nd group</option>
            <option value="24">24th group</option>
          </SelectField>
        ) : null}
      </>
    );
  }
  if (kind === 'depreciation') {
    const mode = getValue(values, 'mode');
    return (
      <>
        <SelectField
          id="mode"
          label="Policy mode"
          value={mode}
          onChange={(event) => update('mode', event.target.value)}
          error={fieldError(errors, 'mode')}
          help="The modes stay separate; the tool does not infer a statutory rate or useful life."
        >
          <option value="companies-act">Companies Act useful life (SLM)</option>
          <option value="income-tax">Income Tax rate / WDV</option>
        </SelectField>
        <div className="form-grid form-grid--two">
          <InputField
            id="assetCost"
            label="Asset cost"
            type="number"
            min="0"
            step="0.01"
            value={getValue(values, 'assetCost')}
            onChange={(event) => update('assetCost', event.target.value)}
            error={fieldError(errors, 'assetCost')}
            required
          />
          <InputField
            id="residualValue"
            label="Residual value"
            type="number"
            min="0"
            step="0.01"
            value={getValue(values, 'residualValue')}
            onChange={(event) => update('residualValue', event.target.value)}
            error={fieldError(errors, 'residualValue')}
            required
          />
        </div>
        {mode === 'companies-act' ? (
          <InputField
            id="usefulLifeYears"
            label="Useful life (years)"
            type="number"
            min="0"
            step="0.01"
            value={getValue(values, 'usefulLifeYears')}
            onChange={(event) => update('usefulLifeYears', event.target.value)}
            error={fieldError(errors, 'usefulLifeYears')}
            required
          />
        ) : (
          <div className="form-grid form-grid--two">
            <InputField
              id="openingWdv"
              label="Opening WDV"
              type="number"
              min="0"
              step="0.01"
              value={getValue(values, 'openingWdv')}
              onChange={(event) => update('openingWdv', event.target.value)}
              error={fieldError(errors, 'openingWdv')}
              help="Leave blank to use asset cost."
            />
            <InputField
              id="ratePercent"
              label="Income Tax rate (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={getValue(values, 'ratePercent')}
              onChange={(event) => update('ratePercent', event.target.value)}
              error={fieldError(errors, 'ratePercent')}
              required
            />
          </div>
        )}
        <InputField
          id="daysInService"
          label="Days in service"
          type="number"
          min="1"
          max="366"
          step="1"
          value={getValue(values, 'daysInService')}
          onChange={(event) => update('daysInService', event.target.value)}
          error={fieldError(errors, 'daysInService')}
          help="Optional first-period proration; use 365 for a full year."
        />
        <SelectField
          id="method"
          label="Method"
          value={getValue(values, 'method')}
          onChange={(event) => update('method', event.target.value)}
          error={fieldError(errors, 'method')}
        >
          <option value="slm">Straight-line (SLM)</option>
          <option value="wdv">Written-down value (WDV)</option>
        </SelectField>
      </>
    );
  }
  if (kind === 'professional-tax') {
    return (
      <>
        <SelectField
          id="state"
          label="State schedule"
          value={getValue(values, 'state')}
          onChange={(event) => update('state', event.target.value)}
          error={fieldError(errors, 'state')}
        >
          <option value="maharashtra">Maharashtra (provisional)</option>
        </SelectField>
        <div className="form-grid form-grid--two">
          <InputField
            id="salaryAmount"
            label="Salary amount"
            type="number"
            min="0"
            step="0.01"
            value={getValue(values, 'salaryAmount')}
            onChange={(event) => update('salaryAmount', event.target.value)}
            error={fieldError(errors, 'salaryAmount')}
            required
          />
          <SelectField
            id="salaryPeriod"
            label="Salary period"
            value={getValue(values, 'salaryPeriod')}
            onChange={(event) => update('salaryPeriod', event.target.value)}
            error={fieldError(errors, 'salaryPeriod')}
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </SelectField>
        </div>
        <SelectField
          id="salaryDefinition"
          label="Salary definition"
          value={getValue(values, 'salaryDefinition')}
          onChange={(event) => update('salaryDefinition', event.target.value)}
          error={fieldError(errors, 'salaryDefinition')}
        >
          <option value="gross-monthly">Declared gross monthly</option>
          <option value="taxable-salary">Declared taxable salary</option>
        </SelectField>
        <div className="form-grid form-grid--two">
          <SelectField
            id="gender"
            label="Gender field"
            value={getValue(values, 'gender')}
            onChange={(event) => update('gender', event.target.value)}
            error={fieldError(errors, 'gender')}
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
          </SelectField>
          <InputField
            id="month"
            label="Payroll month"
            type="month"
            min="2026-04"
            max="2027-03"
            value={getValue(values, 'month')}
            onChange={(event) => update('month', event.target.value)}
            error={fieldError(errors, 'month')}
            required
          />
        </div>
      </>
    );
  }
  if (kind === 'msme-interest') {
    return (
      <>
        <InputField
          id="principal"
          label="Invoice principal"
          type="number"
          min="0"
          step="0.01"
          value={getValue(values, 'principal')}
          onChange={(event) => update('principal', event.target.value)}
          error={fieldError(errors, 'principal')}
          required
        />
        <div className="form-grid form-grid--two">
          <InputField
            id="invoiceDate"
            label="Invoice date"
            type="date"
            value={getValue(values, 'invoiceDate')}
            onChange={(event) => update('invoiceDate', event.target.value)}
            error={fieldError(errors, 'invoiceDate')}
            required
          />
          <InputField
            id="acceptedDate"
            label="Acceptance date"
            type="date"
            value={getValue(values, 'acceptedDate')}
            onChange={(event) => update('acceptedDate', event.target.value)}
            error={fieldError(errors, 'acceptedDate')}
            required
          />
        </div>
        <div className="form-grid form-grid--two">
          <SelectField
            id="agreementBasis"
            label="Payment-term basis"
            value={getValue(values, 'agreementBasis')}
            onChange={(event) => update('agreementBasis', event.target.value)}
            error={fieldError(errors, 'agreementBasis')}
          >
            <option value="written-agreement">Written agreement</option>
            <option value="no-agreement">No written agreement — appointed day</option>
          </SelectField>
          <InputField
            id="agreedPaymentDays"
            label="Agreed payment days"
            type="number"
            min="0"
            max="45"
            step="1"
            value={getValue(values, 'agreedPaymentDays')}
            onChange={(event) => update('agreedPaymentDays', event.target.value)}
            error={fieldError(errors, 'agreedPaymentDays')}
            required={getValue(values, 'agreementBasis') === 'written-agreement'}
            disabled={getValue(values, 'agreementBasis') === 'no-agreement'}
            help={
              getValue(values, 'agreementBasis') === 'no-agreement'
                ? 'The reference due date uses 15 days after acceptance.'
                : 'A written agreement cannot exceed 45 days from acceptance.'
            }
          />
          <InputField
            id="paymentDate"
            label="Payment date"
            type="date"
            value={getValue(values, 'paymentDate')}
            onChange={(event) => update('paymentDate', event.target.value)}
            error={fieldError(errors, 'paymentDate')}
            required
          />
        </div>
        <div className="form-grid form-grid--two">
          <InputField
            id="bankRatePercent"
            label="Declared bank rate (%)"
            type="number"
            min="0"
            step="0.01"
            value={getValue(values, 'bankRatePercent')}
            onChange={(event) => update('bankRatePercent', event.target.value)}
            error={fieldError(errors, 'bankRatePercent')}
            required
          />
          <InputField
            id="bankRateEffectiveOn"
            label="Bank-rate effective date"
            type="date"
            value={getValue(values, 'bankRateEffectiveOn')}
            onChange={(event) => update('bankRateEffectiveOn', event.target.value)}
            error={fieldError(errors, 'bankRateEffectiveOn')}
            help="Record the date attached to the declared bank-rate snapshot."
            required
          />
          <SelectField
            id="enterpriseType"
            label="Enterprise type"
            value={getValue(values, 'enterpriseType')}
            onChange={(event) => update('enterpriseType', event.target.value)}
            error={fieldError(errors, 'enterpriseType')}
          >
            <option value="micro">Micro</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="trading">Trading</option>
            <option value="unknown">Unknown — needs review</option>
          </SelectField>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="form-grid form-grid--two">
        <InputField
          id="amount"
          label="Amount"
          type="number"
          min="0"
          step="0.01"
          value={getValue(values, 'amount')}
          onChange={(event) => update('amount', event.target.value)}
          error={fieldError(errors, 'amount')}
          required
        />
        <InputField
          id="manualRate"
          label="Manual rate"
          type="number"
          min="0"
          step="0.000001"
          value={getValue(values, 'manualRate')}
          onChange={(event) => update('manualRate', event.target.value)}
          error={fieldError(errors, 'manualRate')}
          help="Target currency units for one source currency unit."
          required={getValue(values, 'fromCurrency') !== getValue(values, 'toCurrency')}
        />
      </div>
      <div className="form-grid form-grid--two">
        <SelectField
          id="fromCurrency"
          label="From currency"
          value={getValue(values, 'fromCurrency')}
          onChange={(event) => update('fromCurrency', event.target.value)}
          error={fieldError(errors, 'fromCurrency')}
        >
          {supportedCurrencyCodes.map((currency) => (
            <option value={currency} key={currency}>
              {currency}
            </option>
          ))}
        </SelectField>
        <SelectField
          id="toCurrency"
          label="To currency"
          value={getValue(values, 'toCurrency')}
          onChange={(event) => update('toCurrency', event.target.value)}
          error={fieldError(errors, 'toCurrency')}
        >
          {supportedCurrencyCodes.map((currency) => (
            <option value={currency} key={currency}>
              {currency}
            </option>
          ))}
        </SelectField>
      </div>
    </>
  );
}

export function RegulatedUtilityForm({ kind, tool }: RegulatedUtilityFormProps) {
  const initialValues = useMemo(() => (tool.defaultValues as Values) ?? {}, [tool.defaultValues]);
  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [result, setResult] = useState<RegulatedResult | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [quote, setQuote] = useState<CurrencyQuote | undefined>();
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsInteractive(true));
    trackEvent('tool_viewed', { toolId: tool.id, category: tool.category });
    return () => window.cancelAnimationFrame(frame);
  }, [tool.category, tool.id]);

  useEffect(() => {
    if (errors.length === 0) return;
    const frame = window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [errors]);

  function update(field: string, value: string) {
    setValues((current) => {
      const next = { ...current, [field]: value };
      if (kind === 'depreciation' && field === 'mode')
        next.method = value === 'companies-act' ? 'slm' : 'wdv';
      return next;
    });
    if (field === 'fromCurrency' || field === 'toCurrency') setQuote(undefined);
    setErrors((current) => current.filter((error) => error.field !== field));
    setResult(null);
    setCalculationError(null);
    setQuoteError(null);
  }

  async function requestQuote() {
    if (kind !== 'currency-converter') return;
    setQuoteError(null);
    setIsFetchingQuote(true);
    try {
      const nextQuote = await fetchEcbReferenceQuote(
        getValue(values, 'fromCurrency') as CurrencyInput['fromCurrency'],
        getValue(values, 'toCurrency') as CurrencyInput['toCurrency'],
      );
      setQuote(nextQuote);
      trackEvent('tool_completed', { toolId: tool.id });
    } catch (error) {
      setQuoteError(
        error instanceof Error ? error.message : 'The ECB quote could not be loaded. Enter a manual rate.',
      );
    } finally {
      setIsFetchingQuote(false);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setResult(null);
    setCalculationError(null);
    trackEvent('tool_started', { toolId: tool.id });
    try {
      const outcome = calculate(kind, values, quote);
      if (!outcome.success) {
        setErrors(outcome.errors);
        trackEvent('tool_validation_failed', {
          toolId: tool.id,
          errorCodes: outcome.errors.map((error) => error.code),
        });
        return;
      }
      setResult(outcome.result);
      trackEvent('tool_completed', { toolId: tool.id });
      trackEvent('result_generated', { toolId: tool.id });
      window.requestAnimationFrame(() => resultRef.current?.focus());
    } catch (error) {
      setCalculationError(
        error instanceof Error ? error.message : 'We could not safely calculate that input.',
      );
    }
  }

  const isCurrency = kind === 'currency-converter';
  return (
    <div className="calculator-layout">
      <section className="calculator-card" aria-labelledby="regulated-utility-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Controlled beta utility</p>
            <h2 id="regulated-utility-form-title">Enter your inputs</h2>
          </div>
          <span className="local-badge">{isCurrency ? 'Manual or explicit quote' : 'Runs locally'}</span>
        </div>
        <form onSubmit={submit} noValidate data-interactive={isInteractive ? 'true' : 'false'}>
          <ErrorSummary ref={errorSummaryRef} errors={errors} />
          <FormFields kind={kind} values={values} errors={errors} update={update} />
          {isCurrency ? (
            <div className="button-row">
              <Button type="button" variant="secondary" onClick={requestQuote} disabled={isFetchingQuote}>
                {isFetchingQuote ? 'Loading ECB quote…' : 'Fetch dated ECB reference quote'}
              </Button>
              <p className="field__help">
                This explicit action requests only a dated reference rate. A failed request never reuses an
                old quote silently.
              </p>
            </div>
          ) : null}
          {quoteError ? (
            <StateBlock title="Reference quote unavailable" tone="error">
              {`${quoteError} Manual conversion remains available.`}
            </StateBlock>
          ) : null}
          <Button type="submit">Calculate reference result</Button>
        </form>
        <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
      </section>
      <section
        className="calculator-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby="regulated-utility-result-title"
      >
        {calculationError ? (
          <StateBlock
            titleId="regulated-utility-result-title"
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
                <h2 id="regulated-utility-result-title">Reference result with assumptions</h2>
              </div>
              <span className="result-status">Complete</span>
            </div>
            <CommonPolicyNote result={result} />
            <ResultView kind={kind} result={result} />
            <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
          </>
        ) : (
          <StateBlock
            titleId="regulated-utility-result-title"
            title="Your result will appear here"
            tone="empty"
          >
            Complete the form to see the dated reference result, assumptions and limitations.
          </StateBlock>
        )}
      </section>
    </div>
  );
}
