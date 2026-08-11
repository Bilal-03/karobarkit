'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { FieldError } from '@/domain/calculations/types';
import { GST_CUSTOM_RATE_ID, GST_POLICY_AS_OF, getActiveGstPolicy } from '@/domain/policies/gst';
import {
  INVOICE_LAST_REVIEWED,
  getInvoiceRateOptions,
  invoiceCustomRateOption,
  invoiceDefaultValues,
} from '@/domain/invoices/constants';
import {
  calculateGstInvoice,
  type GstInvoiceDocument,
  type GstInvoiceInput,
  type InvoiceItemInput,
  validateGstInvoiceInput,
} from '@/domain/invoices';
import { documentExportErrorMessage, downloadDocumentPdf, printDocument } from '@/lib/documents/export';
import { trackEvent } from '@/lib/analytics';
import {
  clearLocalScenarioTransfer,
  readLocalScenarioTransfer,
  saveLocalScenarioTransfer,
  type LocalScenarioTransfer,
} from '@/domain/workflows/local-scenario-transfer';

import { DocumentPreview } from '@/components/documents/document-preview';
import { LogoUploader } from '@/components/documents/logo-uploader';
import { Button } from '@/components/ui/button';
import { CheckboxField, InputField, SelectField, TextareaField } from '@/components/ui/form-field';
import { ErrorSummary } from '@/components/ui/form-error';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';
import { useLiveCalculation } from '@/components/tooling/use-live-calculation';

interface InvoiceToolProps {
  id: string;
  category: string;
  defaultValues: unknown;
}

function cloneInvoiceInput(value: unknown): GstInvoiceInput {
  const source = (value as GstInvoiceInput | undefined) ?? invoiceDefaultValues;
  return {
    ...source,
    supplier: { ...source.supplier, address: { ...source.supplier.address } },
    recipient: { ...source.recipient, address: { ...source.recipient.address } },
    placeOfSupply: { ...source.placeOfSupply },
    items: source.items.map((item) => ({ ...item })),
  };
}

function fieldError(errors: FieldError[], field: string) {
  return errors.find((error) => error.field === field)?.message;
}

function policySummary(invoiceDate: string) {
  try {
    const policy = getActiveGstPolicy(invoiceDate || GST_POLICY_AS_OF);
    return `${policy.id} · applies to ${invoiceDate || GST_POLICY_AS_OF} · effective ${policy.effectiveFrom} · last verified ${policy.lastVerifiedOn}`;
  } catch {
    return 'The reviewed GST policy is unavailable.';
  }
}

