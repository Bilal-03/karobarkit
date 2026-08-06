'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

import { processLogoFile, type LogoValidationError } from '@/domain/documents/logo';
import type { LogoAsset } from '@/domain/documents/types';

export function LogoUploader({
  logo,
  onChange,
}: {
  logo: LogoAsset | null;
  onChange: (logo: LogoAsset | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsProcessing(true);
    try {
      onChange(await processLogoFile(file));
    } catch (nextError) {
      const message = nextError as LogoValidationError;
      setError(message?.message || 'We could not use that logo file.');
      onChange(null);
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="logo-uploader">
      <div className="field__label" id="logo-label">
        Business logo <span className="field__optional">(optional)</span>
      </div>
      <p className="field__help" id="logo-help">
        PNG, JPEG or WebP up to 2 MB. It is processed in this browser and never uploaded.
      </p>
      <input
        ref={inputRef}
        className="sr-only"
        id="business-logo"
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        aria-labelledby="logo-label"
        aria-describedby={error ? 'logo-help logo-error' : 'logo-help'}
        onChange={handleFile}
      />
      {logo ? (
        <div className="logo-uploader__preview">
          <Image
            src={logo.dataUrl}
            alt="Selected business logo preview"
            width={logo.width}
            height={logo.height}
            unoptimized
          />
          <div>
            <strong>Logo ready</strong>
            <p>{logo.originalName}</p>
            <div className="inline-actions">
              <button
                className="button button--secondary button--small"
                type="button"
                onClick={() => inputRef.current?.click()}
              >
                Replace logo
              </button>
              <button
                className="button button--ghost button--small"
                type="button"
                onClick={() => onChange(null)}
              >
                Remove logo
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          className="button button--secondary"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing logo…' : 'Choose a logo'}
        </button>
      )}
      {error ? (
        <p className="field__error" id="logo-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
