import { describe, expect, it } from 'vitest';

import {
  calculateDeliveryChallan,
  calculateLeaveBalance,
  calculateMenu,
  calculateNoticePeriod,
  calculatePriceTag,
  calculatePurchaseOrder,
  calculateRentReceipt,
  calculateShippingLabel,
  calculateWageSlip,
  isWorkplaceDocument,
  validateMenuInput,
} from '@/domain/documents/workplace';

describe('retail and workplace document engines', () => {
  it('calculates a declared price-tag discount and protects the MRP boundary', () => {
    const result = calculatePriceTag({
      businessName: 'Shop',
      productName: 'Notebook',
      mrp: '1000',
      offerPrice: '900',
      sku: 'NB-1',
      barcode: '',
      pageProfile: 'label-sheet-a4',
      footerText: '',
    });
    expect(result.metadata.Discount).toBe('10%');
    expect(result.pageProfile).toBe('label-sheet-a4');
    expect(() =>
      calculatePriceTag({
        businessName: 'Shop',
        productName: 'Notebook',
        mrp: '100',
        offerPrice: '101',
        sku: '',
        barcode: '',
        pageProfile: 'a4',
        footerText: '',
      }),
    ).toThrow('Offer price cannot be greater than MRP');
  });

  it('keeps delivery and shipping documents explicitly draft and local', () => {
    const challan = calculateDeliveryChallan({
      consignor: 'Shop',
      consignee: 'Warehouse',
      itemsText: 'Boxes\nLabels',
      reason: 'Stock transfer',
      vehicleNumber: 'KA01AA1234',
      issueDate: '2026-08-11',
      deliveryDate: '2026-08-12',
      pageProfile: 'a4',
      footerText: '',
    });
    const label = calculateShippingLabel({
      senderName: 'Shop',
      senderAddress: '1 Main Street',
      senderPhone: '',
      recipientName: 'Customer',
      recipientAddress: '2 Market Road',
      recipientPhone: '',
      orderReference: 'ORD-1',
      parcelCount: '1',
      weight: '2 kg',
      barcode: 'ORD-1',
      pageProfile: 'label-4x6',
      footerText: '',
    });
    expect(challan.statusLabel).toBe('Draft');
    expect(challan.disclaimer).toContain('e-way bill');
    expect(label.pageProfile).toBe('label-4x6');
    expect(label.disclaimer).toContain('carrier-issued');
  });

  it('calculates purchase-order tax only when declared and produces words', () => {
    const result = calculatePurchaseOrder({
      buyerName: 'Buyer',
      buyerAddress: 'Buyer address',
      supplierName: 'Supplier',
      supplierAddress: 'Supplier address',
      poNumber: 'PO-1',
      poDate: '2026-08-11',
      items: [{ description: 'Item', quantity: '2', unit: 'pcs', unitPrice: '100', taxRate: '5' }],
      taxDisplay: 'declared',
      terms: '',
      pageProfile: 'a4',
      footerText: '',
    });
    expect(result.totals).toMatchObject({ subtotal: '200', tax: '10', grandTotal: '210' });
    expect(result.totals?.amountInWords).toBeTruthy();
    expect(result.statusLabel).toBe('Prepared purchase order');
  });

  it('keeps menu QR destinations safe and does not claim live publishing', () => {
    const result = calculateMenu({
      businessName: 'Cafe',
      address: 'Main Road',
      phone: '9999999999',
      sections: [{ heading: 'Tea', items: [{ name: 'Masala tea', price: '40', note: '' }] }],
      includeQr: true,
      qrUrl: 'menu.example.com',
      pageProfile: 'a4',
      footerText: '',
    });
    expect(result.qrPayload).toBe('https://menu.example.com/');
    expect(result.disclaimer).toContain('does not publish');
    expect(
      validateMenuInput({
        businessName: 'Cafe',
        address: '',
        phone: '',
        sections: [{ heading: 'Tea', items: [{ name: 'Tea', price: '', note: '' }] }],
        includeQr: true,
        qrUrl: 'javascript:alert(1)',
        pageProfile: 'a4',
        footerText: '',
      }).success,
    ).toBe(false);
  });

  it('keeps declared wage and rent outputs outside statutory or payment claims', () => {
    const wage = calculateWageSlip({
      employerName: 'Employer',
      workerName: 'Worker',
      period: 'Aug 2026',
      grossEarnings: '10000',
      deductions: '500',
      pageProfile: 'thermal-80',
      footerText: '',
    });
    const rent = calculateRentReceipt({
      landlordName: 'Landlord',
      tenantName: 'Tenant',
      propertyAddress: 'Flat 1',
      period: 'Aug 2026',
      amount: '10000',
      receiptNumber: 'RR-1',
      date: '2026-08-11',
      pageProfile: 'a4',
      footerText: '',
    });
    expect(wage.totals?.grandTotal).toBe('9500');
    expect(wage.disclaimer).toContain('statutory payroll');
    expect(rent.totals?.grandTotal).toBe('10000');
    expect(rent.disclaimer).toContain('payment proof');
  });

  it('counts calendar and business-day notice rules without an approximation window', () => {
    const calendar = calculateNoticePeriod({
      startDate: '2026-08-11',
      noticeDays: '30',
      rule: 'calendar',
      includeStart: true,
      weekendPattern: 'saturday-sunday',
      customHolidays: '',
    });
    expect(calendar.endDate).toBe('2026-09-09');
    expect(calendar.calendarDays).toBe(30);
    const business = calculateNoticePeriod({
      startDate: '2026-08-14',
      noticeDays: '3',
      rule: 'business-days',
      includeStart: true,
      weekendPattern: 'saturday-sunday',
      customHolidays: '',
    });
    expect(business.endDate).toBe('2026-08-18');
    const holiday = calculateNoticePeriod({
      startDate: '2026-08-14',
      noticeDays: '3',
      rule: 'business-days',
      includeStart: true,
      weekendPattern: 'saturday-sunday',
      customHolidays: '2026-08-17',
    });
    expect(holiday.endDate).toBe('2026-08-19');
    expect(holiday.excludedDays).toContain('2026-08-17');
  });

  it('applies selected leave proration and rejects reversed or over-used balances', () => {
    const monthly = calculateLeaveBalance({
      annualQuota: '24',
      joiningDate: '2026-01-01',
      asOfDate: '2026-08-11',
      usedLeave: '4',
      proration: 'monthly',
    });
    expect(monthly.earnedLeave).toBe('16');
    expect(monthly.remainingLeave).toBe('12');
    expect(() =>
      calculateLeaveBalance({
        annualQuota: '24',
        joiningDate: '2026-08-11',
        asOfDate: '2026-08-10',
        usedLeave: '0',
        proration: 'none',
      }),
    ).toThrow('cannot be before');
    expect(() =>
      calculateLeaveBalance({
        annualQuota: '1',
        joiningDate: '2026-01-01',
        asOfDate: '2026-01-01',
        usedLeave: '2',
        proration: 'none',
      }),
    ).toThrow('cannot exceed');
  });

  it('identifies workplace documents for the shared preview and export boundary', () => {
    const document = calculatePriceTag({
      businessName: 'Shop',
      productName: 'Item',
      mrp: '10',
      offerPrice: '10',
      sku: '',
      barcode: '',
      pageProfile: 'a4',
      footerText: '',
    });
    expect(isWorkplaceDocument(document)).toBe(true);
    expect(isWorkplaceDocument({ type: 'invoice' })).toBe(false);
  });
});
