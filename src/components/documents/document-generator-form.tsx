'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { FieldError } from '@/domain/calculations/types';
import { DOCUMENT_ACCENTS } from '@/domain/documents/constants';
import {
  calculateLetterhead,
  letterheadDefaultValues,
  validateLetterheadInput,
} from '@/domain/documents/letterhead';
import {
  calculatePaymentReceipt,
  paymentMethodOptions,
  paymentReceiptDefaultValues,
  validatePaymentReceiptInput,
} from '@/domain/documents/payment-receipt';
import type { BusinessDocument, LetterheadInput, PaymentReceiptInput } from '@/domain/documents/types';
import { documentExportErrorMessage, downloadDocumentPdf, printDocument } from '@/lib/documents/export';
import { trackEvent } from '@/lib/analytics';
import {
  clearLocalScenarioTransfer,
  readLocalScenarioTransfer,
  type LocalScenarioTransfer,
} from '@/domain/workflows/local-scenario-transfer';

import { DocumentPreview } from '@/components/documents/document-preview';
import { LogoUploader } from '@/components/documents/logo-uploader';
import { Button } from '@/components/ui/button';
import { CheckboxField, InputField, SelectField, TextareaField } from '@/components/ui/form-field';
import { ErrorSummary } from '@/components/ui/form-error';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';
import { useLiveCalculation } from '@/components/tooling/use-live-calculation';

type DocumentKind = 'letterhead' | 'payment-receipt';
type DocumentInput = LetterheadInput | PaymentReceiptInput;

interface DocumentToolProps {
  id: string;
  category: string;
  defaultValues: unknown;
}

function fieldError(errors: FieldError[], field: string) {
  return errors.find((error) => error.field === field)?.message;
}

function getInitialValues(kind: DocumentKind, value: unknown): DocumentInput {
  if (kind === 'letterhead') return (value as LetterheadInput) ?? letterheadDefaultValues;
  return (value as PaymentReceiptInput) ?? paymentReceiptDefaultValues;
}

