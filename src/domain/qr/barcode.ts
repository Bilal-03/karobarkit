import { z } from 'zod';

import type { ValidationResult } from '@/domain/calculations/types';

import { QrInputError } from './types';

export const BARCODE_SYMBOLOGIES = ['code128', 'code39', 'ean13', 'upca'] as const;
export type BarcodeSymbology = (typeof BARCODE_SYMBOLOGIES)[number];

export const barcodeInputSchema = z.object({
  symbology: z.enum(BARCODE_SYMBOLOGIES),
  value: z.string(),
  showLabel: z.boolean(),
  width: z.enum(['compact', 'standard', 'large']),
});

export type BarcodeInput = z.infer<typeof barcodeInputSchema>;

export interface BarcodeResult {
  symbology: BarcodeSymbology;
  value: string;
  humanReadable: string;
  modulePattern: string;
  showLabel: boolean;
  width: number;
}

const CODE39_PATTERN = /^[0-9A-Z .\-$/+%]+$/u;
const CODE128_PATTERN = /^[\x20-\x7E]+$/u;
const WIDTHS = { compact: 2, standard: 3, large: 4 } as const;

function checksumMod10(value: string) {
  let sum = 0;
  for (let index = value.length - 1, weight = 3; index >= 0; index -= 1, weight = weight === 3 ? 1 : 3) {
    sum += Number(value[index]) * weight;
  }
  return (10 - (sum % 10)) % 10;
}

function normalizeNumeric(value: string, label: string, length: number, maxLength: number) {
  const digits = value.trim();
  if (!/^\d+$/.test(digits) || (digits.length !== length && digits.length !== maxLength)) {
    throw new QrInputError(
      'value',
      'invalid_value',
      `${label} must contain ${length} digits or ${maxLength} digits including its check digit.`,
    );
  }
  if (digits.length === length) return `${digits}${checksumMod10(digits)}`;
  const expected = checksumMod10(digits.slice(0, -1));
  if (Number(digits.at(-1)) !== expected) {
    throw new QrInputError('value', 'invalid_checksum', `The ${label} check digit should be ${expected}.`);
  }
  return digits;
}

function validateValue(input: BarcodeInput) {
  const value = input.value.trim();
  if (!value) throw new QrInputError('value', 'required', 'Enter a value to encode.');
  if (input.symbology === 'code128') {
    if (!CODE128_PATTERN.test(value) || value.length > 80) {
      throw new QrInputError(
        'value',
        'invalid_value',
        'Code 128 supports up to 80 printable ASCII characters.',
      );
    }
    return value;
  }
  if (input.symbology === 'code39') {
    const normalized = value.toUpperCase();
    if (normalized.length > 40 || !CODE39_PATTERN.test(normalized)) {
      throw new QrInputError(
        'value',
        'invalid_value',
        'Code 39 supports up to 40 uppercase letters, digits and - . space $ / + %.',
      );
    }
    return normalized;
  }
  return input.symbology === 'ean13'
    ? normalizeNumeric(value, 'EAN-13', 12, 13)
    : normalizeNumeric(value, 'UPC-A', 11, 12).slice(-12);
}

function code39Modules(value: string) {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';
  const patterns = [
    '111221211',
    '211211112',
    '112211112',
    '212211111',
    '111221112',
    '211221111',
    '112221111',
    '111211212',
    '211211211',
    '112211211',
    '211112112',
    '112112112',
    '212112111',
    '111122112',
    '211122111',
    '112122111',
    '111112212',
    '211112211',
    '112112211',
    '111122211',
    '211111122',
    '112111122',
    '212111121',
    '111121122',
    '211121121',
    '112121121',
    '111111222',
    '211111221',
    '112111221',
    '111121221',
    '221111112',
    '122111112',
    '222111111',
    '121121112',
    '221121111',
    '122121111',
    '121111212',
    '221111211',
    '122111211',
    '121212111',
    '121211121',
    '121112121',
    '111212121',
    '121121121',
  ];
  const map = new Map(
    Array.from(alphabet).map((character, index) => [character, patterns[index] ?? patterns[0]]),
  );
  const start = '121121211';
  return [start, ...Array.from(value).map((character) => map.get(character) ?? patterns[0]), start].join('1');
}

