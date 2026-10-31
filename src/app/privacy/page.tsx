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
      intro="KarobarKit's current calculators, QR generators and document generators run locally in your browser. This page describes the current tool set and its data boundary."
    >
      <div className="prose">
        <section>
          <h2>What happens to calculator inputs</h2>
          <p>
            CAGR, ROI, business-economics, URL, UPI and document values are held in the page while you use a
            tool. QR payloads, payment URIs, document previews, CSV exports and PDF exports are generated in
            the browser. Selected logos are read and resized locally only; they are not uploaded. These values
            are not sent to a server, written into a URL, stored in an account or included in analytics.
            Business-economics tools offer an explicit “Save for a related tool” action; that opt-in handoff
            uses bounded session storage in the current tab, imports only matching fields after a second
            confirmation and clears when consumed or when the tab closes. Reloading otherwise clears the
            current form state.
          </p>
        </section>
        <section>
          <h2>Analytics boundary</h2>
          <p>
            The production site uses Vercel Web Analytics for aggregate page-view measurement. Query strings
            and URL fragments are removed before a page view is sent, so search text and other URL details are
            excluded. Analytics data is not sent in local development.
          </p>
          <p>
            When product analytics is enabled, KarobarKit sends sanitized product events to Vercel Analytics.
            The boundary accepts only allowlisted, low-cardinality metadata such as a tool ID, category,
            export format or validation code. Financial values, names, UPI IDs, amounts, payment notes, logos,
            QR payloads, document contents and file data are forbidden properties. Product events include a
            random tab-session identifier, an allowlisted acquisition channel, and elapsed time to understand
            completion. The session identifier expires after 30 minutes of inactivity; it does not identify
            you across visits. We do not fingerprint devices. Do Not Track and Global Privacy Control disable
            custom product events.
          </p>
        </section>
        <section>
          <h2>Research interview interest</h2>
          <p>
            The optional research form sends your name, email, process description and contact consent through
            our email provider to the project owner. These details are not product analytics. They are used to
            arrange a research session, not to enroll you in marketing. Submitting interest does not book a
            session or authorize recording or public quotes. Participation is voluntary; you can withdraw or
            request deletion by replying to the scheduling email or using the contact page. Do not submit
            client records or financial documents.
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
            Any tool that needs a network provider, persistent local storage, file upload or account will show
            that data flow before input. The Phase 2 handoff is temporary tab storage and is not an account or
            persistent profile. No assumption that a future tool is local-first should be made from this page.
          </p>
        </section>
      </div>
    </InfoPage>
  );
}
