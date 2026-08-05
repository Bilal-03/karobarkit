import Link from 'next/link';

import { InfoPage } from '@/components/layout/info-page';
import { toolRegistry } from '@/domain/registry';
import { formatIndianDate } from '@/domain/formatting/indian';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Sources and formula register',
  description:
    'Browse the references used by the current KarobarKit calculator set and see when they were checked.',
  path: '/sources',
});

export default function SourcesPage() {
  const sources = toolRegistry.flatMap((tool) => tool.sources.map((source) => ({ tool, source })));
  return (
    <InfoPage
      eyebrow="Evidence"
      title="Sources we can point to"
      intro="The first release focuses on standard financial formulas. As tax and document tools arrive, this register will include official rules, effective dates and policy versions."
    >
      <div className="prose">
        <section>
          <h2>Current calculator references</h2>
          <div className="source-table-wrap">
            <table className="source-table">
              <caption>Source references for the two proof-of-concept calculators.</caption>
              <thead>
                <tr>
                  <th scope="col">Tool</th>
                  <th scope="col">Reference</th>
                  <th scope="col">Checked</th>
                </tr>
              </thead>
              <tbody>
                {sources.map(({ tool, source }) => (
                  <tr key={source.id}>
                    <td>
                      <Link href={`/tools/${tool.slug}`}>{tool.name}</Link>
                    </td>
                    <td>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.title}
                      </a>
                      <br />
                      <span>
                        {source.publisher} · {source.evidenceLevel}
                      </span>
                    </td>
                    <td>{formatIndianDate(source.lastChecked)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <h2>What “checked” means</h2>
          <p>
            A checked date means the reference link and the formula description were reviewed for this
            release. It is not a claim that a standard financial ratio answers every business or investment
            question.
          </p>
        </section>
        <section>
          <h2>Coming later</h2>
          <p>
            GST, payroll, HSN/SAC and other regulated tools will not ship until their rules have named
            official sources, effective dates, policy versions and independent examples.
          </p>
        </section>
      </div>
    </InfoPage>
  );
}
