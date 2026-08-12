'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  calculateWordCounter,
  type WordCounterInput,
  type WordCounterResult,
  validateWordCounterInput,
} from '@/domain/utilities/word-counter';
import {
  calculatePasswordToolkit,
  type PasswordToolkitInput,
  type PasswordToolkitResult,
  validatePasswordToolkitInput,
} from '@/domain/utilities/password';
import type { FieldError } from '@/domain/calculations/types';
import { formatIndianNumber } from '@/domain/formatting/indian';
import { trackEvent } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/ui/form-error';
import { CheckboxField, InputField, SelectField, TextareaField } from '@/components/ui/form-field';
import { ResultPanel } from '@/components/ui/result-panel';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';
import { focusResult, useLiveCalculation } from './use-live-calculation';

export type TextUtilityKind = 'word-counter' | 'password-toolkit';

interface TextUtilityFormProps {
  kind: TextUtilityKind;
  tool: { id: string; category: string; defaultValues: unknown; privacyNote: string };
}

type WordOrPasswordValues = Record<string, string | boolean>;

function getFieldError(errors: FieldError[], field: string) {
  return errors.find((error) => error.field === field)?.message;
}

function stringValue(values: WordOrPasswordValues, field: string) {
  return typeof values[field] === 'string' ? values[field] : '';
}

function boolValue(values: WordOrPasswordValues, field: string) {
  return values[field] === true;
}

