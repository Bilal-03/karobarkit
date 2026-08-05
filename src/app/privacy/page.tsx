import { InfoPage } from '@/components/layout/info-page';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Privacy',
  description: 'See how KarobarKit handles calculator inputs, analytics and local browser processing.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Your data"
      title="Private by default, clear by design"
      intro="The first KarobarKit calculators run locally in your browser. This page describes the current foundation—not a promise about tools that do not exist yet."
    >
      <div className="prose">
        <section>
          <h2>What happens to calculator inputs</h2>
          <p>
            CAGR and ROI values are held in the page while you use the calculator. They are not sent to a
            server, written into a URL, stored in an account or included in analytics. Reloading the page
            clears the current form state.
          </p>
        </section>
        <section>
          <h2>Analytics boundary</h2>
          <p>
            The app has a privacy-safe event seam for future aggregate product measurement. Allowed events
            include tool views, validation codes and completion metadata. Financial values, names, addresses,
            tax IDs, passwords, QR payloads and document contents are forbidden properties.
          </p>
        </section>
        <section>
          <h2>Error handling</h2>
          <p>
            Route errors may carry a short framework digest in development diagnostics. Safe logging filters
            context to a feature name, code or digest; it does not log form values. If you report an issue,
            send only the tool name, version and a description without private data.
          </p>
        </section>
        <section>
          <h2>Future tools</h2>
          <p>
            Any tool that needs a network provider, local storage, file upload or account will show that data
            flow before input. No assumption that a future tool is local-first should be made from this page.
          </p>
        </section>
      </div>
    </InfoPage>
  );
}
