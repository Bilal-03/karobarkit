'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  assistantFieldConfigs,
  validateAssistantInput,
  type AIAssistantInput,
  type AIAssistantKind,
  type AIAssistantResult,
  type AssistantMetric,
  type AssistantFieldConfig,
} from '@/domain/ai';
import { formatIndianCurrency, formatIndianNumber, formatPercentage } from '@/domain/formatting/indian';
import type { FieldError } from '@/domain/calculations/types';
import { trackEvent } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import { CheckboxField, InputField, SelectField, TextareaField } from '@/components/ui/form-field';
import { ErrorSummary } from '@/components/ui/form-error';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';
import { focusResult } from './use-live-calculation';

interface AIAssistantFormProps {
  kind: AIAssistantKind;
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

function formatMetric(metric: AssistantMetric) {
  if (metric.format === 'currency') return formatIndianCurrency(metric.value);
  if (metric.format === 'percentage') return formatPercentage(metric.value);
  if (metric.format === 'number') return formatIndianNumber(metric.value, { decimals: 2 });
  return metric.value;
}

function draftText(result: AIAssistantResult) {
  const sections = result.sections.flatMap((section) => [`${section.heading}:`, section.body]);
  const suggestions =
    result.suggestions.length > 0 ? ['Suggestions:', ...result.suggestions.map((item) => `- ${item}`)] : [];
  return [result.title, result.summary, ...suggestions, ...sections].join('\n\n');
}

function providerLabel(result: AIAssistantResult) {
  return result.provider === 'deterministic-fallback'
    ? 'Deterministic fallback draft'
    : `AI-generated draft via ${result.provider}`;
}

function reviewedExportText(kind: AIAssistantKind, result: AIAssistantResult, text: string) {
  const metrics = result.metrics.length
    ? [
        'Deterministic metrics:',
        ...result.metrics.map((metric) => `${metric.label}: ${formatMetric(metric)}`),
      ]
    : [];
  const warnings = result.warnings.length
    ? ['Review boundaries:', ...result.warnings.map((warning) => `- ${warning}`)]
    : [];
  return [
    `KarobarKit ${kind} — ${providerLabel(result)}`,
    `Prompt version: ${result.promptVersion}`,
    'This artifact is a review-required planning draft, not professional advice.',
    ...metrics,
    ...warnings,
    '',
    'Draft:',
    text,
  ].join('\n');
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function renderField(
  field: AssistantFieldConfig,
  values: AIAssistantInput,
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
    return <TextareaField key={field.name} {...common} rows={4} />;
  }

  return <InputField key={field.name} {...common} type="text" autoComplete="off" />;
}

function downloadDraft(kind: AIAssistantKind, result: AIAssistantResult, text: string) {
  const rows = [
    ['KarobarKit AI assistant draft', kind],
    ['Provider mode', result.provider],
    ['Prompt version', result.promptVersion],
    ['Review status', 'User confirmed review before export'],
    ['Draft disclaimer', 'Planning draft only; verify assumptions and claims independently.'],
    [],
    ['Draft', ''],
    ...text.split('\n').map((line) => [line, '']),
    [],
    ['Deterministic metric', 'Value'],
    ...result.metrics.map((item) => [item.label, formatMetric(item)]),
    [],
    ['Warnings', ''],
    ...result.warnings.map((warning) => [warning, '']),
  ];
  const csv = rows.map((row) => row.map((cell) => escapeCsv(String(cell))).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${kind}-draft.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AIAssistantForm({ kind, tool }: AIAssistantFormProps) {
  const fields = assistantFieldConfigs[kind];
  const initialValues = useMemo(
    () =>
      (tool.defaultValues as AIAssistantInput) ??
      Object.fromEntries(fields.map((field) => [field.name, field.defaultValue])),
    [fields, tool.defaultValues],
  );
  const [values, setValues] = useState<AIAssistantInput>(initialValues);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [result, setResult] = useState<AIAssistantResult | null>(null);
  const [editableDraft, setEditableDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [providerNotice, setProviderNotice] = useState('Checking the configured provider…');
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackEvent('tool_viewed', { toolId: tool.id, category: tool.category });
  }, [tool.category, tool.id]);

  useEffect(() => {
    let active = true;
    void fetch('/api/ai/status', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('status unavailable');
        return (await response.json()) as {
          mode?: string;
          providers?: Array<{ provider: string; model: string }>;
        };
      })
      .then((status) => {
        if (!active) return;
        if (status.mode === 'deterministic-fallback') {
          setProviderNotice(
            'No provider key is configured; requests use the deterministic local fallback and are not sent to Gemini or Groq.',
          );
          return;
        }
        const names = (status.providers ?? []).map((provider) => `${provider.provider} (${provider.model})`);
        setProviderNotice(
          `This deployment may send the listed fields to ${names.join(' or ')} through the server gateway. Provider retention and usage terms apply.`,
        );
      })
      .catch(() => {
        if (active)
          setProviderNotice(
            'This deployment uses a server gateway. Do not enter confidential, identity, payment or credential data.',
          );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (errors.length === 0) return;
    const frame = window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [errors]);

  function updateValue(field: string, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => current.filter((error) => error.field !== field));
    setRequestError(null);
    setActionStatus(null);
  }

  async function generateDraft() {
    setIsGenerating(true);
    setRequestError(null);
    setActionStatus(null);
    trackEvent('tool_started', { toolId: tool.id });
    try {
      const response = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assistant: kind, input: values, consent: true }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        result?: AIAssistantResult;
        error?: string;
        fieldErrors?: FieldError[];
      };
      if (!response.ok || !body.ok || !body.result) {
        if (body.fieldErrors) setErrors(body.fieldErrors);
        throw new Error(body.error || 'The assistant could not generate a draft.');
      }
      setResult(body.result);
      setEditableDraft(draftText(body.result));
      setReviewed(false);
      setIsEditing(false);
      setActionStatus(null);
      window.requestAnimationFrame(() => focusResult(resultRef.current));
      trackEvent('tool_completed', { toolId: tool.id });
      trackEvent('result_generated', { toolId: tool.id });
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'The assistant could not generate a draft.');
    } finally {
      setIsGenerating(false);
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setRequestError(null);
    if (!consent) {
      setConsentError('Confirm the data-use notice before sending a request.');
      return;
    }
    setConsentError(null);
    const validation = validateAssistantInput(kind, values);
    if (!validation.success) {
      setErrors(validation.errors);
      trackEvent('tool_validation_failed', {
        toolId: tool.id,
        errorCodes: validation.errors.map((error) => error.code),
      });
      return;
    }
    void generateDraft();
  }

  async function copyDraft() {
    if (!result || !reviewed) return;
    const exportText = reviewedExportText(kind, result, editableDraft);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(exportText);
    } else {
      const helper = document.createElement('textarea');
      helper.value = exportText;
      helper.setAttribute('readonly', 'true');
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      helper.remove();
    }
    setActionStatus('Reviewed draft copied.');
    trackEvent('result_copied', { toolId: tool.id });
  }

