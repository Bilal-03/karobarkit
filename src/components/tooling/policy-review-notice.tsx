'use client';

import { useSyncExternalStore, type ReactNode } from 'react';

const blockedTools = new Set([
  'hra-calculator',
  'income-tax-calculator',
  'tds-calculator',
  'corporate-tax-calculator',
  'presumptive-tax-calculator',
  'in-hand-salary-calculator',
  'gst-filing-due-date-calendar',
]);
const manualOverrideTools = new Set(['amazon-fees-calculator', 'flipkart-fees-calculator']);

function reviewDueOn(lastVerified: string, cadenceDays: number) {
  const date = new Date(`${lastVerified}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || cadenceDays < 1) return null;
  date.setUTCDate(date.getUTCDate() + cadenceDays);
  return date.toISOString().slice(0, 10);
}

export function PolicyReviewNotice({
  toolId,
  lastVerified,
  cadenceDays,
  children,
}: {
  toolId: string;
  lastVerified: string;
  cadenceDays: number;
  children?: ReactNode;
}) {
  const overdue = useSyncExternalStore(
    (notify) => {
      const timer = window.setInterval(notify, 60_000);
      return () => window.clearInterval(timer);
    },
    () => {
      const due = reviewDueOn(lastVerified, cadenceDays);
      const today = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      return Boolean(due && today > due);
    },
    () => false,
  );
  if (!overdue) return children ?? null;
  if (blockedTools.has(toolId))
    return (
      <div className="notice" role="status">
        <strong>Temporarily unavailable.</strong> This calculator needs a current official policy review
        before it can provide an estimate. Please use the relevant official portal for current obligations.
      </div>
    );
  if (manualOverrideTools.has(toolId))
    return (
      <>
        <div className="notice" role="status">
          <strong>Bundled fee review overdue.</strong> Enter the current fixed or closing fee from your seller
          dashboard. The older bundled fee cannot be used for a current estimate.
        </div>
        {children}
      </>
    );
  return children ?? null;
}
