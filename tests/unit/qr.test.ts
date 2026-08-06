import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderQrSvg } from '@/lib/qr/render';
import { dataUrlToBlob, downloadDataUrl, downloadSvg, printElement, safeFilename } from '@/lib/qr/export';
import { buildUpiPaymentUri, calculateUpi, validateUpiInput } from '@/domain/qr/upi';
import { calculateUrlQr, normalizeUrl, validateUrlQrInput } from '@/domain/qr/url';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
  document.body.className = '';
});

describe('URL QR payload validation', () => {
  it('normalizes a bare domain and preserves a valid HTTPS URL', () => {
    expect(normalizeUrl(' example.com/pricing ')).toBe('https://example.com/pricing');
    expect(normalizeUrl('HTTP://Example.com/path?q=hello world')).toBe(
      'http://example.com/path?q=hello%20world',
    );
  });

  it.each(['javascript:alert(1)', 'data:text/plain,hello', 'file:///tmp/example.txt', 'ftp://example.com'])(
    'rejects unsafe or unsupported protocol %s',
    (value) => {
      const validation = validateUrlQrInput({ url: value, size: '512' });
      expect(validation.success).toBe(false);
      if (!validation.success) {
        expect(validation.errors[0]?.code).toBe('invalid_url');
        expect(validation.errors[0]?.message).toContain('Only HTTP and HTTPS');
      }
    },
  );

  it.each(['', 'not a URL', 'https://', 'https://user:password@example.com'])(
    'rejects invalid URL input %s',
    (value) => {
      expect(validateUrlQrInput({ url: value, size: '512' }).success).toBe(false);
    },
  );

  it('rejects an unsupported output size', () => {
    expect(validateUrlQrInput({ url: 'https://example.com', size: '300' }).success).toBe(false);
  });

  it('keeps the pure URL calculation result independent from React', () => {
    expect(calculateUrlQr({ url: 'example.com', size: '1024' })).toEqual({
      normalizedUrl: 'https://example.com/',
      payload: 'https://example.com/',
      size: 1024,
    });
  });
});

describe('UPI payment URI construction', () => {
  const validInput = {
    payeeName: 'Ravi & Sons',
    upiId: 'ravi.shop@bank',
    amount: '125.50',
    note: 'Order #1 & tea',
  };

  it('uses the standard UPI pay structure and percent-encodes values', () => {
    expect(buildUpiPaymentUri(validInput)).toBe(
      'upi://pay?pa=ravi.shop%40bank&pn=Ravi%20%26%20Sons&am=125.5&cu=INR&tn=Order%20%231%20%26%20tea',
    );

    const parsed = new URL(buildUpiPaymentUri(validInput));
    expect(parsed.protocol).toBe('upi:');
    expect(parsed.hostname).toBe('pay');
    expect(parsed.searchParams.get('pa')).toBe('ravi.shop@bank');
    expect(parsed.searchParams.get('pn')).toBe('Ravi & Sons');
    expect(parsed.searchParams.get('am')).toBe('125.5');
    expect(parsed.searchParams.get('tn')).toBe('Order #1 & tea');
  });

  it('supports an open amount without adding an amount parameter', () => {
    const result = calculateUpi({ ...validInput, amount: '', note: '' });
    expect(result.amount).toBeNull();
    expect(result.payload).toContain('cu=INR');
    expect(result.payload).not.toContain('&am=');
    expect(result.payload).not.toContain('&tn=');
  });

  it.each([
    ['zero amount', '0'],
    ['negative amount', '-1'],
    ['too many decimal places', '1.234'],
    ['NaN', 'NaN'],
    ['Infinity', 'Infinity'],
    ['extremely large amount', '9999999999999.99'],
  ])('rejects %s', (_label, amount) => {
    const validation = validateUpiInput({ ...validInput, amount });
    expect(validation.success).toBe(false);
    if (!validation.success) {
      expect(validation.errors.some((error) => error.field === 'amount')).toBe(true);
    }
  });

  it('rejects missing or unsupported UPI details', () => {
    const missing = validateUpiInput({ ...validInput, payeeName: '', upiId: '' });
    expect(missing.success).toBe(false);
    if (!missing.success) {
      expect(missing.errors.map((error) => error.field)).toEqual(
        expect.arrayContaining(['payeeName', 'upiId']),
      );
    }

    const unsupportedId = validateUpiInput({ ...validInput, upiId: 'name+tag@bank' });
    expect(unsupportedId.success).toBe(false);
    const longNote = validateUpiInput({ ...validInput, note: 'x'.repeat(81) });
    expect(longNote.success).toBe(false);
  });
});

describe('shared QR rendering and export helpers', () => {
  it('renders a deterministic SVG QR without React or network access', async () => {
    const svg = await renderQrSvg('https://example.com', { size: 256 });
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox');
    expect(svg).toContain('stroke="#16212b"');
  });

  it('converts a PNG data URL into a Blob', () => {
    const blob = dataUrlToBlob('data:image/png;base64,iVBORw0KGgo=');
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('starts a download with a safe static filename', () => {
    const createObjectURL = vi.fn(() => 'blob:karobarkit-test');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    downloadDataUrl('data:image/png;base64,iVBORw0KGgo=', safeFilename('../URL QR', 'karobarkit-qr'));

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:karobarkit-test');
    expect(click).toHaveBeenCalledOnce();
  });

  it('supports SVG export through the same download seam', () => {
    const createObjectURL = vi.fn(() => 'blob:karobarkit-svg');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    downloadSvg('<svg></svg>', 'karobarkit-url-qr.svg');

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:karobarkit-svg');
  });

  it('prepares only the requested preview for print', () => {
    document.body.innerHTML = '<main><div id="print-area">QR</div><div>Other</div></main>';
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);

    printElement('print-area');

    expect(print).toHaveBeenCalledOnce();
    expect(document.body).toHaveClass('is-printing');
    expect(document.getElementById('print-area')).toHaveClass('print-target');

    window.dispatchEvent(new Event('afterprint'));
    expect(document.body).not.toHaveClass('is-printing');
    expect(document.getElementById('print-area')).not.toHaveClass('print-target');
  });
});
