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
      intro="KarobarKit publishes a tool only after its method, assumptions, data flow, lifecycle, review status and edge cases are explicit. Roadmap scope is not presented as a live result."
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
            <li>Effective period, source references, last-verified date and reviewer status.</li>
            <li>Limitations, privacy behavior and a direct correction route.</li>
          </ul>
        </section>
        <section>
          <h2>Rounding and testing</h2>
          <p>
            Money calculations use decimal-safe arithmetic and document their rounding boundary. Unit tests
            cover normal, invalid and boundary cases; integration tests cover forms; browser checks cover
            discovery, accessibility and mobile layouts. Static worked examples use independently expected
            values so a live calculation cannot silently validate itself.
          </p>
        </section>
        <section>
          <h2>Privacy and update process</h2>
          <p>
            Current calculations, QR payloads and documents stay in the browser. Analytics accepts only a
            small event allowlist and excludes entered values, identities and document contents. Business
            economics offers an explicit, tab-only scenario handoff that imports matching fields only after
            confirmation; it is not persistent storage or cloud sync. Regulatory material is stored in a
            reusable effective-dated policy package, reviewed against named sources and updated through code
            review rather than scraped into a result at runtime.
          </p>
        </section>
        <section>
          <h2>Lifecycle and release controls</h2>
          <p>
            Tool definitions can be internal, beta, live, stale-disabled or retired. Internal and disabled
            tools do not enter search or the sitemap. A feature flag can hold a route out of the public
            directory, while a stale policy can replace the interface with a noindex explanation instead of
            continuing to calculate from outdated rules.
          </p>
        </section>
        <section>
          <h2>Review and corrections</h2>
          <p>
            Formula changes are intended to be reviewed as code and content together. If you find a result
            that looks wrong, use the report link with the tool name and version. Do not send private amounts
            or business details in a report.
          </p>
        </section>
        <section>
          <h2>GST Calculator policy</h2>
          <p>
            GST is treated as controlled policy data, not a timeless rate constant. The GST Calculator
            displays policy version <code>gst-general-rates-2025-09-22-v1</code>, its effective date, last
            verification date and official source links. Only the 5% and 18% headline presets are exposed;
            they are choices for arithmetic, not product or service classification.
          </p>
          <p>
            Exclusive mode calculates GST on the entered taxable value. Inclusive mode extracts the GST
            component from the entered total. Currency values use decimal arithmetic and half-up rounding at
            two decimal places. Intra-state components reconcile as CGST plus SGST/UTGST; inter-state tax is
            shown as IGST; the tool never infers place of supply.
          </p>
          <p>
            Review the detailed <a href="/gst-methodology">GST methodology</a>,{' '}
            <a href="/gst-policy-version">policy-version model</a> and{' '}
            <a href="/gst-source-verification">source-verification summary</a> before relying on a result.
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
