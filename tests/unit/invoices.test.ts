import { describe, expect, it } from 'vitest';

import {
  calculateGstInvoice,
  gstInvoiceFilename,
  invoiceDefaultValues,
  invoiceDefaultItem,
  type GstInvoiceInput,
  validateGstInvoiceInput,
} from '@/domain/invoices';

function validInvoice(overrides: Partial<GstInvoiceInput> = {}): GstInvoiceInput {
  return {
    ...invoiceDefaultValues,
    invoiceNumber: 'INV-2026-001',
    supplier: {
      ...invoiceDefaultValues.supplier,
      legalName: 'Supplier Private Limited',
      gstin: '27ABCDE1234F1Z5',
      address: {
        ...invoiceDefaultValues.supplier.address,
        line1: '12 Market Road',
        city: 'Pune',
        state: 'Maharashtra',
        stateCode: '27',
        postalCode: '411001',
      },
    },
    recipient: {
      ...invoiceDefaultValues.recipient,
      legalName: 'Recipient Private Limited',
      gstin: '29ABCDE1234F1Z5',
      address: {
        ...invoiceDefaultValues.recipient.address,
        line1: '44 Business Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        stateCode: '29',
        postalCode: '560001',
      },
    },
    items: [{ ...invoiceDefaultItem, description: 'Consulting service', unitPrice: '1000' }],
    ...overrides,
  };
}

describe('GST invoice calculation', () => {
  it('calculates an intra-State two-unit line through the shared GST engine', () => {
    const result = calculateGstInvoice(
      validInvoice({
        items: [
          {
            ...invoiceDefaultItem,
            description: 'Service',
            quantity: '2',
            unitPrice: '1000',
            ratePresetId: 'gst-headline-rate-18',
          },
        ],
      }),
    );

    expect(result.items[0]).toMatchObject({
      grossValue: '2000.00',
      taxableValue: '2000.00',
      gstAmount: '360.00',
      cgstAmount: '180.00',
      sgstOrUtgstAmount: '180.00',
      lineTotal: '2360.00',
    });
    expect(result.totals).toMatchObject({
      taxableValue: '2000.00',
      cgstAmount: '180.00',
      sgstOrUtgstAmount: '180.00',
      gstAmount: '360.00',
      grandTotal: '2360.00',
    });
  });

  it('calculates an inter-State line after a percentage discount', () => {
    const result = calculateGstInvoice(
      validInvoice({
        supplyType: 'inter-state',
        placeOfSupply: { state: 'Karnataka', stateCode: '29' },
        items: [
          {
            ...invoiceDefaultItem,
            description: 'Equipment',
            unitPrice: '5000',
            discountType: 'percentage',
            discountValue: '10',
            ratePresetId: 'gst-headline-rate-18',
          },
        ],
      }),
    );

    expect(result.totals).toMatchObject({
      grossValue: '5000.00',
      discountAmount: '500.00',
      taxableValue: '4500.00',
      igstAmount: '810.00',
      grandTotal: '5310.00',
    });
    expect(result.totals.cgstAmount).toBe('0.00');
    expect(result.totals.sgstOrUtgstAmount).toBe('0.00');
  });

  it('groups multiple policy and custom rates and warns about custom/omitted HSN-SAC', () => {
    const result = calculateGstInvoice(
      validInvoice({
        items: [
          {
            ...invoiceDefaultItem,
            id: 'one',
            description: 'Rate five',
            unitPrice: '100',
            ratePresetId: 'gst-headline-rate-5',
          },
          {
            ...invoiceDefaultItem,
            id: 'two',
            description: 'Rate eighteen',
            unitPrice: '100',
            ratePresetId: 'gst-headline-rate-18',
            hsnOrSac: '9983',
          },
          {
            ...invoiceDefaultItem,
            id: 'three',
            description: 'Custom rate',
            unitPrice: '100',
            ratePresetId: 'custom',
            customRate: '12',
            hsnOrSac: '9983',
          },
        ],
      }),
    );

    expect(result.taxGroups.map((group) => group.ratePercent)).toEqual(['5', '18', '12']);
    expect(result.taxGroups).toHaveLength(3);
    expect(result.customRateWarning).toBe(true);
    expect(result.hsnWarning).toBe(true);
    expect(result.policy.id).toBe('gst-general-rates-2025-09-22-v1');
  });

  it('keeps amount words and filename deterministic without sensitive values', () => {
    const result = calculateGstInvoice(
      validInvoice({
        invoiceNumber: 'INV/2026-001',
        items: [{ ...invoiceDefaultItem, description: 'Item', unitPrice: '1250.50' }],
      }),
    );
    expect(result.totals.amountInWords).toContain('Rupees');
    expect(result.exportSettings.baseFilename).toBe('gst-invoice-inv-2026-001-2026-08-06');
    expect(gstInvoiceFilename('INV/2026-001', '2026-08-06')).toBe('gst-invoice-inv-2026-001-2026-08-06.pdf');
    expect(result.exportSettings.baseFilename).not.toContain('27ABCDE');
  });
});