export function DocumentGeneratorForm({ kind, tool }: { kind: DocumentKind; tool: DocumentToolProps }) {
  const isLetterhead = kind === 'letterhead';
  const initialValues = useMemo(() => getInitialValues(kind, tool.defaultValues), [kind, tool.defaultValues]);
  const [values, setValues] = useState<DocumentInput>(initialValues);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const [handoffTransfer, setHandoffTransfer] = useState<LocalScenarioTransfer | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const printTargetId = `${kind}-document-print-area`;
  const { result, errors, calculationError, clearFieldError, clearErrors, submit } = useLiveCalculation<
    DocumentInput,
    BusinessDocument
  >({
    values,
    validate: (input) => {
      const validation = isLetterhead
        ? validateLetterheadInput(input as LetterheadInput)
        : validatePaymentReceiptInput(input as PaymentReceiptInput);
      return validation.success ? { success: true as const, data: input } : validation;
    },
    calculate: (input) =>
      isLetterhead
        ? calculateLetterhead(input as LetterheadInput)
        : calculatePaymentReceipt(input as PaymentReceiptInput),
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
    if (!isLetterhead) {
      const timer = window.setTimeout(() => {
        const transfer = readLocalScenarioTransfer();
        if (
          transfer?.sourceKind === 'gst-invoice-to-payment-receipt' ||
          transfer?.sourceKind === 'invoice-to-payment-receipt'
        )
          setHandoffTransfer(transfer);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [isLetterhead]);

  useEffect(() => {
    if (errors.length === 0) return;
    const frame = window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [errors]);

  function updateValue(field: string, value: unknown) {
    setValues((current) => ({ ...current, [field]: value }) as DocumentInput);
    clearFieldError(field);
    setExportError(null);
    setExportStatus(null);
  }

  function importReceiptHandoff() {
    if (!handoffTransfer || isLetterhead) return;
    const incoming = handoffTransfer.values;
    setValues(
      (current) =>
        ({
          ...current,
          businessName: incoming.businessName || current.businessName,
          businessAddress: incoming.businessAddress || current.businessAddress,
          phone: incoming.phone || current.phone,
          email: incoming.email || current.email,
          gstin: incoming.gstin || current.gstin,
          receiptNumber: incoming.receiptNumber || (current as PaymentReceiptInput).receiptNumber,
          receiptDate: incoming.receiptDate || (current as PaymentReceiptInput).receiptDate,
          receivedFrom: incoming.receivedFrom || (current as PaymentReceiptInput).receivedFrom,
          amount: incoming.amount || (current as PaymentReceiptInput).amount,
          paymentPurpose: incoming.paymentPurpose || (current as PaymentReceiptInput).paymentPurpose,
          invoiceReference: incoming.invoiceReference || (current as PaymentReceiptInput).invoiceReference,
          customerAddress: incoming.customerAddress || (current as PaymentReceiptInput).customerAddress,
        }) as DocumentInput,
    );
    clearErrors();
    setHandoffTransfer(null);
    clearLocalScenarioTransfer();
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setExportError(null);
    setExportStatus(null);
    trackEvent('tool_started', { toolId: tool.id });
    submit();
  }

  function resetForm() {
    const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);
    if (isDirty && !window.confirm('Clear the entered details and preview?')) return;
    setValues(initialValues);
    clearErrors();
    setExportError(null);
    setExportStatus(null);
  }

  async function downloadPdf() {
    if (!result) return;
    setIsExporting(true);
    setExportError(null);
    setExportStatus('Preparing your PDF locally…');
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

  const title = isLetterhead ? 'Letterhead generator' : 'Payment receipt generator';
  const resultTitle = isLetterhead ? 'Your letterhead is ready' : 'Your payment receipt is ready';

  return (
    <div className="calculator-layout document-generator-layout">
      <section className="calculator-card document-form-card" aria-labelledby="document-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Document generator</p>
            <h2 id="document-form-title">Create a {isLetterhead ? 'letterhead' : 'receipt'}</h2>
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
          {handoffTransfer && !isLetterhead ? (
            <div className="local-handoff-banner" role="status">
              <strong>An invoice is ready for a receipt draft</strong>
              <p>
                Import selected invoice and issuer fields into this tab, then confirm the declared payment
                details.
              </p>
              <div className="inline-actions">
                <Button type="button" onClick={importReceiptHandoff}>
                  Import invoice details
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    clearLocalScenarioTransfer();
                    setHandoffTransfer(null);
                  }}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ) : null}
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
                autoComplete="tel"
              />
              <InputField
                id="email"
                label="Email (optional)"
                value={values.email}
                onChange={(event) => updateValue('email', event.target.value)}
                error={fieldError(errors, 'email')}
                type="email"
                autoComplete="email"
              />
            </div>
            <InputField
              id="website"
              label="Website (optional)"
              value={values.website}
              onChange={(event) => updateValue('website', event.target.value)}
              error={fieldError(errors, 'website')}
              inputMode="url"
              autoComplete="url"
              help="HTTP and HTTPS only. A bare domain is safely normalized to HTTPS."
            />
            <div className="form-grid form-grid--two">
              <InputField
                id="tagline"
                label="Tagline (optional)"
                value={values.tagline}
                onChange={(event) => updateValue('tagline', event.target.value)}
                error={fieldError(errors, 'tagline')}
              />
              <InputField
                id="additionalContact"
                label="Additional contact line (optional)"
                value={values.additionalContact}
                onChange={(event) => updateValue('additionalContact', event.target.value)}
                error={fieldError(errors, 'additionalContact')}
              />
            </div>
            <LogoUploader logo={values.logo} onChange={(logo) => updateValue('logo', logo)} />
            <div className="form-grid form-grid--three">
              <InputField
                id="gstin"
                label="GSTIN (optional)"
                value={values.gstin}
                onChange={(event) => updateValue('gstin', event.target.value)}
                error={fieldError(errors, 'gstin')}
                help="Displayed as entered; not verified."
              />
              <InputField
                id="cin"
                label="CIN (optional)"
                value={values.cin}
                onChange={(event) => updateValue('cin', event.target.value)}
                error={fieldError(errors, 'cin')}
                help="Displayed as entered; not verified."
              />
              <InputField
                id="registrationNumber"
                label="Registration no. (optional)"
                value={values.registrationNumber}
                onChange={(event) => updateValue('registrationNumber', event.target.value)}
                error={fieldError(errors, 'registrationNumber')}
                help="Displayed as entered; not verified."
              />
            </div>
          </fieldset>

          <fieldset className="document-form-section">
            <legend>Document style</legend>
            <div className="form-grid form-grid--two">
              <SelectField
                id="template"
                label="Layout"
                value={values.template}
                onChange={(event) => updateValue('template', event.target.value as DocumentInput['template'])}
                error={fieldError(errors, 'template')}
              >
                <option value="editorial">Editorial edge</option>
                <option value="formal">Formal frame</option>
              </SelectField>
              <SelectField
                id="accent"
                label="Accent"
                value={values.accent}
                onChange={(event) => updateValue('accent', event.target.value as DocumentInput['accent'])}
                error={fieldError(errors, 'accent')}
              >
                {DOCUMENT_ACCENTS.map((accent) => (
                  <option value={accent.value} key={accent.value}>
                    {accent.label}
                  </option>
                ))}
              </SelectField>
              <SelectField
                id="logoAlignment"
                label="Logo alignment"
                value={values.logoAlignment}
                onChange={(event) =>
                  updateValue('logoAlignment', event.target.value as DocumentInput['logoAlignment'])
                }
                error={fieldError(errors, 'logoAlignment')}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </SelectField>
            </div>
            <div className="form-grid form-grid--two">
              <CheckboxField
                id="headerDivider"
                label="Show header divider"
                checked={values.headerDivider}
                onChange={(event) => updateValue('headerDivider', event.target.checked)}
              />
              <CheckboxField
                id="footerDivider"
                label="Show footer divider"
                checked={values.footerDivider}
                onChange={(event) => updateValue('footerDivider', event.target.checked)}
              />
            </div>
          </fieldset>

          {isLetterhead ? (
            <fieldset className="document-form-section">
              <legend>Letter content</legend>
              <InputField
                id="letterDate"
                label="Letter date (optional)"
                type="date"
                value={(values as LetterheadInput).letterDate}
                onChange={(event) => updateValue('letterDate', event.target.value)}
                error={fieldError(errors, 'letterDate')}
              />
              <div className="form-grid form-grid--two">
                <InputField
                  id="recipientName"
                  label="Recipient name (optional)"
                  value={(values as LetterheadInput).recipientName}
                  onChange={(event) => updateValue('recipientName', event.target.value)}
                  error={fieldError(errors, 'recipientName')}
                />
                <InputField
                  id="subject"
                  label="Subject (optional)"
                  value={(values as LetterheadInput).subject}
                  onChange={(event) => updateValue('subject', event.target.value)}
                  error={fieldError(errors, 'subject')}
                />
              </div>
              <TextareaField
                id="recipientAddress"
                label="Recipient address (optional)"
                value={(values as LetterheadInput).recipientAddress}
                onChange={(event) => updateValue('recipientAddress', event.target.value)}
                error={fieldError(errors, 'recipientAddress')}
                rows={3}
              />
              <TextareaField
                id="body"
                label="Letter body (optional)"
                value={(values as LetterheadInput).body}
                onChange={(event) => updateValue('body', event.target.value)}
                error={fieldError(errors, 'body')}
                rows={9}
                maxLength={12000}
                help="Plain text only. Paragraphs are preserved and long letters continue onto additional A4 pages."
              />
              <div className="form-grid form-grid--two">
                <InputField
                  id="signatoryName"
                  label="Signatory name (optional)"
                  value={(values as LetterheadInput).signatoryName}
                  onChange={(event) => updateValue('signatoryName', event.target.value)}
                  error={fieldError(errors, 'signatoryName')}
                />
                <InputField
                  id="signatoryDesignation"
                  label="Signatory designation (optional)"
                  value={(values as LetterheadInput).signatoryDesignation}
                  onChange={(event) => updateValue('signatoryDesignation', event.target.value)}
                  error={fieldError(errors, 'signatoryDesignation')}
                />
              </div>
              <CheckboxField
                id="signaturePlaceholder"
                label="Leave a signature line"
                checked={(values as LetterheadInput).signaturePlaceholder}
                onChange={(event) => updateValue('signaturePlaceholder', event.target.checked)}
              />
            </fieldset>
          ) : (
            <fieldset className="document-form-section">
              <legend>Payment details</legend>
              <div className="form-grid form-grid--two">
                <InputField
                  id="receiptNumber"
                  label="Receipt number"
                  value={(values as PaymentReceiptInput).receiptNumber}
                  onChange={(event) => updateValue('receiptNumber', event.target.value)}
                  error={fieldError(errors, 'receiptNumber')}
                  required
                  help="Letters, numbers, spaces, hyphens and slashes only. It need not be globally unique."
                />
                <InputField
                  id="receiptDate"
                  label="Receipt date"
                  type="date"
                  value={(values as PaymentReceiptInput).receiptDate}
                  onChange={(event) => updateValue('receiptDate', event.target.value)}
                  error={fieldError(errors, 'receiptDate')}
                  required
                />
              </div>
              <InputField
                id="receivedFrom"
                label="Received from"
                value={(values as PaymentReceiptInput).receivedFrom}
                onChange={(event) => updateValue('receivedFrom', event.target.value)}
                error={fieldError(errors, 'receivedFrom')}
                required
              />
              <InputField
                id="amount"
                label="Amount received"
                value={(values as PaymentReceiptInput).amount}
                onChange={(event) => updateValue('amount', event.target.value)}
                error={fieldError(errors, 'amount')}
                required
                inputMode="decimal"
                help="Positive INR amount, up to two decimal places. Maximum supported value: ₹99,99,99,99,99,99,999.99."
              />
              <TextareaField
                id="paymentPurpose"
                label="Payment purpose"
                value={(values as PaymentReceiptInput).paymentPurpose}
                onChange={(event) => updateValue('paymentPurpose', event.target.value)}
                error={fieldError(errors, 'paymentPurpose')}
                rows={3}
                required
              />
              <div className="form-grid form-grid--two">
                <SelectField
                  id="paymentMethod"
                  label="Payment method (optional)"
                  value={(values as PaymentReceiptInput).paymentMethod}
                  onChange={(event) =>
                    updateValue('paymentMethod', event.target.value as PaymentReceiptInput['paymentMethod'])
                  }
                  error={fieldError(errors, 'paymentMethod')}
                >
                  <option value="">Choose a method</option>
                  {paymentMethodOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>
                <InputField
                  id="transactionReference"
                  label="Transaction reference (optional)"
                  value={(values as PaymentReceiptInput).transactionReference}
                  onChange={(event) => updateValue('transactionReference', event.target.value)}
                  error={fieldError(errors, 'transactionReference')}
                />
              </div>
              <TextareaField
                id="customerAddress"
                label="Customer address (optional)"
                value={(values as PaymentReceiptInput).customerAddress}
                onChange={(event) => updateValue('customerAddress', event.target.value)}
                error={fieldError(errors, 'customerAddress')}
                rows={3}
              />
              <div className="form-grid form-grid--two">
                <InputField
                  id="invoiceReference"
                  label="Invoice reference (optional)"
                  value={(values as PaymentReceiptInput).invoiceReference}
                  onChange={(event) => updateValue('invoiceReference', event.target.value)}
                  error={fieldError(errors, 'invoiceReference')}
                />
                <InputField
                  id="signatoryName"
                  label="Signatory name (optional)"
                  value={(values as PaymentReceiptInput).signatoryName}
                  onChange={(event) => updateValue('signatoryName', event.target.value)}
                  error={fieldError(errors, 'signatoryName')}
                />
              </div>
              <InputField
                id="signatoryDesignation"
                label="Signatory designation (optional)"
                value={(values as PaymentReceiptInput).signatoryDesignation}
                onChange={(event) => updateValue('signatoryDesignation', event.target.value)}
                error={fieldError(errors, 'signatoryDesignation')}
              />
              <TextareaField
                id="paymentNote"
                label="Payment note (optional)"
                value={(values as PaymentReceiptInput).paymentNote}
                onChange={(event) => updateValue('paymentNote', event.target.value)}
                error={fieldError(errors, 'paymentNote')}
                rows={3}
              />
              <CheckboxField
                id="signaturePlaceholder"
                label="Leave a signature line"
                checked={(values as PaymentReceiptInput).signaturePlaceholder}
                onChange={(event) => updateValue('signaturePlaceholder', event.target.checked)}
              />
            </fieldset>
          )}

          <TextareaField
            id="footerText"
            label="Footer text (optional)"
            value={values.footerText}
            onChange={(event) => updateValue('footerText', event.target.value)}
            error={fieldError(errors, 'footerText')}
            rows={2}
            help="Keep it short for clean A4 printing."
          />
          <div className="document-form__actions">
            <Button type="submit" fullWidth>{`Create ${isLetterhead ? 'letterhead' : 'receipt'}`}</Button>
            <Button type="button" variant="secondary" fullWidth onClick={resetForm}>
              Reset
            </Button>
          </div>
        </form>
        <PrivacyBlock>
          Business details, document text and logos stay in this browser. Nothing is sent to a server, saved
          by default or included in analytics.
        </PrivacyBlock>
      </section>

      <section
        className="calculator-result document-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby="document-result-title"
      >
        {calculationError ? (
          <StateBlock
            titleId="document-result-title"
            title={`We could not create that ${isLetterhead ? 'letterhead' : 'receipt'}`}
            tone="error"
          >
            {calculationError}
          </StateBlock>
        ) : result ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Preview and export</p>
                <h2 id="document-result-title">{resultTitle}</h2>
              </div>
              <span className="result-status">Live · ready</span>
            </div>
            <DocumentPreview document={result} targetId={printTargetId} />
            {exportStatus ? (
              <p className="export-status" role="status" aria-live="polite">
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
                Print
              </Button>
            </div>
            <p className="document-export-help">
              The preview and print layout use A4 proportions. For browser PDF settings, choose A4 and enable
              background graphics if available.
            </p>
            <PrivacyBlock>
              This document is generated in your browser. It is not stored on KarobarKit servers or included
              in analytics.
            </PrivacyBlock>
          </>
        ) : (
          <StateBlock titleId="document-result-title" title="Your A4 preview will appear here" tone="empty">
            {`Complete the ${title.toLowerCase()} form to create a printable document. You can review every field before exporting.`}
          </StateBlock>
        )}
      </section>
    </div>
  );
}
