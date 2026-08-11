'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { FieldError } from '@/domain/calculations/types';
import {
  calculateLeaveBalance,
  calculateNoticePeriod,
  type LeaveBalanceInput,
  type LeaveBalanceResult,
  type NoticePeriodInput,
  type NoticePeriodResult,
  validateLeaveBalanceInput,
  validateNoticePeriodInput,
} from '@/domain/documents/workplace';
import { formatIndianDate, formatIndianNumber } from '@/domain/formatting/indian';
import { trackEvent } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/ui/form-error';
import { CheckboxField, InputField, SelectField, TextareaField } from '@/components/ui/form-field';
import { ResultPanel } from '@/components/ui/result-panel';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';

export type WorkplaceCalculatorKind = 'notice-period' | 'leave-balance';

interface WorkplaceCalculatorToolProps {
  id: string;
  category: string;
  defaultValues: unknown;
  privacyNote: string;
}

type CalculatorValues = Record<string, unknown>;
type CalculatorResult = NoticePeriodResult | LeaveBalanceResult;

function getString(values: CalculatorValues, key: string) {
  const value = values[key];
  return typeof value === 'string' ? value : '';
}

function fieldError(errors: FieldError[], name: string) {
  return errors.find((error) => error.field === name)?.message;
}

function useToolView(tool: WorkplaceCalculatorToolProps) {
  const [interactive, setInteractive] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setInteractive(true));
    trackEvent('tool_viewed', { toolId: tool.id, category: tool.category });
    return () => window.cancelAnimationFrame(frame);
  }, [tool.category, tool.id]);
  return interactive;
}

function CalculatorFields({
  kind,
  values,
  errors,
  update,
}: {
  kind: WorkplaceCalculatorKind;
  values: CalculatorValues;
  errors: FieldError[];
  update: (name: string, value: unknown) => void;
}) {
  if (kind === 'notice-period') {
    return (
      <>
        <div className="form-grid form-grid--two">
          <InputField
            id="workplace-startDate"
            label="Start date"
            type="date"
            value={getString(values, 'startDate')}
            onChange={(event) => update('startDate', event.target.value)}
            error={fieldError(errors, 'startDate')}
            required
          />
          <InputField
            id="workplace-noticeDays"
            label="Notice days"
            type="number"
            min="0"
            step="1"
            value={getString(values, 'noticeDays')}
            onChange={(event) => update('noticeDays', event.target.value)}
            error={fieldError(errors, 'noticeDays')}
            required
          />
        </div>
        <SelectField
          id="workplace-rule"
          label="Counting rule"
          value={getString(values, 'rule')}
          onChange={(event) => update('rule', event.target.value)}
          error={fieldError(errors, 'rule')}
        >
          <option value="calendar">Calendar days</option>
          <option value="business-days">Business days</option>
        </SelectField>
        <CheckboxField
          id="workplace-includeStart"
          label="Include the start date in the count"
          checked={Boolean(values.includeStart)}
          onChange={(event) => update('includeStart', event.target.checked)}
        />
        <SelectField
          id="workplace-weekendPattern"
          label="Weekend rule"
          value={getString(values, 'weekendPattern')}
          onChange={(event) => update('weekendPattern', event.target.value)}
          error={fieldError(errors, 'weekendPattern')}
        >
          <option value="saturday-sunday">Saturday and Sunday excluded</option>
          <option value="sunday">Sunday excluded</option>
          <option value="none">No weekend exclusion</option>
        </SelectField>
        <TextareaField
          id="workplace-customHolidays"
          label="Custom holidays (optional)"
          value={getString(values, 'customHolidays')}
          onChange={(event) => update('customHolidays', event.target.value)}
          error={fieldError(errors, 'customHolidays')}
          rows={3}
          help="Use YYYY-MM-DD, separated by commas or spaces. These are user-declared exclusions."
        />
      </>
    );
  }
  return (
    <>
      <InputField
        id="workplace-annualQuota"
        label="Annual leave quota"
        type="number"
        min="0"
        step="0.01"
        value={getString(values, 'annualQuota')}
        onChange={(event) => update('annualQuota', event.target.value)}
        error={fieldError(errors, 'annualQuota')}
        required
      />
      <div className="form-grid form-grid--two">
        <InputField
          id="workplace-joiningDate"
          label="Joining date"
          type="date"
          value={getString(values, 'joiningDate')}
          onChange={(event) => update('joiningDate', event.target.value)}
          error={fieldError(errors, 'joiningDate')}
          required
        />
        <InputField
          id="workplace-asOfDate"
          label="As-of date"
          type="date"
          value={getString(values, 'asOfDate')}
          onChange={(event) => update('asOfDate', event.target.value)}
          error={fieldError(errors, 'asOfDate')}
          required
        />
      </div>
      <InputField
        id="workplace-usedLeave"
        label="Used leave"
        type="number"
        min="0"
        step="0.01"
        value={getString(values, 'usedLeave')}
        onChange={(event) => update('usedLeave', event.target.value)}
        error={fieldError(errors, 'usedLeave')}
        required
      />
      <SelectField
        id="workplace-proration"
        label="Proration policy"
        value={getString(values, 'proration')}
        onChange={(event) => update('proration', event.target.value)}
        error={fieldError(errors, 'proration')}
      >
        <option value="none">No proration</option>
        <option value="monthly">Monthly proration</option>
        <option value="days">Day-based proration</option>
      </SelectField>
    </>
  );
}

