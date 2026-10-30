import Link from 'next/link';
import { Container, Section } from '@/components/ui/container';
import { JsonLd } from '@/components/seo/json-ld';
import { LiveToolSearch } from '@/components/search/live-tool-search';
import { ToolCard } from '@/components/ui/tool-card';
import { ToolIcon } from '@/components/ui/tool-icon';
import { toolDiscoveryIndex } from '@/domain/registry';
import { taskGroups } from '@/domain/registry/presentation';
import { StudioReveal } from '@/components/ui/studio-motion';
import { pageMetadata } from '@/lib/seo';
import { websiteStructuredData } from '@/lib/structured-data';
export const metadata = pageMetadata({
  title: 'Quotations, invoices and receipts for Indian freelancers',
  description:
    'Prepare quotations, invoices and payment receipts without creating an account. A free toolkit for Indian freelancers.',
  path: '/',
});
const quickSlugs = [
  'quotation-generator',
  'invoice-generator',
  'payment-receipt-generator',
  'emi-calculator',
  'upi-standee',
  'photo-resizer-compressor',
];
export default function HomePage() {
  return (
    <>
      <JsonLd data={websiteStructuredData()} />
      <section className="home-intro">
        <Container>
          <p className="eyebrow">For independent work in India.</p>
          <h1>From quotation to payment receipt.</h1>
          <p>Prepare quotations, invoices and payment receipts without creating an account.</p>
          <LiveToolSearch id="home-search" tools={toolDiscoveryIndex} variant="home" />
          <p className="home-reassurance">Free to use · No account needed</p>
        </Container>
      </section>
      <Container>
        <Section title="Your freelance paperwork, in order">
          <p>
            Start with a quotation, carry its details into an invoice, then create a receipt after payment.
            You review each step before exporting.
          </p>
          <div className="inline-actions">
            <Link className="button button--primary" href="/tools/quotation-generator">
              Prepare a quotation
            </Link>
            <Link className="button button--secondary" href="/freelancers">
              See the workflow
            </Link>
          </div>
        </Section>
        <Section title="Quick tools">
          <StudioReveal>
            <div className="tool-grid">
              {quickSlugs.map((slug) => {
                const tool = toolDiscoveryIndex.find((t) => t.slug === slug);
                return tool ? (
                  <ToolCard
                    key={slug}
                    href={`/tools/${slug}`}
                    name={tool.name}
                    summary={tool.summary}
                    presentation={tool.presentation}
                    categoryLabel={tool.categoryLabel}
                    featured
                    lifecycle={tool.lifecycle}
                    executionMode={tool.executionMode}
                  />
                ) : null;
              })}
            </div>
          </StudioReveal>
          <Link className="text-link browse-all" href="/tools">
            See all tools →
          </Link>
        </Section>
        <Section title="What are you working on?">
          <div className="category-grid compact-categories">
            {taskGroups.map((group) => (
              <Link className="category-tile" key={group.id} href={`/tools?group=${group.id}`}>
                <ToolIcon category={group.id} />
                <span>
                  <strong>{group.name}</strong>
                  <small>{group.description}</small>
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </Section>
      </Container>
    </>
  );
}
