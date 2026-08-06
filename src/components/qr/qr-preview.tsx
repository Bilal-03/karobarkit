'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

import { renderQrPngDataUrl } from '@/lib/qr/render';

export interface QrImageState {
  dataUrl: string | null;
  error: string | null;
  isRendering: boolean;
}

export function useQrImage(payload: string, size: number): QrImageState {
  const renderKey = `${payload}:${size}`;
  const [rendered, setRendered] = useState<QrImageState & { key: string }>({
    dataUrl: null,
    error: null,
    isRendering: false,
    key: '',
  });

  useEffect(() => {
    let cancelled = false;
    if (!payload) {
      return () => {
        cancelled = true;
      };
    }

    renderQrPngDataUrl(payload, { size })
      .then((dataUrl) => {
        if (!cancelled) {
          setRendered({ dataUrl, error: null, isRendering: false, key: renderKey });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setRendered({
            dataUrl: null,
            error: error instanceof Error ? error.message : 'We could not render this QR code.',
            isRendering: false,
            key: renderKey,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [payload, renderKey, size]);

  if (!payload) {
    return { dataUrl: null, error: null, isRendering: false };
  }

  if (rendered.key !== renderKey) {
    return { dataUrl: null, error: null, isRendering: true };
  }

  return rendered;
}

export function QrPreview({ state, alt, size }: { state: QrImageState; alt: string; size: number }) {
  if (state.error) {
    return (
      <div className="qr-preview__message qr-preview__message--error" role="alert">
        {state.error}
      </div>
    );
  }

  if (state.isRendering || !state.dataUrl) {
    return (
      <div className="qr-preview__message" role="status" aria-live="polite">
        Preparing your QR preview…
      </div>
    );
  }

  return (
    <figure className="qr-preview">
      <Image src={state.dataUrl} alt={alt} width={size} height={size} unoptimized data-testid="qr-preview" />
      <figcaption>Scan this preview with a trusted app before printing or sharing.</figcaption>
    </figure>
  );
}
