import Image from 'next/image';

import { formatIndianCurrency, formatIndianNumber } from '@/domain/formatting/indian';
import type {
  BusinessCardDocument,
  BusinessDocument,
  LegacyBusinessDocument,
  InvoiceDocument,
  LetterheadDocument,
  PaymentReceiptDocument,
  QuotationDocument,
  QuotationLine,
} from '@/domain/documents/types';
import type { GstInvoiceDocument, GstInvoiceLine } from '@/domain/invoices/types';
import { isWorkplaceDocument } from '@/domain/documents/workplace';

import { WorkplaceDocumentPreview } from './workplace-document-preview';

function Logo({ document }: { document: LegacyBusinessDocument }) {
  if (!document.logo) return null;
  return (
    <Image
      className="document-logo"
      src={document.logo.dataUrl}
      alt="Business logo"
      width={document.logo.width}
      height={document.logo.height}
      unoptimized
    />
  );
}

function IdentityHeader({ document }: { document: LegacyBusinessDocument }) {
  const contact = [
    document.identity.contact.phone,
    document.identity.contact.email,
    document.identity.contact.website,
    document.identity.contact.additionalLine,
    document.identity.contact.socialHandle,
  ].filter(Boolean);
  const registrations = [
    document.identity.gstin ? `GSTIN: ${document.identity.gstin}` : '',
    document.identity.cin ? `CIN: ${document.identity.cin}` : '',
    document.identity.registrationNumber ? `Reg. no.: ${document.identity.registrationNumber}` : '',
  ].filter(Boolean);

  return (
    <header className="document-identity" data-logo-alignment={document.branding.logoAlignment}>
      <div className="document-identity__main">
        <Logo document={document} />
        <div className="document-identity__copy">
          <h2>{document.identity.name}</h2>
          {document.identity.tagline ? (
            <p className="document-identity__tagline">{document.identity.tagline}</p>
          ) : null}
        </div>
      </div>
      <div className="document-identity__contact">
        <p className="preserve-lines">{document.identity.address.text}</p>
        {contact.length ? <p>{contact.join('  ·  ')}</p> : null}
        {registrations.length ? <p>{registrations.join('  ·  ')}</p> : null}
      </div>
    </header>
  );
}

function DocumentFooter({ document }: { document: LegacyBusinessDocument }) {
  return (
    <footer className="document-footer">
      <p>
        {document.footerText ||
          (document.type === 'gst-invoice'
            ? 'Review all invoice particulars and applicable GST rules before issue.'
            : 'Prepared for local business use. Review details before sharing.')}
      </p>
      <span>
        {document.type === 'gst-invoice'
          ? 'Local draft · review before issue'
          : 'Created locally with KarobarKit'}
      </span>
    </footer>
  );
}

function TemplatePage({
  document,
  children,
  pageNumber,
}: {
  document: LegacyBusinessDocument;
  children: React.ReactNode;
  pageNumber?: number;
}) {
  return (
    <article
      className={`a4-page a4-page--${document.branding.template} a4-page--${document.branding.accent}`}
      data-logo-alignment={document.branding.logoAlignment}
      data-testid="a4-page"
    >
      <div className="a4-page__frame" aria-hidden="true" />
      <div className="a4-page__content">
        <IdentityHeader document={document} />
        {children}
        <DocumentFooter document={document} />
        {pageNumber && pageNumber > 1 ? (
          <span className="document-page-number">Page {pageNumber}</span>
        ) : null}
      </div>
    </article>
  );
}

