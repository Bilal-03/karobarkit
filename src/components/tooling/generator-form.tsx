'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { FieldError } from '@/domain/calculations/types';
import { calculateUpi, type UpiInput, type UpiResult, validateUpiInput } from '@/domain/qr/upi';
import {
  calculateUrlQr,
  type UrlQrInput,
  type UrlQrResult,
  URL_QR_SIZES,
  validateUrlQrInput,
} from '@/domain/qr/url';
import { exportErrorMessage, downloadDataUrl, printElement, safeFilename } from '@/lib/qr/export';
import { QR_LOCAL_PRIVACY_NOTE, UPI_OWNERSHIP_DISCLAIMER } from '@/lib/qr/privacy';
import { trackEvent } from '@/lib/analytics';
import {
  clearLocalScenarioTransfer,
  readLocalScenarioTransfer,
  type LocalScenarioTransfer,
} from '@/domain/workflows/local-scenario-transfer';

import { QrPreview, useQrImage } from '@/components/qr/qr-preview';
import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/ui/form-error';
import { InputField, SelectField, TextareaField } from '@/components/ui/form-field';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';
import { focusResult, useLiveCalculation } from './use-live-calculation';

type GeneratorKind = 'url-qr' | 'upi-standee';
type GeneratorInput = UrlQrInput | UpiInput;
type GeneratorResult = UrlQrResult | UpiResult;

interface GeneratorToolProps {
  id: string;
  category: string;
  defaultValues: unknown;
}

function getFieldError(errors: FieldError[], field: string) {
  return errors.find((error) => error.field === field)?.message;
}

function hasValues(values: GeneratorInput) {
  return Object.values(values).some((value) => value.trim().length > 0);
}

