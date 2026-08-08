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
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
export const MAX_LOGO_DIMENSION = 2400;
export const MAX_LOGO_OUTPUT_DIMENSION = 1400;
