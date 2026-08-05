import { InfoPage } from '@/components/layout/info-page';
import { Button } from '@/components/ui/button';
import { InputField, SelectField, TextareaField } from '@/components/ui/form-field';
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
        <form className="contact-form" action="/contact" method="post">
          <InputField id="contact-name" name="name" label="Your name" autoComplete="name" />
          <InputField
            id="contact-email"
            name="email"
            label="Email address"
            type="email"
            autoComplete="email"
            help="Used only to reply. Do not include account numbers or sensitive documents."
          />
          <SelectField id="contact-topic" name="topic" label="What is this about?" defaultValue="feedback">
            <option value="feedback">Product feedback</option>
            <option value="accessibility">Accessibility</option>
            <option value="source">Source suggestion</option>
            <option value="other">Something else</option>
          </SelectField>
          <TextareaField
            id="contact-message"
            name="message"
            label="Message"
            rows={6}
            help="Please leave out private amounts, tax IDs, passwords and document contents."
          />
          <Button type="submit">Send message</Button>
        </form>
      </div>
    </InfoPage>
  );
}
