'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { FieldError } from '@/domain/calculations/types';
import {
  calculateBarcode,
  type BarcodeInput,
  type BarcodeResult,
  validateBarcodeInput,
} from '@/domain/qr/barcode';
import { classifyDecodedContent } from '@/domain/qr/decoded-content';
import { calculateVcard, type VcardInput, type VcardResult, validateVcardInput } from '@/domain/qr/vcard';
import {
  calculateWhatsapp,
  type WhatsappInput,
  type WhatsappResult,
  validateWhatsappInput,
} from '@/domain/qr/whatsapp';
import { calculateWifi, type WifiInput, type WifiResult, validateWifiInput } from '@/domain/qr/wifi';
import { decodeImageFile, detectFromVideo, requestCameraStream } from '@/lib/qr/scanner';
import { renderBarcodeSvg } from '@/lib/qr/barcode-render';
import {
  downloadBlob,
  downloadDataUrl,
  downloadSvg,
  downloadText,
  exportErrorMessage,
  safeFilename,
} from '@/lib/qr/export';
import { useQrImage, QrPreview } from '@/components/qr/qr-preview';
import type { ImageProcessingInput } from '@/domain/files/image';
import { resizeAndCompressImage } from '@/lib/files/image-processing';
import { mergePdfFiles, splitPdfFile } from '@/lib/files/pdf-processing';
import { createFaviconBundle } from '@/lib/files/favicon';
import type { FaviconInput } from '@/domain/files/favicon';
import {
  calculateEmailSignature,
  type EmailSignatureInput,
  type EmailSignatureResult,
  validateEmailSignatureInput,
} from '@/domain/marketing/email-signature';
import {
  calculateReviewRequest,
  type ReviewRequestInput,
  type ReviewRequestResult,
  validateReviewRequestInput,
} from '@/domain/marketing/review-request';
import { trackEvent } from '@/lib/analytics';

import { DownloadList } from '@/components/files/download-list';
import { FileProcessingStatus } from '@/components/files/file-processing-status';
import { LocalFileDropzone } from '@/components/files/local-file-dropzone';
import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/ui/form-error';
import { CheckboxField, InputField, SelectField, TextareaField } from '@/components/ui/form-field';
import { ResultPanel } from '@/components/ui/result-panel';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';
import { useLiveCalculation } from './use-live-calculation';

export type SharingFileUtilityKind =
  | 'whatsapp-link'
  | 'vcard'
  | 'wifi'
  | 'barcode'
  | 'scanner'
  | 'photo-resizer-compressor'
  | 'pdf-merge-split'
  | 'favicon-app-icon'
  | 'email-signature'
  | 'review-request';

interface ToolProps {
  id: string;
  category: string;
  defaultValues: unknown;
  privacyNote: string;
}

function useToolView(tool: ToolProps) {
  const [isInteractive, setIsInteractive] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsInteractive(true));
    trackEvent('tool_viewed', { toolId: tool.id, category: tool.category });
    return () => window.cancelAnimationFrame(frame);
  }, [tool.category, tool.id]);
  return isInteractive;
}

function getFieldError(errors: FieldError[], field: string) {
  return errors.find((error) => error.field === field)?.message;
}
function resultTitle(kind: SharingFileUtilityKind) {
  if (kind === 'whatsapp-link') return 'WhatsApp link ready';
  if (kind === 'vcard') return 'vCard ready';
  if (kind === 'wifi') return 'Wi‑Fi QR ready';
  return 'Your local result';
}

