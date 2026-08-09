import type { DocumentAccent, PageLayout } from './types';

export const DOCUMENT_LAST_REVIEWED = '2026-08-08';
export const DOCUMENT_PAGE_LAYOUT: PageLayout = {
  pageSize: 'a4',
  marginTopMm: 15,
  marginRightMm: 15,
  marginBottomMm: 15,
  marginLeftMm: 15,
};

export const DOCUMENT_ACCENTS: Array<{ value: DocumentAccent; label: string; color: string }> = [
  { value: 'teal', label: 'Emerald teal', color: '#0fa89a' },
  { value: 'navy', label: 'Navy blue', color: '#0d1b2a' },
  { value: 'ochre', label: 'Saffron gold', color: '#b66a00' },
];

export const LETTERHEAD_BODY_MAX_LENGTH = 12000;
export const LETTERHEAD_BODY_PAGE_LIMIT = 2200;
export const MAX_RECEIPT_AMOUNT = '999999999999999.99';
export const QUOTATION_MAX_ITEMS = 50;
export const QUOTATION_PAGE_ITEM_LIMIT = 10;
export const QUOTATION_MAX_DESCRIPTION_LENGTH = 240;
export const QUOTATION_MAX_QUANTITY = '999999999999.999999';
export const QUOTATION_MAX_UNIT_PRICE = '999999999999999.99';
export const QUOTATION_MAX_DISCOUNT = '999999999999999.99';
export const QUOTATION_MAX_TEXT_LENGTH = 600;
export const QUOTATION_NUMBER_MAX_LENGTH = 48;
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
export const MAX_LOGO_DIMENSION = 2400;
export const MAX_LOGO_OUTPUT_DIMENSION = 1400;
