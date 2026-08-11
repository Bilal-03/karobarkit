import Link from 'next/link';

import { formatIndianDate } from '@/domain/formatting/indian';
import { getRelatedTools } from '@/domain/registry';

import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Container, Section } from '@/components/ui/container';
import { ToolCard } from '@/components/ui/tool-card';
import { DisclaimerBlock, LastReviewedBlock, PrivacyBlock } from '@/components/ui/trust-blocks';
import { SourceReferenceBlock } from '@/components/ui/source-reference';
import { JsonLd } from '@/components/seo/json-ld';
import { faqStructuredData, toolStructuredData } from '@/lib/structured-data';
import { ToolTrustPanel } from '@/components/trust/tool-trust-panel';
import { ToolInteraction } from './tool-renderers';
import type { SupportedTool, ToolInteractionTool } from './tool-types';

function toToolInteraction(tool: SupportedTool): ToolInteractionTool {
  return {
    id: tool.id,
    name: tool.name,
    category: tool.category,
    defaultValues: tool.defaultValues,
    privacyNote: tool.privacyNote,
    sources: tool.sources,
    ui: tool.ui,
  };
}

export function ToolPage({ tool }: { tool: SupportedTool }) {
  const relatedTools = getRelatedTools(tool);

  return (
    <>
      <JsonLd data={toolStructuredData(tool)} />
      <JsonLd data={faqStructuredData(tool.faqs)} />
      <div className="page-topline">
        <Container>
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Tools', href: '/tools' }, { label: tool.name }]}
          />
        </Container>
      </div>
      <section className="tool-hero">
        <Container narrow>
          <p className="eyebrow">
            {tool.categoryLabel} ·{' '}
            {tool.executionMode === 'local-only' ? 'Local-first' : 'Data flow disclosed'}
            {tool.lifecycle === 'beta' ? ' · Beta' : ''}
          </p>
          <h1>{tool.name}</h1>
          <p className="tool-hero__summary">{tool.summary}</p>
          <div className="tool-hero__meta">
            <span>{tool.executionMode === 'network-required' ? 'Reviewable draft' : 'Instant result'}</span>
            <span>•</span>
            <span>No account</span>
            <span>•</span>
            <span>
              {tool.executionMode === 'network-required'
                ? 'Fields disclosed before submit'
                : 'Inputs stay in your browser'}
            </span>
          </div>
        </Container>
      </section>
      <Container>
        <ToolInteraction tool={toToolInteraction(tool)} />
      </Container>
      <Container narrow>
        <ToolTrustPanel
          slug={tool.slug}
          formula={tool.formula}
          trust={tool.trust}
          governance={tool.governance}
          sources={tool.sources}
          limitations={tool.limitations}
          privacyNote={tool.privacyNote}
          executionMode={tool.executionMode}
        />
        <p className="section-link-row">
          <Link href={`/categories/${tool.category}`}>Browse {tool.categoryLabel}</Link> ·{' '}
          <Link href="/methodology">Methodology</Link> · <Link href="/sources">Sources</Link>
        </p>
        <Section
          eyebrow="A quick guide"
          title="Use the number with context"
          description="The answer is only useful when you know what it includes and what it leaves out."
        >
          <div className="content-grid content-grid--two">
            <article className="content-card">
              <h3>How to use it</h3>
              <ol className="step-list">
                {tool.howToUse.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
            <article className="content-card">
              <h3>Formula</h3>
              <p className="formula-block">{tool.formula}</p>
              <p>{tool.resultInterpretation}</p>
            </article>
          </div>
        </Section>

        <Section eyebrow="Make it concrete" title="Worked example">
          <div className="example-card">
            <p>{tool.workedExample}</p>
          </div>
        </Section>

        <div id="full-limitations">
          <Section eyebrow="Boundaries" title="What this tool does not assume">
            <div className="content-grid content-grid--two">
              <article className="content-card">
                <h3>Limitations</h3>
                <ul className="plain-list">
                  {tool.limitations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
              <article className="content-card">
                <h3>Edge cases</h3>
                <ul className="plain-list">
                  {tool.edgeCases.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>
          </Section>
        </div>

        <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
        <DisclaimerBlock>
          {tool.disclaimer ??
            'KarobarKit provides educational calculations, not accounting, investment, tax or legal advice. Check decisions against your own records and a qualified professional where appropriate.'}
        </DisclaimerBlock>
        <LastReviewedBlock date={tool.lastReviewed} />
        <SourceReferenceBlock sources={tool.sources} />

        <Section eyebrow="Questions" title="Frequently asked">
          <div className="faq-list">
            {tool.faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </Section>

        {relatedTools.length > 0 ? (
          <Section
            eyebrow="Keep going"
            title="Related tools"
            description="A related local-first tool for the next step."
          >
            <div className="tool-grid">
              {relatedTools.map((related) => (
                <ToolCard
                  key={related.id}
                  href={`/tools/${related.slug}`}
                  name={related.name}
                  summary={related.summary}
                  categoryLabel={related.categoryLabel}
                  lifecycle={related.lifecycle}
                  executionMode={related.executionMode}
                />
              ))}
            </div>
          </Section>
        ) : null}
        <p className="report-link">
          <Link href={`/report-an-error?tool=${tool.slug}`}>Found something that looks wrong?</Link> Tell us
          which tool and version you used.
        </p>
        <p className="last-reviewed">Source register checked {formatIndianDate(tool.lastReviewed)}.</p>
      </Container>
    </>
  );
}