function LetterheadPage({
  document,
  body,
  pageIndex,
}: {
  document: LetterheadDocument;
  body: string;
  pageIndex: number;
}) {
  return (
    <TemplatePage document={document} pageNumber={pageIndex + 1}>
      <div className="letterhead-content">
        {pageIndex === 0 ? (
          <>
            <div className="document-meta-row">
              <div>
                {document.recipient.name ? <strong>To: {document.recipient.name}</strong> : null}
                {document.recipient.address.text ? (
                  <p className="preserve-lines">{document.recipient.address.text}</p>
                ) : null}
              </div>
              {document.displayDate ? (
                <time dateTime={document.metadata.date}>{document.displayDate}</time>
              ) : null}
            </div>
            {document.metadata.subject ? (
              <p className="document-subject">
                <strong>Subject:</strong> {document.metadata.subject}
              </p>
            ) : null}
          </>
        ) : (
          <p className="document-continuation">Letter continued</p>
        )}
        {body ? (
          <div className="letter-body">
            {body.split(/\n\s*\n/u).map((paragraph, index) => (
              <p className="preserve-lines" key={`${index}-${paragraph.slice(0, 20)}`}>
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <p className="document-placeholder">Your letter text will appear here.</p>
        )}
        {pageIndex === document.bodyPages.length - 1 &&
        (document.signature.name || document.signature.showPlaceholder) ? (
          <div className="signature-area">
            {document.signature.showPlaceholder ? (
              <div className="signature-line" aria-hidden="true" />
            ) : null}
            {document.signature.name ? <strong>{document.signature.name}</strong> : null}
            {document.signature.designation ? <span>{document.signature.designation}</span> : null}
          </div>
        ) : null}
      </div>
    </TemplatePage>
  );
}

function PaymentReceiptPage({ document }: { document: PaymentReceiptDocument }) {
  return (
    <TemplatePage document={document}>
      <div className="receipt-content">
        <div className="receipt-heading">
          <div>
            <p className="document-kicker">Acknowledgement of payment</p>
            <h1>Payment receipt</h1>
          </div>
          <time dateTime={document.metadata.date}>{document.displayDate}</time>
        </div>
        <div className="receipt-meta-grid">
          <div>
            <span>Receipt number</span>
            <strong>{document.metadata.number}</strong>
          </div>
          <div>
            <span>Received from</span>
            <strong>{document.recipient.name}</strong>
          </div>
        </div>
        {document.recipient.address.text ? (
          <div className="receipt-detail">
            <span>Customer address</span>
            <p className="preserve-lines">{document.recipient.address.text}</p>
          </div>
        ) : null}
        <section className="amount-summary" aria-label="Amount received">
          <span>Amount received</span>
          <strong>{document.monetaryValue.formatted}</strong>
          <p>Declared amount — independently verify payment settlement.</p>
        </section>
        <div className="receipt-detail">
          <span>Amount in words</span>
          <strong>{document.monetaryValue.inWords}</strong>
        </div>
        <div className="receipt-detail">
          <span>Payment purpose</span>
          <p>{document.paymentPurpose}</p>
        </div>
        <dl className="receipt-facts">
          {document.paymentMethod ? (
            <div>
              <dt>Payment method</dt>
              <dd>{document.paymentMethod}</dd>
            </div>
          ) : null}
          {document.transactionReference ? (
            <div>
              <dt>Transaction reference</dt>
              <dd className="break-anywhere">{document.transactionReference}</dd>
            </div>
          ) : null}
          {document.invoiceReference ? (
            <div>
              <dt>Invoice reference</dt>
              <dd>{document.invoiceReference}</dd>
            </div>
          ) : null}
          {document.paymentNote ? (
            <div>
              <dt>Note</dt>
              <dd className="preserve-lines">{document.paymentNote}</dd>
            </div>
          ) : null}
        </dl>
        {document.signature.name || document.signature.showPlaceholder ? (
          <div className="signature-area signature-area--right">
            {document.signature.showPlaceholder ? (
              <div className="signature-line" aria-hidden="true" />
            ) : null}
            {document.signature.name ? <strong>{document.signature.name}</strong> : null}
            {document.signature.designation ? <span>{document.signature.designation}</span> : null}
          </div>
        ) : null}
        <aside className="receipt-disclaimer">
          This receipt records a payment declared by the issuer. It is not bank confirmation, proof of
          settlement, a government receipt or a GST tax invoice.
        </aside>
      </div>
    </TemplatePage>
  );
}

function QuotationLineDetails({ line, index }: { line: QuotationLine; index: number }) {
  return (
    <details className="invoice-mobile-line">
      <summary>
        <span>
          {index + 1}. {line.description}
        </span>
        <strong>{formatIndianCurrency(line.subtotal)}</strong>
      </summary>
      <dl>
        <div>
          <dt>Quantity</dt>
          <dd>
            {formatIndianNumber(line.quantity)} {line.unit}
          </dd>
        </div>
        <div>
          <dt>Unit price</dt>
          <dd>{formatIndianCurrency(line.unitPrice)}</dd>
        </div>
        <div>
          <dt>Discount</dt>
          <dd>{formatIndianCurrency(line.discountAmount)}</dd>
        </div>
        <div>
          <dt>Line subtotal</dt>
          <dd>{formatIndianCurrency(line.subtotal)}</dd>
        </div>
      </dl>
    </details>
  );
}

function QuotationPage({
  document,
  items,
  pageIndex,
}: {
  document: QuotationDocument | InvoiceDocument;
  items: QuotationLine[];
  pageIndex: number;
}) {
  const isLastPage = pageIndex === document.pageChunks.length - 1;
  const isInvoice = document.type === 'invoice';
  const firstItemIndex = document.items.findIndex((item) => item.id === items[0]?.id);
  return (
    <TemplatePage document={document} pageNumber={pageIndex + 1}>
      <div className="invoice-content quotation-content">
        <div className="invoice-heading">
          <div>
            <p className="document-kicker">
              {isInvoice ? 'Commercial invoice · local draft' : 'Commercial estimate · local draft'}
            </p>
            <h1>{isInvoice ? 'Invoice' : 'Quotation'}</h1>
          </div>
          <dl>
            <div>
              <dt>{isInvoice ? 'Invoice no.' : 'Quote no.'}</dt>
              <dd>{document.metadata.number}</dd>
            </div>
            <div>
              <dt>{isInvoice ? 'Invoice date' : 'Quote date'}</dt>
              <dd>
                <time dateTime={document.metadata.date}>{document.displayDate}</time>
              </dd>
            </div>
            {'displayValidUntil' in document && document.displayValidUntil ? (
              <div>
                <dt>Valid until</dt>
                <dd>{document.displayValidUntil}</dd>
              </div>
            ) : null}
            {isInvoice && document.displayDueDate ? (
              <div>
                <dt>Due date</dt>
                <dd>{document.displayDueDate}</dd>
              </div>
            ) : null}
          </dl>
        </div>
        {pageIndex === 0 ? (
          <div className="invoice-parties">
            <div className="invoice-party-block">
              <span className="invoice-label">{isInvoice ? 'Billed to' : 'Prepared for'}</span>
              <strong>{document.recipient.name}</strong>
              {document.recipient.address.text ? (
                <p className="preserve-lines">{document.recipient.address.text}</p>
              ) : null}
              {[document.recipientContact.phone, document.recipientContact.email].filter(Boolean).length ? (
                <span>
                  {[document.recipientContact.phone, document.recipientContact.email]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              ) : null}
            </div>
            <div className="invoice-party-block">
              <span className="invoice-label">Document status</span>
              <strong>{isInvoice ? 'Commercial draft' : 'Estimate only'}</strong>
              <p>
                {isInvoice
                  ? 'Values are shown before any GST or other statutory treatment.'
                  : 'Prices are shown before any GST or other statutory treatment.'}
              </p>
            </div>
          </div>
        ) : (
          <p className="document-continuation">{isInvoice ? 'Invoice' : 'Quotation'} · continued</p>
        )}
        <div className="invoice-table-wrap">
          <table className="invoice-table quotation-table">
            <caption>
              {isInvoice ? 'Invoice' : 'Quotation'} items, page {pageIndex + 1}
            </caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Description</th>
                <th scope="col">Qty</th>
                <th scope="col">Rate</th>
                <th scope="col">Discount</th>
                <th scope="col">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((line, index) => (
                <tr key={line.id}>
                  <td>{(firstItemIndex < 0 ? index : firstItemIndex + index) + 1}</td>
                  <td className="break-anywhere">{line.description}</td>
                  <td>
                    {formatIndianNumber(line.quantity)} {line.unit}
                  </td>
                  <td>{formatIndianCurrency(line.unitPrice)}</td>
                  <td>{formatIndianCurrency(line.discountAmount)}</td>
                  <td>
                    <strong>{formatIndianCurrency(line.subtotal)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="invoice-mobile-lines" aria-label="Quotation items in mobile layout">
          {items.map((line, index) => (
            <QuotationLineDetails key={line.id} line={line} index={firstItemIndex + index} />
          ))}
        </div>
        {!isLastPage ? (
          <p className="invoice-continuation-note">
            More {isInvoice ? 'invoice' : 'quotation'} items continue on the next A4 page.
          </p>
        ) : null}
        {isLastPage ? (
          <>
            <div className="invoice-result-grid quotation-summary-grid">
              <section
                className="invoice-words"
                aria-label={`${isInvoice ? 'Invoice' : 'Quotation'} total in words`}
              >
                <span className="invoice-label">Total in words</span>
                <strong>{document.totals.amountInWords}</strong>
              </section>
              <section
                className="invoice-totals"
                aria-label={`${isInvoice ? 'Invoice' : 'Quotation'} totals`}
              >
                <div>
                  <span>Gross value</span>
                  <strong>{formatIndianCurrency(document.totals.grossValue)}</strong>
                </div>
                <div>
                  <span>Discounts</span>
                  <strong>{formatIndianCurrency(document.totals.discountAmount)}</strong>
                </div>
                <div className="invoice-grand-total">
                  <span>{isInvoice ? 'Invoice subtotal' : 'Quoted subtotal'}</span>
                  <strong>{formatIndianCurrency(document.totals.subtotal)}</strong>
                </div>
              </section>
            </div>
            <div className="invoice-extra-grid">
              <div>
                {document.notes ? (
                  <p>
                    <strong>Notes:</strong> {document.notes}
                  </p>
                ) : null}
                {document.terms ? (
                  <p>
                    <strong>Terms:</strong> {document.terms}
                  </p>
                ) : null}
                {isInvoice && document.paymentDetails ? (
                  <p>
                    <strong>Payment details:</strong> {document.paymentDetails}
                  </p>
                ) : null}
              </div>
              <div className="invoice-signature">
                <span>{isInvoice ? 'Authorised signatory' : 'Prepared by'}</span>
                {document.signature.showPlaceholder ? <div aria-hidden="true" /> : null}
                {document.signature.name ? <strong>{document.signature.name}</strong> : null}
                {document.signature.designation ? <span>{document.signature.designation}</span> : null}
              </div>
            </div>
            <aside className="invoice-disclaimer quotation-disclaimer">
              {isInvoice
                ? 'This commercial invoice is a local draft created from the entered information. It is not a GST tax invoice, filing record, payment confirmation or guarantee of tax treatment.'
                : 'This quotation is an estimate created from the entered information. It is not a GST tax invoice, e-invoice, IRN, payment confirmation or guarantee of supply.'}
            </aside>
          </>
        ) : null}
      </div>
    </TemplatePage>
  );
}

function BusinessCardPage({ document }: { document: BusinessCardDocument }) {
  const contact = [document.contact.phone, document.contact.email, document.contact.website].filter(Boolean);
  return (
    <TemplatePage document={document}>
      <div className="business-card-content">
        <p className="document-kicker">Print-ready contact card</p>
        <h1>Business card</h1>
        <div className="business-card-sheet">
          <section className="business-card business-card--front" aria-label="Business card front">
            <div className="business-card__brand">
              <Logo document={document} />
              <div>
                <strong>{document.identity.name}</strong>
                {document.identity.tagline ? <span>{document.identity.tagline}</span> : null}
              </div>
            </div>
            <div className="business-card__person">
              <h2>{document.personName}</h2>
              {document.designation ? <p>{document.designation}</p> : null}
            </div>
            {document.tagline ? <p className="business-card__tagline">{document.tagline}</p> : null}
            {contact.length ? <p className="business-card__contact">{contact.join(' · ')}</p> : null}
            {document.address ? (
              <p className="business-card__address preserve-lines">{document.address}</p>
            ) : null}
          </section>
          <section className="business-card business-card--back" aria-label="Business card notes">
            <strong>{document.identity.name}</strong>
            {document.note ? (
              <p className="preserve-lines">{document.note}</p>
            ) : (
              <p>Share this card after checking every contact detail.</p>
            )}
            {document.identity.gstin ? <span>GSTIN: {document.identity.gstin}</span> : null}
            {document.identity.registrationNumber ? (
              <span>Reg. no.: {document.identity.registrationNumber}</span>
            ) : null}
            <small>Local design preview · trim after printing</small>
          </section>
        </div>
        <p className="document-export-help">
          Print on A4 paper and trim to the card stock size you use. Dimensions and print alignment depend on
          your printer.
        </p>
      </div>
    </TemplatePage>
  );
}

function InvoicePartyBlock({ label, party }: { label: string; party: GstInvoiceDocument['supplier'] }) {
  return (
    <div className="invoice-party-block">
      <span className="invoice-label">{label}</span>
      <strong>{party.legalName}</strong>
      {party.tradeName ? <span>Trade name: {party.tradeName}</span> : null}
      <p className="preserve-lines">
        {[
          party.address.line1,
          party.address.line2,
          [party.address.city, party.address.district].filter(Boolean).join(', '),
          [party.address.state, party.address.stateCode ? `(${party.address.stateCode})` : '']
            .filter(Boolean)
            .join(' '),
          party.address.postalCode,
          party.address.country,
        ]
          .filter(Boolean)
          .join('\n')}
      </p>
      {party.gstin ? <span>GSTIN: {party.gstin}</span> : null}
      {[party.phone, party.email].filter(Boolean).length ? (
        <span>{[party.phone, party.email].filter(Boolean).join(' · ')}</span>
      ) : null}
    </div>
  );
}

function InvoiceLineDetails({ line, index }: { line: GstInvoiceLine; index: number }) {
  return (
    <details className="invoice-mobile-line">
      <summary>
        <span>
          {index + 1}. {line.description}
        </span>
        <strong>{formatIndianCurrency(line.lineTotal)}</strong>
      </summary>
      <dl>
        <div>
          <dt>HSN/SAC</dt>
          <dd>{line.hsnOrSac || 'Not supplied'}</dd>
        </div>
        <div>
          <dt>Quantity</dt>
          <dd>
            {formatIndianNumber(line.quantity)} {line.unit}
          </dd>
        </div>
        <div>
          <dt>Unit price</dt>
          <dd>{formatIndianCurrency(line.unitPrice)}</dd>
        </div>
        <div>
          <dt>Taxable value</dt>
          <dd>{formatIndianCurrency(line.taxableValue)}</dd>
        </div>
        <div>
          <dt>GST</dt>
          <dd>
            {formatIndianCurrency(line.gstAmount)} at {line.gstRatePercent}%
          </dd>
        </div>
        <div>
          <dt>Line total</dt>
          <dd>{formatIndianCurrency(line.lineTotal)}</dd>
        </div>
      </dl>
    </details>
  );
}

function GstInvoicePage({
  document,
  items,
  pageIndex,
}: {
  document: GstInvoiceDocument;
  items: GstInvoiceLine[];
  pageIndex: number;
}) {
  const isLastPage = pageIndex === document.pageChunks.length - 1;
  const firstItemIndex = document.items.findIndex((item) => item.id === items[0]?.id);
  return (
    <TemplatePage document={document} pageNumber={pageIndex + 1}>
      <div className="invoice-content">
        <div className="invoice-heading">
          <div>
            <p className="document-kicker">Standard workflow · local draft</p>
            <h1>Tax Invoice</h1>
          </div>
          <dl>
            <div>
              <dt>Invoice no.</dt>
              <dd>{document.invoiceNumber}</dd>
            </div>
            <div>
              <dt>Invoice date</dt>
              <dd>
                <time dateTime={document.invoiceDate}>{document.displayInvoiceDate}</time>
              </dd>
            </div>
            {document.displayDueDate ? (
              <div>
                <dt>Due date</dt>
                <dd>{document.displayDueDate}</dd>
              </div>
            ) : null}
          </dl>
        </div>
        {pageIndex === 0 ? (
          <>
            <div className="invoice-parties">
              <InvoicePartyBlock label="Supplier" party={document.supplier} />
              <InvoicePartyBlock
                label={`Recipient · ${document.recipientRegistrationStatus}`}
                party={document.recipient}
              />
            </div>
            <div className="invoice-facts">
              <span>
                <strong>Supply:</strong>{' '}
                {document.supplyType === 'intra-state'
                  ? 'Intra-State · CGST + SGST/UTGST'
                  : 'Inter-State · IGST'}
              </span>
              {document.placeOfSupply ? (
                <span>
                  <strong>Place of supply:</strong> {document.placeOfSupply.state} (
                  {document.placeOfSupply.stateCode})
                </span>
              ) : null}
              <span>
                <strong>Reverse charge:</strong>{' '}
                {document.reverseCharge ? 'Yes · user marked' : 'No · user marked'}
              </span>
            </div>
          </>
        ) : (
          <p className="document-continuation">Tax Invoice · continued</p>
        )}
        <div className="invoice-table-wrap">
          <table className="invoice-table">
            <caption>Invoice items, page {pageIndex + 1}</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Description</th>
                <th scope="col">HSN/SAC</th>
                <th scope="col">Qty</th>
                <th scope="col">Rate</th>
                <th scope="col">Taxable</th>
                <th scope="col">GST</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((line, index) => (
                <tr key={line.id}>
                  <td>{(firstItemIndex < 0 ? index : firstItemIndex + index) + 1}</td>
                  <td className="break-anywhere">{line.description}</td>
                  <td>{line.hsnOrSac || '—'}</td>
                  <td>
                    {formatIndianNumber(line.quantity)} {line.unit}
                  </td>
                  <td>{formatIndianCurrency(line.unitPrice)}</td>
                  <td>{formatIndianCurrency(line.taxableValue)}</td>
                  <td>
                    {formatIndianCurrency(line.gstAmount)}
                    <small>{line.gstRatePercent}%</small>
                  </td>
                  <td>
                    <strong>{formatIndianCurrency(line.lineTotal)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="invoice-mobile-lines" aria-label="Invoice items in mobile layout">
          {items.map((line, index) => (
            <InvoiceLineDetails key={line.id} line={line} index={firstItemIndex + index} />
          ))}
        </div>
        {!isLastPage ? (
          <p className="invoice-continuation-note">More invoice items continue on the next A4 page.</p>
        ) : null}
        {isLastPage ? (
          <>
            <div className="invoice-result-grid">
              <div>
                <section className="invoice-words" aria-label="Amount in words">
                  <span className="invoice-label">Amount in words</span>
                  <strong>{document.totals.amountInWords}</strong>
                </section>
                <section className="invoice-tax-summary" aria-labelledby="invoice-tax-summary-title">
                  <h2 id="invoice-tax-summary-title">Tax summary by rate</h2>
                  <table>
                    <caption>GST grouped by selected rate</caption>
                    <thead>
                      <tr>
                        <th scope="col">Rate</th>
                        <th scope="col">Taxable</th>
                        <th scope="col">GST</th>
                      </tr>
                    </thead>
                    <tbody>
                      {document.taxGroups.map((group) => (
                        <tr key={group.key}>
                          <td>{group.label}</td>
                          <td>{formatIndianCurrency(group.taxableValue)}</td>
                          <td>{formatIndianCurrency(group.gstAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              </div>
              <section className="invoice-totals" aria-label="Invoice totals">
                <div>
                  <span>Gross value</span>
                  <strong>{formatIndianCurrency(document.totals.grossValue)}</strong>
                </div>
                <div>
                  <span>Discounts</span>
                  <strong>{formatIndianCurrency(document.totals.discountAmount)}</strong>
                </div>
                <div>
                  <span>Taxable value</span>
                  <strong>{formatIndianCurrency(document.totals.taxableValue)}</strong>
                </div>
                {document.supplyType === 'intra-state' ? (
                  <>
                    <div>
                      <span>CGST</span>
                      <strong>{formatIndianCurrency(document.totals.cgstAmount)}</strong>
                    </div>
                    <div>
                      <span>SGST/UTGST</span>
                      <strong>{formatIndianCurrency(document.totals.sgstOrUtgstAmount)}</strong>
                    </div>
                  </>
                ) : (
                  <div>
                    <span>IGST</span>
                    <strong>{formatIndianCurrency(document.totals.igstAmount)}</strong>
                  </div>
                )}
                <div>
                  <span>GST total</span>
                  <strong>{formatIndianCurrency(document.totals.gstAmount)}</strong>
                </div>
                <div className="invoice-grand-total">
                  <span>Grand total</span>
                  <strong>{formatIndianCurrency(document.totals.grandTotal)}</strong>
                </div>
              </section>
            </div>
            <div className="invoice-extra-grid">
              <div>
                {document.notes ? (
                  <p>
                    <strong>Notes:</strong> {document.notes}
                  </p>
                ) : null}
                {document.terms ? (
                  <p>
                    <strong>Terms:</strong> {document.terms}
                  </p>
                ) : null}
                {document.paymentDetails ? (
                  <p>
                    <strong>Payment details:</strong> {document.paymentDetails}
                  </p>
                ) : null}
              </div>
              <div className="invoice-signature">
                <span>Authorised signatory</span>
                <div aria-hidden="true" />
              </div>
            </div>
            <aside className="invoice-disclaimer">
              {document.hsnWarning
                ? 'HSN/SAC is missing on one or more lines; verify the correct code and applicable digit requirement before issue. '
                : ''}
              {document.customRateWarning
                ? 'Custom rates are user supplied and not classified or verified here. '
                : ''}
              This local draft is not an e-invoice, IRN, filing record or proof of GST registration/ownership.
            </aside>
          </>
        ) : null}
      </div>
    </TemplatePage>
  );
}

export function DocumentPreview({ document, targetId }: { document: BusinessDocument; targetId: string }) {
  if (isWorkplaceDocument(document)) {
    return <WorkplaceDocumentPreview document={document} targetId={targetId} />;
  }

  const pages =
    document.type === 'letterhead'
      ? document.bodyPages.map((body, index) => (
          <LetterheadPage document={document} body={body} pageIndex={index} key={`letter-${index}`} />
        ))
      : document.type === 'gst-invoice'
        ? document.pageChunks.map((items, index) => (
            <GstInvoicePage document={document} items={items} pageIndex={index} key={`invoice-${index}`} />
          ))
        : document.type === 'invoice'
          ? document.pageChunks.map((items, index) => (
              <QuotationPage document={document} items={items} pageIndex={index} key={`invoice-${index}`} />
            ))
          : document.type === 'quotation'
            ? document.pageChunks.map((items, index) => (
                <QuotationPage
                  document={document}
                  items={items}
                  pageIndex={index}
                  key={`quotation-${index}`}
                />
              ))
            : document.type === 'business-card'
              ? [<BusinessCardPage document={document} key="business-card" />]
              : [<PaymentReceiptPage document={document} key="receipt" />];

  return (
    <div className="document-preview" data-testid="document-preview" aria-label="Document preview">
      <div id={targetId} className="document-print-area">
        {pages}
      </div>
    </div>
  );
}
