import { InfoPage } from '@/components/layout/info-page';
import { getActiveGstPolicy, getGstPolicyFreshness } from '@/domain/policies/gst';
import { formatIndianDate } from '@/domain/formatting/indian';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'GST policy version',
  description:
    'See the active GST Calculator policy version, effective date, review interval and update safeguards.',
  path: '/gst-policy-version',
});

export default function GstPolicyVersionPage() {
  const policy = getActiveGstPolicy();
  const freshness = getGstPolicyFreshness(policy);

  return (
    <InfoPage
      eyebrow="Regulatory freshness"
      title="GST policy version"
      intro="GST rates are maintained as reviewed application data with explicit dates and official source references."
    >
      <div className="prose">
        <section>
          <h2>{policy.name}</h2>
          <dl className="result-breakdown">
            <div>
              <dt>Stable policy ID</dt>
              <dd>{policy.id}</dd>
            </div>
            <div>
              <dt>Effective from</dt>
              <dd>{formatIndianDate(policy.effectiveFrom)}</dd>
            </div>
            <div>
              <dt>Last verified</dt>
              <dd>{formatIndianDate(policy.lastVerifiedOn)}</dd>
            </div>
            <div>
              <dt>Review due</dt>
              <dd>{formatIndianDate(freshness.reviewDueOn)}</dd>
            </div>
          </dl>
        </section>
        <section>
          <h2>Current presets</h2>
          <ul>
            {policy.ratePresets.map((rate) => (
              <li key={rate.id}>
                {rate.label} — effective {formatIndianDate(rate.effectiveFrom)}. {rate.scope}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Update safeguards</h2>
          <p>
            A stale review produces a visible review-due warning; it never changes the arithmetic or silently
            fetches new rates. Policy updates require a reviewed source record, explicit effective dates,
            validation tests, updated examples and a code/content review.
          </p>
        </section>
      </div>
    </InfoPage>
  );
}
