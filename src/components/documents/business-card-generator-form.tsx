'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { FieldError } from '@/domain/calculations/types';
import { DOCUMENT_ACCENTS } from '@/domain/documents/constants';
import {
  businessCardDefaultValues,
  calculateBusinessCard,
  type BusinessCardDocument,
  type BusinessCardInput,
  validateBusinessCardInput,
} from '@/domain/documents/business-card';
import { documentExportErrorMessage, downloadDocumentPdf, printDocument } from '@/lib/documents/export';
import { trackEvent } from '@/lib/analytics';

import { DocumentPreview } from './document-preview';
import { LogoUploader } from './logo-uploader';
import { Button } from '@/components/ui/button';
import { InputField, SelectField, TextareaField } from '@/components/ui/form-field';
import { ErrorSummary } from '@/components/ui/form-error';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';

interface BusinessCardToolProps {
  id: string;
  category: string;
  defaultValues: unknown;
}

function fieldError(errors: FieldError[], field: string) {
  return errors.find((error) => error.field === field)?.message;
}
function cloneInput(value: unknown): BusinessCardInput {
  return { ...((value as BusinessCardInput | undefined) ?? businessCardDefaultValues) };
}
function hasValues(values: BusinessCardInput) {
  return Boolean(
    values.businessName.trim() || values.businessAddress.trim() || values.personName.trim() || values.logo,
  );
}