  function exportDraft() {
    if (!result || !reviewed) return;
    downloadDraft(kind, result, editableDraft);
    setActionStatus('Reviewed draft downloaded.');
    trackEvent('result_downloaded', { toolId: tool.id });
  }

  const fieldLabels = fields.map((field) => field.label).join(', ');

  return (
    <div className="calculator-layout ai-assistant-layout">
      <section className="calculator-card" aria-labelledby="ai-assistant-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Phase 6 AI beta</p>
            <h2 id="ai-assistant-form-title">Build a private, reviewable brief</h2>
          </div>
          <span className="local-badge">Server gateway</span>
        </div>
        <div className="notice notice--muted" role="note">
          <strong>Before you generate</strong>
          <p>
            With consent, these fields are sent to the server gateway: {fieldLabels}. Known contact and tax-ID
            patterns are redacted; confidential financial identifiers and credentials are rejected.{' '}
            {providerNotice} Review provider data controls before sharing sensitive business context:{' '}
            <a href="https://ai.google.dev/gemini-api/docs/zdr" target="_blank" rel="noreferrer">
              Gemini data controls
            </a>{' '}
            and{' '}
            <a href="https://console.groq.com/docs/your-data" target="_blank" rel="noreferrer">
              Groq data controls
            </a>
            .
          </p>
        </div>
        <form onSubmit={onSubmit} noValidate>
          <ErrorSummary ref={errorSummaryRef} errors={errors} />
          {fields.map((field) => renderField(field, values, errors, updateValue))}
          <CheckboxField
            id="ai-consent"
            label="I understand the disclosed fields may be processed by the configured AI provider, and I will review the draft before using it."
            checked={consent}
            onChange={(event) => {
              setConsent(event.target.checked);
              setConsentError(null);
            }}
            error={consentError ?? undefined}
          />
          <Button type="submit" fullWidth disabled={isGenerating}>
            {isGenerating ? 'Generating draft…' : result ? 'Generate again' : 'Generate draft'}
          </Button>
        </form>
        <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
      </section>

      <section
        className="calculator-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby="ai-assistant-result-title"
      >
        {requestError ? (
          <StateBlock
            titleId="ai-assistant-result-title"
            title="The draft could not be generated"
            tone="error"
          >
            {requestError}
          </StateBlock>
        ) : result ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">{providerLabel(result)}</p>
                <h2 id="ai-assistant-result-title">{result.title}</h2>
              </div>
              <span className="result-status">
                {result.provider === 'deterministic-fallback' ? 'Fallback' : result.provider}
              </span>
            </div>
            <div className="notice notice--muted" role="status">
              <strong>Review before use</strong>
              <p>
                This wording is a draft. Numbers shown below come from deterministic local arithmetic where
                applicable; the provider never owns those calculations.
              </p>
            </div>
            <p className="ai-assistant-summary">{result.summary}</p>
            {result.metrics.length > 0 ? (
              <dl className="result-breakdown">
                {result.metrics.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{formatMetric(item)}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {result.suggestions.length > 0 ? (
              <div className="content-card">
                <h3>Suggestions</h3>
                <ul className="plain-list">
                  {result.suggestions.map((suggestion) => (
                    <li key={suggestion}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="content-card ai-assistant-draft">
              <div className="calculator-result__heading">
                <h3>Editable draft</h3>
                <Button type="button" variant="ghost" onClick={() => setIsEditing((current) => !current)}>
                  {isEditing ? 'Preview draft' : 'Edit draft'}
                </Button>
              </div>
              {isEditing ? (
                <TextareaField
                  id="editable-draft"
                  label="Draft text"
                  value={editableDraft}
                  onChange={(event) => {
                    setEditableDraft(event.target.value);
                    setReviewed(false);
                  }}
                  help="You can edit this text locally. Changes are not sent back to the provider."
                  rows={14}
                />
              ) : (
                <pre className="ai-assistant-draft__preview">{editableDraft}</pre>
              )}
            </div>
            {result.warnings.length > 0 ? (
              <div className="warning-block" role="note">
                <strong>Review boundaries</strong>
                <ul className="plain-list">
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <CheckboxField
              id="draft-reviewed"
              label="I reviewed this draft and its assumptions; unlock copy and CSV export."
              checked={reviewed}
              onChange={(event) => setReviewed(event.target.checked)}
            />
            <div className="inline-actions">
              <Button type="button" variant="secondary" onClick={() => void copyDraft()} disabled={!reviewed}>
                Copy reviewed draft
              </Button>
              <Button type="button" variant="ghost" onClick={exportDraft} disabled={!reviewed}>
                Download CSV
              </Button>
            </div>
            {actionStatus ? (
              <p className="field__help" role="status">
                {actionStatus}
              </p>
            ) : null}
            <p className="last-reviewed">
              Prompt version {result.promptVersion} · Fields redacted:{' '}
              {result.redactedFields.length || 'none'}
            </p>
          </>
        ) : (
          <StateBlock titleId="ai-assistant-result-title" title="Your draft will appear here">
            Complete the brief, accept the data-use notice and generate a first draft. You can edit it before
            any export.
          </StateBlock>
        )}
      </section>
    </div>
  );
}
