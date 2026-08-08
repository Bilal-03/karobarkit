'use client';

import { useState } from 'react';

interface ErrorReportFormProps {
  tools: { slug: string; name: string }[];
  defaultTool: string;
}

export function ErrorReportForm({ tools, defaultTool }: ErrorReportFormProps) {
  const [report, setReport] = useState('');
  const [copied, setCopied] = useState(false);

  function prepareReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setReport(
      [
        `Issue type: ${String(data.get('type') ?? '')}`,
        `Tool: ${String(data.get('tool') ?? '')}`,
        `Version/review date: ${String(data.get('version') ?? '')}`,
        `Description: ${String(data.get('description') ?? '')}`,
        `Expected behaviour: ${String(data.get('expected') ?? '') || 'Not provided'}`,
        `Reply email: ${String(data.get('email') ?? '') || 'Not provided'}`,
      ].join('\n'),
    );
    setCopied(false);
  }

  async function copyReport() {
    await navigator.clipboard.writeText(report);
    setCopied(true);
  }

  return (
    <>
      <div className="warning-block" role="note">
        Do not include bank details, payment credentials, Aadhaar, PAN, customer data or full invoice
        contents. This early build has no submission backend; preparing a report does not send it.
      </div>
      <form className="contact-form" onSubmit={prepareReport}>
        <div className="field">
          <label htmlFor="error-tool">Tool</label>
          <select className="select" id="error-tool" name="tool" defaultValue={defaultTool}>
            {tools.map((tool) => (
              <option key={tool.slug} value={tool.slug}>
                {tool.name}
              </option>
            ))}
            <option value="site">Website / other</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="error-type">Issue type</label>
          <select className="select" id="error-type" name="type" defaultValue="Incorrect calculation">
            <option>Incorrect calculation</option>
            <option>Outdated regulatory information</option>
            <option>Broken source</option>
            <option>PDF or export issue</option>
            <option>Accessibility issue</option>
            <option>Search issue</option>
            <option>Mobile layout issue</option>
            <option>Other</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="error-version">Version or review date</label>
          <input className="input" id="error-version" name="version" defaultValue="Reviewed 8 August 2026" />
        </div>
        <div className="field">
          <label htmlFor="error-description">What happened?</label>
          <textarea
            className="textarea"
            id="error-description"
            name="description"
            rows={6}
            required
            aria-describedby="report-help"
          />
          <p className="field-help" id="report-help">
            Describe the issue without pasting private inputs.
          </p>
        </div>
        <div className="field">
          <label htmlFor="error-expected">What did you expect? (optional)</label>
          <textarea className="textarea" id="error-expected" name="expected" rows={3} />
        </div>
        <div className="field">
          <label htmlFor="error-email">Contact email (optional)</label>
          <input className="input" id="error-email" name="email" type="email" autoComplete="email" />
        </div>
        <button className="button button--primary" type="submit">
          Prepare report
        </button>
      </form>
      {report ? (
        <section className="prepared-report" aria-live="polite">
          <h2>Report ready to share</h2>
          <pre>{report}</pre>
          <button className="button button--secondary" type="button" onClick={copyReport}>
            {copied ? 'Copied' : 'Copy report'}
          </button>
          <p>
            Paste this into the support channel provided by the site owner. Nothing has been transmitted by
            KarobarKit.
          </p>
        </section>
      ) : null}
    </>
  );
}