function QrPayloadForm({ kind, tool }: { kind: 'whatsapp-link' | 'vcard' | 'wifi'; tool: ToolProps }) {
  const initial = useMemo(() => tool.defaultValues as Record<string, string | boolean>, [tool.defaultValues]);
  const [values, setValues] = useState<Record<string, string | boolean>>(initial);
  const [exportError, setExportError] = useState<string | null>(null);
  const isInteractive = useToolView(tool);
  const errorRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const {
    result,
    errors,
    calculationError: error,
    clearFieldError,
    submit,
  } = useLiveCalculation<Record<string, string | boolean>, WhatsappResult | VcardResult | WifiResult>({
    values,
    validate: (input) => {
      const validation =
        kind === 'whatsapp-link'
          ? validateWhatsappInput(input as WhatsappInput)
          : kind === 'vcard'
            ? validateVcardInput(input as VcardInput)
            : validateWifiInput(input as WifiInput);
      return validation.success ? { success: true as const, data: input } : validation;
    },
    calculate: (input) =>
      kind === 'whatsapp-link'
        ? calculateWhatsapp(input as WhatsappInput)
        : kind === 'vcard'
          ? calculateVcard(input as VcardInput)
          : calculateWifi(input as WifiInput),
    onResult: (_nextResult, source) => {
      if (source === 'submit') {
        trackEvent('tool_completed', { toolId: tool.id });
        trackEvent('result_generated', { toolId: tool.id });
        window.requestAnimationFrame(() => resultRef.current?.focus());
      }
    },
    onValidationFailure: (validationErrors, source) => {
      if (source === 'submit') {
        trackEvent('tool_validation_failed', {
          toolId: tool.id,
          errorCodes: validationErrors.map((item) => item.code),
        });
      }
    },
  });
  const qrImage = useQrImage(result?.payload ?? '', 512);

  function update(field: string, value: string | boolean) {
    setValues((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
    setExportError(null);
  }
  async function exportSvg() {
    if (!result) return;
    try {
      const { renderQrSvg } = await import('@/lib/qr/render');
      downloadSvg(
        await renderQrSvg(result.payload, { size: 512 }),
        safeFilename(tool.id, 'karobarkit-qr', 'svg'),
      );
      trackEvent('result_downloaded', { toolId: tool.id, format: 'svg' });
      setExportError(null);
    } catch (nextError) {
      setExportError(exportErrorMessage(nextError));
    }
  }
  function exportPng() {
    if (!qrImage.dataUrl || !result) return;
    try {
      downloadDataUrl(qrImage.dataUrl, safeFilename(tool.id, 'karobarkit-qr', 'png'));
      trackEvent('result_downloaded', { toolId: tool.id, format: 'png' });
    } catch (nextError) {
      setExportError(exportErrorMessage(nextError));
    }
  }
  function exportVcard() {
    if (kind !== 'vcard' || !result) return;
    try {
      downloadText(result.payload, 'contact.vcf', 'text/vcard;charset=utf-8');
      trackEvent('result_downloaded', { toolId: tool.id, format: 'vcf' });
    } catch (nextError) {
      setExportError(exportErrorMessage(nextError));
    }
  }

  return (
    <div className="calculator-layout generator-layout">
      <section className="calculator-card" aria-labelledby="sharing-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Local sharing utility</p>
            <h2 id="sharing-form-title">Prepare the payload</h2>
          </div>
          <span className="local-badge">No sending</span>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            trackEvent('tool_started', { toolId: tool.id });
            submit();
          }}
          noValidate
          data-interactive={isInteractive ? 'true' : 'false'}
        >
          <ErrorSummary ref={errorRef} errors={errors} />
          {kind === 'whatsapp-link' ? (
            <>
              <InputField
                id="countryCode"
                label="Country code"
                value={String(values.countryCode ?? '')}
                onChange={(event) => update('countryCode', event.target.value)}
                error={getFieldError(errors, 'countryCode')}
                inputMode="numeric"
                required
              />
              <InputField
                id="phone"
                label="Phone digits"
                help="Do not include +, spaces or an extension."
                value={String(values.phone ?? '')}
                onChange={(event) => update('phone', event.target.value)}
                error={getFieldError(errors, 'phone')}
                inputMode="tel"
                required
              />
              <TextareaField
                id="message"
                label="Optional message"
                value={String(values.message ?? '')}
                onChange={(event) => update('message', event.target.value)}
                error={getFieldError(errors, 'message')}
                rows={4}
              />
            </>
          ) : kind === 'vcard' ? (
            <>
              <InputField
                id="fullName"
                label="Full name"
                value={String(values.fullName ?? '')}
                onChange={(event) => update('fullName', event.target.value)}
                error={getFieldError(errors, 'fullName')}
                required
              />
              <InputField
                id="organization"
                label="Organization"
                value={String(values.organization ?? '')}
                onChange={(event) => update('organization', event.target.value)}
                error={getFieldError(errors, 'organization')}
              />
              <InputField
                id="phone"
                label="Phone"
                value={String(values.phone ?? '')}
                onChange={(event) => update('phone', event.target.value)}
                error={getFieldError(errors, 'phone')}
                inputMode="tel"
              />
              <InputField
                id="email"
                label="Email"
                value={String(values.email ?? '')}
                onChange={(event) => update('email', event.target.value)}
                error={getFieldError(errors, 'email')}
                inputMode="email"
              />
              <InputField
                id="website"
                label="Website"
                value={String(values.website ?? '')}
                onChange={(event) => update('website', event.target.value)}
                error={getFieldError(errors, 'website')}
                inputMode="url"
              />
              <InputField
                id="address"
                label="Address"
                value={String(values.address ?? '')}
                onChange={(event) => update('address', event.target.value)}
                error={getFieldError(errors, 'address')}
              />
              <TextareaField
                id="note"
                label="Note"
                value={String(values.note ?? '')}
                onChange={(event) => update('note', event.target.value)}
                error={getFieldError(errors, 'note')}
                rows={3}
              />
            </>
          ) : (
            <>
              <InputField
                id="ssid"
                label="Network name (SSID)"
                value={String(values.ssid ?? '')}
                onChange={(event) => update('ssid', event.target.value)}
                error={getFieldError(errors, 'ssid')}
                required
              />
              <SelectField
                id="security"
                label="Security"
                value={String(values.security ?? 'WPA')}
                onChange={(event) => update('security', event.target.value)}
                error={getFieldError(errors, 'security')}
              >
                <option value="WPA">WPA / WPA2 / WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Open network</option>
              </SelectField>
              <InputField
                id="password"
                label="Password"
                type="password"
                autoComplete="off"
                value={String(values.password ?? '')}
                onChange={(event) => update('password', event.target.value)}
                error={getFieldError(errors, 'password')}
              />
              <CheckboxField
                id="hidden"
                label="This is a hidden network"
                checked={values.hidden === true}
                onChange={(event) => update('hidden', event.target.checked)}
              />
            </>
          )}
          <Button type="submit" fullWidth>
            Generate locally
          </Button>
        </form>
        <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
      </section>
      <section
        className="calculator-result generator-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby="sharing-result-title"
      >
        {error ? (
          <StateBlock titleId="sharing-result-title" title="We could not generate that payload" tone="error">
            {error}
          </StateBlock>
        ) : result ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Preview and export</p>
                <h2 id="sharing-result-title">{resultTitle(kind)}</h2>
              </div>
              <span className="result-status">Live · ready</span>
            </div>
            <div className="qr-output">
              <QrPreview state={qrImage} size={512} alt={`QR preview for ${tool.id}`} />
              <ResultPanel
                label="Encoded payload"
                value={result.payload}
                detail="Review the destination before sharing."
              />
            </div>
            {exportError ? (
              <p className="export-error" role="alert">
                {exportError}
              </p>
            ) : null}
            <div className="inline-actions">
              <Button type="button" onClick={exportPng} disabled={!qrImage.dataUrl}>
                Download PNG
              </Button>
              <Button type="button" variant="secondary" onClick={exportSvg}>
                Download SVG
              </Button>
              {kind === 'vcard' ? (
                <Button type="button" variant="secondary" onClick={exportVcard}>
                  Download .vcf
                </Button>
              ) : null}
            </div>
            <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
          </>
        ) : (
          <StateBlock titleId="sharing-result-title" title="Your preview will appear here" tone="empty">
            Complete the local form to create a QR payload. Nothing is sent automatically.
          </StateBlock>
        )}
      </section>
    </div>
  );
}

