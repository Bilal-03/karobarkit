import Link from 'next/link';

import { Container } from '@/components/ui/container';

export function NotFoundContent() {
  return (
    <section className="not-found-page">
      <Container narrow>
        <p className="eyebrow">404 · Page not found</p>
        <h1>That page took a wrong turn.</h1>
        <p className="lede">
          The link may be old, or the tool may have moved to the canonical tools directory.
        </p>
        <div className="inline-actions">
          <Link className="button button--primary" href="/tools">
            Browse all tools
          </Link>
          <Link className="button button--ghost" href="/search">
            Search KarobarKit
          </Link>
        </div>
      </Container>
    </section>
  );
}
