import { InfoPage } from '@/components/layout/info-page';
import { pageMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { faqStructuredData } from '@/lib/structured-data';
import type { FaqItem } from '@/domain/registry/types';

export const metadata = pageMetadata({
  title: 'Frequently asked questions',
  description: 'Answers about KarobarKit privacy, formulas, review dates and the early tool set.',
  path: '/faq',
});

const faqs: FaqItem[] = [
  {
    question: 'Do I need an account?',
    answer: 'No. The first calculators are designed to work without registration or a saved profile.',
  },
  {
    question: 'Are my numbers uploaded?',
    answer:
      'No. CAGR, ROI, QR payloads and document previews calculate in the browser. Financial values, entered URLs, UPI details, logos and document text are not sent to analytics or error logs.',
  },
  {
    question: 'Is the result financial advice?',
    answer:
      'No. These are educational calculations. The pages explain their assumptions and limitations so you can check the result against your own records.',
  },
  {
    question: 'Why is the tool set small?',
    answer:
      'This release is proving a shared, tested engine. The GST Calculator is limited to transparent arithmetic; tax classification, payroll and filing workflows need stronger source governance before they are added.',
  },
  {
    question: 'Does the GST Calculator tell me the correct rate?',
    answer:
      'No. It exposes only two source-backed headline presets plus a clearly labelled custom option. It does not classify a product or service, infer place of supply or give tax advice.',
  },
  {
    question: 'How do I report a wrong result?',
    answer:
      'Use the report an error page and tell us the tool and version. Do not include private amounts or business identifiers.',
  },
];

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqStructuredData(faqs)} />
      <InfoPage
        eyebrow="Help"
        title="Questions, answered plainly"
        intro="A trustworthy tool should explain how it works before you rely on it."
      >
        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </InfoPage>
    </>
  );
}