export function TextUtilityForm({ kind, tool }: TextUtilityFormProps) {
  const initialValues = useMemo(
    () => (tool.defaultValues as WordOrPasswordValues) ?? {},
    [tool.defaultValues],
  );
  const [values, setValues] = useState<WordOrPasswordValues>(initialValues);
  const [isInteractive, setIsInteractive] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const {
    result: liveResult,
    errors,
    calculationError,
    isCalculating,
    clearFieldError,
    submit,
  } = useLiveCalculation<WordOrPasswordValues, WordCounterResult | PasswordToolkitResult>({
    values,
    validate: (input) => {
      if (kind === 'word-counter') {
        const validation = validateWordCounterInput(input as unknown as WordCounterInput);
        return validation.success ? { success: true as const, data: input } : validation;
      }
      const validation = validatePasswordToolkitInput(input as unknown as PasswordToolkitInput);
      return validation.success ? { success: true as const, data: input } : validation;
    },
    calculate: (input) =>
      kind === 'word-counter'
        ? calculateWordCounter(input as unknown as WordCounterInput)
        : calculatePasswordToolkit(input as unknown as PasswordToolkitInput),
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

  const wordResult = kind === 'word-counter' ? (liveResult as WordCounterResult | null) : null;
  const passwordResult = kind === 'password-toolkit' ? (liveResult as PasswordToolkitResult | null) : null;

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
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    trackEvent('tool_started', { toolId: tool.id });
    submit();
  }

  return (
    <div className="calculator-layout">
      <section className="calculator-card" aria-labelledby="text-utility-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Private browser utility</p>
            <h2 id="text-utility-form-title">Work locally</h2>
          </div>
          <span className="local-badge">No persistence</span>
        </div>
        <form onSubmit={onSubmit} noValidate data-interactive={isInteractive ? 'true' : 'false'}>
          <ErrorSummary ref={errorSummaryRef} errors={errors} />
          {kind === 'word-counter' ? (
            <TextareaField
              id="text"
              label="Text"
              help="The text stays in this page session and is not sent anywhere."
              value={stringValue(values, 'text')}
              onChange={(event) => updateValue('text', event.target.value)}
              error={getFieldError(errors, 'text')}
              rows={12}
            />
          ) : (
            <>
              <SelectField
                id="mode"
                label="Password action"
                value={stringValue(values, 'mode')}
                onChange={(event) => updateValue('mode', event.target.value)}
                error={getFieldError(errors, 'mode')}
              >
                <option value="generate">Generate a password</option>
                <option value="assess">Assess a password locally</option>
              </SelectField>
              {stringValue(values, 'mode') === 'generate' ? (
                <>
                  <InputField
                    id="length"
                    label="Length"
                    help="Use 8–128 characters. Generation requires Web Crypto."
                    value={stringValue(values, 'length')}
                    onChange={(event) => updateValue('length', event.target.value)}
                    error={getFieldError(errors, 'length')}
                    inputMode="numeric"
                    autoComplete="off"
                    required
                  />
                  <CheckboxField
                    id="includeLowercase"
                    label="Include lowercase letters"
                    checked={boolValue(values, 'includeLowercase')}
                    onChange={(event) => updateValue('includeLowercase', event.target.checked)}
                  />
                  <CheckboxField
                    id="includeUppercase"
                    label="Include uppercase letters"
                    checked={boolValue(values, 'includeUppercase')}
                    onChange={(event) => updateValue('includeUppercase', event.target.checked)}
                  />
                  <CheckboxField
                    id="includeNumbers"
                    label="Include numbers"
                    checked={boolValue(values, 'includeNumbers')}
                    onChange={(event) => updateValue('includeNumbers', event.target.checked)}
                  />
                  <CheckboxField
                    id="includeSymbols"
                    label="Include symbols"
                    checked={boolValue(values, 'includeSymbols')}
                    onChange={(event) => updateValue('includeSymbols', event.target.checked)}
                    error={getFieldError(errors, 'characterOptions')}
                  />
                </>
              ) : (
                <TextareaField
                  id="strengthInput"
                  label="Password to assess"
                  help="Assessment is local and the value is never copied, stored or sent to analytics."
                  value={stringValue(values, 'strengthInput')}
                  onChange={(event) => updateValue('strengthInput', event.target.value)}
                  error={getFieldError(errors, 'strengthInput')}
                  rows={3}
                  autoComplete="off"
                  required
                />
              )}
            </>
          )}
          {kind === 'password-toolkit' ? (
            <p className="field__help">Strength labels are estimates, not guaranteed crack times.</p>
          ) : null}
          {kind === 'word-counter' ? null : (
            <Button type="submit" fullWidth disabled={isCalculating}>
              {isCalculating ? 'Processing…' : 'Run locally'}
            </Button>
          )}
        </form>
      </section>
      <section
        className="calculator-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby="text-utility-result-title"
      >
        {calculationError ? (
          <StateBlock
            titleId="text-utility-result-title"
            title="We could not process that input"
            tone="error"
          >
            {calculationError}
          </StateBlock>
        ) : kind === 'word-counter' && wordResult ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Live count</p>
                <h2 id="text-utility-result-title">Text summary</h2>
              </div>
              <span className="result-status">Live · local</span>
            </div>
            <ResultPanel
              label="Words"
              value={formatIndianNumber(wordResult.words)}
              detail="Unicode-aware word-like segments"
            />
            <dl className="result-breakdown">
              <div>
                <dt>Characters</dt>
                <dd>{formatIndianNumber(wordResult.characters)}</dd>
              </div>
              <div>
                <dt>Without spaces</dt>
                <dd>{formatIndianNumber(wordResult.charactersWithoutSpaces)}</dd>
              </div>
              <div>
                <dt>Lines</dt>
                <dd>{formatIndianNumber(wordResult.lines)}</dd>
              </div>
              <div>
                <dt>Paragraphs</dt>
                <dd>{formatIndianNumber(wordResult.paragraphs)}</dd>
              </div>
            </dl>
            <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
          </>
        ) : kind === 'password-toolkit' && passwordResult ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Local assessment</p>
                <h2 id="text-utility-result-title">Password result</h2>
              </div>
              <span className="result-status">Live · not saved</span>
            </div>
            {passwordResult.password ? (
              <ResultPanel
                label="Generated password"
                value={passwordResult.password}
                detail="It is not copied or saved automatically. Store it only in a password manager you trust."
              />
            ) : null}
            <ResultPanel
              label="Estimated strength"
              value={passwordResult.label}
              detail={`Estimated entropy: ${passwordResult.entropyBits} bits`}
              tone={
                passwordResult.label === 'Very weak' || passwordResult.label === 'Weak'
                  ? 'negative'
                  : passwordResult.label === 'Moderate'
                    ? 'neutral'
                    : 'positive'
              }
            >
              <ul className="plain-list">
                {passwordResult.feedback.length ? (
                  passwordResult.feedback.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>No additional feedback for this estimate.</li>
                )}
              </ul>
            </ResultPanel>
            <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
          </>
        ) : (
          <StateBlock
            titleId="text-utility-result-title"
            title="Your local result will appear here"
            tone="empty"
          >
            {kind === 'word-counter'
              ? 'Start typing to see counts. Nothing is uploaded or saved.'
              : 'Choose an action and run it when you are ready. Nothing is sent away from this browser.'}
          </StateBlock>
        )}
      </section>
    </div>
  );
}
