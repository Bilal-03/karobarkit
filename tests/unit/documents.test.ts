import { describe, expect, it } from 'vitest';

import {
  amountToIndianWords,
  formatDocumentAmount,
  formatDocumentDate,
  splitTextIntoPages,
} from '@/domain/documents/formatting';
import { processLogoFile } from '@/domain/documents/logo';
import {
  businessCardDefaultValues,
  calculateBusinessCard,
  validateBusinessCardInput,
} from '@/domain/documents/business-card';
import {
  calculateLetterhead,
  letterheadDefaultValues,
  validateLetterheadInput,
} from '@/domain/documents/letterhead';
import {
  calculatePaymentReceipt,
  paymentReceiptDefaultValues,
  validatePaymentReceiptInput,
} from '@/domain/documents/payment-receipt';
import {
  calculateInvoice,
  invoiceDefaultValues,
  invoiceToReceiptTransferValues,
  invoiceToUpiTransferValues,
  validateInvoiceInput,
} from '@/domain/documents/invoice';
import {
  calculateQuotation,
  quotationDefaultValues,
  quotationToInvoiceTransferValues,
  validateQuotationInput,
} from '@/domain/documents/quotation';
import {
  createInvoiceNumber,
  invoiceNumberDefaultValues,
  validateInvoiceNumberInput,
} from '@/domain/documents/sequence';
import { safeFilename } from '@/lib/security/safe-filename';

describe('shared document formatting', () => {
  it('converts Indian currency amounts to deterministic words', () => {
    expect(amountToIndianWords('1250.00')).toBe('One Thousand Two Hundred Fifty Rupees Only');
    expect(amountToIndianWords('1250.50')).toBe('One Thousand Two Hundred Fifty Rupees and Fifty Paise Only');
    expect(amountToIndianWords('100000')).toBe('One Lakh Rupees Only');
    expect(amountToIndianWords('999999999999999.99')).toContain('Paise Only');
  });

  it('formats receipt values with Indian grouping and a timezone-safe date', () => {
    expect(formatDocumentAmount('1250.5')).toBe('₹1,250.50');
    expect(formatDocumentDate('2026-08-06')).toBe('6 August 2026');
  });

  it('splits long letter text into deterministic pages without discarding paragraphs', () => {
    const pages = splitTextIntoPages('First paragraph\n\nSecond paragraph', 18);
    expect(pages).toEqual(['First paragraph', 'Second paragraph']);
  });

  it('creates safe filenames without paths or unsafe characters', () => {
    expect(safeFilename('../Receipt: August 2026', 'document', 'pdf')).toBe('receipt-august-2026.pdf');
    expect(safeFilename('***', 'KarobarKit document', '.PDF')).toBe('karobarkit-document.pdf');
  });
});

