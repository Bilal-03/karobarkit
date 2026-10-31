import Link from 'next/link';
import { InfoPage } from '@/components/layout/info-page';
import { AnalyticsExample } from '@/components/portfolio/analytics-example';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata({
  title: 'KarobarKit product case study',
  description:
    'An independent product ownership project: workflow strategy, prioritization, analytical modeling and release verification.',
  path: '/case-study',
});
export default function CaseStudyPage() {
  return (
    <InfoPage
      eyebrow="Independent product project"
      title="Turning a broad toolkit into a focused workflow"
      intro="KarobarKit is a portfolio project demonstrating product decisions, analytical thinking and delivery. It is not a validated business; no customer interviews, adoption or revenue are claimed."
    >
      <div className="prose">
        <h2>The problem hypothesis</h2>
        <p>
          A freelancer preparing a quotation, invoice and receipt may repeat the same details across tools. I
          chose this connected task as a focused entry point into a much broader toolkit. This audience choice
          is a hypothesis, not a research finding.
        </p>
        <h2>My role and implementation approach</h2>
        <p>
          Product Owner — Independent Project. The project covers positioning, scope, prioritization,
          acceptance criteria and release decisions. AI coding tools assisted implementation, documentation
          and automated testing. This work demonstrates delivery and tradeoff reasoning; it does not
          substitute for customer research or cross-functional team experience.
        </p>
        <h2>Decisions and tradeoffs</h2>
        <ul>
          <li>
            Keep the toolkit accessible without mandatory accounts to reduce entry friction; accept that
            documents are not a permanent cloud archive.
          </li>
          <li>
            Use explicit, temporary local handoffs rather than placing client details in URLs; accept an extra
            review/import step.
          </li>
          <li>
            Keep numeric results deterministic; use AI only for optional drafting, never as the authority for
            tax arithmetic.
          </li>
          <li>
            Defer more tools, profiles and paid acquisition. For this portfolio, invest in a coherent
            workflow, reproducible analysis and clear evidence instead.
          </li>
        </ul>
        <h2>Issues found through actual verification</h2>
        <p>
          An owner question about an unexplained ₹6,400 exposed a breakdown that hid the cess row. Live
          workflow tests then found stale example expiry dates and an invalid no-discount transfer. Those
          issues were fixed and regression coverage added. These are owner/test observations, not interview
          findings.
        </p>
        <p>
          Verification covers quotation → invoice → receipt with explicit imports and three PDF exports at
          desktop and mobile viewport sizes. Automated checks verify calculation contracts, safe analytics
          properties, session handling and verification-traffic exclusion. Viewport simulation is not testing
          on every physical phone.
        </p>
        <p>
          <a href="https://github.com/Bilal-03/karobarkit/blob/main/tests/e2e/pilot-workflow.spec.ts">
            Workflow acceptance test
          </a>{' '}
          ·{' '}
          <a href="https://github.com/Bilal-03/karobarkit/blob/main/tests/unit/documents.test.ts">
            Document regression tests
          </a>
        </p>
      </div>
      <AnalyticsExample />
      <div className="prose">
        <h2>What I can conclude</h2>
        <p>
          The workflow is implemented and has passed the documented automated checks. The analytical example
          demonstrates metric definitions, session deduplication, sequencing, channel segmentation and
          assumption testing. It cannot establish real completion rates, retention, commercial demand or
          product-market fit.
        </p>
        <h2>What would change the roadmap?</h2>
        <p>
          If future real usage shows repeated re-entry, saved business profiles could be worth testing. If
          discovery is the bottleneck, onboarding would take priority. Without that evidence, neither a paid
          tier nor more features is justified. Production custom events remain disabled because the current
          Vercel plan does not support them.
        </p>
        <p>
          <Link className="button button--primary" href="/freelancers">
            Try the document workflow
          </Link>{' '}
          <a href="https://github.com/Bilal-03/karobarkit">Explore the repository</a>
        </p>
      </div>
    </InfoPage>
  );
}
