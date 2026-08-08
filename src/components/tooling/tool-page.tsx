import Link from 'next/link';

import { formatIndianDate } from '@/domain/formatting/indian';
import { getRelatedTools } from '@/domain/registry';
import type {
  SourceReference,
  ToolExecutionMode,
  ToolGovernance,
  ToolKind,
  ToolLifecycle,
  ToolTrustMetadata,
  ToolUiAdapter,
} from '@/domain/registry/types';

import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Container, Section } from '@/components/ui/container';
import { ToolCard } from '@/components/ui/tool-card';
import { DisclaimerBlock, LastReviewedBlock, PrivacyBlock } from '@/components/ui/trust-blocks';
import { SourceReferenceBlock } from '@/components/ui/source-reference';
import { JsonLd } from '@/components/seo/json-ld';
import { faqStructuredData, toolStructuredData } from '@/lib/structured-data';
import { ToolTrustPanel } from '@/components/trust/tool-trust-panel';

import { CalculatorForm } from './calculator-form';
import { GstCalculatorForm } from './gst-calculator-form';
import { DocumentGeneratorForm } from '@/components/documents/document-generator-form';
import { GstInvoiceGeneratorForm } from '@/components/documents/gst-invoice-generator-form';
import { GeneratorForm } from './generator-form';

interface SupportedTool {
  id: string;
  slug: string;
  kind: ToolKind;
  generatorKind?: 'qr' | 'document';
  ui: ToolUiAdapter;
  name: string;
  category: string;
  categoryLabel: string;
  summary: string;
  defaultValues: unknown;
  relatedToolIds: string[];
  howToUse: string[];
  formula: string;
  workedExample: string;
  resultInterpretation: string;
  limitations: string[];
  edgeCases: string[];
  privacyNote: string;
  lastReviewed: string;
  sources: SourceReference[];
  faqs: { question: string; answer: string }[];
  disclaimer?: string;
  lifecycle: ToolLifecycle;
  executionMode: ToolExecutionMode;
  governance: ToolGovernance;
  trust: ToolTrustMetadata;
}

function ToolInteraction({ tool }: { tool: SupportedTool }) {
  switch (tool.ui.adapter) {
    case 'gst-calculator':
      return (
        <GstCalculatorForm
          tool={{
            id: tool.id,
            category: tool.category,
            defaultValues: tool.defaultValues,
            privacyNote: tool.privacyNote,
            sources: tool.sources,
          }}
        />
      );
    case 'gst-invoice-generator':
      return (
        <GstInvoiceGeneratorForm
          tool={{ id: tool.id, category: tool.category, defaultValues: tool.defaultValues }}
        />
      );
    case 'calculator':
      return (
        <CalculatorForm
          kind={tool.ui.variant}
          tool={{
            id: tool.id,
            category: tool.category,
            defaultValues: tool.defaultValues,
            privacyNote: tool.privacyNote,
          }}
        />
      );
    case 'document-generator':
      return (
        <DocumentGeneratorForm
          kind={tool.ui.variant}
          tool={{ id: tool.id, category: tool.category, defaultValues: tool.defaultValues }}
        />
      );
    case 'qr-generator':
      return (
        <GeneratorForm
          kind={tool.ui.variant}
          tool={{ id: tool.id, category: tool.category, defaultValues: tool.defaultValues }}
        />
      );
    case 'unavailable':
      return (
        <div className="state-block state-block--empty">
          <strong>This interface is not available yet</strong>
          <p>The tool remains unavailable until its task-specific interface passes release review.</p>
        </div>
      );
  }
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
            <span>Instant result</span>
            <span>•</span>
            <span>No account</span>
            <span>•</span>
            <span>Inputs stay in your browser</span>
          </div>
        </Container>
      </section>
      <Container>
        <ToolInteraction tool={tool} />
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
