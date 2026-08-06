import Link from 'next/link';

import { Container, Section } from '@/components/ui/container';
import { ToolCard } from '@/components/ui/tool-card';
import { PrivacyBlock } from '@/components/ui/trust-blocks';
import { cagrTool, roiTool, upiStandeeTool, urlQrTool } from '@/domain/registry';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Private business tools for India',
  description:
    'Calculate growth and returns with clear formulas, local-first processing and no account required.',
  path: '/',
});

export default function HomePage() {
  return (
    <>
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
                <Link className="button button--primary" href="/tools/cagr-calculator">
                  Try a calculator <span aria-hidden="true">→</span>
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
      <div className="container proof-bar" aria-label="Product promises">
        <span>No account required</span>
        <span>Indian number formatting</span>
        <span>Source-backed methods</span>
        <span>Keyboard-friendly</span>
      </div>
      <Container>
        <Section
          eyebrow="Start small"
          title="Four tools, one clear promise"
          description="Start with transparent calculations and local QR outputs before the platform grows into more complex business workflows."
        >
          <div className="tool-grid">
            <ToolCard
              href={`/tools/${cagrTool.slug}`}
              name={cagrTool.name}
              summary={cagrTool.summary}
              categoryLabel={cagrTool.categoryLabel}
              featured
            />
            <ToolCard
              href={`/tools/${roiTool.slug}`}
              name={roiTool.name}
              summary={roiTool.summary}
              categoryLabel={roiTool.categoryLabel}
              featured
            />
            <ToolCard
              href={`/tools/${urlQrTool.slug}`}
              name={urlQrTool.name}
              summary={urlQrTool.summary}
              categoryLabel={urlQrTool.categoryLabel}
              featured
            />
            <ToolCard
              href={`/tools/${upiStandeeTool.slug}`}
              name={upiStandeeTool.name}
              summary={upiStandeeTool.summary}
              categoryLabel={upiStandeeTool.categoryLabel}
              featured
            />
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
                  These tools run locally. We do not put financial values, URLs or UPI details into analytics,
                  URLs or error logs.
                </p>
              </div>
            </div>
            <PrivacyBlock>
              Calculations, QR payloads and generated images stay in your browser. Later tools will show their
              data flow before you enter anything.
            </PrivacyBlock>
          </div>
        </Section>
      </Container>
    </>
  );
}
