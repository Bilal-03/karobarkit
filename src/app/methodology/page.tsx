import { InfoPage } from '@/components/layout/info-page';
import { Section } from '@/components/ui/container';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Methodology and review process',
  description: 'Learn how KarobarKit documents formulas, validates inputs and reviews business tool results.',
  path: '/methodology',
});

export default function MethodologyPage() {
  return (
    <InfoPage
      eyebrow="How we work"
      title="A result should come with its working"
      intro="KarobarKit starts with a deliberately small set of tools. We document the formula, show the assumptions and test the edge cases before adding more."
    >
      <div className="prose">
        <section>
          <h2>Our calculation contract</h2>
          <p>
            Every deterministic tool has a pure calculation function. It does not read the DOM, call a
            network, write to storage or depend on a browser event. The form is only a way to collect and
            validate input; the result can be tested independently.
          </p>
        </section>
        <section>
          <h2>What appears beside a result</h2>
          <ul>
            <li>A plain-language explanation of the inputs.</li>
            <li>The formula used, without asking an AI model to do arithmetic.</li>
            <li>A worked example with independently expected values.</li>
            <li>Limitations, edge cases, source references and a last-reviewed date.</li>
          </ul>
        </section>
        <section>
          <h2>Review and corrections</h2>
          <p>
            Formula changes are intended to be reviewed as code and content together. If you find a result
            that looks wrong, use the report link with the tool name and version. Do not send private amounts
            or business details in a report.
          </p>
        </section>
        <Section eyebrow="Quality gates" title="The foundation we are building">
          <div className="stats-grid">
            <div className="stat">
              <strong>Pure</strong>
              <span>Domain functions independent from React</span>
            </div>
            <div className="stat">
              <strong>Visible</strong>
              <span>Formula, sources and limitations on the page</span>
            </div>
            <div className="stat">
              <strong>Private</strong>
              <span>No financial inputs in analytics or logs</span>
            </div>
          </div>
        </Section>
      </div>
    </InfoPage>
  );
}
