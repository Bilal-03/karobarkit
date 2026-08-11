import { Container } from '@/components/ui/container';
import { LiveToolSearch } from '@/components/search/live-tool-search';
import { toolDiscoveryIndex } from '@/domain/registry';
import { pageMetadata } from '@/lib/seo';

export const metadata = {
  ...pageMetadata({
    title: 'Search business tools',
    description: 'Search KarobarKit by tool name, calculation or business task.',
    path: '/search',
  }),
  robots: { index: false, follow: true },
};

interface SearchPageProps {
  searchParams?: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = searchParams ? await searchParams : {};
  const query = typeof params.q === 'string' ? params.q.slice(0, 80).trim() : '';

  return (
    <>
      <section className="info-hero">
        <Container narrow>
          <p className="eyebrow">Search</p>
          <h1>Find the right tool for the job</h1>
          <p className="lede">Search by a tool name, a business task or a phrase like “returns over time”.</p>
          <LiveToolSearch
            key={query}
            id="search-page-input"
            tools={toolDiscoveryIndex}
            initialQuery={query}
            variant="page"
          />
        </Container>
      </section>
    </>
  );
}
