import { InfoPage } from '@/components/layout/info-page';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Disclaimer',
  description:
    'Understand the limits of KarobarKit calculations and why results should be independently checked.',
  path: '/disclaimer',
});

export default function DisclaimerPage() {
  return (
    <InfoPage
      eyebrow="Read before relying on a result"
      title="A calculation is not a conclusion"
      intro="KarobarKit makes formulas easier to use and inspect. It cannot know every business context, tax rule, fee or cash-flow detail behind your numbers."
    >
      <div className="prose">
        <section>
          <h2>Calculator limitations</h2>
          <p>
            CAGR is a smoothed annual rate and does not represent actual year-by-year performance. Basic ROI
            does not account for time, taxes, fees, inflation or interim cash flows. The tool-specific pages
            list their own boundaries.
          </p>
        </section>
        <section>
          <h2>Independent checks matter</h2>
          <p>
            Use the worked example and formula to check the arithmetic. For decisions with material financial,
            tax or legal consequences, consult your records and a qualified professional.
          </p>
        </section>
        <section>
          <h2>Sources and freshness</h2>
          <p>
            Each current calculator has a named reference and review date. A reference supports the formula;
            it does not make the result universal or guarantee that a particular decision is suitable.
          </p>
        </section>
      </div>
    </InfoPage>
  );
}
