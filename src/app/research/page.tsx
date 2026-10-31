import { InfoPage } from '@/components/layout/info-page';
import { ContactForm } from '@/components/feedback/contact-form';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Help shape KarobarKit',
  description: 'Volunteer for a short research interview about freelance quotations and invoices.',
  path: '/research',
});
export default function ResearchPage() {
  return (
    <InfoPage
      eyebrow="Freelancer research"
      title="Help us understand your paperwork"
      intro="We are looking for 5–8 Indian freelancers to share how they prepare quotations and invoices. We are testing a hypothesis; customer demand has not yet been validated."
    >
      <div className="prose">
        <h2>Who can join?</h2>
        <p>
          You freelance in India and have prepared a quotation or invoice for a client in the last three
          months. You can participate even if you have never used KarobarKit.
        </p>
        <h2>What happens in the session?</h2>
        <p>
          A 20-minute conversation about your most recent paperwork task and the tools you already use. We may
          ask you to try a short task using dummy details. No real client documents, tax records or payment
          details are needed.
        </p>
        <p>
          Taking part is voluntary. You can skip questions or stop at any time. We will ask separately before
          taking research notes, recording anything, publishing a quote or contacting you for follow-up. No
          payment or other incentive is promised.
        </p>
        <h2>Express interest</h2>
        <p>
          Use the form below to ask to join. The project owner can reply to arrange a time. This is not an
          automatic booking. If delivery fails, your interest has not been received; the form will show an
          error.
        </p>
      </div>
      <ContactForm research />
    </InfoPage>
  );
}