function BarcodeForm({ tool }: { tool: ToolProps }) {
  const initial = useMemo(() => tool.defaultValues as BarcodeInput, [tool.defaultValues]);
  const [values, setValues] = useState<BarcodeInput>(initial);
  const isInteractive = useToolView(tool);

  const {
    result,
    errors,
    calculationError: error,
    clearFieldError,
    submit: evaluate,
  } = useLiveCalculation<BarcodeInput, BarcodeResult>({
    values,
    validate: (input) => validateBarcodeInput(input),
    calculate: (input) => calculateBarcode(input),
    onResult: (_nextResult, source) => {
      if (source === 'submit') {
        trackEvent('tool_completed', { toolId: tool.id });
        trackEvent('result_generated', { toolId: tool.id });
      }
    },
    onValidationFailure: (validationErrors, source) => {
      if (source === 'submit') {
        trackEvent('tool_validation_failed', {
          toolId: tool.id,
          errorCodes: validationErrors.map((item) => item.code),
        });
      }
    },
  });

  function update(field: keyof BarcodeInput, value: string | boolean) {
    setValues((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    trackEvent('tool_started', { toolId: tool.id });
    evaluate();
  }
  return (
    <div className="calculator-layout">
      <section className="calculator-card" aria-labelledby="barcode-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Retail barcode</p>
            <h2 id="barcode-form-title">Enter a value</h2>
          </div>
          <span className="local-badge">Vector output</span>
        </div>
        <form onSubmit={submit} noValidate data-interactive={isInteractive ? 'true' : 'false'}>
          <ErrorSummary errors={errors} />
          <SelectField
            id="symbology"
            label="Symbology"
            value={values.symbology}
            onChange={(event) => update('symbology', event.target.value)}
            error={getFieldError(errors, 'symbology')}
          >
            <option value="code128">Code 128</option>
            <option value="code39">Code 39</option>
            <option value="ean13">EAN-13</option>
            <option value="upca">UPC-A</option>
          </SelectField>
          <InputField
            id="value"
            label="Value"
            value={values.value}
            onChange={(event) => update('value', event.target.value)}
            error={getFieldError(errors, 'value')}
            required
          />
          <SelectField
            id="width"
            label="Module width"
            value={values.width}
            onChange={(event) => update('width', event.target.value)}
          >
            <option value="compact">Compact</option>
            <option value="standard">Standard</option>
            <option value="large">Large</option>
          </SelectField>
          <CheckboxField
            id="showLabel"
            label="Show human-readable value"
            checked={values.showLabel}
            onChange={(event) => update('showLabel', event.target.checked)}
          />
          <Button type="submit" fullWidth>
            Generate barcode
          </Button>
        </form>
        <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
      </section>
      <section className="calculator-result" aria-labelledby="barcode-result-title">
        {error ? (
          <StateBlock titleId="barcode-result-title" title="We could not generate the barcode" tone="error">
            {error}
          </StateBlock>
        ) : result ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Preview</p>
                <h2 id="barcode-result-title">Barcode ready</h2>
              </div>
              <span className="result-status">Live · ready</span>
            </div>
            <div className="barcode-preview" dangerouslySetInnerHTML={{ __html: renderBarcodeSvg(result) }} />
            <div className="inline-actions">
              <Button
                type="button"
                onClick={() => {
                  downloadSvg(renderBarcodeSvg(result), safeFilename(tool.id, 'karobarkit-barcode', 'svg'));
                  trackEvent('result_downloaded', { toolId: tool.id, format: 'svg' });
                }}
              >
                Download SVG
              </Button>
            </div>
            <p className="field__help">Scan-test the output before using it on stock or labels.</p>
          </>
        ) : (
          <StateBlock titleId="barcode-result-title" title="Your barcode will appear here" tone="empty">
            A local vector preview will be generated after validation.
          </StateBlock>
        )}
      </section>
    </div>
  );
}

function ScannerForm({ tool }: { tool: ToolProps }) {
  const [content, setContent] = useState('');
  const [decoded, setDecoded] = useState<ReturnType<typeof classifyDecodedContent> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInteractive = useToolView(tool);
  useEffect(
    () => () => {
      if (scanTimerRef.current !== null) window.clearTimeout(scanTimerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    },
    [],
  );
  function review(value: string) {
    setContent(value);
    try {
      setDecoded(classifyDecodedContent(value));
      setError(null);
      trackEvent('result_generated', { toolId: tool.id });
    } catch (nextError) {
      setDecoded(null);
      setError(nextError instanceof Error ? nextError.message : 'The decoded content is empty.');
    }
  }
  async function readImage(files: File[]) {
    const file = files[0];
    if (!file) return;
    try {
      const found = await decodeImageFile(file);
      if (!found[0]) throw new Error('No QR or barcode was detected in that image.');
      review(found[0].rawValue);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'We could not decode that image.');
    }
  }
  async function startCamera() {
    try {
      stopCamera();
      setError(null);
      const nextStream = await requestCameraStream();
      streamRef.current = nextStream;
      setStream(nextStream);
      if (videoRef.current) {
        videoRef.current.srcObject = nextStream;
        await videoRef.current.play();
      }
      const scan = async () => {
        if (streamRef.current !== nextStream || !videoRef.current) return;
        try {
          const found = await detectFromVideo(videoRef.current);
          if (found[0]) {
            review(found[0].rawValue);
            stopCamera();
            return;
          }
        } catch (nextError) {
          setError(nextError instanceof Error ? nextError.message : 'Camera scanning is unavailable.');
          stopCamera();
          return;
        }
        scanTimerRef.current = window.setTimeout(() => void scan(), 180);
      };
      scanTimerRef.current = window.setTimeout(() => void scan(), 350);
      nextStream.getVideoTracks()[0]?.addEventListener('ended', stopCamera, { once: true });
    } catch (nextError) {
      stopCamera();
      setError(nextError instanceof Error ? nextError.message : 'Camera scanning is unavailable.');
    }
  }
  function stopCamera() {
    if (scanTimerRef.current !== null) window.clearTimeout(scanTimerRef.current);
    scanTimerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
  }
  return (
    <div className="calculator-layout">
      <section className="calculator-card" aria-labelledby="scanner-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Permission-first scanner</p>
            <h2 id="scanner-form-title">Scan locally</h2>
          </div>
          <span className="local-badge">No auto-open</span>
        </div>
        <div className="scanner-actions">
          <LocalFileDropzone
            id="scanner-file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            label="Upload an image"
            help="The image is decoded locally and released after use."
            onFiles={readImage}
          />
          <Button type="button" onClick={startCamera} disabled={Boolean(stream)}>
            Start camera
          </Button>
          {stream ? (
            <Button type="button" variant="secondary" onClick={stopCamera}>
              Stop camera
            </Button>
          ) : null}
          <video ref={videoRef} className="scanner-video" muted playsInline aria-label="Camera preview" />
          {stream ? <p role="status">Scanning continuously… Hold a code inside the camera preview.</p> : null}
        </div>
        <TextareaField
          id="content"
          label="Or review decoded content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={4}
        />
        <Button
          type="button"
          fullWidth
          onClick={() => {
            trackEvent('tool_started', { toolId: tool.id });
            review(content);
          }}
          data-interactive={isInteractive ? 'true' : 'false'}
        >
          Review content safely
        </Button>
        <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
      </section>
      <section className="calculator-result" aria-labelledby="scanner-result-title">
        {error ? (
          <StateBlock titleId="scanner-result-title" title="Scanner message" tone="error">
            {error}
          </StateBlock>
        ) : decoded ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Decoded preview</p>
                <h2 id="scanner-result-title">Review before opening</h2>
              </div>
              <span className="result-status">{decoded.kind}</span>
            </div>
            <ResultPanel
              label="Decoded content"
              value={decoded.display}
              detail={decoded.host ? `Domain: ${decoded.host}` : 'Shown as text first'}
            />
            {decoded.fields ? (
              <dl className="result-breakdown">
                <div>
                  <dt>Payee</dt>
                  <dd>{decoded.fields.payee ?? 'Not provided'}</dd>
                </div>
                <div>
                  <dt>Amount</dt>
                  <dd>
                    {decoded.fields.amount
                      ? `${decoded.fields.currency ?? 'INR'} ${decoded.fields.amount}`
                      : 'Not provided'}
                  </dd>
                </div>
              </dl>
            ) : null}
            {decoded.warning ? <p className="field__help">{decoded.warning}</p> : null}
            {decoded.openable ? (
              <a className="button button--secondary" href={decoded.raw} target="_blank" rel="noreferrer">
                Open after checking
              </a>
            ) : null}
          </>
        ) : (
          <StateBlock
            titleId="scanner-result-title"
            title="Your decoded content will appear here"
            tone="empty"
          >
            Camera permission is requested only when you press Start camera. Unknown and payment schemes stay
            text-only.
          </StateBlock>
        )}
      </section>
    </div>
  );
}

