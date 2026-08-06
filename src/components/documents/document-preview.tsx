import Image from 'next/image';

import type { BusinessDocument, LetterheadDocument, PaymentReceiptDocument } from '@/domain/documents/types';

function Logo({ document }: { document: BusinessDocument }) {
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

function IdentityHeader({ document }: { document: BusinessDocument }) {
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

function DocumentFooter({ document }: { document: BusinessDocument }) {
  return (
    <footer className="document-footer">
      <p>{document.footerText || 'Prepared for local business use. Review details before sharing.'}</p>
      <span>Created locally with KarobarKit</span>
    </footer>
  );
}

function TemplatePage({
  document,
  children,
  pageNumber,
}: {
  document: BusinessDocument;
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

export function DocumentPreview({ document, targetId }: { document: BusinessDocument; targetId: string }) {
  const pages =
    document.type === 'letterhead'
      ? document.bodyPages.map((body, index) => (
          <LetterheadPage document={document} body={body} pageIndex={index} key={`letter-${index}`} />
        ))
      : [<PaymentReceiptPage document={document} key="receipt" />];

  return (
    <div className="document-preview" data-testid="document-preview" aria-label="Document preview">
      <div id={targetId} className="document-print-area">
        {pages}
      </div>
    </div>
  );
}