describe('GST invoice validation', () => {
  it.each([
    ['NaN', 'unitPrice'],
    ['Infinity', 'unitPrice'],
    ['-1', 'unitPrice'],
    ['1.234', 'unitPrice'],
    ['999999999999999999', 'unitPrice'],
  ])('rejects unsafe unit price %s', (unitPrice, field) => {
    const result = validateGstInvoiceInput(
      validInvoice({ items: [{ ...invoiceDefaultItem, description: 'Item', unitPrice }] }),
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.some((error) => error.field.endsWith(field))).toBe(true);
  });

  it('rejects missing/invalid invoice and party particulars', () => {
    const result = validateGstInvoiceInput(
      validInvoice({
        invoiceNumber: 'INV #1',
        supplier: { ...validInvoice().supplier, gstin: 'not-a-gstin' },
        recipient: { ...validInvoice().recipient, gstin: '' },
        recipientRegistrationStatus: 'registered',
      }),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(['invoiceNumber', 'supplier.gstin', 'recipient.gstin']),
    );
  });

  it('requires inter-State place of supply and rejects a due date before issue date', () => {
    const result = validateGstInvoiceInput(
      validInvoice({
        supplyType: 'inter-state',
        placeOfSupply: { state: '', stateCode: '' },
        dueDate: '2026-08-05',
      }),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(['placeOfSupply.state', 'placeOfSupply.stateCode', 'dueDate']),
    );
  });

  it('rejects empty, oversized and unsafe discounts', () => {
    const empty = validateGstInvoiceInput(
      validInvoice({ items: [{ ...invoiceDefaultItem, description: '', unitPrice: '' }] }),
    );
    expect(empty.success).toBe(false);
    const oversized = validateGstInvoiceInput(
      validInvoice({
        items: [
          {
            ...invoiceDefaultItem,
            description: 'Item',
            unitPrice: '100',
            discountType: 'fixed',
            discountValue: '100',
          },
        ],
      }),
    );
    expect(oversized.success).toBe(false);
    const precise = validateGstInvoiceInput(
      validInvoice({
        items: [
          {
            ...invoiceDefaultItem,
            description: 'Item',
            unitPrice: '100',
            discountType: 'percentage',
            discountValue: '1.234',
          },
        ],
      }),
    );
    expect(precise.success).toBe(false);
  });

  it('rejects invoice dates without a reviewed policy instead of inventing historical rates', () => {
    const result = validateGstInvoiceInput(validInvoice({ invoiceDate: '2024-01-01' }));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((error) => error.code === 'policy_unavailable')).toBe(true);
  });

  it('allows an explicitly unregistered recipient without a recipient GSTIN', () => {
    const result = validateGstInvoiceInput(
      validInvoice({
        recipientRegistrationStatus: 'unregistered',
        recipient: { ...validInvoice().recipient, gstin: '' },
      }),
    );
    expect(result.success).toBe(true);
  });
});
