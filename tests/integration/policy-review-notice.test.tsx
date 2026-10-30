import { afterEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PolicyReviewNotice } from '@/components/tooling/policy-review-notice';

afterEach(() => vi.useRealTimers());

it('warns before an overdue regulated calculation and clears after a current review', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-30T08:00:00Z'));
  const { rerender } = render(
    <PolicyReviewNotice toolId="income-tax-calculator" lastVerified="2026-08-09" cadenceDays={30}>
      <button>Calculate tax</button>
    </PolicyReviewNotice>,
  );
  expect(screen.getByText(/Temporarily unavailable/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Calculate tax' })).not.toBeInTheDocument();
  rerender(
    <PolicyReviewNotice toolId="income-tax-calculator" lastVerified="2026-10-29" cadenceDays={30}>
      <button>Calculate tax</button>
    </PolicyReviewNotice>,
  );
  expect(screen.queryByText(/Temporarily unavailable/)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Calculate tax' })).toBeInTheDocument();
});

it('keeps a seller-input calculator available with an overdue-fee warning', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-30T08:00:00Z'));
  render(
    <PolicyReviewNotice toolId="amazon-fees-calculator" lastVerified="2026-08-10" cadenceDays={30}>
      <button>Calculate fees</button>
    </PolicyReviewNotice>,
  );
  expect(screen.getByText(/Bundled fee review overdue/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Calculate fees' })).toBeInTheDocument();
});