function PhotoForm({ tool }: { tool: ToolProps }) {
  const initial = useMemo(() => tool.defaultValues as ImageProcessingInput, [tool.defaultValues]);
  const [values, setValues] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [output, setOutput] = useState<{
    blob: Blob;
    filename: string;
    width: number;
    height: number;
    bytes: number;
  } | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef<AbortController | null>(null);
  const isInteractive = useToolView(tool);
  useEffect(() => () => processingRef.current?.abort(), []);
  async function process() {
    if (!file) {
      setError('Choose an image first.');
      setStatus('error');
      return;
    }
    setStatus('processing');
    setError(null);
    processingRef.current?.abort();
    const controller = new AbortController();
    processingRef.current = controller;
    try {
      const next = await resizeAndCompressImage(
        file,
        { ...values, stripMetadata: true },
        { signal: controller.signal },
      );
      if (processingRef.current !== controller) return;
      setOutput(next);
      setStatus('complete');
      trackEvent('tool_completed', { toolId: tool.id });
      trackEvent('result_generated', { toolId: tool.id });
    } catch (nextError) {
      if (controller.signal.aborted) return;
      setStatus('error');
      setError(nextError instanceof Error ? nextError.message : 'The image could not be processed.');
    } finally {
      if (processingRef.current === controller) processingRef.current = null;
    }
  }
  function clearPhoto() {
    processingRef.current?.abort();
    processingRef.current = null;
    setFile(null);
    setOutput(null);
    setError(null);
    setStatus('idle');
  }
  return (
    <div className="calculator-layout">
      <section className="calculator-card" aria-labelledby="photo-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Local image utility</p>
            <h2 id="photo-form-title">Resize and compress</h2>
          </div>
          <span className="local-badge">No upload</span>
        </div>
        <LocalFileDropzone
          id="photo-file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          label={file ? file.name : 'Choose a local image'}
          help="JPEG, PNG, WebP or GIF within the shared byte and pixel limits."
          onFiles={(files) => {
            processingRef.current?.abort();
            setFile(files[0] ?? null);
            setOutput(null);
            setStatus('idle');
          }}
        />
        {file ? (
          <Button type="button" variant="ghost" onClick={clearPhoto}>
            Remove selected image
          </Button>
        ) : null}
        <InputField
          id="width"
          label="Output width (px)"
          value={values.width}
          onChange={(event) => setValues((current) => ({ ...current, width: event.target.value }))}
          inputMode="numeric"
        />
        <InputField
          id="height"
          label="Output height (px)"
          value={values.height}
          onChange={(event) => setValues((current) => ({ ...current, height: event.target.value }))}
          inputMode="numeric"
        />
        <InputField
          id="quality"
          label="Quality (0.1–1)"
          value={values.quality}
          onChange={(event) => setValues((current) => ({ ...current, quality: event.target.value }))}
          inputMode="decimal"
        />
        <SelectField
          id="format"
          label="Output format"
          value={values.format}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              format: event.target.value as ImageProcessingInput['format'],
            }))
          }
        >
          <option value="image/jpeg">JPEG</option>
          <option value="image/png">PNG</option>
          <option value="image/webp">WebP</option>
        </SelectField>
        <p className="field__help">
          The new file is canvas-encoded, so EXIF and other source metadata are always removed.
        </p>
        <Button
          type="button"
          fullWidth
          onClick={() => {
            trackEvent('tool_started', { toolId: tool.id });
            void process();
          }}
          disabled={status === 'processing'}
          data-interactive={isInteractive ? 'true' : 'false'}
        >
          Process locally
        </Button>
        {status === 'processing' ? (
          <Button type="button" variant="secondary" fullWidth onClick={clearPhoto}>
            Cancel processing
          </Button>
        ) : null}
        <FileProcessingStatus status={status} message={error ?? undefined} />
        <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
      </section>
      <section className="calculator-result" aria-labelledby="photo-result-title">
        {output ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Local output</p>
                <h2 id="photo-result-title">Image ready</h2>
              </div>
              <span className="result-status">{Math.ceil(output.bytes / 1024)} KB</span>
            </div>
            <ResultPanel
              label="Output dimensions"
              value={`${output.width} × ${output.height} px`}
              detail="The source file is unchanged."
            />
            <Button
              type="button"
              onClick={() => {
                downloadBlob(output.blob, output.filename);
                trackEvent('result_downloaded', {
                  toolId: tool.id,
                  format: output.blob.type.split('/')[1] ?? 'image',
                });
              }}
            >
              Download image
            </Button>
          </>
        ) : (
          <StateBlock titleId="photo-result-title" title="Your output will appear here" tone="empty">
            Choose a file and process it locally. Object URLs and decoded bitmaps are cleaned up after use.
          </StateBlock>
        )}
      </section>
    </div>
  );
}

