'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { FieldError } from '@/domain/calculations/types';
import { DOCUMENT_ACCENTS } from '@/domain/documents/constants';
import {
  calculateQuotation,
  quotationDefaultItem,
  quotationDefaultValues,
  quotationToInvoiceTransferValues,
  type QuotationDocument,
  type QuotationInput,
  type QuotationLineInput,
  validateQuotationInput,
} from '@/domain/documents/quotation';
import { documentExportErrorMessage, downloadDocumentPdf, printDocument } from '@/lib/documents/export';
import { trackEvent } from '@/lib/analytics';
import { saveLocalScenarioTransfer } from '@/domain/workflows/local-scenario-transfer';

import { DocumentPreview } from './document-preview';
import { LogoUploader } from './logo-uploader';
import { Button } from '@/components/ui/button';
import { CheckboxField, InputField, SelectField, TextareaField } from '@/components/ui/form-field';
import { ErrorSummary } from '@/components/ui/form-error';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';

interface QuotationToolProps {
  id: string;
  category: string;
  defaultValues: unknown;
}

function cloneQuotationInput(value: unknown): QuotationInput {
  const source = (value as QuotationInput | undefined) ?? quotationDefaultValues;
  return { ...source, items: source.items.map((item) => ({ ...item })) };
}

function fieldError(errors: FieldError[], field: string) {
  return errors.find((error) => error.field === field)?.message;
}

function hasValues(values: QuotationInput) {
  return Boolean(
    values.businessName.trim() ||
    values.businessAddress.trim() ||
    values.quoteNumber.trim() ||
    values.customerName.trim() ||
    values.items.some((item) => item.description.trim() || item.unitPrice.trim()) ||
    values.logo,
  );
}

