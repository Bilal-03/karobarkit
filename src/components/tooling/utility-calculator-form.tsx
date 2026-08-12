'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  areaRegionOptions,
  areaUnitOptions,
  calculateArea,
  calculateBusinessDays,
  calculateDiscount,
  calculateFuelExpense,
  calculatePercentage,
  calculateVolumetricWeight,
  type AreaInput,
  type AreaResult,
  type BusinessDaysInput,
  type BusinessDaysResult,
  type DiscountInput,
  type DiscountResult,
  type FuelInput,
  type FuelResult,
  type PercentageInput,
  type PercentageResult,
  type VolumetricWeightInput,
  type VolumetricWeightResult,
  validateAreaInput,
  validateBusinessDaysInput,
  validateDiscountInput,
  validateFuelInput,
  validatePercentageInput,
  validateVolumetricWeightInput,
  versionedHolidayPresetLabels,
  weekendPatterns,
  holidayPresets,
} from '@/domain/calculations/utilities';
import type { FieldError } from '@/domain/calculations/types';
import { formatIndianCurrency, formatIndianNumber, formatPercentage } from '@/domain/formatting/indian';
import { trackEvent } from '@/lib/analytics';
import { saveLocalScenarioTransfer } from '@/domain/workflows/local-scenario-transfer';

import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/ui/form-error';
import { CheckboxField, InputField, SelectField, TextareaField } from '@/components/ui/form-field';
import { ResultPanel } from '@/components/ui/result-panel';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';
import { focusResult, useLiveCalculation } from './use-live-calculation';

export type UtilityCalculatorKind =
  'percentage' | 'discount' | 'area' | 'business-days' | 'fuel-expense' | 'volumetric-weight';

interface UtilityCalculatorFormProps {
  kind: UtilityCalculatorKind;
  tool: { id: string; name: string; category: string; defaultValues: unknown; privacyNote: string };
}

type UtilityValues = Record<string, string | boolean>;
type UtilityResult =
  PercentageResult | DiscountResult | AreaResult | BusinessDaysResult | FuelResult | VolumetricWeightResult;

function getFieldError(errors: FieldError[], field: string) {
  return errors.find((error) => error.field === field)?.message;
}

function valueAsString(values: UtilityValues, key: string) {
  const value = values[key];
  return typeof value === 'string' ? value : '';
}

function valueAsBoolean(values: UtilityValues, key: string) {
  return values[key] === true;
}

function validateUtility(kind: UtilityCalculatorKind, values: UtilityValues) {
  if (kind === 'percentage') {
    const input = values as unknown as PercentageInput;
    const validation = validatePercentageInput(input);
    return validation.success ? { success: true as const, data: values } : validation;
  }
  if (kind === 'discount') {
    const input = values as unknown as DiscountInput;
    const validation = validateDiscountInput(input);
    return validation.success ? { success: true as const, data: values } : validation;
  }
  if (kind === 'area') {
    const input = values as unknown as AreaInput;
    const validation = validateAreaInput(input);
    return validation.success ? { success: true as const, data: values } : validation;
  }
  if (kind === 'business-days') {
    const input = values as unknown as BusinessDaysInput;
    const validation = validateBusinessDaysInput(input);
    return validation.success ? { success: true as const, data: values } : validation;
  }
  if (kind === 'fuel-expense') {
    const input = values as unknown as FuelInput;
    const validation = validateFuelInput(input);
    return validation.success ? { success: true as const, data: values } : validation;
  }
  const input = values as unknown as VolumetricWeightInput;
  const validation = validateVolumetricWeightInput(input);
  return validation.success ? { success: true as const, data: values } : validation;
}

function calculateUtility(kind: UtilityCalculatorKind, values: UtilityValues): UtilityResult {
  if (kind === 'percentage') return calculatePercentage(values as unknown as PercentageInput);
  if (kind === 'discount') return calculateDiscount(values as unknown as DiscountInput);
  if (kind === 'area') return calculateArea(values as unknown as AreaInput);
  if (kind === 'business-days') return calculateBusinessDays(values as unknown as BusinessDaysInput);
  if (kind === 'fuel-expense') return calculateFuelExpense(values as unknown as FuelInput);
  return calculateVolumetricWeight(values as unknown as VolumetricWeightInput);
}