export function BusinessCardGeneratorForm({ tool }: { tool: BusinessCardToolProps }) {
  const initialValues = useMemo(() => cloneInput(tool.defaultValues), [tool.defaultValues]);
  const [values, setValues] = useState<BusinessCardInput>(initialValues);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [result, setResult] = useState<BusinessCardDocument | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const printTargetId = 'business-card-document-print-area';

  useEffect(() => {
    trackEvent('tool_viewed', { toolId: tool.id, category: tool.category });
  }, [tool.category, tool.id]);
  useEffect(() => {
    if (!errors.length) return;
    const frame = window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [errors]);

  function clearResult() {
    setResult(null);
    setGenerationError(null);
    setExportError(null);
    setExportStatus(null);
  }
  function updateValue(field: keyof BusinessCardInput, value: unknown) {
    setValues((current) => ({ ...current, [field]: value }) as BusinessCardInput);
    setErrors((current) => current.filter((error) => error.field !== field));
    clearResult();
  }
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    clearResult();
    trackEvent('tool_started', { toolId: tool.id });
    const validation = validateBusinessCardInput(values);
    if (!validation.success) {
      setErrors(validation.errors);
      trackEvent('tool_validation_failed', {
        toolId: tool.id,
        errorCodes: validation.errors.map((error) => error.code),
      });
      return;
    }
    try {
      const next = calculateBusinessCard(validation.data);
      setResult(next);
      trackEvent('tool_completed', { toolId: tool.id });
      trackEvent('result_generated', { toolId: tool.id });
      window.requestAnimationFrame(() => resultRef.current?.focus());
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'We could not prepare that business card.');
    }
  }
  function resetForm() {
    if ((hasValues(values) || result) && !window.confirm('Clear the entered card details and preview?'))
      return;
    setValues(cloneInput(initialValues));
    setErrors([]);
    clearResult();
  }
  async function downloadPdf() {
    if (!result) return;
    setIsExporting(true);
    setExportError(null);
    setExportStatus('Preparing your business card PDF locally…');
    try {
      await downloadDocumentPdf(result);
      trackEvent('result_downloaded', { toolId: tool.id, format: 'pdf' });
      setExportStatus('PDF download started.');
    } catch (error) {
      setExportError(documentExportErrorMessage(error));
      setExportStatus(null);
    } finally {
      setIsExporting(false);
    }
  }
  function printPreview() {
    try {
      printDocument(printTargetId);
      trackEvent('result_printed', { toolId: tool.id, pageSize: 'a4' });
      setExportError(null);
      setExportStatus('Print dialog opened. Check paper size and trimming.');
    } catch (error) {
      setExportError(documentExportErrorMessage(error));
      setExportStatus(null);
    }
  }

  return (
    <div className="calculator-layout document-generator-layout business-card-generator-layout">
      <section className="calculator-card document-form-card" aria-labelledby="business-card-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Asset generator</p>
            <h2 id="business-card-form-title">Create a business card</h2>
          </div>
          <span className="local-badge">Runs locally</span>
        </div>
        <form onSubmit={onSubmit} noValidate>
          <ErrorSummary ref={errorSummaryRef} errors={errors} />
          <fieldset className="document-form-section">
            <legend>Business identity</legend>
            <InputField
              id="businessName"
              label="Business name"
              value={values.businessName}
              onChange={(event) => updateValue('businessName', event.target.value)}
              error={fieldError(errors, 'businessName')}
              autoComplete="organization"
              required
            />
            <TextareaField
              id="businessAddress"
              label="Business address"
              value={values.businessAddress}
              onChange={(event) => updateValue('businessAddress', event.target.value)}
              error={fieldError(errors, 'businessAddress')}
              rows={3}
              required
            />
            <div className="form-grid form-grid--two">
              <InputField
                id="phone"
                label="Business phone (optional)"
                value={values.phone}
                onChange={(event) => updateValue('phone', event.target.value)}
                error={fieldError(errors, 'phone')}
                inputMode="tel"
              />
              <InputField
                id="email"
                label="Business email (optional)"
                value={values.email}
                onChange={(event) => updateValue('email', event.target.value)}
                error={fieldError(errors, 'email')}
                type="email"
              />
            </div>
            <InputField
              id="website"
              label="Business website (optional)"
              value={values.website}
              onChange={(event) => updateValue('website', event.target.value)}
              error={fieldError(errors, 'website')}
              inputMode="url"
            />
            <div className="form-grid form-grid--two">
              <InputField
                id="gstin"
                label="GSTIN (optional)"
                value={values.gstin}
                onChange={(event) => updateValue('gstin', event.target.value)}
                error={fieldError(errors, 'gstin')}
                help="Displayed as entered; not verified."
              />
              <InputField
                id="tagline"
                label="Business tagline (optional)"
                value={values.tagline}
                onChange={(event) => updateValue('tagline', event.target.value)}
                error={fieldError(errors, 'tagline')}
              />
            </div>
            <LogoUploader logo={values.logo} onChange={(logo) => updateValue('logo', logo)} />
          </fieldset>
          <fieldset className="document-form-section">
            <legend>Card details</legend>
            <InputField
              id="personName"
              label="Person name"
              value={values.personName}
              onChange={(event) => updateValue('personName', event.target.value)}
              error={fieldError(errors, 'personName')}
              autoComplete="name"
              required
            />
            <InputField
              id="designation"
              label="Designation (optional)"
              value={values.designation}
              onChange={(event) => updateValue('designation', event.target.value)}
              error={fieldError(errors, 'designation')}
            />
            <div className="form-grid form-grid--two">
              <InputField
                id="cardPhone"
                label="Card phone (optional)"
                value={values.cardPhone}
                onChange={(event) => updateValue('cardPhone', event.target.value)}
                error={fieldError(errors, 'cardPhone')}
                inputMode="tel"
              />
              <InputField
                id="cardEmail"
                label="Card email (optional)"
                value={values.cardEmail}
                onChange={(event) => updateValue('cardEmail', event.target.value)}
                error={fieldError(errors, 'cardEmail')}
                type="email"
              />
            </div>
            <InputField
              id="cardWebsite"
              label="Card website (optional)"
              value={values.cardWebsite}
              onChange={(event) => updateValue('cardWebsite', event.target.value)}
              error={fieldError(errors, 'cardWebsite')}
              inputMode="url"
            />
            <TextareaField
              id="cardAddress"
              label="Card address (optional)"
              value={values.cardAddress}
              onChange={(event) => updateValue('cardAddress', event.target.value)}
              error={fieldError(errors, 'cardAddress')}
              rows={2}
            />
            <InputField
              id="cardTagline"
              label="Personal tagline (optional)"
              value={values.cardTagline}
              onChange={(event) => updateValue('cardTagline', event.target.value)}
              error={fieldError(errors, 'cardTagline')}
            />
            <TextareaField
              id="cardNote"
              label="Back-of-card note (optional)"
              value={values.cardNote}
              onChange={(event) => updateValue('cardNote', event.target.value)}
              error={fieldError(errors, 'cardNote')}
              rows={3}
            />
          </fieldset>
          <fieldset className="document-form-section">
            <legend>Style</legend>
            <div className="form-grid form-grid--two">
              <SelectField
                id="template"
                label="Layout"
                value={values.template}
                onChange={(event) =>
                  updateValue('template', event.target.value as BusinessCardInput['template'])
                }
                error={fieldError(errors, 'template')}
              >
                <option value="editorial">Editorial edge</option>
                <option value="formal">Formal frame</option>
              </SelectField>
              <SelectField
                id="accent"
                label="Accent"
                value={values.accent}
                onChange={(event) => updateValue('accent', event.target.value as BusinessCardInput['accent'])}
                error={fieldError(errors, 'accent')}
              >
                {DOCUMENT_ACCENTS.map((accent) => (
                  <option value={accent.value} key={accent.value}>
                    {accent.label}
                  </option>
                ))}
              </SelectField>
            </div>
          </fieldset>
          <div className="document-form__actions">
            <Button type="submit" fullWidth>
              Create business card
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={resetForm}>
              Reset
            </Button>
          </div>
        </form>
        <PrivacyBlock>
          Business, person, contact and logo details stay in this browser. They are not uploaded, stored by
          default, sent in analytics or written to logs.
        </PrivacyBlock>
      </section>
      <section
        className="calculator-result document-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby="business-card-result-title"
      >
        {generationError ? (
          <StateBlock titleId="business-card-result-title" title="We could not create that card" tone="error">
            {generationError}
          </StateBlock>
        ) : result ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Preview and export</p>
                <h2 id="business-card-result-title">Your business card is ready</h2>
              </div>
              <span className="result-status">Ready · proof</span>
            </div>
            <DocumentPreview document={result} targetId={printTargetId} />
            {exportStatus ? (
              <p className="export-status" role="status">
                {exportStatus}
              </p>
            ) : null}
            {exportError ? (
              <p className="export-error" role="alert">
                {exportError}
              </p>
            ) : null}
            <div className="inline-actions generator-actions">
              <Button type="button" onClick={downloadPdf} disabled={isExporting}>
                {isExporting ? 'Preparing PDF…' : 'Download PDF'}
              </Button>
              <Button type="button" variant="secondary" onClick={printPreview}>
                Print proof
              </Button>
            </div>
            <p className="document-export-help">
              The output is an A4 proof sheet. Check printer alignment, stock and trimming before production.
            </p>
            <PrivacyBlock>
              This card is generated locally and details are displayed exactly as entered.
            </PrivacyBlock>
          </>
        ) : (
          <StateBlock
            titleId="business-card-result-title"
            title="Your A4 card proof will appear here"
            tone="empty"
          >
            Complete the business and person fields to create a local proof sheet.
          </StateBlock>
        )}
      </section>
    </div>
  );
}
