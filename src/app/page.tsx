import Link from 'next/link';

import { Container, Section } from '@/components/ui/container';
import { BrandIcon } from '@/components/layout/brand-lockup';
import { JsonLd } from '@/components/seo/json-ld';
import { LiveToolSearch } from '@/components/search/live-tool-search';
import { ToolCard } from '@/components/ui/tool-card';
import { PrivacyBlock } from '@/components/ui/trust-blocks';
import { getFeaturedTools } from '@/domain/discovery';
import {
  categoryRegistry,
  getToolsByCategory,
  letterheadTool,
  paymentReceiptTool,
  toolDiscoveryIndex,
  upiStandeeTool,
  urlQrTool,
} from '@/domain/registry';
import { pageMetadata } from '@/lib/seo';
import { websiteStructuredData } from '@/lib/structured-data';

export const metadata = pageMetadata({
  title: 'The Business Toolkit for India',
  description:
    'Trusted calculators, generators and operational tools for Indian businesses, with visible methods, sources, limitations and privacy.',
  path: '/',
});

export default function HomePage() {
  const featuredTools = getFeaturedTools(toolDiscoveryIndex);
  return (
    <>
      <JsonLd data={websiteStructuredData()} />
      <section className="hero">
        <Container>
          <div className="hero__layout">
            <div>
              <div className="hero__brandline">
                <BrandIcon className="hero__brandline-icon" decorative />
                <span>
                  Smart tools for <strong>smarter business</strong>
                </span>
              </div>
              <p className="eyebrow">The Business Toolkit for India</p>
              <h1>Run the numbers. Create the document. Make the next decision.</h1>
              <p className="hero__lede">
                KarobarKit brings trustworthy calculators, generators and operational tools together for
                Indian freelancers, sellers, founders and small teams.
              </p>
              <div className="hero__actions">
                <Link className="button button--primary" href="/search">
                  Find a tool <span aria-hidden="true">→</span>
                </Link>
                <Link className="button button--secondary" href="/tools">
                  Explore the directory
                </Link>
              </div>
            </div>
            <aside className="hero__aside" aria-label="KarobarKit principles">
              <div className="hero__visual-header">
                <div>
                  <p className="hero__visual-kicker">Trust before scale</p>
                  <p className="hero__aside-heading">Know how every result was produced</p>
                </div>
                <BrandIcon className="hero__visual-icon" decorative variant="badge" />
              </div>
              <div className="hero__signal" aria-hidden="true">
                <span className="hero__signal-label">Clarity in, confidence out</span>
                <span className="hero__signal-bars">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <ul className="trust-list">
                <li>Inputs stay in your browser for these calculators.</li>
                <li>Every result shows its method, sources, limits and review status.</li>
                <li>Designed for a phone first, with readable print styles.</li>
              </ul>
            </aside>
          </div>
        </Container>
      </section>
      <div className="container home-search">
        <LiveToolSearch id="home-search" tools={toolDiscoveryIndex} variant="home" />
      </div>
      <div className="container proof-bar" aria-label="Product promises">
        <span>No account required</span>
        <span>Indian number formatting</span>
        <span>Source-backed methods</span>
        <span>Keyboard-friendly</span>
      </div>
      <Container>
        <Section
          eyebrow="Start small"
          title="Live tools, one release standard"
          description="Start with the published tools, then explore the expanding business toolkit. Every live and beta route carries its method, data-flow and review status."
        >
          <div className="tool-grid">
            {featuredTools.map((tool) => (
              <ToolCard
                key={tool.id}
                href={`/tools/${tool.slug}`}
                name={tool.name}
                summary={tool.summary}
                categoryLabel={tool.categoryLabel}
                featured
              />
            ))}
          </div>
        </Section>
        <Section eyebrow="Browse by category" title="Start with the kind of work in front of you">
          <div className="category-grid">
            {categoryRegistry.map((category) => {
              const count = getToolsByCategory(category.slug).length;
              return (
                <article className="content-card category-card" key={category.id}>
                  <span className="tag">
                    {count > 0 ? `${count} published` : `Phase ${category.roadmapPhase}`}
                  </span>
                  <h3>
                    <Link href={`/categories/${category.slug}`}>{category.name}</Link>
                  </h3>
                  <p>{category.shortDescription}</p>
                  <Link className="text-link" href={`/categories/${category.slug}`}>
                    {count > 0 ? 'Browse published tools' : 'View roadmap scope'}{' '}
                    <span aria-hidden="true">→</span>
                  </Link>
                </article>
              );
            })}
          </div>
        </Section>
        <Section eyebrow="Find your next step" title="What would you like to do?">
          <div className="content-grid content-grid--two">
            <article className="content-card">
              <h3>Growth over time</h3>
              <p>
                Use CAGR when you have a beginning value, an ending value and a duration—and want one smoothed
                annual rate.
              </p>
              <Link className="text-link" href="/tools/cagr-calculator">
                Calculate CAGR <span aria-hidden="true">→</span>
              </Link>
            </article>
            <article className="content-card">
              <h3>Prepare a business document</h3>
              <p>
                Build a local-first letterhead or payment acknowledgement, review the A4 preview and export
                it.
              </p>
              <Link className="text-link" href={`/tools/${letterheadTool.slug}`}>
                Create a letterhead <span aria-hidden="true">→</span>
              </Link>
            </article>
            <article className="content-card">
              <h3>Acknowledge a payment</h3>
              <p>
                Record a declared payment with Indian amount-to-words formatting and a clear verification
                limitation.
              </p>
              <Link className="text-link" href={`/tools/${paymentReceiptTool.slug}`}>
                Create a payment receipt <span aria-hidden="true">→</span>
              </Link>
            </article>
            <article className="content-card">
              <h3>Share a destination</h3>
              <p>Turn a safe website URL into a QR code that is ready to download, scan-test and print.</p>
              <Link className="text-link" href={`/tools/${urlQrTool.slug}`}>
                Generate a URL QR <span aria-hidden="true">→</span>
              </Link>
            </article>
            <article className="content-card">
              <h3>Display a payment address</h3>
              <p>
                Create a UPI standee locally, with an optional amount and a clear reminder to verify the
                payee.
              </p>
              <Link className="text-link" href={`/tools/${upiStandeeTool.slug}`}>
                Create a UPI standee <span aria-hidden="true">→</span>
              </Link>
            </article>
            <article className="content-card">
              <h3>Return on a cost</h3>
              <p>
                Use ROI for a quick comparison between what you invested and the final value you received.
              </p>
              <Link className="text-link" href="/tools/roi-calculator">
                Calculate ROI <span aria-hidden="true">→</span>
              </Link>
            </article>
          </div>
        </Section>
        <Section eyebrow="Why KarobarKit" title="Trust is part of the interface">
          <div className="content-grid content-grid--two">
            <div className="prose">
              <div>
                <h3>Show the work</h3>
                <p>
                  Methods, worked examples and limitations live next to the answer, not buried in a footer.
                </p>
              </div>
              <div>
                <h3>Keep data close</h3>
                <p>
                  These tools run locally. We do not put financial values, URLs, UPI details, logos or
                  document text into analytics, URLs or error logs.
                </p>
              </div>
            </div>
            <PrivacyBlock>
              Calculations, QR payloads, document previews and generated images stay in your browser. Later
              tools will show their data flow before you enter anything.
            </PrivacyBlock>
          </div>
        </Section>
      </Container>
    </>
  );
}
