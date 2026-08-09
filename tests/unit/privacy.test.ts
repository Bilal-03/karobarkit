import { describe, expect, it, vi } from 'vitest';

import { trackEvent } from '@/lib/analytics';

describe('privacy-safe analytics boundary', () => {
  it('removes calculator values from browser analytics events', () => {
    const handler = vi.fn();
    window.addEventListener('karobarkit:analytics', handler);

    trackEvent('tool_completed', {
      toolId: 'roi-calculator',
      category: 'financial-calculators',
      investmentCost: '100000',
      finalValue: '125000',
      profit: '25000',
      percentage: '25',
      url: 'https://private.example.com',
      upiId: 'private@bank',
      payeeName: 'Private Shop',
      note: 'private note',
      payload: 'upi://pay?pa=private%40bank',
      rawInput: 'private input',
      amount: '1234.56',
      taxableValue: '1175.77',
      totalAmount: '1234.56',
      ratePercent: '5',
      customRate: '5.5',
      ratePresetId: 'gst-headline-rate-5',
      cgstAmount: '29.39',
      sgstOrUtgstAmount: '29.40',
      igstAmount: '58.79',
      supplyType: 'intra-state',
      calculationMode: 'exclusive',
      policyVersion: 'gst-general-rates-2025-09-22-v1',
      revenue: '100000',
      totalCost: '70000',
      targetMargin: '40',
      currentCash: '900000',
      rtoRate: '8',
    });

    const event = handler.mock.calls[0]?.[0] as CustomEvent;
    expect(event.detail.properties).toEqual({
      toolId: 'roi-calculator',
      category: 'financial-calculators',
    });

    window.removeEventListener('karobarkit:analytics', handler);
  });
});
