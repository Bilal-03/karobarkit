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
      rawInput: 'private input',
    });

    const event = handler.mock.calls[0]?.[0] as CustomEvent;
    expect(event.detail.properties).toEqual({
      toolId: 'roi-calculator',
      category: 'financial-calculators',
    });

    window.removeEventListener('karobarkit:analytics', handler);
  });
});
