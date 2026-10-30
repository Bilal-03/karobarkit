import type { CurrencyQuote, SupportedCurrencyCode } from '@/domain/calculations/regulated-utilities';
import { isApprovedOfficialPolicyUrl } from '@/domain/policies/regulated-utilities';

const ECB_API_BASE = 'https://data-api.ecb.europa.eu/service/data/EXR/D';

function ecbUrl(currency: SupportedCurrencyCode, today: string) {
  const start = new Date(`${today}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 10);
  return `${ECB_API_BASE}.${currency}.EUR.SP00.A?format=csvdata&startPeriod=${start.toISOString().slice(0, 10)}&endPeriod=${today}`;
}

function parseEcbCsv(value: string, today: string) {
  const lines = value.trim().split(/\r?\n/u).filter(Boolean);
  if (lines.length < 2) throw new Error('The ECB response did not contain a reference quote.');
  const headers = lines[0]?.split(',').map((header) => header.trim()) ?? [];
  const valueIndex = headers.indexOf('OBS_VALUE');
  const dateIndex = headers.indexOf('TIME_PERIOD');
  if (valueIndex < 0 || dateIndex < 0) throw new Error('The ECB response format was not recognised.');
  const observations = lines
    .slice(1)
    .map((line) => line.split(',').map((item) => item.trim()))
    .map((row) => ({ rate: Number(row[valueIndex]), quotedOn: row[dateIndex] ?? '' }))
    .filter(
      (row) =>
        Number.isFinite(row.rate) &&
        row.rate > 0 &&
        /^\d{4}-\d{2}-\d{2}$/u.test(row.quotedOn) &&
        row.quotedOn <= today,
    );
  if (!observations.length) {
    throw new Error('The ECB response did not contain a valid dated quote.');
  }
  return observations;
}

async function fetchEcbPerEuro(currency: SupportedCurrencyCode, today: string, signal: AbortSignal) {
  if (currency === 'EUR') return { rate: 1, quotedOn: today, sourceUrl: null };
  const sourceUrl = ecbUrl(currency, today);
  if (!isApprovedOfficialPolicyUrl(sourceUrl)) throw new Error('The configured FX source is not approved.');
  const response = await fetch(sourceUrl, { signal, headers: { Accept: 'text/csv' } });
  if (!response.ok) throw new Error(`ECB quote request failed with HTTP ${response.status}.`);
  const parsed = parseEcbCsv(await response.text(), today);
  return { observations: parsed, sourceUrl };
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
    const fromObservations =
      fromCurrency === 'EUR' ? [{ rate: 1, quotedOn: today }] : (from.observations ?? []);
    const toObservations = toCurrency === 'EUR' ? [{ rate: 1, quotedOn: today }] : (to.observations ?? []);
    const sharedDates =
      fromCurrency === 'EUR'
        ? toObservations.map((item) => item.quotedOn)
        : toCurrency === 'EUR'
          ? fromObservations.map((item) => item.quotedOn)
          : fromObservations
              .map((item) => item.quotedOn)
              .filter((date) => toObservations.some((item) => item.quotedOn === date));
    const quotedOn = sharedDates.sort().at(-1);
    if (!quotedOn) throw new Error('The ECB currencies had no common dated observation.');
    const fromRate =
      fromCurrency === 'EUR' ? 1 : fromObservations.find((item) => item.quotedOn === quotedOn)?.rate;
    const toRate = toCurrency === 'EUR' ? 1 : toObservations.find((item) => item.quotedOn === quotedOn)?.rate;
    if (!fromRate || !toRate) throw new Error('The ECB currencies had no common dated observation.');
    return {
      rate: String(toRate / fromRate),
      quotedOn,
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
