'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';

import type { DigitalSignatureInput } from '@/domain/files/digital-signature';
import { downloadDataUrl, exportErrorMessage, safeFilename } from '@/lib/qr/export';
import { trackEvent } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import { PrivacyBlock } from '@/components/ui/trust-blocks';

interface DigitalSignatureToolProps {
  id: string;
  category: string;
  defaultValues: unknown;
  privacyNote: string;
}

type Point = { x: number; y: number };
type SignatureStroke = { color: string; width: number; points: Point[] };

const PEN_COLORS: readonly {
  value: DigitalSignatureInput['penColor'];
  label: string;
  color: string;
}[] = [
  { value: 'ink', label: 'Ink', color: '#0d1b2a' },
  { value: 'teal', label: 'Teal', color: '#087d74' },
  { value: 'navy', label: 'Navy', color: '#27435a' },
  { value: 'ochre', label: 'Ochre', color: '#b66a00' },
];

const BACKGROUNDS: readonly {
  value: DigitalSignatureInput['background'];
  label: string;
  color: string;
}[] = [
  { value: 'transparent', label: 'Transparent', color: 'transparent' },
  { value: 'white', label: 'Pure white', color: '#ffffff' },
  { value: 'soft-slate', label: 'Soft slate', color: '#f2f7f7' },
];

function drawStrokes(context: CanvasRenderingContext2D, strokes: readonly SignatureStroke[], scale = 1) {
  context.save();
  context.lineCap = 'round';
  context.lineJoin = 'round';

  for (const stroke of strokes) {
    const [firstPoint] = stroke.points;
    if (!firstPoint) continue;

    context.strokeStyle = stroke.color;
    context.fillStyle = stroke.color;
    context.lineWidth = stroke.width * scale;

    if (stroke.points.length === 1) {
      context.beginPath();
      context.arc(
        firstPoint.x * scale,
        firstPoint.y * scale,
        Math.max(1.5, stroke.width * scale) / 2,
        0,
        Math.PI * 2,
      );
      context.fill();
      continue;
    }

    context.beginPath();
    context.moveTo(firstPoint.x * scale, firstPoint.y * scale);
    for (const point of stroke.points.slice(1)) {
      context.lineTo(point.x * scale, point.y * scale);
    }
    context.stroke();
  }

  context.restore();
}

function colorForPen(penColor: DigitalSignatureInput['penColor']) {
  return PEN_COLORS.find((option) => option.value === penColor)?.color ?? PEN_COLORS[0].color;
}

function backgroundForExport(background: DigitalSignatureInput['background']) {
  return BACKGROUNDS.find((option) => option.value === background)?.color ?? 'transparent';
}

