'use client';

import { useSyncExternalStore, type ReactNode } from 'react';

const policyTools = new Set([
  'hra-calculator',
  'gst-invoice-generator',
  'income-tax-calculator',
  'tds-calculator',
  'corporate-tax-calculator',
  'presumptive-tax-calculator',
  'in-hand-salary-calculator',
  'gst-filing-due-date-calendar',
  'ctc-calculator',
  'pf-calculator',
  'gratuity-calculator',
  'hsn-sac-finder',
  'depreciation-calculator',
  'professional-tax-calculator',
  'msme-late-payment-interest-calculator',
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
  const showNotice = overdue && (policyTools.has(toolId) || manualOverrideTools.has(toolId));
  return (
    <>
      {showNotice ? (
        <div className="notice" role="status">
          <strong>Using bundled reference rates.</strong> Last reviewed {lastVerified}. Calculations remain
          available for this project; the bundled rules may not include later changes.
          {manualOverrideTools.has(toolId) && ' You can enter current seller-dashboard fees as overrides.'}
        </div>
      ) : null}
      {children}
    </>
  );
}
