import Link from 'next/link';

import { Container, Section } from '@/components/ui/container';
import { JsonLd } from '@/components/seo/json-ld';
import { ToolCard } from '@/components/ui/tool-card';
import { PrivacyBlock } from '@/components/ui/trust-blocks';
import { getFeaturedTools } from '@/domain/discovery';
import {
  categoryRegistry,
  letterheadTool,
  paymentReceiptTool,
  upiStandeeTool,
  urlQrTool,
} from '@/domain/registry';
import { pageMetadata } from '@/lib/seo';
import { websiteStructuredData } from '@/lib/structured-data';

export const metadata = pageMetadata({
  title: 'Private business tools for India',
  description:
    'Calculate growth and returns with clear formulas, local-first processing and no account required.',
  path: '/',
});

export default function HomePage() {
  const featuredTools = getFeaturedTools();
  return (
    <>
      <JsonLd data={websiteStructuredData()} />
      <section className="hero">
        <Container>
          <div className="hero__layout">
            <div>
              <p className="eyebrow">Built for the work behind the work</p>
              <h1>Numbers you can explain. Tools you can trust.</h1>
              <p className="hero__lede">
                KarobarKit is a focused set of private, practical business tools for Indian freelancers,
                retailers and small teams.
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
              <p className="hero__aside-heading">A calmer way to get a useful answer</p>
              <ul className="trust-list">
                <li>Inputs stay in your browser for these calculators.</li>
                <li>Every result shows its formula, limits and review date.</li>
                <li>Designed for a phone first, with readable print styles.</li>
              </ul>
            </aside>
          </div>
        </Container>
      </section>
      <div className="container home-search">
        <form className="search-form" action="/search" method="get">
          <label htmlFor="home-search">What do you need to do?</label>
          <div className="search-form__row">
            <input
              className="input"
              id="home-search"
              name="q"
              type="search"
              maxLength={80}
              placeholder="Try GST bill, payment QR or growth rate…"
            />
            <button className="button button--primary" type="submit">
              Search tools
            </button>
          </div>
        </form>
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
          title="Eight tools, one clear promise"
          description="Start with transparent calculations, source-backed GST arithmetic, local QR outputs and original documents before the platform grows into more complex business workflows."
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
            {categoryRegistry.map((category) => (
              <article className="content-card" key={category.id}>
                <h3>
                  <Link href={`/categories/${category.slug}`}>{category.name}</Link>
                </h3>
                <p>{category.description}</p>
                <Link className="text-link" href={`/categories/${category.slug}`}>
                  Browse category <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
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
        <Section eyebrow="Why KarobarKit" title="Small details that make tools feel trustworthy">
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
