import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { ToolTrustPanel } from '@/components/trust/tool-trust-panel';
import { SourceReferenceBlock } from '@/components/ui/source-reference';
import { JsonLd } from '@/components/seo/json-ld';
import { faqStructuredData } from '@/lib/structured-data';
import { allToolDefinitions, getToolDefinitionBySlug } from '@/domain/registry';
import { pageMetadata } from '@/lib/seo';
export function generateStaticParams() {
  return allToolDefinitions
    .filter((tool) => tool.lifecycle !== 'internal' && tool.lifecycle !== 'retired')
    .map((tool) => ({ slug: tool.slug }));
}
export const dynamicParams = false;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolDefinitionBySlug(slug);
  return pageMetadata({
    title: `${tool?.name ?? 'Tool'} help`,
    description: `Instructions, methods and references for ${tool?.name ?? 'this tool'}.`,
    path: `/tools/${slug}/help`,
  });
}
export default async function HelpPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolDefinitionBySlug(slug);
  if (!tool || tool.lifecycle === 'internal' || tool.lifecycle === 'retired') notFound();
  return (
    <Container narrow>
      <JsonLd data={faqStructuredData(tool.faqs)} />
      <article className="reference-page">
        <Link className="text-link" href={`/tools/${slug}`}>
          ← Back to {tool.name}
        </Link>
        <p className="eyebrow">Tool guide</p>
        <h1>{tool.name}</h1>
        <nav className="reference-nav" aria-label="Guide sections">
          <a href="#how-it-works">Instructions</a>
          <a href="#full-limitations">Limitations</a>
          <a href="#source-register">Sources</a>
          <a href="#questions">Questions</a>
        </nav>
        <section id="how-it-works">
          <h2>How it works</h2>
          <ol>
            {tool.howToUse.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <h3>Formula</h3>
          <p className="formula-block">{tool.formula}</p>
          <p>{tool.resultInterpretation}</p>
          <h3>Example</h3>
          <p>{tool.workedExample}</p>
        </section>
        <section id="full-limitations">
          <h2 id="limitations">Limitations</h2>
          <ul>
            {tool.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3>Edge cases</h3>
          <ul>
            {tool.edgeCases.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{tool.disclaimer}</p>
        </section>
        <ToolTrustPanel
          slug={tool.slug}
          formula={tool.formula}
          trust={tool.trust}
          governance={tool.governance}
          sources={tool.sources}
          limitations={[]}
          privacyNote={tool.privacyNote}
          executionMode={tool.executionMode}
        />
        <SourceReferenceBlock sources={tool.sources} />
        <section id="questions">
          <h2>Common questions</h2>
          {tool.faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </section>
      </article>
    </Container>
  );
}
