import type { CurrencyQuote, SupportedCurrencyCode } from '@/domain/calculations/regulated-utilities';
import { isApprovedOfficialPolicyUrl } from '@/domain/policies/regulated-utilities';

const ECB_API_BASE = 'https://data-api.ecb.europa.eu/service/data/EXR/D';

function ecbUrl(currency: SupportedCurrencyCode, today: string) {
  return `${ECB_API_BASE}.${currency}.EUR.SP00.A?format=csvdata&startPeriod=${today}`;
}

function parseEcbCsv(value: string) {
  const lines = value.trim().split(/\r?\n/u).filter(Boolean);
  if (lines.length < 2) throw new Error('The ECB response did not contain a reference quote.');
  const headers = lines[0]?.split(',').map((header) => header.trim()) ?? [];
  const valueIndex = headers.indexOf('OBS_VALUE');
  const dateIndex = headers.indexOf('TIME_PERIOD');
  if (valueIndex < 0 || dateIndex < 0) throw new Error('The ECB response format was not recognised.');
  const row = lines[lines.length - 1]?.split(',').map((item) => item.trim()) ?? [];
  const rate = Number(row[valueIndex]);
  const quotedOn = row[dateIndex] ?? '';
  if (!Number.isFinite(rate) || !/^\d{4}-\d{2}-\d{2}$/u.test(quotedOn)) {
    throw new Error('The ECB response did not contain a valid dated quote.');
  }
  return { rate, quotedOn };
}

async function fetchEcbPerEuro(currency: SupportedCurrencyCode, today: string, signal: AbortSignal) {
  if (currency === 'EUR') return { rate: 1, quotedOn: today, sourceUrl: null };
  const sourceUrl = ecbUrl(currency, today);
  if (!isApprovedOfficialPolicyUrl(sourceUrl)) throw new Error('The configured FX source is not approved.');
  const response = await fetch(sourceUrl, { signal, headers: { Accept: 'text/csv' } });
  if (!response.ok) throw new Error(`ECB quote request failed with HTTP ${response.status}.`);
  const parsed = parseEcbCsv(await response.text());
  return { ...parsed, sourceUrl };
}

export async function fetchEcbReferenceQuote(
  fromCurrency: SupportedCurrencyCode,
  toCurrency: SupportedCurrencyCode,
  today = new Date().toISOString().slice(0, 10),
): Promise<CurrencyQuote> {
  if (fromCurrency === toCurrency) {
    return {
      rate: '1',
      quotedOn: today,
      source: 'ECB reference',
      rateType: 'reference',
      cacheState: 'not-cached',
      sourceUrl:
        'https://data.ecb.europa.eu/key-figures/ecb-interest-rates-and-exchange-rates/exchange-rates',
    };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const [from, to] = await Promise.all([
      fetchEcbPerEuro(fromCurrency, today, controller.signal),
      fetchEcbPerEuro(toCurrency, today, controller.signal),
    ]);
    return {
      rate: String(to.rate / from.rate),
      quotedOn: to.quotedOn < from.quotedOn ? to.quotedOn : from.quotedOn,
      source: 'ECB reference',
      rateType: 'reference',
      cacheState: 'not-cached',
      sourceUrl:
        to.sourceUrl ??
        from.sourceUrl ??
        'https://data.ecb.europa.eu/key-figures/ecb-interest-rates-and-exchange-rates/exchange-rates',
    };
  } finally {
    clearTimeout(timeout);
  }
}
