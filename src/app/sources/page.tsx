import Link from 'next/link';

import { InfoPage } from '@/components/layout/info-page';
import { toolRegistry } from '@/domain/registry';
import { formatIndianDate } from '@/domain/formatting/indian';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Sources and formula register',
  description:
    'Browse the references used by the current KarobarKit calculator set, including the verified GST policy sources and review dates.',
  path: '/sources',
});

export default function SourcesPage() {
  const sources = toolRegistry.flatMap((tool) => tool.sources.map((source) => ({ tool, source })));
  return (
    <InfoPage
      eyebrow="Evidence"
      title="Sources we can point to"
      intro="Every current tool points to the method or official material it relies on. The GST Calculator additionally shows controlled policy versions, effective dates, authorities and the last verification date."
    >
      <div className="prose">
        <section>
          <h2>Current tool references</h2>
          <div className="source-table-wrap">
            <table className="source-table">
              <caption>Source references for calculations and QR payload generation.</caption>
              <thead>
                <tr>
                  <th scope="col">Tool</th>
                  <th scope="col">Reference</th>
                  <th scope="col">Authority and dates</th>
                  <th scope="col">Supports</th>
                </tr>
              </thead>
              <tbody>
                {sources.map(({ tool, source }) => (
                  <tr key={`${tool.id}-${source.id}`}>
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
                    <td>
                      <span>{source.authority ?? source.publisher}</span>
                      {source.referenceNumber ? (
                        <>
                          <br />
                          <span>{source.referenceNumber}</span>
                        </>
                      ) : null}
                      {source.publishedOn ? (
                        <>
                          <br />
                          <span>Published {formatIndianDate(source.publishedOn)}</span>
                        </>
                      ) : null}
                      {source.effectiveFrom ? (
                        <>
                          <br />
                          <span>Effective {formatIndianDate(source.effectiveFrom)}</span>
                        </>
                      ) : null}
                      <br />
                      <span>Checked {formatIndianDate(source.lastChecked)}</span>
                    </td>
                    <td>{source.supports?.join(' · ') ?? 'Formula or standard reference'}</td>
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
          <h2>GST policy note</h2>
          <p>
            The GST Calculator uses only the current, source-backed headline presets documented in its policy
            bundle. It does not claim that a rate applies to a product or service, and it excludes
            classification, exemption, place-of-supply and filing decisions.
          </p>
        </section>
      </div>
    </InfoPage>
  );
}