function resultTitle(kind: WorkplaceCalculatorKind) {
  return kind === 'notice-period' ? 'Notice-period estimate' : 'Leave-balance estimate';
}

export function WorkplaceCalculatorForm({
  kind,
  tool,
}: {
  kind: WorkplaceCalculatorKind;
  tool: WorkplaceCalculatorToolProps;
}) {
  const initialValues = useMemo(() => (tool.defaultValues as CalculatorValues) ?? {}, [tool.defaultValues]);
  const [values, setValues] = useState<CalculatorValues>(initialValues);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const isInteractive = useToolView(tool);
  const errorRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function update(name: string, value: unknown) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => current.filter((error) => error.field !== name));
    setResult(null);
    setCalculationError(null);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setResult(null);
    setCalculationError(null);
    trackEvent('tool_started', { toolId: tool.id });
    const validation =
      kind === 'notice-period'
        ? validateNoticePeriodInput(values as unknown as NoticePeriodInput)
        : validateLeaveBalanceInput(values as unknown as LeaveBalanceInput);
    if (!validation.success) {
      setErrors(validation.errors);
      trackEvent('tool_validation_failed', {
        toolId: tool.id,
        errorCodes: validation.errors.map((error) => error.code),
      });
      window.requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    try {
      const next =
        kind === 'notice-period'
          ? calculateNoticePeriod(validation.data as NoticePeriodInput)
          : calculateLeaveBalance(validation.data as LeaveBalanceInput);
      setResult(next);
      trackEvent('tool_completed', { toolId: tool.id });
      trackEvent('result_generated', { toolId: tool.id });
      window.requestAnimationFrame(() => resultRef.current?.focus());
    } catch (error) {
      setCalculationError(error instanceof Error ? error.message : 'We could not calculate this estimate.');
    }
  }

  const noticeResult = kind === 'notice-period' && result ? (result as NoticePeriodResult) : null;
  const leaveResult = kind === 'leave-balance' && result ? (result as LeaveBalanceResult) : null;

  return (
    <div className="calculator-layout">
      <section className="calculator-card" aria-labelledby="workplace-calculator-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Workplace calculator</p>
            <h2 id="workplace-calculator-form-title">{resultTitle(kind)}</h2>
          </div>
          <span className="local-badge">Runs locally</span>
        </div>
        <form onSubmit={submit} noValidate data-interactive={isInteractive ? 'true' : 'false'}>
          <ErrorSummary ref={errorRef} errors={errors} />
          <CalculatorFields kind={kind} values={values} errors={errors} update={update} />
          {calculationError ? (
            <StateBlock title="Check the entered values" tone="error">
              {calculationError}
            </StateBlock>
          ) : null}
          <div className="document-form__actions">
            <Button type="submit" fullWidth>
              {kind === 'notice-period' ? 'Calculate locally' : 'Calculate balance'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                setValues(initialValues);
                setErrors([]);
                setResult(null);
                setCalculationError(null);
              }}
            >
              Clear form
            </Button>
          </div>
        </form>
        <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
      </section>
      <section
        className="calculator-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby="workplace-calculator-result-title"
      >
        <div className="calculator-result__heading">
          <div>
            <p className="eyebrow">Transparent estimate</p>
            <h2 id="workplace-calculator-result-title">
              {result ? 'Result ready' : 'Your result will appear here'}
            </h2>
          </div>
          {result ? <span className="result-status">Local estimate</span> : null}
        </div>
        {noticeResult ? (
          <>
            <ResultPanel
              label="Estimated end date"
              value={formatIndianDate(noticeResult.endDate)}
              detail={`${noticeResult.businessDays} counted business days · ${noticeResult.calendarDays} calendar days`}
            />
            <dl className="result-breakdown">
              <div>
                <dt>Rule</dt>
                <dd>{noticeResult.rule === 'business-days' ? 'Business days' : 'Calendar days'}</dd>
              </div>
              <div>
                <dt>Start date</dt>
                <dd>{formatIndianDate(noticeResult.startDate)}</dd>
              </div>
              <div>
                <dt>Excluded days</dt>
                <dd>{noticeResult.excludedDays.length}</dd>
              </div>
            </dl>
            <StateBlock title="Policy reminder" tone="empty">
              This is an estimate under the selected rule. Contract wording and employer policy remain
              authoritative.
            </StateBlock>
          </>
        ) : null}
        {leaveResult ? (
          <>
            <ResultPanel
              label="Remaining leave"
              value={`${formatIndianNumber(leaveResult.remainingLeave)} days`}
              detail={`${formatIndianNumber(leaveResult.earnedLeave)} earned under the selected policy`}
            />
            <dl className="result-breakdown">
              <div>
                <dt>Annual quota</dt>
                <dd>{formatIndianNumber(leaveResult.annualQuota)} days</dd>
              </div>
              <div>
                <dt>Used leave</dt>
                <dd>{formatIndianNumber(leaveResult.usedLeave)} days</dd>
              </div>
              <div>
                <dt>As-of date</dt>
                <dd>{formatIndianDate(leaveResult.asOfDate)}</dd>
              </div>
            </dl>
            <StateBlock title="Policy reminder" tone="empty">
              This is a user-policy estimate. Check the employer leave ledger, carry-forward rules and
              approvals.
            </StateBlock>
          </>
        ) : null}
        {!result && !calculationError ? (
          <StateBlock title="No result yet" tone="empty">
            Complete the fields to see a local estimate with the selected policy made explicit.
          </StateBlock>
        ) : null}
      </section>
    </div>
  );
}
