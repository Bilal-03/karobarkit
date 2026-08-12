'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { FieldError } from '@/domain/calculations/types';
import { DOCUMENT_ACCENTS } from '@/domain/documents/constants';
import {
  calculateInvoice,
  invoiceDefaultValues,
  type InvoiceDocument,
  type InvoiceInput,
  validateInvoiceInput,
} from '@/domain/documents/invoice';
import type { QuotationLineInput } from '@/domain/documents/types';
import { documentExportErrorMessage, downloadDocumentPdf, printDocument } from '@/lib/documents/export';
import { trackEvent } from '@/lib/analytics';
import {
  clearLocalScenarioTransfer,
  readLocalScenarioTransfer,
  saveLocalScenarioTransfer,
  type LocalScenarioTransfer,
} from '@/domain/workflows/local-scenario-transfer';

import { DocumentPreview } from './document-preview';
import { LogoUploader } from './logo-uploader';
import { Button } from '@/components/ui/button';
import { CheckboxField, InputField, SelectField, TextareaField } from '@/components/ui/form-field';
import { ErrorSummary } from '@/components/ui/form-error';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';
import { focusResult, useLiveCalculation } from '@/components/tooling/use-live-calculation';

interface InvoiceToolProps {
  id: string;
  category: string;
  defaultValues: unknown;
}

function cloneInvoiceInput(value: unknown): InvoiceInput {
  const source = (value as InvoiceInput | undefined) ?? invoiceDefaultValues;
  return { ...source, items: source.items.map((item) => ({ ...item })) };
}

function fieldError(errors: FieldError[], field: string) {
  return errors.find((error) => error.field === field)?.message;
}

function importQuotationValues(transfer: LocalScenarioTransfer, current: InvoiceInput): InvoiceInput {
  const incoming = transfer.values;
  let items = current.items;
  try {
    const parsed = JSON.parse(incoming.itemsJson ?? '[]') as Array<Record<string, string>>;
    const imported = parsed.slice(0, 50).map(
      (item, index) =>
        ({
          id: `quote-import-${index + 1}`,
          description: item.description ?? '',
          quantity: item.quantity ?? '1',
          unit: item.unit ?? 'unit',
          unitPrice: item.unitPrice ?? '',
          discountType:
            item.discountType === 'percentage' || item.discountType === 'fixed' ? item.discountType : 'none',
          discountValue: item.discountValue ?? '',
        }) satisfies QuotationLineInput,
    );
    if (imported.length) items = imported;
  } catch {
    // Keep the destination's starter row when the tab handoff is malformed.
  }
  return {
    ...current,
    invoiceNumber: incoming.invoiceNumber || current.invoiceNumber,
    invoiceDate: incoming.invoiceDate || current.invoiceDate,
    businessName: incoming.supplierLegalName || current.businessName,
    businessAddress: incoming.supplierAddress || current.businessAddress,
    phone: incoming.supplierPhone || current.phone,
    email: incoming.supplierEmail || current.email,
    gstin: incoming.supplierGstin || current.gstin,
    customerName: incoming.recipientName || current.customerName,
    customerAddress: incoming.recipientAddress || current.customerAddress,
    customerPhone: incoming.recipientPhone || current.customerPhone,
    customerEmail: incoming.recipientEmail || current.customerEmail,
    items,
  };
}

