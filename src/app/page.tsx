import Link from 'next/link';
import { Container, Section } from '@/components/ui/container';
import { JsonLd } from '@/components/seo/json-ld';
import { SavedDrafts } from '@/components/workspace/saved-drafts';
import { pageMetadata } from '@/lib/seo';
import { websiteStructuredData } from '@/lib/structured-data';
export const metadata = pageMetadata({
  title: 'Simple business paperwork, pricing and payments',
  description: 'Simple tools for your everyday business paperwork, pricing, and payments. No account needed.',
  path: '/',
});
const tasks = [
  ['Create an invoice', 'Prepare a clear invoice for your customer.', 'invoice-generator'],
  ['Prepare a quotation', 'Send an itemised offer before work begins.', 'quotation-generator'],
  ['Make a payment receipt', 'Acknowledge a payment you have received.', 'payment-receipt-generator'],
  ['Create a UPI payment QR', 'Make a payment QR to share or print.', 'upi-standee'],
  ['Calculate selling price', 'Work out a price from your costs and margin.', 'pricing-calculator'],
  ['Add or remove GST', 'See the tax amount and total clearly.', 'gst-calculator'],
];
export default function HomePage() {
  return (
    <>
      <JsonLd data={websiteStructuredData()} />
      <Container>
        <section className="business-home-intro">
          <p className="eyebrow">For small businesses and freelancers in India</p>
          <h1>Everyday business, made simpler.</h1>
          <p>Simple tools for your everyday business paperwork, pricing, and payments. No account needed.</p>
        </section>
        <section aria-label="Everyday business tasks" className="business-task-grid">
          {tasks.map(([title, text, slug]) => (
            <Link className="business-task-card" href={`/tools/${slug}`} key={slug}>
              <h2>
                {title}
                <span aria-hidden="true"> ↗</span>
              </h2>
              <p>{text}</p>
            </Link>
          ))}
        </section>
        <Section title="Saved drafts on this device">
          <SavedDrafts compact />
        </Section>
        <p>
          <Link className="text-link" href="/tools">
            Browse all tools →
          </Link>
        </p>
      </Container>
    </>
  );
}
