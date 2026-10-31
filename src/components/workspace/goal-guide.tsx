'use client';
import { useState } from 'react';
import Link from 'next/link';
const journeys = {
  pricing: {
    label: 'Price a service or product',
    why: 'Compare price, costs and discounts before preparing an offer.',
    steps: [
      ['Compare offers', '/decision-workbench'],
      ['Prepare a quotation', '/tools/quotation-generator'],
    ],
  },
  documents: {
    label: 'Prepare client paperwork',
    why: 'Review details at each step. Use the preview actions to carry quotation details into an invoice, then into a receipt after payment.',
    steps: [
      ['Prepare a quotation', '/tools/quotation-generator'],
      ['Prepare an invoice', '/tools/invoice-generator'],
      ['Acknowledge payment', '/tools/payment-receipt-generator'],
    ],
  },
  profit: {
    label: 'Understand profit on an order',
    why: 'Start with comparable price and costs. Then check the full-period contribution and break-even volume.',
    steps: [
      ['Compare cost and price assumptions', '/decision-workbench'],
      ['Check period margin', '/tools/margin-calculator'],
      ['Check break-even', '/tools/break-even-calculator'],
    ],
  },
  scenarios: {
    label: 'Compare business scenarios',
    why: 'Change one assumption at a time and inspect downside cases. Save comparisons only if useful.',
    steps: [
      ['Open decision workbench', '/decision-workbench'],
      ['Manage saved scenarios', '/workspace'],
    ],
  },
};
export function GoalGuide() {
  const [goal, setGoal] = useState<keyof typeof journeys>('documents');
  const journey = journeys[goal];
  return (
    <div>
      <label className="field" htmlFor="work-goal">
        What would you like to accomplish?
      </label>
      <select
        id="work-goal"
        className="input"
        value={goal}
        onChange={(e) => setGoal(e.target.value as keyof typeof journeys)}
      >
        {Object.entries(journeys).map(([key, j]) => (
          <option key={key} value={key}>
            {j.label}
          </option>
        ))}
      </select>
      <section aria-live="polite">
        <h2>{journey.label}</h2>
        <p>{journey.why}</p>
        <ol>
          {journey.steps.map(([label, path]) => (
            <li key={path}>
              <Link href={path}>{label}</Link>
            </li>
          ))}
        </ol>
      </section>
      <p>
        These are suggested steps, not requirements. You can skip directly to any step or{' '}
        <Link href="/tools">browse all tools</Link>. Calculator values are not copied automatically. Document
        previews offer explicit local handoffs; the next form asks you to review and import them.
      </p>
      <p>
        <Link href="/workspace">Optional device workspace</Link> can reuse business details and document
        drafts without an account.
      </p>
    </div>
  );
}
