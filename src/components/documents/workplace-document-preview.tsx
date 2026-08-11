'use client';

import { useEffect, useMemo, useState } from 'react';

import { formatIndianCurrency, formatIndianNumber } from '@/domain/formatting/indian';
import type { WorkplaceDocument } from '@/domain/documents/workplace';
import { calculateBarcode } from '@/domain/qr/barcode';
import { renderBarcodeSvg } from '@/lib/qr/barcode-render';

function displayValue(label: string, value: string) {
  if (/^(mrp|offer price|amount|gross declared|deductions declared|net declared)$/iu.test(label)) {
    return value;
  }
  return value;
}

function WorkplaceTotals({ document }: { document: WorkplaceDocument }) {
  if (!document.totals) return null;
  return (
    <section className="workplace-totals" aria-label="Document totals">
      <div>
        <span>Subtotal / declared gross</span>
        <strong>{formatIndianCurrency(document.totals.subtotal)}</strong>
      </div>
      <div>
        <span>Tax / declared deductions</span>
        <strong>{formatIndianCurrency(document.totals.tax)}</strong>
      </div>
      <div className="workplace-totals__grand">
        <span>Grand / net declared</span>
        <strong>{formatIndianCurrency(document.totals.grandTotal)}</strong>
      </div>
      {document.totals.amountInWords ? (
        <p>
          <span>Amount in words</span>
          <strong>{document.totals.amountInWords}</strong>
        </p>
      ) : null}
    </section>
  );
}

function WorkplaceLineItems({ document }: { document: WorkplaceDocument }) {
  if (!document.items.length) return null;
  return (
    <section className="workplace-items" aria-label="Document items">
      <h2>Items</h2>
      <div className="workplace-table-wrap">
        <table className="workplace-table">
          <thead>
            <tr>
              <th scope="col">Description</th>
              <th scope="col">Qty</th>
              <th scope="col">Rate</th>
              <th scope="col">Amount</th>
            </tr>
          </thead>
          <tbody>
            {document.items.map((item) => (
              <tr key={item.id}>
                <td className="break-anywhere">{item.description}</td>
                <td>
                  {formatIndianNumber(item.quantity)} {item.unit}
                </td>
                <td>{formatIndianCurrency(item.unitPrice)}</td>
                <td>
                  <strong>{formatIndianCurrency(item.amount)}</strong>
                  {item.taxAmount && item.taxRate ? (
                    <small>
                      {formatIndianCurrency(item.taxAmount)} tax @ {item.taxRate}%
                    </small>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WorkplaceBarcode({ value }: { value: string }) {
  const markup = useMemo(() => {
    try {
      return renderBarcodeSvg(
        calculateBarcode({ symbology: 'code128', value, showLabel: true, width: 'compact' }),
        { height: 92 },
      );
    } catch {
      return '';
    }
  }, [value]);
  return markup ? (
    <div
      className="workplace-code-graphic"
      role="img"
      aria-label={`Barcode for ${value}`}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  ) : (
    <strong className="break-anywhere">{value}</strong>
  );
}

function WorkplaceQr({ payload }: { payload: string }) {
  const [markup, setMarkup] = useState('');
  useEffect(() => {
    let active = true;
    void import('@/lib/qr/render').then(async ({ renderQrSvg }) => {
      try {
        const nextMarkup = await renderQrSvg(payload, { size: 196 });
        if (active) setMarkup(nextMarkup);
      } catch {
        if (active) setMarkup('');
      }
    });
    return () => {
      active = false;
    };
  }, [payload]);
  return markup ? (
    <div
      className="workplace-code-graphic workplace-code-graphic--qr"
      role="img"
      aria-label="Menu QR code"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  ) : (
    <strong className="break-anywhere">{payload}</strong>
  );
}

export function WorkplaceDocumentPreview({
  document,
  targetId,
}: {
  document: WorkplaceDocument;
  targetId: string;
}) {
  const metadata = Object.entries(document.metadata);
  return (
    <div
      className="document-preview workplace-document-preview"
      data-testid="document-preview"
      aria-label="Document preview"
    >
      <div id={targetId} className="document-print-area">
        <article
          className={`workplace-page workplace-page--${document.pageProfile}`}
          data-page-profile={document.pageProfile}
          data-document-type={document.type}
        >
          <header className="workplace-page__header">
            <div>
              <span className="workplace-status">{document.statusLabel}</span>
              <h1>{document.title}</h1>
              <p>{document.subtitle}</p>
            </div>
            <div className="workplace-page__identity">
              <strong>{document.businessName}</strong>
              {document.contactLine ? <span className="preserve-lines">{document.contactLine}</span> : null}
            </div>
          </header>

          {metadata.length ? (
            <dl className="workplace-metadata">
              {metadata.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd className="break-anywhere">{displayValue(label, value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {document.barcode ? (
            <section className="workplace-code-block" aria-label="Declared barcode value">
              <span>Scannable Code 128 barcode</span>
              <WorkplaceBarcode value={document.barcode} />
              <small>Value supplied by the user; no allocation or scan acceptance is implied.</small>
            </section>
          ) : null}

          {document.qrPayload ? (
            <section className="workplace-code-block" aria-label="Prepared QR destination">
              <span>Scannable QR destination</span>
              <WorkplaceQr payload={document.qrPayload} />
              <small>Review the destination before sharing. The menu is not hosted by KarobarKit.</small>
            </section>
          ) : null}

          {document.sections.map((section) => (
            <section className="workplace-section" key={section.heading}>
              <h2>{section.heading}</h2>
              <div>
                {section.lines.map((line, index) => (
                  <p
                    className="preserve-lines break-anywhere"
                    key={`${section.heading}-${index}-${line.slice(0, 24)}`}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <WorkplaceLineItems document={document} />
          <WorkplaceTotals document={document} />

          <footer className="workplace-page__footer">
            {document.footerText ? <p className="preserve-lines">{document.footerText}</p> : null}
            <p className="workplace-disclaimer">{document.disclaimer}</p>
            <span>Created locally with KarobarKit · {document.statusLabel}</span>
          </footer>
        </article>
      </div>
    </div>
  );
}
