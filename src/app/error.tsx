'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { safeLogger } from '@/lib/security/safe-logger';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    safeLogger.error('A route boundary caught an error.', { feature: 'route', digest: error.digest });
  }, [error.digest]);

  return (
    <section className="not-found-page">
      <div className="container container--narrow">
        <p className="eyebrow">Something needs another try</p>
        <h1>We could not finish that page.</h1>
        <p className="lede">
          Your form values were not sent anywhere. You can try again or return to the tools directory.
        </p>
        <div className="inline-actions">
          <button className="button button--primary" type="button" onClick={() => reset()}>
            Try again
          </button>
          <Link className="button button--ghost" href="/tools">
            Browse tools
          </Link>
        </div>
      </div>
    </section>
  );
}