export function QuotationGeneratorForm({ tool }: { tool: QuotationToolProps }) {
  const initialValues = useMemo(() => cloneQuotationInput(tool.defaultValues), [tool.defaultValues]);
  const [values, setValues] = useState<QuotationInput>(initialValues);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [result, setResult] = useState<QuotationDocument | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const printTargetId = 'quotation-document-print-area';

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
    setHandoffError(null);
  }

  function updateValue(field: keyof QuotationInput, value: unknown) {
    setValues((current) => ({ ...current, [field]: value }) as QuotationInput);
    setErrors((current) => current.filter((error) => error.field !== field));
    clearResult();
  }

  function updateItem(index: number, field: keyof QuotationLineInput, value: string) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
    setErrors((current) => current.filter((error) => error.field !== `items.${index}.${field}`));
    clearResult();
  }

  function addItem() {
    setValues((current) => ({
      ...current,
      items: [...current.items, { ...quotationDefaultItem, id: `quote-item-${current.items.length + 1}` }],
    }));
    clearResult();
  }

  function removeItem(index: number) {
    if (values.items.length <= 1) return;
    setValues((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
    clearResult();
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    clearResult();
    trackEvent('tool_started', { toolId: tool.id });
    const validation = validateQuotationInput(values);
    if (!validation.success) {
      setErrors(validation.errors);
      trackEvent('tool_validation_failed', {
        toolId: tool.id,
        errorCodes: validation.errors.map((error) => error.code),
      });
      return;
    }
    try {
      const document = calculateQuotation(validation.data);
      setResult(document);
      trackEvent('tool_completed', { toolId: tool.id });
      trackEvent('result_generated', { toolId: tool.id });
      window.requestAnimationFrame(() => resultRef.current?.focus());
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'We could not prepare that quotation.');
    }
  }

  function resetForm() {
    if ((hasValues(values) || result) && !window.confirm('Clear the entered quotation details and preview?'))
      return;
    setValues(cloneQuotationInput(initialValues));
    setErrors([]);
    clearResult();
  }

  async function downloadPdf() {
    if (!result) return;
    setIsExporting(true);
    setExportError(null);
    setExportStatus('Preparing your quotation PDF locally…');
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
      setExportStatus('Print dialog opened. Choose A4 paper for the intended layout.');
    } catch (error) {
      setExportError(documentExportErrorMessage(error));
      setExportStatus(null);
    }
  }

  function continueToInvoice() {
    if (!result) return;
    const saved = saveLocalScenarioTransfer({
      sourceToolId: tool.id,
      sourceToolName: 'Quotation Generator',
      sourceKind: 'quotation-to-gst-invoice',
      values: quotationToInvoiceTransferValues(result),
    });
    if (!saved) {
      setHandoffError(
        'The local handoff could not be stored. Keep this preview open and enter the invoice details manually.',
      );
      return;
    }
    window.location.href = '/tools/gst-invoice-generator';
  }

  function continueToCommercialInvoice() {
    if (!result) return;
    const saved = saveLocalScenarioTransfer({
      sourceToolId: tool.id,
      sourceToolName: 'Quotation Generator',
      sourceKind: 'quotation-to-invoice',
      values: quotationToInvoiceTransferValues(result),
    });
    if (!saved) {
      setHandoffError(
        'The local handoff could not be stored. Keep this preview open and enter the invoice details manually.',
      );
      return;
    }
    window.location.href = '/tools/invoice-generator';
  }

  return (
    <div className="calculator-layout document-generator-layout quotation-generator-layout">
      <section className="calculator-card document-form-card" aria-labelledby="quotation-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Document generator</p>
            <h2 id="quotation-form-title">Create a quotation</h2>
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
                label="Phone number (optional)"
                value={values.phone}
                onChange={(event) => updateValue('phone', event.target.value)}
                error={fieldError(errors, 'phone')}
                inputMode="tel"
              />
              <InputField
                id="email"
                label="Email (optional)"
                value={values.email}
                onChange={(event) => updateValue('email', event.target.value)}
                error={fieldError(errors, 'email')}
                type="email"
              />
            </div>
            <InputField
              id="website"
              label="Website (optional)"
              value={values.website}
              onChange={(event) => updateValue('website', event.target.value)}
              error={fieldError(errors, 'website')}
              inputMode="url"
              help="HTTP and HTTPS only; the address is normalized locally."
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
                label="Tagline (optional)"
                value={values.tagline}
                onChange={(event) => updateValue('tagline', event.target.value)}
                error={fieldError(errors, 'tagline')}
              />
            </div>
            <LogoUploader logo={values.logo} onChange={(logo) => updateValue('logo', logo)} />
          </fieldset>
          <fieldset className="document-form-section">
            <legend>Quote details</legend>
            <div className="form-grid form-grid--two">
              <InputField
                id="quoteNumber"
                label="Quote number"
                value={values.quoteNumber}
                onChange={(event) => updateValue('quoteNumber', event.target.value)}
                error={fieldError(errors, 'quoteNumber')}
                required
              />
              <InputField
                id="quoteDate"
                label="Quote date"
                type="date"
                value={values.quoteDate}
                onChange={(event) => updateValue('quoteDate', event.target.value)}
                error={fieldError(errors, 'quoteDate')}
                required
              />
            </div>
            <InputField
              id="validUntil"
              label="Valid until (optional)"
              type="date"
              value={values.validUntil}
              onChange={(event) => updateValue('validUntil', event.target.value)}
              error={fieldError(errors, 'validUntil')}
            />
            <div className="form-grid form-grid--two">
              <InputField
                id="customerName"
                label="Customer name"
                value={values.customerName}
                onChange={(event) => updateValue('customerName', event.target.value)}
                error={fieldError(errors, 'customerName')}
                required
              />
              <InputField
                id="customerPhone"
                label="Customer phone (optional)"
                value={values.customerPhone}
                onChange={(event) => updateValue('customerPhone', event.target.value)}
                error={fieldError(errors, 'customerPhone')}
                inputMode="tel"
              />
            </div>
            <InputField
              id="customerEmail"
              label="Customer email (optional)"
              value={values.customerEmail}
              onChange={(event) => updateValue('customerEmail', event.target.value)}
              error={fieldError(errors, 'customerEmail')}
              type="email"
            />
            <TextareaField
              id="customerAddress"
              label="Customer address (optional)"
              value={values.customerAddress}
              onChange={(event) => updateValue('customerAddress', event.target.value)}
              error={fieldError(errors, 'customerAddress')}
              rows={3}
            />
          </fieldset>
          <fieldset className="document-form-section">
            <legend>Line items</legend>
            <p className="field__help">
              Quoted values are shown before GST or other statutory treatment. No product classification is
              performed.
            </p>
            <div className="invoice-editor-items">
              {values.items.map((item, index) => {
                const prefix = `items.${index}`;
                return (
                  <fieldset className="invoice-editor-item" key={item.id}>
                    <legend>Item {index + 1}</legend>
                    <TextareaField
                      id={`${prefix}.description`}
                      label="Description"
                      value={item.description}
                      onChange={(event) => updateItem(index, 'description', event.target.value)}
                      error={fieldError(errors, `${prefix}.description`)}
                      rows={2}
                      required
                    />
                    <div className="form-grid form-grid--three">
                      <InputField
                        id={`${prefix}.quantity`}
                        label="Quantity"
                        value={item.quantity}
                        onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                        error={fieldError(errors, `${prefix}.quantity`)}
                        inputMode="decimal"
                        required
                      />
                      <InputField
                        id={`${prefix}.unit`}
                        label="Unit (optional)"
                        value={item.unit}
                        onChange={(event) => updateItem(index, 'unit', event.target.value)}
                        error={fieldError(errors, `${prefix}.unit`)}
                      />
                      <InputField
                        id={`${prefix}.unitPrice`}
                        label="Unit price"
                        value={item.unitPrice}
                        onChange={(event) => updateItem(index, 'unitPrice', event.target.value)}
                        error={fieldError(errors, `${prefix}.unitPrice`)}
                        inputMode="decimal"
                        required
                      />
                    </div>
                    <div className="form-grid form-grid--two">
                      <SelectField
                        id={`${prefix}.discountType`}
                        label="Discount"
                        value={item.discountType}
                        onChange={(event) =>
                          updateItem(
                            index,
                            'discountType',
                            event.target.value as QuotationLineInput['discountType'],
                          )
                        }
                        error={fieldError(errors, `${prefix}.discountType`)}
                      >
                        <option value="none">None</option>
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed INR</option>
                      </SelectField>
                      {item.discountType !== 'none' ? (
                        <InputField
                          id={`${prefix}.discountValue`}
                          label={
                            item.discountType === 'percentage' ? 'Discount percentage' : 'Discount amount'
                          }
                          value={item.discountValue}
                          onChange={(event) => updateItem(index, 'discountValue', event.target.value)}
                          error={fieldError(errors, `${prefix}.discountValue`)}
                          inputMode="decimal"
                          required
                        />
                      ) : (
                        <span />
                      )}
                    </div>
                    <div className="invoice-item-actions">
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => removeItem(index)}
                        disabled={values.items.length <= 1}
                      >
                        Remove
                      </Button>
                    </div>
                  </fieldset>
                );
              })}
            </div>
            <Button type="button" variant="secondary" onClick={addItem} disabled={values.items.length >= 50}>
              Add item
            </Button>
          </fieldset>
          <fieldset className="document-form-section">
            <legend>Optional notes and style</legend>
            <div className="form-grid form-grid--two">
              <SelectField
                id="template"
                label="Layout"
                value={values.template}
                onChange={(event) =>
                  updateValue('template', event.target.value as QuotationInput['template'])
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
                onChange={(event) => updateValue('accent', event.target.value as QuotationInput['accent'])}
                error={fieldError(errors, 'accent')}
              >
                {DOCUMENT_ACCENTS.map((accent) => (
                  <option value={accent.value} key={accent.value}>
                    {accent.label}
                  </option>
                ))}
              </SelectField>
            </div>
            <TextareaField
              id="notes"
              label="Notes (optional)"
              value={values.notes}
              onChange={(event) => updateValue('notes', event.target.value)}
              error={fieldError(errors, 'notes')}
              rows={2}
            />
            <TextareaField
              id="terms"
              label="Terms (optional)"
              value={values.terms}
              onChange={(event) => updateValue('terms', event.target.value)}
              error={fieldError(errors, 'terms')}
              rows={3}
            />
            <div className="form-grid form-grid--two">
              <InputField
                id="signatoryName"
                label="Prepared by (optional)"
                value={values.signatoryName}
                onChange={(event) => updateValue('signatoryName', event.target.value)}
                error={fieldError(errors, 'signatoryName')}
              />
              <InputField
                id="signatoryDesignation"
                label="Designation (optional)"
                value={values.signatoryDesignation}
                onChange={(event) => updateValue('signatoryDesignation', event.target.value)}
                error={fieldError(errors, 'signatoryDesignation')}
              />
            </div>
            <CheckboxField
              id="signaturePlaceholder"
              label="Show signature line"
              checked={values.signaturePlaceholder}
              onChange={(event) => updateValue('signaturePlaceholder', event.target.checked)}
            />
          </fieldset>
          <div className="document-form__actions">
            <Button type="submit" fullWidth>
              Create quotation
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={resetForm}>
              Reset
            </Button>
          </div>
        </form>
        <PrivacyBlock>
          Business, customer, line-item and logo details stay in this browser. They are not uploaded, stored
          by default, sent in analytics or written to logs.
        </PrivacyBlock>
      </section>
      <section
        className="calculator-result document-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby="quotation-result-title"
      >
        {generationError ? (
          <StateBlock
            titleId="quotation-result-title"
            title="We could not create that quotation"
            tone="error"
          >
            {generationError}
          </StateBlock>
        ) : result ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Preview and export</p>
                <h2 id="quotation-result-title">Your quotation is ready</h2>
              </div>
              <span className="result-status">Ready · estimate</span>
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
            {handoffError ? (
              <p className="export-error" role="alert">
                {handoffError}
              </p>
            ) : null}
            <div className="inline-actions generator-actions">
              <Button type="button" onClick={downloadPdf} disabled={isExporting}>
                {isExporting ? 'Preparing PDF…' : 'Download PDF'}
              </Button>
              <Button type="button" variant="secondary" onClick={printPreview}>
                Print
              </Button>
              <Button type="button" variant="secondary" onClick={continueToCommercialInvoice}>
                Continue to invoice
              </Button>
              <Button type="button" variant="secondary" onClick={continueToInvoice}>
                Continue to GST invoice
              </Button>
            </div>
            <p className="document-export-help">
              The handoff copies selected quote fields into the GST invoice form in this tab’s session
              storage. Review all parties, dates, classifications, rates and tax choices before issue.
            </p>
            <PrivacyBlock>
              This quotation is generated locally. It is an estimate, not a tax invoice or payment
              confirmation.
            </PrivacyBlock>
          </>
        ) : (
          <StateBlock
            titleId="quotation-result-title"
            title="Your A4 quotation preview will appear here"
            tone="empty"
          >
            Complete the required business, customer, date and line-item fields to create a local quotation.
          </StateBlock>
        )}
      </section>
    </div>
  );
}
