import { InfoPage } from '@/components/layout/info-page';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'About KarobarKit',
  description:
    'Meet the product direction behind KarobarKit, a privacy-first business tools platform for India.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="The idea"
      title="Useful business tools, with fewer surprises"
      intro="KarobarKit is an early product build for people who need a quick calculation or a clean document without signing up for accounting software first."
    >
      <div className="prose">
        <section>
          <h2>Who it is for</h2>
          <p>
            Freelancers, small retailers, service businesses, consultants and aspiring entrepreneurs often
            need one answer at a time. The first release is designed around that moment: focused,
            mobile-friendly and understandable enough to check.
          </p>
        </section>
        <section>
          <h2>What we believe</h2>
          <ul>
            <li>Privacy should be a default users can see, not a promise hidden in legal copy.</li>
            <li>Formulas and limitations should be as easy to find as the headline result.</li>
            <li>A smaller, tested product is more useful than a catalogue of uncertain tools.</li>
          </ul>
        </section>
        <section>
          <h2>What we are not building yet</h2>
          <p>
            No accounts, bank connections, GST filing, payroll engine, payment gateway or realistic mock bills
            are part of this release. The GST Calculator is intentionally limited to source-backed arithmetic;
            classification, filing and compliance workflows require stronger source governance before they are
            added.
          </p>
        </section>
      </div>
    </InfoPage>
  );
}
