import { describe, expect, it } from 'vitest';
import { blankDocument, localDocumentDate } from '@/domain/documents/starting-values';
import { quotationDefaultValues } from '@/domain/documents/quotation';
import { invoiceDefaultValues } from '@/domain/invoices/constants';
import { paymentReceiptDefaultValues } from '@/domain/documents/payment-receipt';

describe('real document starting values', () => {
  it('removes demo identities, financial amounts and stale dates while keeping structural defaults', () => {
    const blank = blankDocument(quotationDefaultValues, '2026-11-01');
    expect(blank).toMatchObject({
      businessName: '',
      customerName: '',
      phone: '',
      email: '',
      quoteNumber: '',
      quoteDate: '2026-11-01',
      validUntil: '',
      notes: '',
      terms: '',
      signatoryName: '',
    });
    expect(blank.items[0]).toMatchObject({
      quantity: '1',
      description: '',
      unitPrice: '',
      discountType: 'none',
    });
    expect(quotationDefaultValues.businessName).toBe('KarobarKit Demo');
  });
  it('does not preselect a demo GST rate, place of supply or customer registration details', () => {
    const blank = blankDocument(invoiceDefaultValues, '2026-11-01');
    expect(blank.supplier.legalName).toBe('');
    expect(blank.supplier.gstin).toBe('');
    expect(blank.placeOfSupply).toEqual({ state: '', stateCode: '' });
    expect(blank.items[0].ratePresetId).toBe('');
    expect(blank.paymentDetails).toBe('');
    expect(blank.supplier.address.country).toBe('India');
  });
  it('clears payment acknowledgements and uses the local calendar date', () => {
    const blank = blankDocument(paymentReceiptDefaultValues, '2026-11-01');
    expect(blank).toMatchObject({
      receivedFrom: '',
      amount: '',
      receiptNumber: '',
      receiptDate: '2026-11-01',
      transactionReference: '',
      invoiceReference: '',
    });
    expect(localDocumentDate(new Date(2026, 10, 1, 0, 5))).toBe('2026-11-01');
  });
});
