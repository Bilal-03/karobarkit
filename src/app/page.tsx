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
  title: 'The Business Toolkit for India',
  description: 'Everyday calculators, documents and useful tools for your business.',
  path: '/',
});
const quickSlugs = [
  'gst-calculator',
  'invoice-generator',
  'margin-calculator',
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
          <p className="eyebrow">A little less work. A little more done.</p>
          <h1>Your work, made simpler.</h1>
          <p>Calculate, create and get things done. All in one place.</p>
          <LiveToolSearch id="home-search" tools={toolDiscoveryIndex} variant="home" />
          <p className="home-reassurance">Free to use · No account needed</p>
        </Container>
      </section>
      <Container>
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