function PdfForm({ tool }: { tool: ToolProps }) {
  const initial = useMemo(
    () => tool.defaultValues as { mode: 'merge' | 'split'; splitPages: string },
    [tool.defaultValues],
  );
  const [values, setValues] = useState(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [output, setOutput] = useState<{ blob: Blob; filename: string; pages: number } | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef<AbortController | null>(null);
  const isInteractive = useToolView(tool);
  useEffect(() => () => processingRef.current?.abort(), []);
  async function process() {
    processingRef.current?.abort();
    const controller = new AbortController();
    processingRef.current = controller;
    setStatus('processing');
    setError(null);
    try {
      const next =
        values.mode === 'merge'
          ? await mergePdfFiles(files, { signal: controller.signal })
          : files[0]
            ? await splitPdfFile(files[0], values, { signal: controller.signal })
            : (() => {
                throw new Error('Choose a PDF first.');
              })();
      if (processingRef.current !== controller) return;
      setOutput(next);
      setStatus('complete');
      trackEvent('tool_completed', { toolId: tool.id });
      trackEvent('result_generated', { toolId: tool.id });
    } catch (nextError) {
      if (controller.signal.aborted) return;
      setStatus('error');
      setError(nextError instanceof Error ? nextError.message : 'The PDF could not be processed.');
    } finally {
      if (processingRef.current === controller) processingRef.current = null;
    }
  }
  function clearPdfs() {
    processingRef.current?.abort();
    processingRef.current = null;
    setFiles([]);
    setOutput(null);
    setError(null);
    setStatus('idle');
  }
  return (
    <div className="calculator-layout">
      <section className="calculator-card" aria-labelledby="pdf-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Local PDF utility</p>
            <h2 id="pdf-form-title">Merge or split</h2>
          </div>
          <span className="local-badge">No upload</span>
        </div>
        <SelectField
          id="mode"
          label="Action"
          value={values.mode}
          onChange={(event) => {
            clearPdfs();
            setValues((current) => ({ ...current, mode: event.target.value as typeof current.mode }));
          }}
        >
          <option value="merge">Merge PDFs</option>
          <option value="split">Split / extract pages</option>
        </SelectField>
        <LocalFileDropzone
          id="pdf-files"
          accept="application/pdf,.pdf"
          multiple={values.mode === 'merge'}
          label={
            files.length
              ? `${files.length} PDF${files.length === 1 ? '' : 's'} selected`
              : 'Choose local PDFs'
          }
          help="Maximum 10 files, 12 MB per file and 100 pages per output."
          onFiles={(next) => {
            processingRef.current?.abort();
            setFiles(next);
            setOutput(null);
            setStatus('idle');
          }}
        />
        {files.length ? (
          <ul className="plain-list">
            {files.map((file, index) => (
              <li key={`${file.name}-${file.size}-${file.lastModified}-${index}`}>
                <span>{file.name}</span>{' '}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
                    setOutput(null);
                    setStatus('idle');
                  }}
                  aria-label={`Remove ${file.name}`}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        {files.length ? (
          <Button type="button" variant="ghost" onClick={clearPdfs}>
            Clear selected PDFs
          </Button>
        ) : null}
        {values.mode === 'split' ? (
          <InputField
            id="splitPages"
            label="Pages"
            help="For example 1, 3-4. Leave blank to export every page."
            value={values.splitPages}
            onChange={(event) => setValues((current) => ({ ...current, splitPages: event.target.value }))}
          />
        ) : null}
        <Button
          type="button"
          fullWidth
          onClick={() => {
            trackEvent('tool_started', { toolId: tool.id });
            void process();
          }}
          data-interactive={isInteractive ? 'true' : 'false'}
          disabled={status === 'processing'}
        >
          Process locally
        </Button>
        {status === 'processing' ? (
          <Button type="button" variant="secondary" fullWidth onClick={clearPdfs}>
            Cancel processing
          </Button>
        ) : null}
        <FileProcessingStatus status={status} message={error ?? undefined} />
        <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
      </section>
      <section className="calculator-result" aria-labelledby="pdf-result-title">
        {output ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Local output</p>
                <h2 id="pdf-result-title">PDF ready</h2>
              </div>
              <span className="result-status">{output.pages} pages</span>
            </div>
            <ResultPanel
              label="Output file"
              value={output.filename}
              detail="Open the PDF and verify the pages before sharing."
            />
            <Button
              type="button"
              onClick={() => {
                downloadBlob(output.blob, output.filename);
                trackEvent('result_downloaded', { toolId: tool.id, format: 'pdf' });
              }}
            >
              Download PDF
            </Button>
          </>
        ) : (
          <StateBlock titleId="pdf-result-title" title="Your PDF will appear here" tone="empty">
            Choose a local action and files. Encrypted or malformed PDFs are rejected without upload.
          </StateBlock>
        )}
      </section>
    </div>
  );
}

function FaviconForm({ tool }: { tool: ToolProps }) {
  const initial = useMemo(() => tool.defaultValues as FaviconInput, [tool.defaultValues]);
  const [values, setValues] = useState(initial);
  const [file, setFile] = useState<File | undefined>();
  const [output, setOutput] = useState<Awaited<ReturnType<typeof createFaviconBundle>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isInteractive = useToolView(tool);
  async function process() {
    setError(null);
    if (values.mode === 'image' && !file) {
      setError('Choose a source image first.');
      return;
    }
    try {
      const next = await createFaviconBundle(values, file);
      setOutput(next);
      trackEvent('tool_completed', { toolId: tool.id });
      trackEvent('result_generated', { toolId: tool.id });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'The icon set could not be generated.');
    }
  }
  return (
    <div className="calculator-layout">
      <section className="calculator-card" aria-labelledby="favicon-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Local brand asset</p>
            <h2 id="favicon-form-title">Create icon sizes</h2>
          </div>
          <span className="local-badge">ZIP locally</span>
        </div>
        <SelectField
          id="mode"
          label="Source"
          value={values.mode}
          onChange={(event) =>
            setValues((current) => ({ ...current, mode: event.target.value as FaviconInput['mode'] }))
          }
        >
          <option value="initials">Initials and colors</option>
          <option value="image">Source image</option>
        </SelectField>
        {values.mode === 'initials' ? (
          <InputField
            id="initials"
            label="Initials"
            value={values.initials}
            onChange={(event) => setValues((current) => ({ ...current, initials: event.target.value }))}
            help="Use one to three characters."
          />
        ) : (
          <LocalFileDropzone
            id="favicon-file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            label={file?.name ?? 'Choose source image'}
            help="The source is resized locally into common icon dimensions."
            onFiles={(files) => {
              setFile(files[0]);
              setOutput(null);
              setError(null);
            }}
          />
        )}
        {values.mode === 'image' && file ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setFile(undefined);
              setOutput(null);
              setError(null);
            }}
          >
            Remove source image
          </Button>
        ) : null}
        <InputField
          id="background"
          label="Background hex"
          value={values.background}
          onChange={(event) => setValues((current) => ({ ...current, background: event.target.value }))}
        />
        <InputField
          id="foreground"
          label="Foreground hex"
          value={values.foreground}
          onChange={(event) => setValues((current) => ({ ...current, foreground: event.target.value }))}
        />
        <Button
          type="button"
          fullWidth
          onClick={() => {
            trackEvent('tool_started', { toolId: tool.id });
            void process();
          }}
          data-interactive={isInteractive ? 'true' : 'false'}
        >
          Generate icon set
        </Button>
        {error ? (
          <p className="field__error" role="alert">
            {error}
          </p>
        ) : null}
        <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
      </section>
      <section className="calculator-result" aria-labelledby="favicon-result-title">
        {output ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Local outputs</p>
                <h2 id="favicon-result-title">Icon set ready</h2>
              </div>
              <span className="result-status">{output.files.length} files</span>
            </div>
            <DownloadList
              items={[
                {
                  name: output.filename,
                  detail: 'ZIP of PNG sizes',
                  onDownload: () => {
                    downloadBlob(output.zip, output.filename);
                    trackEvent('result_downloaded', { toolId: tool.id, format: 'zip' });
                  },
                },
              ]}
            />
            <ul className="plain-list">
              {output.files.map((item) => (
                <li key={item.name}>{item.name}</li>
              ))}
            </ul>
          </>
        ) : (
          <StateBlock titleId="favicon-result-title" title="Your icon set will appear here" tone="empty">
            Initials and source images stay in this browser.
          </StateBlock>
        )}
      </section>
    </div>
  );
}

