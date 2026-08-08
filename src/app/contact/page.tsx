import { InfoPage } from '@/components/layout/info-page';
import { ContactForm } from '@/components/feedback/contact-form';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Contact KarobarKit',
  description:
    'Contact the KarobarKit team with product feedback, accessibility questions or source suggestions.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Say hello"
      title="Tell us what would make this useful"
      intro="This early build is shaped by practical feedback from Indian freelancers, retailers and small teams. Keep messages free of private financial or identity details."
    >
      <div className="contact-grid">
        <div className="contact-card">
          <h2>Good things to send</h2>
          <ul className="plain-list">
            <li>A tool or workflow you need often.</li>
            <li>A confusing field, result or mobile interaction.</li>
            <li>A source we should consider for a future regulated tool.</li>
            <li>An accessibility issue, including keyboard or contrast problems.</li>
          </ul>
        </div>
        <ContactForm />
      </div>
    </InfoPage>
  );
}
