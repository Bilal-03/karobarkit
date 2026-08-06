import Link from 'next/link';

import { formatIndianDate } from '@/domain/formatting/indian';
import { getRelatedTools } from '@/domain/registry';
import type { SourceReference } from '@/domain/registry/types';

import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Container, Section } from '@/components/ui/container';
import { ToolCard } from '@/components/ui/tool-card';
import { DisclaimerBlock, LastReviewedBlock, PrivacyBlock } from '@/components/ui/trust-blocks';
import { SourceReferenceBlock } from '@/components/ui/source-reference';

import { CalculatorForm } from './calculator-form';
import { GstCalculatorForm } from './gst-calculator-form';
import { DocumentGeneratorForm } from '@/components/documents/document-generator-form';
import { GstInvoiceGeneratorForm } from '@/components/documents/gst-invoice-generator-form';
import { GeneratorForm } from './generator-form';

interface SupportedTool {
  id: string;
  slug: string;
  kind: 'calculator' | 'generator';
  generatorKind?: 'qr' | 'document';
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
}

function calculatorKind(slug: string) {
  return slug === 'cagr-calculator' ? 'cagr' : 'roi';
}

function generatorKind(slug: string) {
  return slug === 'url-qr' ? 'url-qr' : 'upi-standee';
}

export function ToolPage({ tool }: { tool: SupportedTool }) {
  const relatedTools = getRelatedTools(tool);
  const kind = calculatorKind(tool.slug);

  return (
    <>
      <div className="page-topline">
        <Container>
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Tools', href: '/tools' }, { label: tool.name }]}
          />
        </Container>
      </div>
      <section className="tool-hero">
        <Container narrow>
          <p className="eyebrow">{tool.categoryLabel} · Local-first</p>
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
        {tool.slug === 'gst-calculator' ? (
          <GstCalculatorForm
            tool={{
              id: tool.id,
              category: tool.category,
              defaultValues: tool.defaultValues,
              privacyNote: tool.privacyNote,
              sources: tool.sources,
            }}
          />
        ) : tool.slug === 'gst-invoice-generator' ? (
          <GstInvoiceGeneratorForm
            tool={{ id: tool.id, category: tool.category, defaultValues: tool.defaultValues }}
          />
        ) : tool.kind === 'calculator' ? (
          <CalculatorForm
            kind={kind}
            tool={{
              id: tool.id,
              category: tool.category,
              defaultValues: tool.defaultValues,
              privacyNote: tool.privacyNote,
            }}
          />
        ) : tool.generatorKind === 'document' ? (
          <DocumentGeneratorForm
            kind={tool.slug === 'letterhead-generator' ? 'letterhead' : 'payment-receipt'}
            tool={{ id: tool.id, category: tool.category, defaultValues: tool.defaultValues }}
          />
        ) : (
          <GeneratorForm
            kind={generatorKind(tool.slug)}
            tool={{ id: tool.id, category: tool.category, defaultValues: tool.defaultValues }}
          />
        )}
      </Container>
      <Container narrow>
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
