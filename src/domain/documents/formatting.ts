import { formatIndianCurrency, formatIndianDate } from '@/domain/formatting/indian';
import { decimalToString, parseDecimal } from '@/domain/formatting/decimal';

import { LETTERHEAD_BODY_PAGE_LIMIT, MAX_RECEIPT_AMOUNT } from './constants';

const ONES = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const INDIAN_GROUPS = ['', 'Thousand', 'Lakh', 'Crore', 'Arab', 'Kharab', 'Neel', 'Padma'];

function underThousandToWords(value: number): string {
  if (value < 20) return ONES[value] ?? '';
  if (value < 100) {
    return `${TENS[Math.floor(value / 10)]}${value % 10 ? ` ${ONES[value % 10]}` : ''}`;
  }

  return `${ONES[Math.floor(value / 100)]} Hundred${value % 100 ? ` ${underThousandToWords(value % 100)}` : ''}`;
}

function indianIntegerToWords(value: string): string {
  const normalized = value.replace(/^0+(?=\d)/u, '');
  if (normalized === '0') return 'Zero';
  if (normalized.length > 3 + (INDIAN_GROUPS.length - 1) * 2) {
    throw new Error('This amount is above the supported amount-to-words range.');
  }

  const groups: number[] = [];
  groups.unshift(Number(normalized.slice(-3)));
  let prefix = normalized.slice(0, -3);
  while (prefix.length > 0) {
    groups.unshift(Number(prefix.slice(-2)));
    prefix = prefix.slice(0, -2);
  }

  const words: string[] = [];
  groups.forEach((group, index) => {
    if (group === 0) return;
    const groupName = INDIAN_GROUPS[groups.length - index - 1];
    const groupWords = underThousandToWords(group);
    words.push(groupName ? `${groupWords} ${groupName}` : groupWords);
  });
  return words.join(' ');
}

export function amountToIndianWords(value: string | number): string {
  const decimal = parseDecimal(value);
  if (decimal.isNegative()) {
    throw new Error('Amount to words accepts zero or positive amounts only.');
  }
  if (decimal.gt(parseDecimal(MAX_RECEIPT_AMOUNT))) {
    throw new Error('This amount is above the supported amount-to-words range.');
  }
  if ((decimal.decimalPlaces() ?? 0) > 2) {
    throw new Error('Amount to words supports a maximum of two decimal places.');
  }

  const rupees = decimal.trunc().toFixed(0);
  const paise = decimal.minus(decimal.trunc()).times(100).toFixed(0).padStart(2, '0');
  const rupeeWords = indianIntegerToWords(rupees);
  if (paise === '00') return `${rupeeWords} Rupees Only`;
  return `${rupeeWords} Rupees and ${indianIntegerToWords(paise)} Paise Only`;
}

export function formatDocumentDate(value: string): string {
  return formatIndianDate(value);
}

export function formatDocumentAmount(value: string): string {
  return formatIndianCurrency(value, 2);
}

export function normalizeDocumentAmount(value: string): string {
  return decimalToString(parseDecimal(value));
}

function splitLongParagraph(paragraph: string, limit: number): string[] {
  const words = paragraph.split(/(\s+)/u);
  const chunks: string[] = [];
  let current = '';
  for (const word of words) {
    if (current.length + word.length <= limit || current.length === 0) {
      current += word;
    } else {
      chunks.push(current.trim());
      current = word.trimStart();
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function splitTextIntoPages(text: string, limit = LETTERHEAD_BODY_PAGE_LIMIT): string[] {
  const paragraphs = text
    .trim()
    .split(/\n\s*\n/u)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .flatMap((paragraph) => splitLongParagraph(paragraph, limit));

  if (paragraphs.length === 0) return [''];

  const pages: string[] = [];
  let current = '';
  for (const paragraph of paragraphs) {
    const separator = current ? '\n\n' : '';
    if (current && current.length + separator.length + paragraph.length > limit) {
      pages.push(current);
      current = paragraph;
    } else {
      current += `${separator}${paragraph}`;
    }
  }
  if (current) pages.push(current);
  return pages;
}
