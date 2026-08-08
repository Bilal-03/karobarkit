'use client';

import { useState } from 'react';

export function ContactForm() {
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  function prepare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setMessage(
      [
        `Name: ${String(data.get('name') ?? '') || 'Not provided'}`,
        `Email: ${String(data.get('email') ?? '') || 'Not provided'}`,
        `Topic: ${String(data.get('topic') ?? '')}`,
        `Message: ${String(data.get('message') ?? '') || 'Not provided'}`,
      ].join('\n'),
    );
    setCopied(false);
  }

  async function copy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
  }

  return (
    <div className="contact-form-stack">
      <div className="warning-block" role="note">
        This early build has no message-delivery backend. Preparing a message does not send it; copy the
        prepared text into the support channel provided by the site owner.
      </div>
      <form className="contact-form" onSubmit={prepare}>
        <div className="field">
          <label className="field__label" htmlFor="contact-name">
            Your name
          </label>
          <input className="input" id="contact-name" name="name" autoComplete="name" />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="contact-email">
            Email address
          </label>
          <input
            className="input"
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            aria-describedby="contact-email-help"
          />
          <div className="field__help" id="contact-email-help">
            Optional. Do not include account numbers or sensitive documents.
          </div>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="contact-topic">
            What is this about?
          </label>
          <select className="input input--select" id="contact-topic" name="topic" defaultValue="feedback">
            <option value="feedback">Product feedback</option>
            <option value="accessibility">Accessibility</option>
            <option value="source">Source suggestion</option>
            <option value="other">Something else</option>
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="contact-message">
            Message
          </label>
          <textarea
            className="input input--textarea"
            id="contact-message"
            name="message"
            rows={6}
            aria-describedby="contact-message-help"
          />
          <div className="field__help" id="contact-message-help">
            Leave out private amounts, tax IDs, passwords and document contents.
          </div>
        </div>
        <button className="button button--primary" type="submit">
          Prepare message
        </button>
      </form>
      {message ? (
        <section className="prepared-report" aria-live="polite">
          <h2>Message ready to share</h2>
          <pre>{message}</pre>
          <button className="button button--secondary" type="button" onClick={copy}>
            {copied ? 'Copied' : 'Copy message'}
          </button>
          <p>Nothing has been transmitted by KarobarKit.</p>
        </section>
      ) : null}
    </div>
  );
}
