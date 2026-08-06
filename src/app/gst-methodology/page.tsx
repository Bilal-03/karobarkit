import { InfoPage } from '@/components/layout/info-page';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'GST Calculator methodology',
  description: 'Read the GST Calculator formulas, rounding rules, policy scope and supply-type limitations.',
  path: '/gst-methodology',
});

export default function GstMethodologyPage() {
  return (
    <InfoPage
      eyebrow="GST Calculator"
      title="GST methodology and limits"
      intro="This page explains the arithmetic and the boundaries around it. It is not a rate finder, classification service or tax advice."
    >
      <div className="prose">
        <section>
          <h2>Exclusive and inclusive formulas</h2>
          <p>
            <strong>Exclusive:</strong> GST = taxable value × rate ÷ 100; total = taxable value + GST.
          </p>
          <p>
            <strong>Inclusive:</strong> taxable value = entered total ÷ (1 + rate ÷ 100); GST = entered total
            − taxable value.
          </p>
        </section>
        <section>
          <h2>Tax components</h2>
          <p>
            Intra-state results split the displayed GST into CGST and a remainder labelled SGST/UTGST. The
            tool does not determine which jurisdictional component applies. Inter-state results show the
            displayed GST as IGST. “Tax split not required” shows total GST only.
          </p>
        </section>
        <section>
          <h2>Precision and reconciliation</h2>
          <ul>
            <li>
              Currency input is positive, finite, at most two decimal places and capped at
              ₹999,999,999,999,999.99.
            </li>
            <li>Custom rates allow 0% through 100% with at most two decimal places.</li>
            <li>
              Decimal.js performs internal arithmetic. Currency values use half-up rounding to two decimals.
            </li>
            <li>
              Exclusive mode rounds GST before adding it. Inclusive mode rounds taxable value and derives GST
              as the total remainder.
            </li>
            <li>
              For a split, the second component is the rounded-total remainder so displayed components
              reconcile exactly.
            </li>
          </ul>
        </section>
        <section>
          <h2>What the calculator does not decide</h2>
          <p>
            It does not decide taxability, product or service classification, HSN/SAC, exemption, reverse
            charge, ITC, compensation cess, registration, filing, export treatment, e-invoice or e-way-bill
            applicability, or legal place of supply. Verify the applicable source and transaction facts
            independently.
          </p>
        </section>
      </div>
    </InfoPage>
  );
}
