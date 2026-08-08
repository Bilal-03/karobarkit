'use client';

import { useState } from 'react';

export function ContactForm() {
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus(null);
    setIsSending(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setStatus({
          type: 'error',
          message: result?.error ?? 'We could not send your message right now. Please try again shortly.',
        });
        return;
      }

      form.reset();
      setStatus({ type: 'success', message: 'Thanks — your message has been sent.' });
    } catch {
      setStatus({
        type: 'error',
        message: 'We could not send your message right now. Please try again shortly.',
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="contact-form-stack">
      <form className="contact-form" onSubmit={submit}>
        <div className="contact-honeypot" aria-hidden="true">
          <label htmlFor="contact-website">Website</label>
          <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
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
            required
            aria-describedby="contact-message-help"
          />
          <div className="field__help" id="contact-message-help">
            We will use your email only to reply. Please leave out private amounts, tax IDs, passwords and
            document contents.
          </div>
        </div>
        <button className="button button--primary" type="submit" disabled={isSending}>
          {isSending ? 'Sending…' : 'Send message'}
        </button>
      </form>
      {status ? (
        <p
          className={`contact-status contact-status--${status.type}`}
          role={status.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