function UtilityResultView({ kind, result }: { kind: UtilityCalculatorKind; result: UtilityResult }) {
  if (kind === 'percentage') {
    const percentage = result as PercentageResult;
    return (
      <ResultPanel
        label={percentage.resultUnit === 'percentage' ? 'Percentage result' : 'Calculated value'}
        value={
          percentage.resultUnit === 'percentage'
            ? formatPercentage(percentage.result)
            : formatIndianNumber(percentage.result)
        }
        tone={
          percentage.direction === 'decrease'
            ? 'negative'
            : percentage.direction === 'flat'
              ? 'neutral'
              : 'positive'
        }
        detail={percentage.formula}
      />
    );
  }
  if (kind === 'discount') {
    const discount = result as DiscountResult;
    return (
      <ResultPanel
        label="Final price"
        value={formatIndianCurrency(discount.finalPrice)}
        detail="GST and other charges are not added automatically."
      >
        <dl className="result-breakdown">
          <div>
            <dt>Total savings</dt>
            <dd>{formatIndianCurrency(discount.totalSavings)}</dd>
          </div>
          <div>
            <dt>Effective discount</dt>
            <dd>{formatPercentage(discount.effectiveDiscountPercent)}</dd>
          </div>
          <div>
            <dt>First discount saving</dt>
            <dd>{formatIndianCurrency(discount.firstSavings)}</dd>
          </div>
          <div>
            <dt>Second discount saving</dt>
            <dd>{formatIndianCurrency(discount.secondSavings)}</dd>
          </div>
        </dl>
      </ResultPanel>
    );
  }
  if (kind === 'area') {
    const area = result as AreaResult;
    return (
      <ResultPanel
        label="Converted area"
        value={formatIndianNumber(area.convertedValue)}
        detail={`Factor: ${area.conversionFactor}`}
      >
        {area.regionalWarning ? <p className="field__help">{area.regionalWarning}</p> : null}
      </ResultPanel>
    );
  }
  if (kind === 'business-days') {
    const days = result as BusinessDaysResult;
    return (
      <ResultPanel
        label="Business days"
        value={formatIndianNumber(days.businessDays)}
        detail={`${days.calendarDays} calendar days reviewed`}
      >
        <dl className="result-breakdown">
          <div>
            <dt>Weekend exclusions</dt>
            <dd>{formatIndianNumber(days.weekendCount)}</dd>
          </div>
          <div>
            <dt>Holiday exclusions</dt>
            <dd>{formatIndianNumber(days.holidayCount)}</dd>
          </div>
          <div>
            <dt>Excluded dates</dt>
            <dd>
              {days.excludedDays.length
                ? days.excludedDays.map((item) => `${item.date} (${item.reason})`).join(', ')
                : 'None'}
            </dd>
          </div>
        </dl>
      </ResultPanel>
    );
  }
  if (kind === 'fuel-expense') {
    const fuel = result as FuelResult;
    return (
      <ResultPanel
        label="Customer or trip cost"
        value={formatIndianCurrency(fuel.customerCost)}
        detail={`Fuel cost before markup: ${formatIndianCurrency(fuel.fuelCost)}`}
      >
        <dl className="result-breakdown">
          <div>
            <dt>Fuel used</dt>
            <dd>{formatIndianNumber(fuel.litres, { decimals: 2 })} L</dd>
          </div>
          <div>
            <dt>Distance</dt>
            <dd>{formatIndianNumber(fuel.distanceKm, { decimals: 2 })} km</dd>
          </div>
          <div>
            <dt>Markup</dt>
            <dd>{formatPercentage(fuel.markupPercent)}</dd>
          </div>
        </dl>
      </ResultPanel>
    );
  }
  const volumetric = result as VolumetricWeightResult;
  return (
    <ResultPanel
      label="Chargeable weight"
      value={`${formatIndianNumber(volumetric.chargeableWeightKg, { decimals: 2 })} kg`}
      detail={`Uses ${volumetric.basis} weight`}
    >
      <dl className="result-breakdown">
        <div>
          <dt>Dimensional weight</dt>
          <dd>{formatIndianNumber(volumetric.dimensionalWeightKg, { decimals: 2 })} kg</dd>
        </div>
        <div>
          <dt>Actual weight</dt>
          <dd>{formatIndianNumber(volumetric.actualWeightKg, { decimals: 2 })} kg</dd>
        </div>
        <div>
          <dt>Divisor</dt>
          <dd>{volumetric.divisor}</dd>
        </div>
      </dl>
    </ResultPanel>
  );
}