function code128Modules(value: string) {
  // Code 128-B module patterns for printable ASCII. Each entry is a sequence
  // of bar/space widths; the checksum is calculated over symbol values.
  const patterns = [
    '212222',
    '222122',
    '222221',
    '121223',
    '121322',
    '131222',
    '122213',
    '122312',
    '132212',
    '221213',
    '221312',
    '231212',
    '112232',
    '122132',
    '122231',
    '113222',
    '123122',
    '123221',
    '223211',
    '221132',
    '221231',
    '213212',
    '223112',
    '312131',
    '311222',
    '321122',
    '321221',
    '312212',
    '322112',
    '322211',
    '212123',
    '212321',
    '232121',
    '111323',
    '131123',
    '131321',
    '112313',
    '132113',
    '132311',
    '211313',
    '231113',
    '231311',
    '112133',
    '112331',
    '132131',
    '113123',
    '113321',
    '133121',
    '313121',
    '211331',
    '231131',
    '213113',
    '213311',
    '213131',
    '311123',
    '311321',
    '331121',
    '312113',
    '312311',
    '332111',
    '314111',
    '221411',
    '431111',
    '111224',
    '111422',
    '121124',
    '121421',
    '141122',
    '141221',
    '112214',
    '112412',
    '122114',
    '122411',
    '142112',
    '142211',
    '241211',
    '221114',
    '413111',
    '241112',
    '134111',
    '111242',
    '121142',
    '121241',
    '114212',
    '124112',
    '124211',
    '411212',
    '421112',
    '421211',
    '212141',
    '214121',
    '412121',
    '111143',
    '111341',
    '131141',
    '114113',
    '114311',
    '411113',
    '411311',
    '113141',
    '114131',
    '311141',
    '411131',
    '211412',
    '211214',
    '211232',
    '2331112',
  ];
  const values = Array.from(value, (character) => character.charCodeAt(0) - 32);
  const checksum = values.reduce((sum, symbol, index) => sum + symbol * (index + 1), 104) % 103;
  return [patterns[104], ...values.map((symbol) => patterns[symbol]), patterns[checksum], patterns[106]].join(
    '',
  );
}

const EAN_L = [
  '0001101',
  '0011001',
  '0010011',
  '0111101',
  '0100011',
  '0110001',
  '0101111',
  '0111011',
  '0110111',
  '0001011',
];
const EAN_G = [
  '0100111',
  '0110011',
  '0011011',
  '0100001',
  '0011101',
  '0111001',
  '0000101',
  '0010001',
  '0001001',
  '0010111',
];
const EAN_R = [
  '1110010',
  '1100110',
  '1101100',
  '1000010',
  '1011100',
  '1001110',
  '1010000',
  '1000100',
  '1001000',
  '1110100',
];
const EAN_PARITY = [
  'LLLLLL',
  'LLGLGG',
  'LLGGLG',
  'LLGGGL',
  'LGLLGG',
  'LGGLLG',
  'LGGGLL',
  'LGLGLG',
  'LGLGGL',
  'LGGLGL',
];

function binaryToRunPattern(binary: string) {
  const runs: string[] = [];
  let current = binary[0] ?? '0';
  let length = 0;
  for (const bit of binary) {
    if (bit === current) length += 1;
    else {
      runs.push(String(length));
      current = bit;
      length = 1;
    }
  }
  if (length) runs.push(String(length));
  return runs.join('');
}

function eanModules(value: string, upca: boolean) {
  const digits = upca ? `0${value}` : value;
  const first = Number(digits[0]);
  const parity = EAN_PARITY[first] ?? EAN_PARITY[0];
  const left = Array.from(digits.slice(1, 7))
    .map((digit, index) => (parity[index] === 'G' ? EAN_G : EAN_L)[Number(digit)] ?? EAN_L[0])
    .join('');
  const right = Array.from(digits.slice(7))
    .map((digit) => EAN_R[Number(digit)] ?? EAN_R[0])
    .join('');
  return binaryToRunPattern(`101${left}01010${right}101`);
}

export function validateBarcodeInput(input: BarcodeInput): ValidationResult<BarcodeInput> {
  const parsed = barcodeInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      errors: [{ field: 'form', code: 'invalid_input', message: 'Choose a supported barcode format.' }],
    };
  }
  try {
    const value = validateValue(parsed.data);
    return { success: true, data: { ...parsed.data, value } };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          field: error instanceof QrInputError ? error.field : 'value',
          code: error instanceof QrInputError ? error.code : 'invalid_value',
          message: error instanceof Error ? error.message : 'Enter a supported barcode value.',
        },
      ],
    };
  }
}

export function calculateBarcode(input: BarcodeInput): BarcodeResult {
  const validation = validateBarcodeInput(input);
  if (!validation.success) {
    const firstError = validation.errors[0];
    throw new QrInputError(firstError.field, firstError.code, firstError.message);
  }
  const value = validation.data.value;
  const modulePattern =
    validation.data.symbology === 'code39'
      ? code39Modules(value)
      : validation.data.symbology === 'ean13'
        ? eanModules(value, false)
        : validation.data.symbology === 'upca'
          ? eanModules(value, true)
          : code128Modules(value);
  return {
    symbology: validation.data.symbology,
    value,
    humanReadable: value,
    modulePattern,
    showLabel: validation.data.showLabel,
    width: WIDTHS[validation.data.width],
  };
}

export { binaryToRunPattern, code128Modules, code39Modules, checksumMod10, eanModules };
