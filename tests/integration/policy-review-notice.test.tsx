import { afterEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PolicyReviewNotice } from '@/components/tooling/policy-review-notice';

afterEach(() => vi.useRealTimers());

it('keeps overdue calculators mounted and clears the notice after a current review', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-30T08:00:00Z'));
  const { rerender } = render(
    <PolicyReviewNotice toolId="income-tax-calculator" lastVerified="2026-08-09" cadenceDays={30}>
      <button>Calculate tax</button>
    </PolicyReviewNotice>,
  );
  expect(screen.getByText(/Using bundled reference rates/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Calculate tax' })).toBeInTheDocument();
  const calculateButton = screen.getByRole('button', { name: 'Calculate tax' });
  rerender(
    <PolicyReviewNotice toolId="income-tax-calculator" lastVerified="2026-10-29" cadenceDays={30}>
      <button>Calculate tax</button>
    </PolicyReviewNotice>,
  );
  expect(screen.queryByText(/Using bundled reference rates/)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Calculate tax' })).toBe(calculateButton);
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
  expect(screen.getByText(/Using bundled reference rates/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Calculate fees' })).toBeInTheDocument();
});