export function InvoiceGeneratorForm({ tool }: { tool: InvoiceToolProps }) {
  const router = useRouter();
  const initialValues = useMemo(() => cloneInvoiceInput(tool.defaultValues), [tool.defaultValues]);
  const [values, setValues] = useState<InvoiceInput>(initialValues);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const [quotationTransfer, setQuotationTransfer] = useState<LocalScenarioTransfer | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const printTargetId = 'invoice-document-print-area';
  const { result, errors, calculationError, clearFieldError, clearErrors, submit } = useLiveCalculation<
    InvoiceInput,
    InvoiceDocument
  >({
    values,
    validate: (input) => {
      const validation = validateInvoiceInput(input);
      return validation.success ? { success: true as const, data: input } : validation;
    },
    calculate: (input) => calculateInvoice(input),
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
    const timer = window.setTimeout(() => {
      const transfer = readLocalScenarioTransfer();
      if (transfer?.sourceKind === 'quotation-to-invoice') setQuotationTransfer(transfer);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!errors.length) return;
    const frame = window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [errors]);

  function clearResult() {
    setExportError(null);
    setExportStatus(null);
    setHandoffError(null);
  }

  function updateValue(field: keyof InvoiceInput, value: unknown) {
    setValues((current) => ({ ...current, [field]: value }) as InvoiceInput);
    clearFieldError(String(field));
    clearResult();
  }

  function updateItem(index: number, field: keyof QuotationLineInput, value: string) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
    clearFieldError(`items.${index}.${field}`);
    clearResult();
  }

  function addItem() {
    setValues((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          id: `invoice-item-${current.items.length + 1}`,
          description: '',
          quantity: '1',
          unit: 'unit',
          unitPrice: '',
          discountType: 'none',
          discountValue: '',
        },
      ],
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
    clearResult();
    trackEvent('tool_started', { toolId: tool.id });
    submit();
  }

  function resetForm() {
    const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);
    if (isDirty && !window.confirm('Clear the entered invoice details and preview?')) return;
    setValues(cloneInvoiceInput(initialValues));
    clearErrors();
    clearResult();
  }

  function importQuotation() {
    if (!quotationTransfer) return;
    setValues((current) => importQuotationValues(quotationTransfer, current));
    clearLocalScenarioTransfer();
    setQuotationTransfer(null);
    clearErrors();
    clearResult();
  }

  async function downloadPdf() {
    if (!result) return;
    setIsExporting(true);
    setExportError(null);
    setExportStatus('Preparing your invoice PDF locally…');
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

  function continueToReceipt() {
    if (!result) return;
    const saved = saveLocalScenarioTransfer({
      sourceToolId: tool.id,
      sourceToolName: 'Invoice Generator',
      sourceKind: 'invoice-to-payment-receipt',
      values: {
        receiptNumber: result.metadata.number,
        receiptDate: result.metadata.date,
        receivedFrom: result.recipient.name,
        amount: result.totals.subtotal,
        paymentPurpose: `Payment against invoice ${result.metadata.number}`,
        invoiceReference: result.metadata.number,
        customerAddress: result.recipient.address.text,
        businessName: result.identity.name,
        businessAddress: result.identity.address.text,
        phone: result.identity.contact.phone,
        email: result.identity.contact.email,
        gstin: result.identity.gstin,
      },
    });
    if (!saved) {
      setHandoffError('The receipt handoff could not be stored. Enter the receipt details manually.');
      return;
    }
    router.push('/tools/payment-receipt-generator');
  }

  function continueToUpi() {
    if (!result) return;
    const saved = saveLocalScenarioTransfer({
      sourceToolId: tool.id,
      sourceToolName: 'Invoice Generator',
      sourceKind: 'invoice-to-upi',
      values: { amount: result.totals.subtotal, note: `Invoice ${result.metadata.number}` },
    });
    if (!saved) {
      setHandoffError('The UPI handoff could not be stored. Enter the amount and note manually.');
      return;
    }
    router.push('/tools/upi-standee');
  }

  return (
    <div className="calculator-layout document-generator-layout invoice-generator-layout">
      <section className="calculator-card document-form-card" aria-labelledby="invoice-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Document generator</p>
            <h2 id="invoice-form-title">Create a commercial invoice draft</h2>
          </div>
          <span className="local-badge">Runs locally</span>
        </div>
        <form onSubmit={onSubmit} noValidate data-interactive={isInteractive ? 'true' : 'false'}>
          <ErrorSummary ref={errorSummaryRef} errors={errors} />
          {quotationTransfer ? (
            <div className="local-handoff-banner" role="status">
              <strong>A quotation is ready to continue</strong>
              <p>Import selected quote fields, then review the invoice before sharing it.</p>
              <div className="inline-actions">
                <Button type="button" onClick={importQuotation}>
                  Import quotation details
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    clearLocalScenarioTransfer();
                    setQuotationTransfer(null);
                  }}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ) : null}
          <div className="gst-policy-summary" role="note">
            <strong>Commercial invoice boundary</strong>
            <span>This draft shows entered commercial values before any GST or statutory treatment.</span>
            <span>Use the GST Invoice Generator when a tax invoice is required.</span>
          </div>
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
                label="Phone (optional)"
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
            <InputField
              id="gstin"
              label="GSTIN (optional)"
              value={values.gstin}
              onChange={(event) => updateValue('gstin', event.target.value)}
              error={fieldError(errors, 'gstin')}
              help="Displayed as entered; not verified. This draft does not calculate GST."
            />
            <LogoUploader logo={values.logo} onChange={(logo) => updateValue('logo', logo)} />
          </fieldset>
          <fieldset className="document-form-section">
            <legend>Invoice details</legend>
            <div className="form-grid form-grid--three">
              <InputField
                id="invoiceNumber"
                label="Invoice number"
                value={values.invoiceNumber}
                onChange={(event) => updateValue('invoiceNumber', event.target.value)}
                error={fieldError(errors, 'invoiceNumber')}
                required
              />
              <InputField
                id="invoiceDate"
                label="Invoice date"
                type="date"
                value={values.invoiceDate}
                onChange={(event) => updateValue('invoiceDate', event.target.value)}
                error={fieldError(errors, 'invoiceDate')}
                required
              />
              <InputField
                id="dueDate"
                label="Due date (optional)"
                type="date"
                value={values.dueDate}
                onChange={(event) => updateValue('dueDate', event.target.value)}
                error={fieldError(errors, 'dueDate')}
              />
            </div>
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
            <p className="field__help">Discounts are commercial adjustments; no tax is calculated here.</p>
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
            <legend>Terms and style</legend>
            <TextareaField
              id="paymentDetails"
              label="Payment details (optional)"
              value={values.paymentDetails}
              onChange={(event) => updateValue('paymentDetails', event.target.value)}
              error={fieldError(errors, 'paymentDetails')}
              rows={2}
            />
            <div className="form-grid form-grid--two">
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
                rows={2}
              />
            </div>
            <div className="form-grid form-grid--two">
              <SelectField
                id="template"
                label="Layout"
                value={values.template}
                onChange={(event) => updateValue('template', event.target.value as InvoiceInput['template'])}
                error={fieldError(errors, 'template')}
              >
                <option value="editorial">Editorial edge</option>
                <option value="formal">Formal frame</option>
              </SelectField>
              <SelectField
                id="accent"
                label="Accent"
                value={values.accent}
                onChange={(event) => updateValue('accent', event.target.value as InvoiceInput['accent'])}
                error={fieldError(errors, 'accent')}
              >
                {DOCUMENT_ACCENTS.map((accent) => (
                  <option value={accent.value} key={accent.value}>
                    {accent.label}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="form-grid form-grid--two">
              <InputField
                id="signatoryName"
                label="Authorised signatory (optional)"
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
              Create invoice draft
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
        aria-labelledby="invoice-result-title"
      >
        {calculationError ? (
          <StateBlock titleId="invoice-result-title" title="We could not create that invoice" tone="error">
            {calculationError}
          </StateBlock>
        ) : result ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Preview and export</p>
                <h2 id="invoice-result-title">Your invoice draft is ready</h2>
              </div>
              <span className="result-status">Live · non-GST draft</span>
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
              <Button type="button" variant="secondary" onClick={continueToReceipt}>
                Continue to payment receipt
              </Button>
              <Button type="button" variant="secondary" onClick={continueToUpi}>
                Continue to UPI QR
              </Button>
            </div>
            <p className="document-export-help">
              This is a commercial invoice draft, not a GST tax invoice. Handoffs copy selected fields into
              destination forms in this tab&apos;s session storage and always require review.
            </p>
            <PrivacyBlock>
              The invoice is generated locally and does not confirm tax treatment, payment settlement or UPI
              ownership.
            </PrivacyBlock>
          </>
        ) : (
          <StateBlock
            titleId="invoice-result-title"
            title="Your A4 invoice preview will appear here"
            tone="empty"
          >
            Complete the required business, customer, date and line-item fields to create a local invoice
            draft.
          </StateBlock>
        )}
      </section>
    </div>
  );
}