export function UtilityCalculatorForm({ kind, tool }: UtilityCalculatorFormProps) {
  const router = useRouter();
  const initialValues = useMemo(() => (tool.defaultValues as UtilityValues) ?? {}, [tool.defaultValues]);
  const [values, setValues] = useState<UtilityValues>(initialValues);
  const [isInteractive, setIsInteractive] = useState(false);
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const { result, errors, calculationError, isCalculating, clearFieldError, submit } = useLiveCalculation<
    UtilityValues,
    UtilityResult
  >({
    values,
    debounceMs: kind === 'business-days' ? 80 : 0,
    validate: (input) => validateUtility(kind, input),
    calculate: (input) => calculateUtility(kind, input),
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
    trackEvent('tool_viewed', { toolId: tool.id, category: tool.category });
    return () => window.cancelAnimationFrame(frame);
  }, [tool.category, tool.id]);

  useEffect(() => {
    if (errors.length === 0) return;
    const frame = window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [errors]);

  function updateValue(field: string, value: string | boolean) {
    setValues((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
    setHandoffError(null);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    trackEvent('tool_started', { toolId: tool.id });
    submit();
  }

  const areaUsesRegion =
    (kind === 'area' && ['bigha', 'katha'].includes(valueAsString(values, 'fromUnit'))) ||
    (kind === 'area' && ['bigha', 'katha'].includes(valueAsString(values, 'toUnit')));

  function continueToRelatedTool() {
    if (!result) return;
    const transfer: {
      destination: string;
      sourceKind: string;
      values: Record<string, string>;
    } | null =
      kind === 'discount'
        ? {
            destination: '/tools/gst-calculator',
            sourceKind: 'discount-to-gst',
            values: { amount: (result as DiscountResult).finalPrice },
          }
        : kind === 'fuel-expense'
          ? {
              destination: '/tools/pricing-calculator',
              sourceKind: 'fuel-to-pricing',
              values: { unitCost: (result as FuelResult).customerCost },
            }
          : null;
    if (!transfer) return;
    const saved = saveLocalScenarioTransfer({
      sourceToolId: tool.id,
      sourceToolName: tool.name,
      sourceKind: transfer.sourceKind,
      values: transfer.values,
    });
    if (!saved) {
      setHandoffError(
        'This browser blocked the tab-only transfer. Enter the result in the next tool manually.',
      );
      return;
    }
    trackEvent('related_tool_opened', { toolId: tool.id });
    router.push(transfer.destination);
  }

  return (
    <div className="calculator-layout">
      <section className="calculator-card" aria-labelledby="utility-calculator-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Local utility</p>
            <h2 id="utility-calculator-form-title">Enter your inputs</h2>
          </div>
          <span className="local-badge">Runs locally</span>
        </div>
        <form onSubmit={onSubmit} noValidate data-interactive={isInteractive ? 'true' : 'false'}>
          <ErrorSummary ref={errorSummaryRef} errors={errors} />
          {kind === 'percentage' ? (
            <>
              <SelectField
                id="mode"
                label="What do you want to calculate?"
                value={valueAsString(values, 'mode')}
                onChange={(event) => updateValue('mode', event.target.value)}
                error={getFieldError(errors, 'mode')}
              >
                <option value="percentage-of">What is X% of a number?</option>
                <option value="what-percent">What percent is one value of another?</option>
                <option value="percentage-change">What is the percentage change?</option>
              </SelectField>
              <InputField
                id="base"
                label="Base value"
                value={valueAsString(values, 'base')}
                onChange={(event) => updateValue('base', event.target.value)}
                error={getFieldError(errors, 'base')}
                inputMode="decimal"
                autoComplete="off"
                required
              />
              {valueAsString(values, 'mode') === 'percentage-of' ? (
                <InputField
                  id="percentage"
                  label="Percentage"
                  value={valueAsString(values, 'percentage')}
                  onChange={(event) => updateValue('percentage', event.target.value)}
                  error={getFieldError(errors, 'percentage')}
                  inputMode="decimal"
                  autoComplete="off"
                  required
                />
              ) : (
                <InputField
                  id="value"
                  label="Comparison value"
                  value={valueAsString(values, 'value')}
                  onChange={(event) => updateValue('value', event.target.value)}
                  error={getFieldError(errors, 'value')}
                  inputMode="decimal"
                  autoComplete="off"
                  required
                />
              )}
            </>
          ) : null}
          {kind === 'discount' ? (
            <>
              <InputField
                id="originalPrice"
                label="Original price"
                value={valueAsString(values, 'originalPrice')}
                onChange={(event) => updateValue('originalPrice', event.target.value)}
                error={getFieldError(errors, 'originalPrice')}
                inputMode="decimal"
                autoComplete="off"
                required
              />
              <InputField
                id="firstDiscountPercent"
                label="First discount"
                help="Enter 0 to 100. This is applied first."
                value={valueAsString(values, 'firstDiscountPercent')}
                onChange={(event) => updateValue('firstDiscountPercent', event.target.value)}
                error={getFieldError(errors, 'firstDiscountPercent')}
                inputMode="decimal"
                autoComplete="off"
                required
              />
              <InputField
                id="secondDiscountPercent"
                label="Second discount (optional)"
                help="Applied to the already discounted price."
                value={valueAsString(values, 'secondDiscountPercent')}
                onChange={(event) => updateValue('secondDiscountPercent', event.target.value)}
                error={getFieldError(errors, 'secondDiscountPercent')}
                inputMode="decimal"
                autoComplete="off"
              />
            </>
          ) : null}
          {kind === 'area' ? (
            <>
              <InputField
                id="value"
                label="Area"
                value={valueAsString(values, 'value')}
                onChange={(event) => updateValue('value', event.target.value)}
                error={getFieldError(errors, 'value')}
                inputMode="decimal"
                autoComplete="off"
                required
              />
              <SelectField
                id="fromUnit"
                label="From unit"
                value={valueAsString(values, 'fromUnit')}
                onChange={(event) => updateValue('fromUnit', event.target.value)}
                error={getFieldError(errors, 'fromUnit')}
              >
                {areaUnitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
              <SelectField
                id="toUnit"
                label="To unit"
                value={valueAsString(values, 'toUnit')}
                onChange={(event) => updateValue('toUnit', event.target.value)}
                error={getFieldError(errors, 'toUnit')}
              >
                {areaUnitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
              {areaUsesRegion ? (
                <SelectField
                  id="region"
                  label="Regional definition"
                  help="Required for bigha and katha because these units vary by locality."
                  value={valueAsString(values, 'region')}
                  onChange={(event) => updateValue('region', event.target.value)}
                  error={getFieldError(errors, 'region')}
                >
                  {areaRegionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>
              ) : null}
            </>
          ) : null}
          {kind === 'business-days' ? (
            <>
              <InputField
                id="startDate"
                type="date"
                label="Start date"
                value={valueAsString(values, 'startDate')}
                onChange={(event) => updateValue('startDate', event.target.value)}
                error={getFieldError(errors, 'startDate')}
                required
              />
              <InputField
                id="endDate"
                type="date"
                label="End date"
                value={valueAsString(values, 'endDate')}
                onChange={(event) => updateValue('endDate', event.target.value)}
                error={getFieldError(errors, 'endDate')}
                required
              />
              <CheckboxField
                id="includeStart"
                label="Include the start date"
                checked={valueAsBoolean(values, 'includeStart')}
                onChange={(event) => updateValue('includeStart', event.target.checked)}
              />
              <CheckboxField
                id="includeEnd"
                label="Include the end date"
                checked={valueAsBoolean(values, 'includeEnd')}
                onChange={(event) => updateValue('includeEnd', event.target.checked)}
              />
              <SelectField
                id="weekendPattern"
                label="Weekend pattern"
                value={valueAsString(values, 'weekendPattern')}
                onChange={(event) => updateValue('weekendPattern', event.target.value)}
                error={getFieldError(errors, 'weekendPattern')}
              >
                {weekendPatterns.map((pattern) => (
                  <option key={pattern} value={pattern}>
                    {pattern === 'saturday-sunday'
                      ? 'Saturday and Sunday'
                      : pattern === 'sunday'
                        ? 'Sunday only'
                        : 'No weekends'}
                  </option>
                ))}
              </SelectField>
              <SelectField
                id="holidayPreset"
                label="Holiday preset"
                help="Presets are versioned references, not a universal regional calendar."
                value={valueAsString(values, 'holidayPreset')}
                onChange={(event) => updateValue('holidayPreset', event.target.value)}
                error={getFieldError(errors, 'holidayPreset')}
              >
                {holidayPresets.map((preset) => (
                  <option key={preset} value={preset}>
                    {versionedHolidayPresetLabels[preset]}
                  </option>
                ))}
              </SelectField>
              <TextareaField
                id="customHolidays"
                label="Additional holidays (optional)"
                help="Use YYYY-MM-DD, separated by commas or new lines."
                value={valueAsString(values, 'customHolidays')}
                onChange={(event) => updateValue('customHolidays', event.target.value)}
                error={getFieldError(errors, 'customHolidays')}
                rows={3}
              />
            </>
          ) : null}
          {kind === 'fuel-expense' ? (
            <>
              <InputField
                id="distance"
                label="Distance"
                value={valueAsString(values, 'distance')}
                onChange={(event) => updateValue('distance', event.target.value)}
                error={getFieldError(errors, 'distance')}
                inputMode="decimal"
                autoComplete="off"
                required
              />
              <SelectField
                id="distanceUnit"
                label="Distance unit"
                value={valueAsString(values, 'distanceUnit')}
                onChange={(event) => updateValue('distanceUnit', event.target.value)}
                error={getFieldError(errors, 'distanceUnit')}
              >
                <option value="km">Kilometres</option>
                <option value="mi">Miles</option>
              </SelectField>
              <InputField
                id="mileage"
                label="Mileage"
                value={valueAsString(values, 'mileage')}
                onChange={(event) => updateValue('mileage', event.target.value)}
                error={getFieldError(errors, 'mileage')}
                inputMode="decimal"
                autoComplete="off"
                required
              />
              <SelectField
                id="mileageUnit"
                label="Mileage unit"
                value={valueAsString(values, 'mileageUnit')}
                onChange={(event) => updateValue('mileageUnit', event.target.value)}
                error={getFieldError(errors, 'mileageUnit')}
              >
                <option value="km-per-litre">Kilometres per litre</option>
                <option value="miles-per-gallon">Miles per gallon</option>
              </SelectField>
              <InputField
                id="fuelPricePerLitre"
                label="Fuel price per litre"
                help="Enter the price yourself; no live price is fetched."
                value={valueAsString(values, 'fuelPricePerLitre')}
                onChange={(event) => updateValue('fuelPricePerLitre', event.target.value)}
                error={getFieldError(errors, 'fuelPricePerLitre')}
                inputMode="decimal"
                autoComplete="off"
                required
              />
              <InputField
                id="trips"
                label="Number of trips"
                value={valueAsString(values, 'trips')}
                onChange={(event) => updateValue('trips', event.target.value)}
                error={getFieldError(errors, 'trips')}
                inputMode="numeric"
                autoComplete="off"
                required
              />
              <InputField
                id="markupPercent"
                label="Optional markup"
                help="A declared customer or trip markup, not a mandated rate."
                value={valueAsString(values, 'markupPercent')}
                onChange={(event) => updateValue('markupPercent', event.target.value)}
                error={getFieldError(errors, 'markupPercent')}
                inputMode="decimal"
                autoComplete="off"
              />
            </>
          ) : null}
          {kind === 'volumetric-weight' ? (
            <>
              <InputField
                id="length"
                label="Length"
                value={valueAsString(values, 'length')}
                onChange={(event) => updateValue('length', event.target.value)}
                error={getFieldError(errors, 'length')}
                inputMode="decimal"
                autoComplete="off"
                required
              />
              <InputField
                id="width"
                label="Width"
                value={valueAsString(values, 'width')}
                onChange={(event) => updateValue('width', event.target.value)}
                error={getFieldError(errors, 'width')}
                inputMode="decimal"
                autoComplete="off"
                required
              />
              <InputField
                id="height"
                label="Height"
                value={valueAsString(values, 'height')}
                onChange={(event) => updateValue('height', event.target.value)}
                error={getFieldError(errors, 'height')}
                inputMode="decimal"
                autoComplete="off"
                required
              />
              <SelectField
                id="dimensionUnit"
                label="Dimension unit"
                value={valueAsString(values, 'dimensionUnit')}
                onChange={(event) => updateValue('dimensionUnit', event.target.value)}
                error={getFieldError(errors, 'dimensionUnit')}
              >
                <option value="cm">Centimetres</option>
                <option value="in">Inches</option>
              </SelectField>
              <InputField
                id="actualWeight"
                label="Actual weight"
                value={valueAsString(values, 'actualWeight')}
                onChange={(event) => updateValue('actualWeight', event.target.value)}
                error={getFieldError(errors, 'actualWeight')}
                inputMode="decimal"
                autoComplete="off"
                required
              />
              <SelectField
                id="actualWeightUnit"
                label="Actual weight unit"
                value={valueAsString(values, 'actualWeightUnit')}
                onChange={(event) => updateValue('actualWeightUnit', event.target.value)}
                error={getFieldError(errors, 'actualWeightUnit')}
              >
                <option value="kg">Kilograms</option>
                <option value="lb">Pounds</option>
              </SelectField>
              <InputField
                id="divisor"
                label="Carrier divisor"
                help="Use the divisor stated by your carrier; it is never assumed silently."
                value={valueAsString(values, 'divisor')}
                onChange={(event) => updateValue('divisor', event.target.value)}
                error={getFieldError(errors, 'divisor')}
                inputMode="decimal"
                autoComplete="off"
                required
              />
            </>
          ) : null}
          <Button type="submit" fullWidth disabled={isCalculating}>
            {isCalculating ? 'Calculating…' : 'Calculate result'}
          </Button>
        </form>
      </section>
      <section
        className="calculator-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby="utility-calculator-result-title"
      >
        {calculationError ? (
          <StateBlock
            titleId="utility-calculator-result-title"
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
                <h2 id="utility-calculator-result-title">A local answer with assumptions</h2>
              </div>
              <span className="result-status" aria-label="Live calculation complete">
                Live
              </span>
            </div>
            <UtilityResultView kind={kind} result={result} />
            {kind === 'discount' || kind === 'fuel-expense' ? (
              <div className="inline-actions scenario-actions">
                <Button type="button" variant="secondary" onClick={continueToRelatedTool}>
                  {kind === 'discount'
                    ? 'Continue final price to GST Calculator'
                    : 'Continue trip cost to Pricing Calculator'}
                </Button>
              </div>
            ) : null}
            {handoffError ? (
              <p className="field__error" role="alert">
                {handoffError}
              </p>
            ) : null}
            <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
          </>
        ) : (
          <StateBlock
            titleId="utility-calculator-result-title"
            title="Your result will appear here"
            tone="empty"
          >
            Complete the short form to see the calculation, breakdown and limitations. Nothing is sent away
            from this browser.
          </StateBlock>
        )}
      </section>
    </div>
  );
}
