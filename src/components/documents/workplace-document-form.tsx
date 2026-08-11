'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { FieldError } from '@/domain/calculations/types';
import {
  calculateDeliveryChallan,
  calculateMenu,
  calculatePriceTag,
  calculatePurchaseOrder,
  calculateRentReceipt,
  calculateShippingLabel,
  calculateWageSlip,
  type DeliveryChallanInput,
  type MenuInput,
  type PriceTagInput,
  type PurchaseOrderInput,
  type RentReceiptInput,
  type ShippingLabelInput,
  type WageSlipInput,
  type WorkplaceDocument,
  type WorkplacePageProfile,
  validateDeliveryChallanInput,
  validateMenuInput,
  validatePriceTagInput,
  validatePurchaseOrderInput,
  validateRentReceiptInput,
  validateShippingLabelInput,
  validateWageSlipInput,
  workplacePageProfiles,
} from '@/domain/documents/workplace';
import { documentExportErrorMessage, downloadDocumentPdf, printDocument } from '@/lib/documents/export';
import { trackEvent } from '@/lib/analytics';

import { DocumentPreview } from '@/components/documents/document-preview';
import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/ui/form-error';
import { InputField, SelectField, TextareaField, CheckboxField } from '@/components/ui/form-field';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';

export type WorkplaceDocumentKind =
  | 'price-tag'
  | 'delivery-challan'
  | 'shipping-label'
  | 'purchase-order'
  | 'menu'
  | 'wage-slip'
  | 'rent-receipt';

interface WorkplaceToolProps {
  id: string;
  category: string;
  defaultValues: unknown;
  privacyNote: string;
}

type WorkplaceValues = Record<string, unknown>;

function getFieldError(errors: FieldError[], field: string) {
  return errors.find((error) => error.field === field)?.message;
}

function useToolView(tool: WorkplaceToolProps) {
  const [interactive, setInteractive] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setInteractive(true));
    trackEvent('tool_viewed', { toolId: tool.id, category: tool.category });
    return () => window.cancelAnimationFrame(frame);
  }, [tool.category, tool.id]);
  return interactive;
}

function getString(values: WorkplaceValues, key: string) {
  const value = values[key];
  return typeof value === 'string' ? value : '';
}

function profileOptions() {
  return workplacePageProfiles.map((profile) => (
    <option value={profile.value} key={profile.value}>
      {profile.label}
    </option>
  ));
}

function Field({
  values,
  errors,
  name,
  label,
  type = 'text',
  required = false,
  onChange,
}: {
  values: WorkplaceValues;
  errors: FieldError[];
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <InputField
      id={`workplace-${name}`}
      label={label}
      type={type}
      value={getString(values, name)}
      onChange={(event) => onChange(name, event.target.value)}
      error={getFieldError(errors, name)}
      required={required}
    />
  );
}