export function DigitalSignatureForm({ tool }: { tool: DigitalSignatureToolProps }) {
  const initialValues = useMemo(() => {
    const values = tool.defaultValues as DigitalSignatureInput;
    return {
      penColor: values.penColor ?? 'ink',
      background: values.background ?? 'transparent',
      strokeWidth: values.strokeWidth ?? '3',
    } satisfies DigitalSignatureInput;
  }, [tool.defaultValues]);
  const [penColor, setPenColor] = useState<DigitalSignatureInput['penColor']>(initialValues.penColor);
  const [background, setBackground] = useState<DigitalSignatureInput['background']>(initialValues.background);
  const [strokeWidth, setStrokeWidth] = useState(initialValues.strokeWidth);
  const [strokeCount, setStrokeCount] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<SignatureStroke[]>([]);
  const activeStrokeRef = useRef<SignatureStroke | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * devicePixelRatio);
    const pixelHeight = Math.round(height * devicePixelRatio);

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    drawStrokes(
      context,
      activeStrokeRef.current ? [...strokesRef.current, activeStrokeRef.current] : strokesRef.current,
    );
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(redraw);
    resizeObserver.observe(canvas);
    redraw();
    return () => resizeObserver.disconnect();
  }, [redraw]);

  useEffect(() => {
    trackEvent('tool_viewed', { toolId: tool.id, category: tool.category });
  }, [tool.category, tool.id]);

  const pointFromEvent = useCallback((event: PointerEvent<HTMLCanvasElement>): Point => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(bounds.width, event.clientX - bounds.left)),
      y: Math.max(0, Math.min(bounds.height, event.clientY - bounds.top)),
    };
  }, []);

  const finishStroke = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const activeStroke = activeStrokeRef.current;
      if (!activeStroke) return;

      strokesRef.current = [...strokesRef.current, activeStroke];
      activeStrokeRef.current = null;
      setStrokeCount(strokesRef.current.length);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      redraw();
    },
    [redraw],
  );

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (event.pointerType !== 'touch' && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activeStrokeRef.current = {
      color: colorForPen(penColor),
      width: Number(strokeWidth),
      points: [pointFromEvent(event)],
    };
    setActionStatus(null);
    setExportError(null);
    redraw();
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const activeStroke = activeStrokeRef.current;
    if (!activeStroke || event.buttons === 0) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    const previousPoint = activeStroke.points[activeStroke.points.length - 1];
    if (previousPoint && Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y) < 0.5) return;
    activeStroke.points.push(point);
    redraw();
  }

  function clearPad() {
    strokesRef.current = [];
    activeStrokeRef.current = null;
    setStrokeCount(0);
    setActionStatus(null);
    setExportError(null);
    redraw();
  }

  function downloadSignature() {
    const canvas = canvasRef.current;
    if (!canvas || !strokesRef.current.length) return;

    try {
      const bounds = canvas.getBoundingClientRect();
      const exportScale = 2;
      const exportCanvas = document.createElement('canvas');
      const width = Math.max(1, Math.round(bounds.width * exportScale));
      const height = Math.max(1, Math.round(bounds.height * exportScale));
      exportCanvas.width = width;
      exportCanvas.height = height;
      const context = exportCanvas.getContext('2d');
      if (!context) throw new Error('The signature canvas is unavailable.');

      const exportBackground = backgroundForExport(background);
      if (exportBackground !== 'transparent') {
        context.fillStyle = exportBackground;
        context.fillRect(0, 0, width, height);
      }
      drawStrokes(context, strokesRef.current, exportScale);
      downloadDataUrl(
        exportCanvas.toDataURL('image/png'),
        safeFilename(tool.id, 'karobarkit-signature', 'png'),
      );
      trackEvent('result_downloaded', { toolId: tool.id, format: 'png' });
      setActionStatus('Signature PNG downloaded.');
      setExportError(null);
    } catch (error) {
      setExportError(exportErrorMessage(error));
      setActionStatus(null);
    }
  }

  const backgroundClass = `signature-canvas--${background}`;

  return (
    <div className="calculator-layout signature-tool-layout">
      <section className="calculator-card signature-settings" aria-labelledby="digital-signature-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Local document utility</p>
            <h2 id="digital-signature-form-title">Set up your signature</h2>
          </div>
          <span className="local-badge">No upload</span>
        </div>

        <div className="signature-settings__controls">
          <fieldset className="signature-option-group">
            <legend>Pen colour</legend>
            <div className="signature-color-options">
              {PEN_COLORS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`signature-color-option${penColor === option.value ? ' is-selected' : ''}`}
                  aria-label={`${option.label} pen`}
                  aria-pressed={penColor === option.value}
                  onClick={() => {
                    setPenColor(option.value);
                    setActionStatus(null);
                  }}
                >
                  <span className="signature-color-option__dot" style={{ backgroundColor: option.color }} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="signature-option-group">
            <legend>Background fill</legend>
            <div className="signature-background-options">
              {BACKGROUNDS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`signature-background-option${background === option.value ? ' is-selected' : ''}`}
                  aria-pressed={background === option.value}
                  onClick={() => {
                    setBackground(option.value);
                    setActionStatus(null);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="signature-range" htmlFor="signature-stroke-width">
            <span>
              Stroke width <strong>{strokeWidth}px</strong>
            </span>
            <input
              id="signature-stroke-width"
              className="signature-range__input"
              type="range"
              min="1"
              max="8"
              step="1"
              value={strokeWidth}
              onChange={(event) => {
                setStrokeWidth(event.target.value);
                setActionStatus(null);
              }}
            />
          </label>
        </div>

        <p className="signature-settings__hint">
          Draw with a mouse, trackpad, stylus or finger. The mark stays in this page until you download it.
        </p>
        <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
      </section>

      <section
        className="calculator-result signature-tool-result"
        aria-labelledby="digital-signature-result-title"
      >
        <div className="calculator-result__heading">
          <div>
            <p className="eyebrow">Draw and export</p>
            <h2 id="digital-signature-result-title">Signature canvas</h2>
          </div>
          <span className="result-status">Live · local</span>
        </div>

        <div className="signature-canvas-card">
          <div className="signature-canvas-card__heading">
            <div>
              <p className="signature-canvas-card__label">Canvas pad</p>
              <p className="signature-canvas-card__help">Touch and drag to draw your signature.</p>
            </div>
            <Button type="button" variant="secondary" className="button--small" onClick={clearPad}>
              Clear pad
            </Button>
          </div>
          <div className={`signature-canvas ${backgroundClass}`}>
            <canvas
              ref={canvasRef}
              aria-label="Signature drawing canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishStroke}
              onPointerCancel={finishStroke}
            />
            {!strokeCount ? (
              <span className="signature-canvas__placeholder">Draw your signature here</span>
            ) : null}
          </div>
          <div className="signature-canvas-card__actions">
            <Button type="button" onClick={downloadSignature} disabled={!strokeCount}>
              Download signature PNG
            </Button>
          </div>
        </div>

        {exportError ? (
          <p className="export-error" role="alert">
            {exportError}
          </p>
        ) : null}
        {actionStatus ? (
          <p className="action-status" role="status">
            {actionStatus}
          </p>
        ) : null}
        <p className="signature-tool-result__note">
          A PNG is a visual signature asset. It does not provide certificate-based identity verification or
          tamper evidence.
        </p>
      </section>
    </div>
  );
}
