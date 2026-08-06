import { InfoPage } from '@/components/layout/info-page';
import { getActiveGstPolicy, GST_REGULATORY_SOURCES } from '@/domain/policies/gst';
import { formatIndianDate } from '@/domain/formatting/indian';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'GST source verification',
  description: 'Review the official Government sources used for the current KarobarKit GST policy bundle.',
  path: '/gst-source-verification',
});

export default function GstSourceVerificationPage() {
  const policy = getActiveGstPolicy();
  const sources = GST_REGULATORY_SOURCES.filter((source) => policy.sourceIds.includes(source.id));

  return (
    <InfoPage
      eyebrow="Evidence register"
      title="GST source verification"
      intro="The current GST Calculator policy was reviewed against official Government material on 6 August 2026."
    >
      <div className="prose">
        <section>
          <h2>What the review supports</h2>
          <p>
            Official material supports a primarily 5% and 18% headline structure after the 22 September 2025
            reforms, while also documenting exemptions, category-specific rates, a special 40% category and
            later amendments. The calculator therefore does arithmetic without classifying a supply.
          </p>
        </section>
        <section>
          <h2>Official sources</h2>
          <div className="source-table-wrap">
            <table className="source-table">
              <caption>Official material in the active GST policy bundle.</caption>
              <thead>
                <tr>
                  <th scope="col">Authority</th>
                  <th scope="col">Document</th>
                  <th scope="col">Dates and support</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.id}>
                    <td>{source.authority}</td>
                    <td>
                      <a href={source.officialUrl} target="_blank" rel="noreferrer">
                        {source.title}
                      </a>
                      {source.referenceNumber ? (
                        <>
                          <br />
                          <span>{source.referenceNumber}</span>
                        </>
                      ) : null}
                    </td>
                    <td>
                      {source.publishedOn ? (
                        <>
                          Published {formatIndianDate(source.publishedOn)}
                          <br />
                        </>
                      ) : null}
                      {source.effectiveFrom ? (
                        <>
                          Effective {formatIndianDate(source.effectiveFrom)}
                          <br />
                        </>
                      ) : null}
                      <>
                        Accessed {formatIndianDate(source.accessedOn)}
                        <br />
                      </>
                      <span>{source.supports.join(' · ')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <h2>Unresolved matters remain excluded</h2>
          <p>
            The source set is not a complete HSN/SAC database and does not establish the rate for an
            individual supply. Nil / exempt treatment, 40% special-rate treatment, deferred tobacco
            transitions and later category-specific amendments require facts and source coverage this
            milestone intentionally does not collect.
          </p>
        </section>
      </div>
    </InfoPage>
  );
}