function EmailSignatureForm({ tool }: { tool: ToolProps }) {
  const initial = useMemo(() => tool.defaultValues as EmailSignatureInput, [tool.defaultValues]);
  const [values, setValues] = useState(initial);
  const isInteractive = useToolView(tool);
  const {
    result,
    errors,
    calculationError: error,
    clearFieldError,
    submit: evaluate,
  } = useLiveCalculation<EmailSignatureInput, EmailSignatureResult>({
    values,
    validate: (input) => {
      const validation = validateEmailSignatureInput(input);
      return validation.success ? { success: true as const, data: input } : validation;
    },
    calculate: (input) => calculateEmailSignature(input),
    onResult: (_nextResult, source) => {
      if (source === 'submit') {
        trackEvent('tool_completed', { toolId: tool.id });
        trackEvent('result_generated', { toolId: tool.id });
      }
    },
  });
  const visibleError = error ?? errors[0]?.message ?? null;
  function update(field: keyof EmailSignatureInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    trackEvent('tool_started', { toolId: tool.id });
    evaluate();
  }
  return (
    <div className="calculator-layout">
      <section className="calculator-card" aria-labelledby="signature-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Local document helper</p>
            <h2 id="signature-form-title">Build a signature</h2>
          </div>
          <span className="local-badge">Escaped HTML</span>
        </div>
        <form onSubmit={submit} noValidate data-interactive={isInteractive ? 'true' : 'false'}>
          <InputField
            id="name"
            label="Name"
            value={values.name}
            onChange={(event) => update('name', event.target.value)}
            required
          />
          <InputField
            id="role"
            label="Role"
            value={values.role}
            onChange={(event) => update('role', event.target.value)}
          />
          <InputField
            id="company"
            label="Company"
            value={values.company}
            onChange={(event) => update('company', event.target.value)}
          />
          <InputField
            id="phone"
            label="Phone"
            value={values.phone}
            onChange={(event) => update('phone', event.target.value)}
          />
          <InputField
            id="email"
            label="Email"
            value={values.email}
            onChange={(event) => update('email', event.target.value)}
            inputMode="email"
          />
          <InputField
            id="website"
            label="Website"
            value={values.website}
            onChange={(event) => update('website', event.target.value)}
            inputMode="url"
          />
          <InputField
            id="linkedin"
            label="LinkedIn"
            value={values.linkedin}
            onChange={(event) => update('linkedin', event.target.value)}
            inputMode="url"
          />
          <SelectField
            id="accent"
            label="Accent"
            value={values.accent}
            onChange={(event) => update('accent', event.target.value as EmailSignatureInput['accent'])}
          >
            <option value="teal">Teal</option>
            <option value="navy">Navy</option>
            <option value="ochre">Ochre</option>
          </SelectField>
          {visibleError ? (
            <p className="field__error" role="alert">
              {visibleError}
            </p>
          ) : null}
          <Button type="submit" fullWidth>
            Generate signature
          </Button>
        </form>
        <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
      </section>
      <section className="calculator-result" aria-labelledby="signature-result-title">
        {result ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Preview and export</p>
                <h2 id="signature-result-title">Signature ready</h2>
              </div>
              <span className="result-status">Live · local</span>
            </div>
            <div className="signature-preview" dangerouslySetInnerHTML={{ __html: result.html }} />
            <pre className="payload-details">{result.plainText}</pre>
            <div className="inline-actions">
              <Button
                type="button"
                onClick={() => {
                  downloadText(result.html, 'karobarkit-email-signature.html', 'text/html;charset=utf-8');
                  trackEvent('result_downloaded', { toolId: tool.id, format: 'html' });
                }}
              >
                Download HTML
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  downloadText(result.plainText, 'karobarkit-email-signature.txt');
                  trackEvent('result_downloaded', { toolId: tool.id, format: 'text' });
                }}
              >
                Download text
              </Button>
            </div>
          </>
        ) : (
          <StateBlock titleId="signature-result-title" title="Your signature will appear here" tone="empty">
            Visible fields are HTML-escaped and links are restricted to HTTP and HTTPS.
          </StateBlock>
        )}
      </section>
    </div>
  );
}

