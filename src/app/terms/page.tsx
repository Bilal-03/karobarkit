import { InfoPage } from '@/components/layout/info-page';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Terms of use',
  description: 'Read the initial KarobarKit terms for using its free, local-first business calculators.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="The ground rules"
      title="Terms of use"
      intro="These initial terms describe the early calculator experience. They should be reviewed with the product as the platform grows."
    >
      <div className="prose">
        <section>
          <h2>Use the output responsibly</h2>
          <p>
            You may use KarobarKit for personal and business planning. You are responsible for checking
            inputs, understanding assumptions and deciding whether a result is appropriate for your situation.
          </p>
        </section>
        <section>
          <h2>No professional advice</h2>
          <p>
            The tools are educational utilities, not accounting, investment, tax, legal or financial advice.
            Do not treat a result as a filing, approval, guarantee or professional opinion.
          </p>
        </section>
        <section>
          <h2>Do not misuse the platform</h2>
          <p>
            Do not attempt to disrupt the service, bypass security controls, submit malicious code or use
            future document features to impersonate an institution or create misleading evidence.
          </p>
        </section>
        <section>
          <h2>Changes</h2>
          <p>
            The tool set, formulas, references and limits may change as they are reviewed. Pages show a
            last-reviewed date where it matters.
          </p>
        </section>
      </div>
    </InfoPage>
  );
}
