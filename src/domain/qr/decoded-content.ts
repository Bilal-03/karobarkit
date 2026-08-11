import { QrInputError } from './types';

export type DecodedContentKind = 'http' | 'https' | 'upi' | 'payment' | 'credential' | 'unsafe' | 'text';

export interface DecodedContent {
  raw: string;
  kind: DecodedContentKind;
  display: string;
  openable: boolean;
  warning: string | null;
  host?: string;
  fields?: { payee?: string; amount?: string; currency?: string };
}

const unsafeSchemePattern = /^(?:javascript|data|file|vbscript|blob|intent):/iu;
const paymentSchemePattern = /^(?:upi|bitcoin|ethereum|payto):/iu;

export function classifyDecodedContent(rawValue: string): DecodedContent {
  const raw = rawValue.trim();
  if (!raw) throw new QrInputError('decoded', 'empty', 'The decoded content is empty.');

  if (unsafeSchemePattern.test(raw)) {
    return {
      raw,
      kind: 'unsafe',
      display: raw,
      openable: false,
      warning: 'This scheme is never opened automatically.',
    };
  }
  if (paymentSchemePattern.test(raw)) {
    if (/^upi:\/\/pay\?/iu.test(raw)) {
      try {
        const query = new URL(raw).searchParams;
        const payee = query.get('pn') || undefined;
        const amount = query.get('am') || undefined;
        const currency = query.get('cu') || undefined;
        return {
          raw,
          kind: 'upi',
          display: raw,
          openable: false,
          warning: 'Verify the payee and amount in your trusted payment app before taking any action.',
          fields: { payee, amount, currency },
        };
      } catch {
        return {
          raw,
          kind: 'payment',
          display: raw,
          openable: false,
          warning: 'Malformed payment content is shown as text only.',
        };
      }
    }
    return {
      raw,
      kind: 'payment',
      display: raw,
      openable: false,
      warning: 'Payment and credential-like schemes are shown as text only.',
    };
  }

  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      if (parsed.username || parsed.password) {
        return {
          raw,
          kind: 'credential',
          display: raw,
          openable: false,
          warning: 'URLs containing embedded credentials are not opened.',
        };
      }
      return {
        raw,
        kind: parsed.protocol === 'http:' ? 'http' : 'https',
        display: parsed.toString(),
        openable: true,
        warning: null,
        host: parsed.host,
      };
    }
  } catch {
    // Plain decoded text is expected for many barcodes.
  }

  return {
    raw,
    kind: 'text',
    display: raw,
    openable: false,
    warning: 'This content is shown as text because it is not a verified web URL.',
  };
}