function ReviewRequestForm({ tool }: { tool: ToolProps }) {
  const initial = useMemo(() => tool.defaultValues as ReviewRequestInput, [tool.defaultValues]);
  const [values, setValues] = useState(initial);
  const isInteractive = useToolView(tool);
  const {
    result,
    errors,
    calculationError: error,
    clearFieldError,
    submit: evaluate,
  } = useLiveCalculation<ReviewRequestInput, ReviewRequestResult>({
    values,
    validate: (input) => {
      const validation = validateReviewRequestInput(input);
      return validation.success ? { success: true as const, data: input } : validation;
    },
    calculate: (input) => calculateReviewRequest(input),
    onResult: (_nextResult, source) => {
      if (source === 'submit') {
        trackEvent('tool_completed', { toolId: tool.id });
        trackEvent('result_generated', { toolId: tool.id });
      }
    },
  });
  const visibleError = error ?? errors[0]?.message ?? null;
  function update(field: keyof ReviewRequestInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    trackEvent('tool_started', { toolId: tool.id });
    evaluate();
  }
  return (
    <div className="calculator-layout">
      <section className="calculator-card" aria-labelledby="review-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Honest feedback draft</p>
            <h2 id="review-form-title">Set the destination</h2>
          </div>
          <span className="local-badge">No sending</span>
        </div>
        <form onSubmit={submit} noValidate data-interactive={isInteractive ? 'true' : 'false'}>
          <InputField
            id="businessName"
            label="Business name"
            value={values.businessName}
            onChange={(event) => update('businessName', event.target.value)}
            required
          />
          <InputField
            id="reviewUrl"
            label="Review URL"
            value={values.reviewUrl}
            onChange={(event) => update('reviewUrl', event.target.value)}
            inputMode="url"
            required
          />
          <SelectField
            id="tone"
            label="Tone"
            value={values.tone}
            onChange={(event) => update('tone', event.target.value as ReviewRequestInput['tone'])}
          >
            <option value="warm">Warm</option>
            <option value="direct">Direct</option>
            <option value="formal">Formal</option>
          </SelectField>
          <InputField
            id="whatsappCountryCode"
            label="WhatsApp country code (optional)"
            value={values.whatsappCountryCode}
            onChange={(event) => update('whatsappCountryCode', event.target.value)}
            inputMode="numeric"
          />
          <InputField
            id="whatsappPhone"
            label="WhatsApp phone (optional)"
            value={values.whatsappPhone}
            onChange={(event) => update('whatsappPhone', event.target.value)}
            inputMode="tel"
          />
          {visibleError ? (
            <p className="field__error" role="alert">
              {visibleError}
            </p>
          ) : null}
          <Button type="submit" fullWidth>
            Build draft locally
          </Button>
        </form>
        <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
      </section>
      <section className="calculator-result" aria-labelledby="review-result-title">
        {result ? (
          <>
            <div className="calculator-result__heading">
              <div>
                <p className="eyebrow">Draft preview</p>
                <h2 id="review-result-title">Review request ready</h2>
              </div>
              <span className="result-status">Live · no auto-send</span>
            </div>
            <ResultPanel label="Subject" value={result.subject} />
            <pre className="payload-details">{result.message}</pre>
            {result.whatsappUrl ? (
              <ResultPanel
                label="WhatsApp link"
                value={result.whatsappUrl}
                detail="Opening and sending remain user actions."
              />
            ) : null}
            <div className="inline-actions">
              <Button
                type="button"
                onClick={() => {
                  downloadText(result.message, 'karobarkit-review-request.txt');
                  trackEvent('result_downloaded', { toolId: tool.id, format: 'text' });
                }}
              >
                Download text
              </Button>
            </div>
          </>
        ) : (
          <StateBlock titleId="review-result-title" title="Your draft will appear here" tone="empty">
            The tool never fabricates a review or sends a message.
          </StateBlock>
        )}
      </section>
    </div>
  );
}

export function SharingFileUtilityForm({ kind, tool }: { kind: SharingFileUtilityKind; tool: ToolProps }) {
  if (kind === 'whatsapp-link' || kind === 'vcard' || kind === 'wifi')
    return <QrPayloadForm kind={kind} tool={tool} />;
  if (kind === 'barcode') return <BarcodeForm tool={tool} />;
  if (kind === 'scanner') return <ScannerForm tool={tool} />;
  if (kind === 'photo-resizer-compressor') return <PhotoForm tool={tool} />;
  if (kind === 'pdf-merge-split') return <PdfForm tool={tool} />;
  if (kind === 'favicon-app-icon') return <FaviconForm tool={tool} />;
  if (kind === 'email-signature') return <EmailSignatureForm tool={tool} />;
  return <ReviewRequestForm tool={tool} />;
}
