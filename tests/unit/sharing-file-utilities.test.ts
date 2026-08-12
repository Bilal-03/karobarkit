import { describe, expect, it, vi } from 'vitest';

import { calculateBarcode, validateBarcodeInput } from '@/domain/qr/barcode';
import { classifyDecodedContent } from '@/domain/qr/decoded-content';
import { calculateVcard } from '@/domain/qr/vcard';
import { calculateWhatsapp } from '@/domain/qr/whatsapp';
import { calculateWifi } from '@/domain/qr/wifi';
import { calculateFaviconPlan, validateFaviconInput } from '@/domain/files/favicon';
import { calculateDigitalSignature, validateDigitalSignatureInput } from '@/domain/files/digital-signature';
import { parsePageSelection, validatePdfFile } from '@/domain/files/pdf';
import { validateImageFile } from '@/domain/files/image';
import { FILE_LIMITS, withFileProcessingTimeout } from '@/lib/files/limits';
import { createStoredZip } from '@/lib/files/favicon';
import { calculateEmailSignature } from '@/domain/marketing/email-signature';
import { calculateReviewRequest } from '@/domain/marketing/review-request';

describe('sharing and file utility engines', () => {
  it('builds WhatsApp links without sending and escapes the optional message', () => {
    const result = calculateWhatsapp({ countryCode: '91', phone: '9876543210', message: 'Hello & welcome' });
    expect(result.payload).toBe('https://wa.me/919876543210?text=Hello%20%26%20welcome');
  });

  it('escapes vCard and Wi-Fi delimiters', () => {
    const card = calculateVcard({
      fullName: 'A, B',
      organization: 'R\\S',
      phone: '',
      email: '',
      website: '',
      address: '',
      note: '',
    });
    expect(card.payload).toContain('FN:A\\, B');
    expect(card.payload).toContain('ORG:R\\\\S');
    const wifi = calculateWifi({ ssid: 'Shop;Guest', security: 'WPA', password: 'a:b,c', hidden: false });
    expect(wifi.payload).toBe('WIFI:T:WPA;S:Shop\\;Guest;P:a\\:b\\,c;H:false;;');
  });

  it('validates barcode check digits and rejects bad EAN input', () => {
    const valid = calculateBarcode({
      symbology: 'ean13',
      value: '400638133393',
      showLabel: true,
      width: 'standard',
    });
    expect(valid.value).toBe('4006381333931');
    expect(
      validateBarcodeInput({ symbology: 'ean13', value: '4006381333932', showLabel: true, width: 'standard' })
        .success,
    ).toBe(false);
  });

  it('classifies decoded content without auto-opening unsafe or payment schemes', () => {
    expect(classifyDecodedContent('javascript:alert(1)').openable).toBe(false);
    expect(classifyDecodedContent('https://example.com/path').kind).toBe('https');
    expect(classifyDecodedContent('upi://pay?pa=test@bank&pn=Shop&am=20').fields).toEqual({
      payee: 'Shop',
      amount: '20',
      currency: undefined,
    });
  });

  it('enforces shared file limits and deterministic page selections', () => {
    expect(parsePageSelection('1, 3-4, 3', 5)).toEqual([0, 2, 3]);
    expect(() => parsePageSelection('1-101', 101)).toThrow();
    expect(
      validateImageFile({ name: 'x.jpg', type: 'image/jpeg', size: FILE_LIMITS.maxBytesPerFile + 1 }).success,
    ).toBe(false);
    expect(validatePdfFile({ name: 'x.pdf', type: 'application/pdf', size: 10 }).success).toBe(true);
  });

  it('keeps favicon plans bounded and creates a local stored ZIP', async () => {
    const plan = calculateFaviconPlan({
      mode: 'initials',
      initials: 'KK',
      background: '#0d8076',
      foreground: '#ffffff',
    });
    expect(plan.sizes).toEqual([16, 32, 48, 180, 192, 512]);
    expect(
      validateFaviconInput({
        mode: 'initials',
        initials: 'TOO LONG',
        background: '#0d8076',
        foreground: '#ffffff',
      }).success,
    ).toBe(false);
    const zip = await createStoredZip([
      { name: 'hello.txt', blob: new Blob(['hello'], { type: 'text/plain' }) },
    ]);
    expect(zip.size).toBeGreaterThan(20);
  });

  it('escapes email signature HTML and keeps review drafts honest', () => {
    const signature = calculateEmailSignature({
      name: '<Owner>',
      role: 'Founder',
      company: 'Shop',
      phone: '',
      email: 'owner@example.com',
      website: 'example.com',
      linkedin: '',
      accent: 'teal',
    });
    expect(signature.html).toContain('&lt;Owner&gt;');
    expect(signature.html).not.toContain('<Owner>');
    const review = calculateReviewRequest({
      businessName: 'Shop',
      reviewUrl: 'https://example.com/review',
      tone: 'warm',
      whatsappCountryCode: '91',
      whatsappPhone: '9876543210',
    });
    expect(review.message).toContain('honest feedback');
    expect(review.whatsappUrl).toContain('https://wa.me/919876543210');
  });

  it('keeps the three review tones distinct and validates signature drawing options', () => {
    const common = {
      businessName: 'Shop',
      reviewUrl: 'https://example.com/review',
      whatsappCountryCode: '',
      whatsappPhone: '',
    } as const;
    const messages = (['warm', 'direct', 'formal'] as const).map(
      (tone) => calculateReviewRequest({ ...common, tone }).message,
    );
    expect(new Set(messages).size).toBe(3);
    expect(messages.every((message) => message.includes('https://example.com/review'))).toBe(true);

    expect(
      calculateDigitalSignature({ penColor: 'teal', background: 'transparent', strokeWidth: '4' }),
    ).toEqual({ penColor: 'teal', background: 'transparent', strokeWidth: 4 });
    expect(
      validateDigitalSignatureInput({ penColor: 'teal', background: 'transparent', strokeWidth: '12' })
        .success,
    ).toBe(false);
  });

  it('aborts timed-out local work instead of only ignoring its result', async () => {
    vi.useFakeTimers();
    let receivedSignal: AbortSignal | undefined;
    const operation = withFileProcessingTimeout(async (signal) => {
      receivedSignal = signal;
      await new Promise<void>(() => undefined);
      return 'unreachable';
    }, 50);
    const rejection = expect(operation).rejects.toThrow('was stopped');
    await vi.advanceTimersByTimeAsync(50);
    await rejection;
    expect(receivedSignal?.aborted).toBe(true);
    vi.useRealTimers();
  });
});
