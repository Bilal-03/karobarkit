import Link from 'next/link';

import { LiveToolSearch } from '@/components/search/live-tool-search';
import { Container } from '@/components/ui/container';
import { toolDiscoveryIndex } from '@/domain/registry';

export function NotFoundContent() {
  return (
    <section className="not-found-page">
      <Container narrow>
        <p className="eyebrow">404 · Page not found</p>
        <h1>That page took a wrong turn.</h1>
        <p className="lede">
          The link may be old, or the tool may have moved to the canonical tools directory.
        </p>
        <LiveToolSearch id="not-found-search" tools={toolDiscoveryIndex} variant="not-found" />
        <div className="inline-actions">
          <Link className="button button--primary" href="/tools">
            Browse all tools
          </Link>
          <Link className="button button--ghost" href="/search">
            Search page
          </Link>
          <Link className="button button--ghost" href="/categories">
            Browse categories
          </Link>
          <Link className="button button--ghost" href="/">
            Home
          </Link>
        </div>
        <ul className="category-link-list" aria-label="Major categories">
          <li>
            <Link href="/categories/financial-calculators">Financial calculations</Link>
          </li>
          <li>
            <Link href="/categories/billing-taxes">Billing &amp; taxes</Link>
          </li>
          <li>
            <Link href="/categories/business-documents">Business documents</Link>
          </li>
          <li>
            <Link href="/categories/marketing-barcodes">Marketing &amp; QR codes</Link>
          </li>
        </ul>
      </Container>
    </section>
  );
}