export function GeneratorForm({ kind, tool }: { kind: GeneratorKind; tool: GeneratorToolProps }) {
  const isUrl = kind === 'url-qr';
  const initialValues = useMemo(
    () => (isUrl ? (tool.defaultValues as UrlQrInput) : (tool.defaultValues as UpiInput)),
    [isUrl, tool.defaultValues],
  );
  const [values, setValues] = useState<GeneratorInput>(initialValues);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isInteractive, setIsInteractive] = useState(false);
  const [handoffTransfer, setHandoffTransfer] = useState<LocalScenarioTransfer | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const {
    result,
    errors,
    calculationError,
    isCalculating: isGenerating,
    clearFieldError,
    clearErrors,
    submit,
  } = useLiveCalculation<GeneratorInput, GeneratorResult>({
    values,
    validate: (input) => {
      const validation = isUrl
        ? validateUrlQrInput(input as UrlQrInput)
        : validateUpiInput(input as UpiInput);
      return validation.success ? { success: true as const, data: input } : validation;
    },
    calculate: (input) => (isUrl ? calculateUrlQr(input as UrlQrInput) : calculateUpi(input as UpiInput)),
    onResult: (_nextResult, source) => {
      if (source === 'submit') {
        trackEvent('tool_completed', { toolId: tool.id });
        trackEvent('result_generated', { toolId: tool.id });
        window.requestAnimationFrame(() => focusResult(resultRef.current));
      }
    },
    onValidationFailure: (validationErrors, source) => {
      if (source === 'submit') {
        trackEvent('tool_validation_failed', {
          toolId: tool.id,
          errorCodes: validationErrors.map((error) => error.code),
        });
      }
    },
  });

  const urlResult = isUrl ? (result as UrlQrResult | null) : null;
  const upiResult = !isUrl ? (result as UpiResult | null) : null;
  const qrSize = urlResult?.size ?? 512;
  const qrImage = useQrImage(result?.payload ?? '', qrSize);
  const printTargetId = isUrl ? 'url-qr-print-area' : 'upi-standee-print-area';

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsInteractive(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    trackEvent('tool_viewed', { toolId: tool.id, category: tool.category });
  }, [tool.category, tool.id]);

  useEffect(() => {
    if (!isUrl) {
      const timer = window.setTimeout(() => {
        const transfer = readLocalScenarioTransfer();
        if (transfer?.sourceKind === 'gst-invoice-to-upi' || transfer?.sourceKind === 'invoice-to-upi')
          setHandoffTransfer(transfer);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [isUrl]);

  useEffect(() => {
    if (errors.length === 0) {
      return;
    }

    const frame = window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [errors]);

  function updateValue(field: string, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
    setExportError(null);
  }

  function importInvoiceHandoff() {
    if (!handoffTransfer || isUrl) return;
    const incoming = handoffTransfer.values;
    setValues((current) => ({
      ...(current as UpiInput),
      amount: incoming.amount || (current as UpiInput).amount,
      note: incoming.note || (current as UpiInput).note,
    }));
    clearErrors();
    setHandoffTransfer(null);
    clearLocalScenarioTransfer();
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setExportError(null);
    trackEvent('tool_started', { toolId: tool.id });
    submit();
  }

  function resetForm() {
    const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);
    if (
      (isDirty || (hasValues(values) && !result)) &&
      !window.confirm('Clear the entered details and generated QR code?')
    ) {
      return;
    }
    setValues(initialValues);
    clearErrors();
    setExportError(null);
  }

  function downloadPng() {
    if (!qrImage.dataUrl) {
      setExportError('The QR preview is still preparing. Try the download again in a moment.');
      return;
    }

    try {
      downloadDataUrl(
        qrImage.dataUrl,
        safeFilename(isUrl ? 'karobarkit-url-qr' : 'karobarkit-upi-standee', 'karobarkit-qr', 'png'),
      );
      trackEvent('result_downloaded', { toolId: tool.id, format: 'png' });
      setExportError(null);
    } catch (error) {
      setExportError(exportErrorMessage(error));
    }
  }

  function printPreview() {
    try {
      printElement(printTargetId);
      trackEvent('result_printed', { toolId: tool.id, pageSize: isUrl ? 'qr' : 'standee' });
      setExportError(null);
    } catch (error) {
      setExportError(exportErrorMessage(error));
    }
  }

  const resultTitle = isUrl ? 'Your URL QR code is ready' : 'Your UPI standee is ready';

  return (
    <div className="calculator-layout generator-layout">
      <section className="calculator-card" aria-labelledby="generator-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">{isUrl ? 'QR generator' : 'Payment display'}</p>
            <h2 id="generator-form-title">{isUrl ? 'Enter a URL' : 'Enter payment details'}</h2>
          </div>
          <span className="local-badge">Runs locally</span>
        </div>
        <form
          onSubmit={onSubmit}
          noValidate
          data-interactive={isInteractive ? 'true' : 'false'}
          inert={!isInteractive}
        >
          <ErrorSummary ref={errorSummaryRef} errors={errors} />
          {handoffTransfer && !isUrl ? (
            <div className="local-handoff-banner" role="status">
              <strong>An invoice total is ready for a UPI QR draft</strong>
              <p>
                Import the declared amount and invoice note, then enter and verify the payee name and UPI ID
                yourself.
              </p>
              <div className="inline-actions">
                <Button type="button" onClick={importInvoiceHandoff}>
                  Import invoice amount
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    clearLocalScenarioTransfer();
                    setHandoffTransfer(null);
                  }}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ) : null}
          {isUrl ? (
            <>
              <InputField
                id="url"
                name="url"
                type="text"
                inputMode="url"
                autoComplete="url"
                label="URL"
                help="HTTP and HTTPS are supported. A bare domain is normalized to HTTPS; other protocols are rejected."
                placeholder="https://example.com"
                value={(values as UrlQrInput).url}
                onChange={(event) => updateValue('url', event.target.value)}
                error={getFieldError(errors, 'url')}
                required
              />
              <SelectField
                id="size"
                name="size"
                label="Output size"
                help="Choose a larger size for print or a distant sign."
                value={(values as UrlQrInput).size}
                onChange={(event) => updateValue('size', event.target.value)}
                error={getFieldError(errors, 'size')}
                required
              >
                {URL_QR_SIZES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
            </>
          ) : (
            <>
              <InputField
                id="payeeName"
                name="payeeName"
                type="text"
                autoComplete="name"
                label="Payee name"
                help="This is shown on the standee. It is not checked against a bank or UPI account."
                value={(values as UpiInput).payeeName}
                onChange={(event) => updateValue('payeeName', event.target.value)}
                error={getFieldError(errors, 'payeeName')}
                required
              />
              <InputField
                id="upiId"
                name="upiId"
                type="text"
                inputMode="email"
                autoComplete="off"
                label="UPI ID"
                help="Use the name@handle format shown by your UPI app. Syntax is checked locally; ownership is not verified."
                placeholder="yourname@bank"
                value={(values as UpiInput).upiId}
                onChange={(event) => updateValue('upiId', event.target.value)}
                error={getFieldError(errors, 'upiId')}
                required
              />
              <InputField
                id="amount"
                name="amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                label="Fixed amount (optional)"
                help="Enter an INR amount with up to two decimal places, or leave blank for an open amount."
                placeholder="For example, 250.00"
                value={(values as UpiInput).amount}
                onChange={(event) => updateValue('amount', event.target.value)}
                error={getFieldError(errors, 'amount')}
              />
              <TextareaField
                id="note"
                name="note"
                label="Payment note (optional)"
                help="Keep it short. The note is encoded into the URI and shown to the payer's UPI app."
                rows={3}
                value={(values as UpiInput).note}
                onChange={(event) => updateValue('note', event.target.value)}
                error={getFieldError(errors, 'note')}
              />
            </>
          )}
          <div className="generator-form__actions">
            <Button type="submit" fullWidth disabled={isGenerating}>
              {isGenerating ? 'Generating…' : isUrl ? 'Generate QR code' : 'Generate UPI standee'}
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={resetForm}>
              Reset
            </Button>
          </div>
        </form>
        <PrivacyBlock>{QR_LOCAL_PRIVACY_NOTE}</PrivacyBlock>
      </section>

      <section
        className="calculator-result generator-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby="generator-result-title"
      >
        {calculationError ? (
          <StateBlock
            titleId="generator-result-title"
            title="We could not generate that QR code"
            tone="error"
          >
            {calculationError}
          </StateBlock>
        ) : result ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Preview and export</p>
                <h2 id="generator-result-title">{resultTitle}</h2>
              </div>
              <span className="result-status" aria-label="QR preview updates live">
                Live · ready
              </span>
            </div>
            <div id={printTargetId} className={`qr-output ${isUrl ? 'qr-output--url' : 'qr-output--upi'}`}>
              {isUrl ? (
                <>
                  <p className="qr-output__kicker">URL QR code</p>
                  <h3>Scan to open the URL</h3>
                  <QrPreview state={qrImage} size={qrSize} alt="QR code for the normalized URL" />
                  <dl className="result-breakdown qr-output__details">
                    <div>
                      <dt>Encoded URL</dt>
                      <dd className="break-anywhere">{urlResult?.normalizedUrl}</dd>
                    </div>
                    <div>
                      <dt>Output size</dt>
                      <dd>{urlResult?.size} px</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <div className="standee-preview">
                  <p className="standee-preview__brand">KarobarKit · UPI payment</p>
                  <h3>{upiResult?.payeeName}</h3>
                  <p className="standee-preview__prompt">Scan to pay</p>
                  <QrPreview
                    state={qrImage}
                    size={qrSize}
                    alt={`UPI payment QR code for ${upiResult?.payeeName}`}
                  />
                  {upiResult?.amount ? <p className="standee-preview__amount">₹{upiResult.amount}</p> : null}
                  <p className="standee-preview__upi">{upiResult?.upiId}</p>
                  <p className="standee-preview__note">
                    Confirm the payee name in your UPI app before paying.
                  </p>
                </div>
              )}
            </div>
            {exportError ? (
              <p className="export-error" role="alert">
                {exportError}
              </p>
            ) : null}
            <div className="inline-actions generator-actions">
              <Button type="button" onClick={downloadPng} disabled={!qrImage.dataUrl}>
                Download PNG
              </Button>
              <Button type="button" variant="secondary" onClick={printPreview} disabled={!qrImage.dataUrl}>
                Print
              </Button>
            </div>
            <PrivacyBlock>{QR_LOCAL_PRIVACY_NOTE}</PrivacyBlock>
            {!isUrl ? <p className="generator-disclaimer">{UPI_OWNERSHIP_DISCLAIMER}</p> : null}
            {!isUrl ? (
              <details className="payload-details">
                <summary>Show generated UPI payment URI</summary>
                <code data-testid="upi-payment-uri">{upiResult?.payload}</code>
              </details>
            ) : null}
          </>
        ) : (
          <StateBlock titleId="generator-result-title" title="Your preview will appear here" tone="empty">
            Complete the short form to create a QR preview. The URL or payment details stay in this browser.
          </StateBlock>
        )}
      </section>
    </div>
  );
}
