import { Suspense } from 'react';

import { DirectoryToolSearch } from '@/components/search/live-tool-search';
import { Container } from '@/components/ui/container';
import { toolRegistry } from '@/domain/registry';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Business tools for India',
  description:
    'Browse the KarobarKit directory of transparent calculators, generators and practical business tools for India.',
  path: '/tools',
});

export default function ToolsPage() {
  return (
    <>
      <section className="info-hero">
        <Container>
          <p className="eyebrow">Tool directory</p>
          <div className="directory-heading">
            <div>
              <h1>Find the right tool for the business task</h1>
              <p className="lede">
                Search by task, category, tool type, data use or regulatory scope. Every live tool exposes its
                method, limitations, sources and verification status.
              </p>
            </div>
            <span className="result-count">{toolRegistry.length} tools available</span>
          </div>
        </Container>
      </section>
      <Container>
        <div className="search-section">
          <Suspense
            fallback={
              <div className="state-block state-block--loading" aria-live="polite">
                <strong>Loading directory controls</strong>
                <p>The live tool index is ready; filters are reading this URL.</p>
              </div>
            }
          >
            <DirectoryToolSearch id="directory-search" />
          </Suspense>
        </div>
      </Container>
    </>
  );
}