describe('letterhead validation and mapping', () => {
  it('requires business name and address while preserving Unicode and multiline content', () => {
    const invalid = validateLetterheadInput({
      ...letterheadDefaultValues,
      businessName: '',
      businessAddress: '',
    });
    expect(invalid.success).toBe(false);
    if (invalid.success) return;
    expect(invalid.errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(['businessName', 'businessAddress']),
    );

    const valid = validateLetterheadInput({
      ...letterheadDefaultValues,
      businessName: 'नमस्ते Studio',
      businessAddress: '12 Market Road\nPune, Maharashtra',
      email: 'hello@example.com',
      website: 'example.com',
      body: '<not html>\n\nSecond paragraph',
    });
    expect(valid.success).toBe(true);
    if (!valid.success) return;
    expect(valid.data.website).toBe('https://example.com/');
    const document = calculateLetterhead(valid.data);
    expect(document.identity.name).toBe('नमस्ते Studio');
    expect(document.identity.address.text).toContain('Pune');
    expect(document.bodyPages).toEqual(['<not html>\n\nSecond paragraph']);
  });

  it('rejects invalid email and unsafe website protocols', () => {
    const result = validateLetterheadInput({
      ...letterheadDefaultValues,
      businessName: 'A business',
      businessAddress: 'Somewhere',
      email: 'not-an-email',
      website: 'javascript:alert(1)',
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.map((error) => error.field)).toEqual(expect.arrayContaining(['email', 'website']));
  });
});

describe('payment receipt validation and mapping', () => {
  const minimumReceipt = {
    ...paymentReceiptDefaultValues,
    businessName: 'Ravi & Sons',
    businessAddress: 'Market Road, Pune',
    receiptNumber: 'RCPT/2026-001',
    receiptDate: '2026-08-06',
    receivedFrom: 'निखिल',
    amount: '1250.50',
    paymentPurpose: 'Consulting retainer',
    paymentNote: '',
  };

  it('maps required and optional fields into a receipt document', () => {
    const result = validatePaymentReceiptInput(minimumReceipt);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const document = calculatePaymentReceipt({ ...result.data, paymentMethod: 'upi' });
    expect(document.metadata.number).toBe('RCPT/2026-001');
    expect(document.recipient.name).toBe('निखिल');
    expect(document.monetaryValue.formatted).toBe('₹1,250.50');
    expect(document.monetaryValue.inWords).toBe('One Thousand Two Hundred Fifty Rupees and Fifty Paise Only');
    expect(document.paymentNote).toBe('');
  });

  it.each(['0', '-1', 'NaN', 'Infinity', '1.234', '9999999999999999'])(
    'rejects unsafe amount %s',
    (amount) => {
      const result = validatePaymentReceiptInput({ ...minimumReceipt, amount });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.errors.some((error) => error.field === 'amount')).toBe(true);
    },
  );

  it('rejects invalid dates and receipt-number punctuation', () => {
    const result = validatePaymentReceiptInput({
      ...minimumReceipt,
      receiptDate: '2026-02-30',
      receiptNumber: 'RCPT#1',
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(['receiptDate', 'receiptNumber']),
    );
  });
});

describe('logo validation', () => {
  it('rejects SVG and mismatched or malformed raster uploads', async () => {
    const svg = new File(['<svg></svg>'], 'logo.svg', { type: 'image/svg+xml' });
    await expect(processLogoFile(svg)).rejects.toThrow(/PNG, JPEG or WebP/iu);

    const fakePng = new File(['not a png'], 'logo.png', { type: 'image/png' });
    await expect(processLogoFile(fakePng)).rejects.toThrow(/valid image signature/iu);
  });
});

describe('quotation, card and sequence workflows', () => {
  const minimumQuotation = {
    ...quotationDefaultValues,
    businessName: 'Ravi & Sons',
    businessAddress: 'Market Road, Pune',
    quoteNumber: 'QT/2026-001',
    quoteDate: '2026-08-06',
    validUntil: '2026-08-20',
    customerName: 'Nikhil Foods',
    customerAddress: 'Pune, Maharashtra',
    items: [
      {
        ...quotationDefaultValues.items[0],
        description: 'Consulting retainer',
        quantity: '2',
        unitPrice: '1000',
        discountType: 'fixed' as const,
        discountValue: '100',
      },
    ],
  };

  it('calculates quotation totals without implying GST treatment', () => {
    const validation = validateQuotationInput(minimumQuotation);
    expect(validation.success).toBe(true);
    if (!validation.success) return;
    const document = calculateQuotation(validation.data);
    expect(document.totals.subtotal).toBe('1900.00');
    expect(document.totals.amountInWords).toContain('One Thousand Nine Hundred Rupees');
    expect(document.type).toBe('quotation');
    expect(quotationToInvoiceTransferValues(document).itemsJson).toContain('Consulting retainer');
  });

  it('rejects quotation dates and discounts that are not safe', () => {
    const invalid = validateQuotationInput({
      ...minimumQuotation,
      validUntil: '2026-08-01',
      items: [{ ...minimumQuotation.items[0], discountValue: '2000' }],
    });
    expect(invalid.success).toBe(false);
    if (invalid.success) return;
    expect(invalid.errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(['validUntil', 'items.0.discountValue']),
    );
  });

  it('creates a business-card document while keeping contact details local', () => {
    const validation = validateBusinessCardInput({
      ...businessCardDefaultValues,
      businessName: 'Ravi & Sons',
      businessAddress: 'Market Road',
      personName: 'Nikhil Sharma',
      cardEmail: 'nikhil@example.com',
    });
    expect(validation.success).toBe(true);
    if (!validation.success) return;
    const document = calculateBusinessCard(validation.data);
    expect(document.personName).toBe('Nikhil Sharma');
    expect(document.contact.email).toBe('nikhil@example.com');
  });

  it('rejects unsafe business-card website protocols', () => {
    const validation = validateBusinessCardInput({
      ...businessCardDefaultValues,
      businessName: 'Ravi & Sons',
      businessAddress: 'Market Road',
      personName: 'Nikhil Sharma',
      cardWebsite: 'javascript:alert(1)',
    });
    expect(validation.success).toBe(false);
    if (validation.success) return;
    expect(validation.errors.some((error) => error.field === 'cardWebsite')).toBe(true);
  });

  it('formats invoice numbers and rejects invalid sequence input', () => {
    const result = createInvoiceNumber(invoiceNumberDefaultValues);
    expect(result.value).toBe('INV/2026-27/0001');
    const invalid = validateInvoiceNumberInput({ ...invoiceNumberDefaultValues, nextNumber: '0' });
    expect(invalid.success).toBe(false);
  });

  it('creates a non-GST invoice with commercial totals and explicit handoff values', () => {
    const input = {
      ...invoiceDefaultValues,
      businessName: 'Ravi & Sons',
      businessAddress: 'Market Road, Pune',
      invoiceNumber: 'INV/2026-001',
      invoiceDate: '2026-08-06',
      dueDate: '2026-08-20',
      customerName: 'Nikhil Foods',
      items: [
        {
          ...invoiceDefaultValues.items[0],
          description: 'Consulting retainer',
          quantity: '2',
          unitPrice: '1000',
          discountType: 'fixed' as const,
          discountValue: '100',
        },
      ],
      paymentDetails: 'Pay by bank transfer after review.',
    };
    const validation = validateInvoiceInput(input);
    expect(validation.success).toBe(true);
    if (!validation.success) return;
    const document = calculateInvoice(validation.data);
    expect(document.type).toBe('invoice');
    expect(document.totals.subtotal).toBe('1900.00');
    expect(document.displayDueDate).toBe('20 August 2026');
    expect(document.paymentDetails).toContain('bank transfer');
    expect(invoiceToReceiptTransferValues(document).amount).toBe('1900.00');
    expect(invoiceToUpiTransferValues(document)).toEqual({
      amount: '1900.00',
      note: 'Invoice INV/2026-001',
    });
  });

  it('rejects a due date before the invoice date and unsafe invoice number', () => {
    const validation = validateInvoiceInput({
      ...invoiceDefaultValues,
      businessName: 'Ravi & Sons',
      businessAddress: 'Market Road',
      invoiceNumber: 'INV#1',
      invoiceDate: '2026-08-06',
      dueDate: '2026-08-01',
      customerName: 'Nikhil Foods',
      items: [
        {
          ...invoiceDefaultValues.items[0],
          description: 'Service',
          unitPrice: '100',
        },
      ],
    });
    expect(validation.success).toBe(false);
    if (validation.success) return;
    expect(validation.errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(['invoiceNumber', 'dueDate']),
    );
  });
});
