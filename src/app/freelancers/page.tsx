import Link from 'next/link';
import { InfoPage } from '@/components/layout/info-page';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Paperwork for Indian freelancers',
  description:
    'Prepare a quotation, turn it into an invoice, and acknowledge payment with a receipt. No account needed.',
  path: '/freelancers',
});

export default function FreelancersPage() {
  return (
    <InfoPage
      eyebrow="For Indian freelancers"
      title="One job. Less repeated paperwork."
      intro="Prepare a quotation, turn it into an invoice, then acknowledge payment with a receipt. No account needed."
    >
      <div className="prose">
        <h2>1. Agree on the work</h2>
        <p>
          Create a quotation with your services, quantities and terms. Download it for your client. After
          acceptance, use “Continue to invoice” from the preview to carry the details forward.
        </p>
        <Link className="button button--primary" href="/tools/quotation-generator">
          Prepare a quotation
        </Link>
        <h2>2. Issue an invoice</h2>
        <p>
          Choose to import the quotation, review the carried details and add the invoice number and dates. Use
          the GST invoice tool only when appropriate to your registration and transaction. Creating a draft
          does not send it to your client.
        </p>
        <Link href="/tools/invoice-generator">Prepare an invoice</Link>
        <h2>3. Acknowledge payment</h2>
        <p>
          After receiving payment, continue from the invoice preview to a payment receipt. Review the amount
          and payment details before exporting. A receipt draft does not collect or verify payment.
        </p>
        <Link href="/tools/payment-receipt-generator">Prepare a payment receipt</Link>
        <h2>Your details stay with you</h2>
        <p>
          Documents are prepared in your browser. Handoffs use temporary storage in this tab and require an
          explicit import. Keep your downloaded copies; this is not an account or a permanent document
          archive.
        </p>
        <h2>Help improve this workflow</h2>
        <p>
          We are testing whether this workflow helps freelancers with real paperwork. Share where you got
          stuck or what you needed to repeat. Please leave out client details, financial records and document
          contents.
        </p>
        <Link href="/contact">Share feedback or volunteer for a short usability session</Link>
        <p>
          <Link href="/tools">Browse the full business toolkit</Link>
        </p>
      </div>
    </InfoPage>
  );
}
