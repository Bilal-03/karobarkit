import Image from 'next/image';

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
        <section className="creator-credit" id="creator" aria-labelledby="creator-heading">
          <div className="creator-credit__identity">
            <Image
              className="creator-credit__photo"
              src="/bilal-choudhary.jpg"
              width={1050}
              height={1400}
              sizes="(max-width: 620px) 136px, 150px"
              alt="Bilal Choudhary"
            />
            <span className="creator-credit__signal">Built with purpose in India</span>
          </div>
          <div className="creator-credit__content">
            <p className="eyebrow">Meet the creator</p>
            <h2 id="creator-heading">Bilal Choudhary</h2>
            <p className="creator-credit__role">Creator and developer of KarobarKit</p>
            <p className="creator-credit__message">
              I built KarobarKit to make dependable day-to-day business tools easier to access for people
              building and running businesses across India. The goal is simple: useful software, transparent
              logic and genuine respect for your data.
            </p>
            <div className="creator-credit__links" aria-label="Bilal Choudhary online">
              <a
                className="creator-social-link creator-social-link--github"
                href="https://github.com/Bilal-03"
                target="_blank"
                rel="noreferrer"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.57-.29-5.27-1.29-5.27-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.18A10.9 10.9 0 0 1 12 6.13c.98 0 1.95.13 2.87.39 2.2-1.49 3.16-1.18 3.16-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.4-2.71 5.38-5.29 5.67.42.36.78 1.06.78 2.14v3.27c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
                </svg>
                <span>
                  <small>Explore the code</small>
                  GitHub
                </span>
                <span aria-hidden="true">↗</span>
              </a>
              <a
                className="creator-social-link creator-social-link--linkedin"
                href="https://www.linkedin.com/in/bilal2012/"
                target="_blank"
                rel="noreferrer"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M5.37 7.98H1.8V22h3.57V7.98ZM3.59 2A2.08 2.08 0 1 0 3.6 6.16 2.08 2.08 0 0 0 3.59 2Zm9.15 5.98H9.32V22h3.57v-6.94c0-1.83.35-3.61 2.62-3.61 2.24 0 2.27 2.1 2.27 3.73V22h3.57v-7.69c0-3.78-.82-6.69-5.23-6.69-2.12 0-3.54 1.16-4.12 2.25h-.05V7.98h-3.42" />
                </svg>
                <span>
                  <small>Connect professionally</small>
                  LinkedIn
                </span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </InfoPage>
  );
}