export function GstInvoiceGeneratorForm({ tool }: { tool: InvoiceToolProps }) {
  const router = useRouter();
  const initialValues = useMemo(() => cloneInvoiceInput(tool.defaultValues), [tool.defaultValues]);
  const [values, setValues] = useState<GstInvoiceInput>(initialValues);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const [quotationTransfer, setQuotationTransfer] = useState<LocalScenarioTransfer | null>(null);
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const printTargetId = 'gst-invoice-document-print-area';
  const rateOptions = getInvoiceRateOptions(values.invoiceDate || INVOICE_LAST_REVIEWED);
  const { result, errors, calculationError, clearFieldError, clearErrors, submit } = useLiveCalculation<
    GstInvoiceInput,
    GstInvoiceDocument
  >({
    values,
    validate: (input) => {
      const validation = validateGstInvoiceInput(input);
      return validation.success ? { success: true as const, data: input } : validation;
    },
    calculate: (input) => calculateGstInvoice(input),
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
    trackEvent('tool_viewed', { toolId: tool.id, category: tool.category });
    return () => window.cancelAnimationFrame(frame);
  }, [tool.category, tool.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const transfer = readLocalScenarioTransfer();
      if (transfer?.sourceKind === 'quotation-to-gst-invoice') setQuotationTransfer(transfer);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (errors.length === 0) return;
    const frame = window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [errors]);

  function clearResult() {
    setExportError(null);
    setExportStatus(null);
    setHandoffError(null);
  }

  function importQuotation() {
    if (!quotationTransfer) return;
    const incoming = quotationTransfer.values;
    let importedItems: InvoiceItemInput[] = [];
    try {
      const parsed = JSON.parse(incoming.itemsJson ?? '[]') as Array<Record<string, string>>;
      importedItems = parsed.slice(0, 50).map((item, index) => ({
        id: `quote-import-${index + 1}`,
        description: item.description ?? '',
        hsnOrSac: '',
        quantity: item.quantity ?? '1',
        unit: item.unit ?? 'unit',
        unitPrice: item.unitPrice ?? '',
        discountType:
          item.discountType === 'percentage' || item.discountType === 'fixed' ? item.discountType : 'none',
        discountValue: item.discountValue ?? '',
        ratePresetId: invoiceDefaultValues.items[0]?.ratePresetId ?? 'gst-headline-rate-18',
        customRate: '',
      }));
    } catch {
      importedItems = [];
    }
    setValues((current) => ({
      ...current,
      invoiceNumber: /^[A-Za-z0-9][A-Za-z0-9/-]{0,15}$/u.test(incoming.invoiceNumber ?? '')
        ? incoming.invoiceNumber
        : current.invoiceNumber,
      invoiceDate: incoming.invoiceDate || current.invoiceDate,
      supplier: {
        ...current.supplier,
        legalName: incoming.supplierLegalName || current.supplier.legalName,
        gstin: incoming.supplierGstin || current.supplier.gstin,
        phone: incoming.supplierPhone || current.supplier.phone,
        email: incoming.supplierEmail || current.supplier.email,
        address: {
          ...current.supplier.address,
          line1: incoming.supplierAddress || current.supplier.address.line1,
        },
      },
      recipient: {
        ...current.recipient,
        legalName: incoming.recipientName || current.recipient.legalName,
        phone: incoming.recipientPhone || current.recipient.phone,
        email: incoming.recipientEmail || current.recipient.email,
        address: {
          ...current.recipient.address,
          line1: incoming.recipientAddress || current.recipient.address.line1,
        },
      },
      items: importedItems.length ? importedItems : current.items,
    }));
    clearErrors();
    clearResult();
    clearLocalScenarioTransfer();
    setQuotationTransfer(null);
    setHandoffError(null);
  }

  function updateValue(field: keyof GstInvoiceInput, value: unknown) {
    setValues((current) => ({ ...current, [field]: value }) as GstInvoiceInput);
    clearFieldError(String(field));
    clearResult();
  }

  function updateParty(party: 'supplier' | 'recipient', field: string, value: unknown) {
    setValues(
      (current) =>
        ({
          ...current,
          [party]: { ...current[party], [field]: value },
        }) as GstInvoiceInput,
    );
    clearFieldError(`${party}.${field}`);
    clearResult();
  }

  function updateAddress(party: 'supplier' | 'recipient', field: string, value: string) {
    setValues(
      (current) =>
        ({
          ...current,
          [party]: {
            ...current[party],
            address: { ...current[party].address, [field]: value },
          },
        }) as GstInvoiceInput,
    );
    clearFieldError(`${party}.address.${field}`);
    clearResult();
  }

  function updatePlaceOfSupply(field: 'state' | 'stateCode', value: string) {
    setValues((current) => ({ ...current, placeOfSupply: { ...current.placeOfSupply, [field]: value } }));
    clearFieldError(`placeOfSupply.${field}`);
    clearResult();
  }

  function updateItem(index: number, field: keyof InvoiceItemInput, value: string) {
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
          ...invoiceDefaultValues.items[0],
          id: `item-${current.items.length + 1}`,
        } as InvoiceItemInput,
      ],
    }));
    clearResult();
  }

  function duplicateItem(index: number) {
    setValues((current) => {
      const source = current.items[index];
      if (!source) return current;
      const duplicate = { ...source, id: `${source.id}-copy-${Date.now()}` };
      return {
        ...current,
        items: [...current.items.slice(0, index + 1), duplicate, ...current.items.slice(index + 1)],
      };
    });
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
    if (
      JSON.stringify(values) !== JSON.stringify(initialValues) &&
      !window.confirm('Clear the entered invoice details and preview?')
    )
      return;
    setValues(cloneInvoiceInput(initialValues));
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
      sourceToolName: 'GST Invoice Generator',
      sourceKind: 'gst-invoice-to-payment-receipt',
      values: {
        receiptNumber: result.invoiceNumber,
        receiptDate: result.invoiceDate,
        receivedFrom: result.recipient.legalName,
        amount: result.totals.grandTotal,
        paymentPurpose: `Payment against invoice ${result.invoiceNumber}`,
        invoiceReference: result.invoiceNumber,
        customerAddress: [
          result.recipient.address.line1,
          result.recipient.address.line2,
          result.recipient.address.city,
          result.recipient.address.state,
          result.recipient.address.postalCode,
        ]
          .filter(Boolean)
          .join('\n'),
        businessName: result.supplier.legalName,
        businessAddress: [
          result.supplier.address.line1,
          result.supplier.address.line2,
          result.supplier.address.city,
          result.supplier.address.state,
          result.supplier.address.postalCode,
        ]
          .filter(Boolean)
          .join('\n'),
        phone: result.supplier.phone,
        email: result.supplier.email,
        gstin: result.supplier.gstin,
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
      sourceToolName: 'GST Invoice Generator',
      sourceKind: 'gst-invoice-to-upi',
      values: { amount: result.totals.grandTotal, note: `Invoice ${result.invoiceNumber}` },
    });
    if (!saved) {
      setHandoffError('The UPI handoff could not be stored. Enter the amount and note manually.');
      return;
    }
    router.push('/tools/upi-standee');
  }

  function renderPartyFields(party: 'supplier' | 'recipient') {
    const value = values[party];
    const prefix = party;
    const isSupplier = party === 'supplier';
    return (
      <>
        <div className="form-grid form-grid--two">
          <InputField
            id={`${prefix}.legalName`}
            label="Legal name"
            value={value.legalName}
            onChange={(event) => updateParty(party, 'legalName', event.target.value)}
            error={fieldError(errors, `${prefix}.legalName`)}
            autoComplete="organization"
            required
          />
          <InputField
            id={`${prefix}.tradeName`}
            label="Trade name (optional)"
            value={value.tradeName}
            onChange={(event) => updateParty(party, 'tradeName', event.target.value)}
            error={fieldError(errors, `${prefix}.tradeName`)}
          />
        </div>
        <div className="form-grid form-grid--two">
          <InputField
            id={`${prefix}.gstin`}
            label={isSupplier ? 'Supplier GSTIN' : 'Recipient GSTIN'}
            value={value.gstin}
            onChange={(event) => updateParty(party, 'gstin', event.target.value)}
            error={fieldError(errors, `${prefix}.gstin`)}
            help="Syntax is checked locally only. Existence and ownership are not verified."
            required={isSupplier || values.recipientRegistrationStatus === 'registered'}
            autoCapitalize="characters"
          />
          <InputField
            id={`${prefix}.phone`}
            label="Phone (optional)"
            value={value.phone}
            onChange={(event) => updateParty(party, 'phone', event.target.value)}
            error={fieldError(errors, `${prefix}.phone`)}
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
        <InputField
          id={`${prefix}.email`}
          label="Email (optional)"
          value={value.email}
          onChange={(event) => updateParty(party, 'email', event.target.value)}
          error={fieldError(errors, `${prefix}.email`)}
          type="email"
          autoComplete="email"
        />
        <div className="invoice-address-fields">
          <p className="field__label">Address</p>
          <InputField
            id={`${prefix}.address.line1`}
            label="Address line 1"
            value={value.address.line1}
            onChange={(event) => updateAddress(party, 'line1', event.target.value)}
            error={fieldError(errors, `${prefix}.address.line1`)}
            required
          />
          <InputField
            id={`${prefix}.address.line2`}
            label="Address line 2 (optional)"
            value={value.address.line2}
            onChange={(event) => updateAddress(party, 'line2', event.target.value)}
            error={fieldError(errors, `${prefix}.address.line2`)}
          />
          <div className="form-grid form-grid--two">
            <InputField
              id={`${prefix}.address.city`}
              label="City"
              value={value.address.city}
              onChange={(event) => updateAddress(party, 'city', event.target.value)}
              error={fieldError(errors, `${prefix}.address.city`)}
              required
            />
            <InputField
              id={`${prefix}.address.district`}
              label="District (optional)"
              value={value.address.district}
              onChange={(event) => updateAddress(party, 'district', event.target.value)}
              error={fieldError(errors, `${prefix}.address.district`)}
            />
          </div>
          <div className="form-grid form-grid--three">
            <InputField
              id={`${prefix}.address.state`}
              label="State / UT"
              value={value.address.state}
              onChange={(event) => updateAddress(party, 'state', event.target.value)}
              error={fieldError(errors, `${prefix}.address.state`)}
              required
            />
            <InputField
              id={`${prefix}.address.stateCode`}
              label="State code (optional)"
              value={value.address.stateCode}
              onChange={(event) => updateAddress(party, 'stateCode', event.target.value)}
              error={fieldError(errors, `${prefix}.address.stateCode`)}
              inputMode="numeric"
            />
            <InputField
              id={`${prefix}.address.postalCode`}
              label="Postal code"
              value={value.address.postalCode}
              onChange={(event) => updateAddress(party, 'postalCode', event.target.value)}
              error={fieldError(errors, `${prefix}.address.postalCode`)}
              inputMode="numeric"
              required
            />
          </div>
          <InputField
            id={`${prefix}.address.country`}
            label="Country"
            value={value.address.country}
            onChange={(event) => updateAddress(party, 'country', event.target.value)}
            error={fieldError(errors, `${prefix}.address.country`)}
            required
          />
        </div>
      </>
    );
  }

  return (
    <div className="calculator-layout document-generator-layout gst-invoice-generator-layout">
      <section className="calculator-card document-form-card" aria-labelledby="gst-invoice-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">GST document generator</p>
            <h2 id="gst-invoice-form-title">Create a GST tax invoice draft</h2>
          </div>
          <span className="local-badge">Runs locally</span>
        </div>
        <form onSubmit={onSubmit} noValidate data-interactive={isInteractive ? 'true' : 'false'}>
          <ErrorSummary ref={errorSummaryRef} errors={errors} />
          {quotationTransfer ? (
            <div className="local-handoff-banner" role="status">
              <strong>A quotation is ready to continue</strong>
              <p>
                Selected quote fields are waiting in this tab only. Import them, then complete and review all
                GST particulars.
              </p>
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
            <strong>Reviewed GST policy</strong>
            <span>{policySummary(values.invoiceDate)}</span>
            <span>
              The invoice date selects the effective policy; unsupported historical and future dates are
              blocked. Rate presets are source-backed choices only, and the generator does not classify
              goods/services or recommend a rate.
            </span>
          </div>
          <fieldset className="document-form-section">
            <legend>Supplier</legend>
            <LogoUploader logo={values.logo} onChange={(logo) => updateValue('logo', logo)} />
            {renderPartyFields('supplier')}
          </fieldset>
          <fieldset className="document-form-section">
            <legend>Recipient</legend>
            <SelectField
              id="recipientRegistrationStatus"
              label="Recipient registration status"
              value={values.recipientRegistrationStatus}
              onChange={(event) =>
                updateValue(
                  'recipientRegistrationStatus',
                  event.target.value as GstInvoiceInput['recipientRegistrationStatus'],
                )
              }
              error={fieldError(errors, 'recipientRegistrationStatus')}
              help="Choose the status from your records; the tool does not infer or verify it."
              required
            >
              <option value="registered">Registered</option>
              <option value="unregistered">Unregistered</option>
              <option value="unknown">Unknown · review before issue</option>
            </SelectField>
            {renderPartyFields('recipient')}
          </fieldset>
          <fieldset className="document-form-section">
            <legend>Invoice details</legend>
            <div className="form-grid form-grid--two">
              <InputField
                id="invoiceNumber"
                label="Invoice number"
                value={values.invoiceNumber}
                onChange={(event) => updateValue('invoiceNumber', event.target.value)}
                error={fieldError(errors, 'invoiceNumber')}
                required
                help="Up to 16 letters, numbers, hyphens or slashes. Uniqueness is not checked."
              />
              <InputField
                id="invoiceDate"
                label="Invoice date"
                type="date"
                value={values.invoiceDate}
                max={GST_POLICY_AS_OF}
                onChange={(event) => updateValue('invoiceDate', event.target.value)}
                error={fieldError(errors, 'invoiceDate')}
                required
              />
            </div>
            <InputField
              id="dueDate"
              label="Due date (optional)"
              type="date"
              value={values.dueDate}
              onChange={(event) => updateValue('dueDate', event.target.value)}
              error={fieldError(errors, 'dueDate')}
            />
            <div className="form-grid form-grid--two">
              <SelectField
                id="supplyType"
                label="Supply type"
                value={values.supplyType}
                onChange={(event) =>
                  updateValue('supplyType', event.target.value as GstInvoiceInput['supplyType'])
                }
                error={fieldError(errors, 'supplyType')}
                required
              >
                <option value="intra-state">Intra-State · CGST + SGST/UTGST</option>
                <option value="inter-state">Inter-State · IGST</option>
              </SelectField>
              <CheckboxField
                id="reverseCharge"
                label="Mark reverse charge (user selected)"
                checked={values.reverseCharge}
                onChange={(event) => updateValue('reverseCharge', event.target.checked)}
              />
            </div>
            <div className="form-grid form-grid--two">
              <InputField
                id="placeOfSupply.state"
                label={`Place of supply state${values.supplyType === 'inter-state' ? '' : ' (optional)'}`}
                value={values.placeOfSupply.state}
                onChange={(event) => updatePlaceOfSupply('state', event.target.value)}
                error={fieldError(errors, 'placeOfSupply.state')}
                required={values.supplyType === 'inter-state'}
                help="Enter it explicitly; the tool never infers place of supply."
              />
              <InputField
                id="placeOfSupply.stateCode"
                label={`Place of supply code${values.supplyType === 'inter-state' ? '' : ' (optional)'}`}
                value={values.placeOfSupply.stateCode}
                onChange={(event) => updatePlaceOfSupply('stateCode', event.target.value)}
                error={fieldError(errors, 'placeOfSupply.stateCode')}
                required={values.supplyType === 'inter-state'}
                inputMode="numeric"
              />
            </div>
          </fieldset>
          <fieldset className="document-form-section">
            <legend>Line items</legend>
            <p className="field__help">
              Prices are treated as pre-GST. HSN/SAC is an issuer-supplied field; no code lookup or
              classification is performed.
            </p>
            <div className="invoice-editor-items">
              {values.items.map((item, index) => {
                const prefix = `items.${index}`;
                const customRate = item.ratePresetId === GST_CUSTOM_RATE_ID;
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
                    <div className="form-grid form-grid--two">
                      <InputField
                        id={`${prefix}.hsnOrSac`}
                        label="HSN/SAC (optional)"
                        value={item.hsnOrSac}
                        onChange={(event) => updateItem(index, 'hsnOrSac', event.target.value)}
                        error={fieldError(errors, `${prefix}.hsnOrSac`)}
                        help="Enter a code from your records; correctness and required digit count are not checked."
                      />
                      <InputField
                        id={`${prefix}.unit`}
                        label="Unit (optional)"
                        value={item.unit}
                        onChange={(event) => updateItem(index, 'unit', event.target.value)}
                        error={fieldError(errors, `${prefix}.unit`)}
                      />
                    </div>
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
                        id={`${prefix}.unitPrice`}
                        label="Unit price (pre-GST)"
                        value={item.unitPrice}
                        onChange={(event) => updateItem(index, 'unitPrice', event.target.value)}
                        error={fieldError(errors, `${prefix}.unitPrice`)}
                        inputMode="decimal"
                        required
                      />
                      <SelectField
                        id={`${prefix}.discountType`}
                        label="Discount"
                        value={item.discountType}
                        onChange={(event) =>
                          updateItem(
                            index,
                            'discountType',
                            event.target.value as InvoiceItemInput['discountType'],
                          )
                        }
                        error={fieldError(errors, `${prefix}.discountType`)}
                      >
                        <option value="none">None</option>
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed INR</option>
                      </SelectField>
                    </div>
                    {item.discountType !== 'none' ? (
                      <InputField
                        id={`${prefix}.discountValue`}
                        label={
                          item.discountType === 'percentage' ? 'Discount percentage' : 'Discount amount (INR)'
                        }
                        value={item.discountValue}
                        onChange={(event) => updateItem(index, 'discountValue', event.target.value)}
                        error={fieldError(errors, `${prefix}.discountValue`)}
                        inputMode="decimal"
                        required
                      />
                    ) : null}
                    <SelectField
                      id={`${prefix}.ratePresetId`}
                      label="GST rate"
                      value={item.ratePresetId}
                      onChange={(event) => updateItem(index, 'ratePresetId', event.target.value)}
                      error={fieldError(errors, `${prefix}.ratePresetId`)}
                      required
                      help="Presets come from the reviewed policy for the invoice date."
                    >
                      <option value="">Choose a rate</option>
                      {rateOptions.map((option) => (
                        <option value={option.id} key={option.id}>
                          {option.label}
                        </option>
                      ))}
                      <option value={invoiceCustomRateOption.value}>{invoiceCustomRateOption.label}</option>
                    </SelectField>
                    {customRate ? (
                      <InputField
                        id={`${prefix}.customRate`}
                        label="Custom GST rate"
                        value={item.customRate}
                        onChange={(event) => updateItem(index, 'customRate', event.target.value)}
                        error={fieldError(errors, `${prefix}.customRate`)}
                        inputMode="decimal"
                        required
                        help="0–100%, up to two decimal places. You are responsible for choosing the applicable rate."
                      />
                    ) : null}
                    <div className="invoice-item-actions">
                      <Button type="button" variant="secondary" onClick={() => duplicateItem(index)}>
                        Duplicate item
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => removeItem(index)}
                        disabled={values.items.length <= 1}
                        aria-label={`Remove item ${index + 1}`}
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
            <p className="field__help">
              At least one item is required. The editor supports up to 50 items and exports long invoices
              across A4 pages.
            </p>
          </fieldset>
          <fieldset className="document-form-section">
            <legend>Optional details</legend>
            <TextareaField
              id="paymentDetails"
              label="Payment details"
              value={values.paymentDetails}
              onChange={(event) => updateValue('paymentDetails', event.target.value)}
              error={fieldError(errors, 'paymentDetails')}
              rows={2}
              help="Display-only text; no payment processing or verification is performed."
            />
            <TextareaField
              id="notes"
              label="Notes"
              value={values.notes}
              onChange={(event) => updateValue('notes', event.target.value)}
              error={fieldError(errors, 'notes')}
              rows={2}
            />
            <TextareaField
              id="terms"
              label="Terms and conditions"
              value={values.terms}
              onChange={(event) => updateValue('terms', event.target.value)}
              error={fieldError(errors, 'terms')}
              rows={3}
            />
          </fieldset>
          <div className="document-form__actions">
            <Button type="submit" fullWidth>
              Create GST invoice draft
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={resetForm}>
              Reset
            </Button>
          </div>
        </form>
        <PrivacyBlock>
          Supplier, recipient, item descriptions, quantities, prices, discounts, GST choices and totals stay
          in this browser. They are not uploaded, stored by default, sent in analytics or written to logs.
        </PrivacyBlock>
      </section>
      <section
        className="calculator-result document-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby="gst-invoice-result-title"
      >
        {calculationError ? (
          <StateBlock
            titleId="gst-invoice-result-title"
            title="We could not create that invoice"
            tone="error"
          >
            {calculationError}
          </StateBlock>
        ) : result ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Preview and export</p>
                <h2 id="gst-invoice-result-title">Your GST invoice draft is ready</h2>
              </div>
              <span className="result-status">Live · review</span>
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
              The layout is A4 and uses the shared local PDF/print engine. Review page breaks, fields,
              HSN/SAC, tax rate and applicability before issuing.
            </p>
            <PrivacyBlock>
              This draft is generated in your browser. It is not stored on KarobarKit servers or included in
              analytics.
            </PrivacyBlock>
          </>
        ) : (
          <StateBlock
            titleId="gst-invoice-result-title"
            title="Your A4 invoice preview will appear here"
            tone="empty"
          >
            Complete the required supplier, recipient, invoice and line-item fields to create a local tax
            invoice draft.
          </StateBlock>
        )}
      </section>
    </div>
  );
}