function WorkplaceFields({
  kind,
  values,
  errors,
  update,
}: {
  kind: WorkplaceDocumentKind;
  values: WorkplaceValues;
  errors: FieldError[];
  update: (name: string, value: unknown) => void;
}) {
  const field = (name: string, label: string, type?: string, required?: boolean) => (
    <Field
      key={name}
      values={values}
      errors={errors}
      name={name}
      label={label}
      type={type}
      required={required}
      onChange={update}
    />
  );
  const area = (name: string, label: string, required = false) => (
    <TextareaField
      key={name}
      id={`workplace-${name}`}
      label={label}
      value={getString(values, name)}
      onChange={(event) => update(name, event.target.value)}
      error={getFieldError(errors, name)}
      rows={3}
      required={required}
    />
  );

  let fields: React.ReactNode;
  if (kind === 'price-tag') {
    fields = (
      <>
        {field('businessName', 'Business name', undefined, true)}
        {field('productName', 'Product name', undefined, true)}
        <div className="form-grid form-grid--two">
          {field('mrp', 'MRP', 'number', true)}
          {field('offerPrice', 'Offer price', 'number', true)}
        </div>
        <div className="form-grid form-grid--two">
          {field('sku', 'SKU (optional)')}
          {field('barcode', 'Barcode value (optional)')}
        </div>
      </>
    );
  } else if (kind === 'delivery-challan') {
    fields = (
      <>
        {area('consignor', 'Consignor', true)}
        {area('consignee', 'Consignee', true)}
        {area('itemsText', 'Items (one per line)', true)}
        {field('reason', 'Reason', undefined, true)}
        <div className="form-grid form-grid--two">
          {field('vehicleNumber', 'Vehicle number (optional)')}
          {field('issueDate', 'Issue date', 'date', true)}
          {field('deliveryDate', 'Delivery date', 'date', true)}
        </div>
      </>
    );
  } else if (kind === 'shipping-label') {
    fields = (
      <>
        <div className="form-grid form-grid--two">
          {field('senderName', 'Sender name', undefined, true)}
          {field('senderPhone', 'Sender phone (optional)')}
        </div>
        {area('senderAddress', 'Sender address', true)}
        <div className="form-grid form-grid--two">
          {field('recipientName', 'Recipient name', undefined, true)}
          {field('recipientPhone', 'Recipient phone (optional)')}
        </div>
        {area('recipientAddress', 'Recipient address', true)}
        <div className="form-grid form-grid--three">
          {field('orderReference', 'Order reference (optional)')}
          {field('parcelCount', 'Parcel count', 'number', true)}
          {field('weight', 'Weight (optional)')}
        </div>
        {field('barcode', 'Barcode value (optional)')}
      </>
    );
  } else if (kind === 'purchase-order') {
    const items = Array.isArray(values.items) ? (values.items as PurchaseOrderInput['items']) : [];
    const updateItem = (
      index: number,
      fieldName: keyof PurchaseOrderInput['items'][number],
      value: string,
    ) => {
      update(
        'items',
        items.map((item, itemIndex) => (itemIndex === index ? { ...item, [fieldName]: value } : item)),
      );
    };
    fields = (
      <>
        <div className="form-grid form-grid--two">
          {field('buyerName', 'Buyer name', undefined, true)}
          {field('supplierName', 'Supplier name', undefined, true)}
        </div>
        {area('buyerAddress', 'Buyer address', true)}
        {area('supplierAddress', 'Supplier address', true)}
        <div className="form-grid form-grid--two">
          {field('poNumber', 'PO number', undefined, true)}
          {field('poDate', 'PO date', 'date', true)}
        </div>
        {items.map((item, index) => (
          <fieldset className="document-form-section" key={`purchase-item-${index}`}>
            <legend>Item {index + 1}</legend>
            <InputField
              id={`workplace-item-${index}-description`}
              label="Description"
              value={item.description}
              onChange={(event) => updateItem(index, 'description', event.target.value)}
              error={getFieldError(errors, 'items')}
              required
            />
            <div className="form-grid form-grid--three">
              <InputField
                id={`workplace-item-${index}-quantity`}
                label="Quantity"
                type="number"
                value={item.quantity}
                onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                required
              />
              <InputField
                id={`workplace-item-${index}-unit`}
                label="Unit"
                value={item.unit}
                onChange={(event) => updateItem(index, 'unit', event.target.value)}
              />
              <InputField
                id={`workplace-item-${index}-unit-price`}
                label="Unit price"
                type="number"
                value={item.unitPrice}
                onChange={(event) => updateItem(index, 'unitPrice', event.target.value)}
                required
              />
            </div>
            <InputField
              id={`workplace-item-${index}-tax-rate`}
              label="Tax rate (optional)"
              type="number"
              value={item.taxRate}
              onChange={(event) => updateItem(index, 'taxRate', event.target.value)}
            />
            {items.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  update(
                    'items',
                    items.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              >
                Remove item {index + 1}
              </Button>
            ) : null}
          </fieldset>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={items.length >= 25}
          onClick={() =>
            update('items', [
              ...items,
              { description: '', quantity: '1', unit: 'pcs', unitPrice: '0', taxRate: '0' },
            ])
          }
        >
          Add item
        </Button>
        <SelectField
          id="workplace-taxDisplay"
          label="Tax display"
          value={getString(values, 'taxDisplay')}
          onChange={(event) => update('taxDisplay', event.target.value)}
          error={getFieldError(errors, 'taxDisplay')}
        >
          <option value="none">Do not show tax</option>
          <option value="declared">Show declared rate</option>
        </SelectField>
        {area('terms', 'Terms (optional)')}
      </>
    );
  } else if (kind === 'menu') {
    const sections = Array.isArray(values.sections) ? (values.sections as MenuInput['sections']) : [];
    const updateSection = (sectionIndex: number, nextSection: MenuInput['sections'][number]) =>
      update(
        'sections',
        sections.map((section, index) => (index === sectionIndex ? nextSection : section)),
      );
    fields = (
      <>
        {field('businessName', 'Business name', undefined, true)}
        {area('address', 'Address (optional)')}
        {field('phone', 'Phone (optional)')}
        {sections.map((section, sectionIndex) => (
          <fieldset className="document-form-section" key={`menu-section-${sectionIndex}`}>
            <legend>Menu section {sectionIndex + 1}</legend>
            <InputField
              id={`workplace-section-${sectionIndex}-heading`}
              label="Section heading"
              value={section.heading}
              onChange={(event) => updateSection(sectionIndex, { ...section, heading: event.target.value })}
              error={getFieldError(errors, 'sections')}
              required
            />
            {section.items.map((item, itemIndex) => (
              <div className="document-form-section" key={`menu-section-${sectionIndex}-item-${itemIndex}`}>
                <div className="form-grid form-grid--two">
                  <InputField
                    id={`workplace-section-${sectionIndex}-item-${itemIndex}-name`}
                    label={`Item ${itemIndex + 1} name`}
                    value={item.name}
                    onChange={(event) =>
                      updateSection(sectionIndex, {
                        ...section,
                        items: section.items.map((current, index) =>
                          index === itemIndex ? { ...current, name: event.target.value } : current,
                        ),
                      })
                    }
                    required
                  />
                  <InputField
                    id={`workplace-section-${sectionIndex}-item-${itemIndex}-price`}
                    label="Price (optional)"
                    value={item.price}
                    onChange={(event) =>
                      updateSection(sectionIndex, {
                        ...section,
                        items: section.items.map((current, index) =>
                          index === itemIndex ? { ...current, price: event.target.value } : current,
                        ),
                      })
                    }
                  />
                </div>
                <TextareaField
                  id={`workplace-section-${sectionIndex}-item-${itemIndex}-note`}
                  label="Item note (optional)"
                  value={item.note}
                  onChange={(event) =>
                    updateSection(sectionIndex, {
                      ...section,
                      items: section.items.map((current, index) =>
                        index === itemIndex ? { ...current, note: event.target.value } : current,
                      ),
                    })
                  }
                  rows={2}
                />
                {section.items.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      updateSection(sectionIndex, {
                        ...section,
                        items: section.items.filter((_, index) => index !== itemIndex),
                      })
                    }
                  >
                    Remove item {itemIndex + 1}
                  </Button>
                ) : null}
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              disabled={section.items.length >= 30}
              onClick={() =>
                updateSection(sectionIndex, {
                  ...section,
                  items: [...section.items, { name: '', price: '', note: '' }],
                })
              }
            >
              Add menu item
            </Button>
            {sections.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  update(
                    'sections',
                    sections.filter((_, index) => index !== sectionIndex),
                  )
                }
              >
                Remove section {sectionIndex + 1}
              </Button>
            ) : null}
          </fieldset>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={sections.length >= 10}
          onClick={() =>
            update('sections', [...sections, { heading: '', items: [{ name: '', price: '', note: '' }] }])
          }
        >
          Add menu section
        </Button>
        <CheckboxField
          id="workplace-includeQr"
          label="Prepare an optional QR destination"
          checked={Boolean(values.includeQr)}
          onChange={(event) => update('includeQr', event.target.checked)}
        />
        {Boolean(values.includeQr) ? field('qrUrl', 'Menu URL', 'url', true) : null}
      </>
    );
  } else if (kind === 'wage-slip') {
    fields = (
      <>
        {field('employerName', 'Employer name', undefined, true)}
        {field('workerName', 'Worker name', undefined, true)}
        {field('period', 'Pay period', undefined, true)}
        <div className="form-grid form-grid--two">
          {field('grossEarnings', 'Declared earnings', 'number', true)}
          {field('deductions', 'Declared deductions', 'number', true)}
        </div>
      </>
    );
  } else {
    fields = (
      <>
        {field('landlordName', 'Landlord name', undefined, true)}
        {field('tenantName', 'Tenant name', undefined, true)}
        {area('propertyAddress', 'Property address', true)}
        <div className="form-grid form-grid--two">
          {field('period', 'Rent period', undefined, true)}
          {field('amount', 'Declared amount', 'number', true)}
        </div>
        <div className="form-grid form-grid--two">
          {field('receiptNumber', 'Receipt number', undefined, true)}
          {field('date', 'Receipt date', 'date', true)}
        </div>
      </>
    );
  }

  return (
    <>
      {fields}
      <SelectField
        id="workplace-pageProfile"
        label="Print profile"
        value={getString(values, 'pageProfile')}
        onChange={(event) => update('pageProfile', event.target.value as WorkplacePageProfile)}
        error={getFieldError(errors, 'pageProfile')}
      >
        {profileOptions()}
      </SelectField>
      <TextareaField
        id="workplace-footerText"
        label="Footer note (optional)"
        value={getString(values, 'footerText')}
        onChange={(event) => update('footerText', event.target.value)}
        error={getFieldError(errors, 'footerText')}
        rows={2}
        help="Keep this as a user-facing note; no official seals or acceptance language is added."
      />
    </>
  );
}

function toCalculationInput(kind: WorkplaceDocumentKind, values: WorkplaceValues) {
  if (kind === 'price-tag') return values as unknown as PriceTagInput;
  if (kind === 'delivery-challan') return values as unknown as DeliveryChallanInput;
  if (kind === 'shipping-label') return values as unknown as ShippingLabelInput;
  if (kind === 'purchase-order') return values as unknown as PurchaseOrderInput;
  if (kind === 'menu') return values as unknown as MenuInput;
  if (kind === 'wage-slip') return values as unknown as WageSlipInput;
  return values as unknown as RentReceiptInput;
}

function calculateDocument(kind: WorkplaceDocumentKind, input: unknown) {
  if (kind === 'price-tag') return calculatePriceTag(input as PriceTagInput);
  if (kind === 'delivery-challan') return calculateDeliveryChallan(input as DeliveryChallanInput);
  if (kind === 'shipping-label') return calculateShippingLabel(input as ShippingLabelInput);
  if (kind === 'purchase-order') return calculatePurchaseOrder(input as PurchaseOrderInput);
  if (kind === 'menu') return calculateMenu(input as MenuInput);
  if (kind === 'wage-slip') return calculateWageSlip(input as WageSlipInput);
  return calculateRentReceipt(input as RentReceiptInput);
}

function validateDocument(kind: WorkplaceDocumentKind, input: unknown) {
  if (kind === 'price-tag') return validatePriceTagInput(input as PriceTagInput);
  if (kind === 'delivery-challan') return validateDeliveryChallanInput(input as DeliveryChallanInput);
  if (kind === 'shipping-label') return validateShippingLabelInput(input as ShippingLabelInput);
  if (kind === 'purchase-order') return validatePurchaseOrderInput(input as PurchaseOrderInput);
  if (kind === 'menu') return validateMenuInput(input as MenuInput);
  if (kind === 'wage-slip') return validateWageSlipInput(input as WageSlipInput);
  return validateRentReceiptInput(input as RentReceiptInput);
}

function titleFor(kind: WorkplaceDocumentKind) {
  return {
    'price-tag': 'price tag',
    'delivery-challan': 'delivery challan',
    'shipping-label': 'shipping label',
    'purchase-order': 'purchase order',
    menu: 'menu',
    'wage-slip': 'wage slip',
    'rent-receipt': 'rent receipt',
  }[kind];
}

export function WorkplaceDocumentForm({
  kind,
  tool,
}: {
  kind: WorkplaceDocumentKind;
  tool: WorkplaceToolProps;
}) {
  const initialValues = useMemo(() => (tool.defaultValues as WorkplaceValues) ?? {}, [tool.defaultValues]);
  const [values, setValues] = useState<WorkplaceValues>(initialValues);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [result, setResult] = useState<WorkplaceDocument | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const isInteractive = useToolView(tool);
  const errorRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const printTargetId = `${kind}-workplace-print-area`;

  function update(name: string, value: unknown) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => current.filter((error) => !error.field.startsWith(name)));
    setResult(null);
    setGenerationError(null);
    setExportError(null);
    setExportStatus(null);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setResult(null);
    setGenerationError(null);
    setExportError(null);
    setExportStatus(null);
    trackEvent('tool_started', { toolId: tool.id });
    const input = toCalculationInput(kind, values);
    const validation = validateDocument(kind, input);
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
      const next = calculateDocument(kind, validation.data);
      setResult(next);
      trackEvent('tool_completed', { toolId: tool.id });
      trackEvent('result_generated', { toolId: tool.id });
      window.requestAnimationFrame(() => resultRef.current?.focus());
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'We could not prepare this document.');
    }
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
      trackEvent('result_printed', { toolId: tool.id, pageSize: getString(values, 'pageProfile') });
      setExportError(null);
      setExportStatus('Print dialog opened. Review the selected profile before printing.');
    } catch (error) {
      setExportError(documentExportErrorMessage(error));
      setExportStatus(null);
    }
  }

  return (
    <div className="calculator-layout document-generator-layout">
      <section className="calculator-card document-form-card" aria-labelledby="workplace-document-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Document generator</p>
            <h2 id="workplace-document-form-title">Create a {titleFor(kind)}</h2>
          </div>
          <span className="local-badge">Runs locally</span>
        </div>
        <form onSubmit={submit} noValidate data-interactive={isInteractive ? 'true' : 'false'}>
          <ErrorSummary ref={errorRef} errors={errors} />
          <WorkplaceFields kind={kind} values={values} errors={errors} update={update} />
          {generationError ? (
            <StateBlock title="Check the entered values" tone="error">
              {generationError}
            </StateBlock>
          ) : null}
          <div className="document-form__actions">
            <Button type="submit" fullWidth>
              {kind === 'menu' ? 'Generate menu' : `Generate ${titleFor(kind)}`}
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                setValues(initialValues);
                setErrors([]);
                setResult(null);
                setGenerationError(null);
              }}
            >
              Clear form
            </Button>
          </div>
        </form>
        <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
      </section>
      <section
        className="calculator-result document-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby="workplace-document-result-title"
      >
        <div className="calculator-result__heading">
          <div>
            <p className="eyebrow">Preview and export</p>
            <h2 id="workplace-document-result-title">
              {result ? `Your ${titleFor(kind)} is ready` : 'Your preview will appear here'}
            </h2>
          </div>
          {result ? <span className="result-status">Draft</span> : null}
        </div>
        {result ? (
          <>
            <DocumentPreview document={result} targetId={printTargetId} />
            <div className="inline-actions">
              <Button type="button" onClick={downloadPdf} disabled={isExporting}>
                {isExporting ? 'Preparing…' : 'Download PDF'}
              </Button>
              <Button type="button" variant="secondary" onClick={printPreview}>
                Print
              </Button>
            </div>
            {exportStatus ? (
              <p className="status-message" role="status">
                {exportStatus}
              </p>
            ) : null}
            {exportError ? (
              <StateBlock title="Export needs attention" tone="error">
                {exportError}
              </StateBlock>
            ) : null}
          </>
        ) : (
          <StateBlock title="No document yet" tone="empty">
            Complete the fields to prepare a local, clearly labelled draft.
          </StateBlock>
        )}
      </section>
    </div>
  );
}
