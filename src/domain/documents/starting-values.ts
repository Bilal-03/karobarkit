/** Keep presentation choices and safe units; never use demo identities as user input. */
export function localDocumentDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
const presentationKeys = new Set([
  'template',
  'accent',
  'logoAlignment',
  'discountType',
  'unit',
  'supplyType',
  'recipientRegistrationStatus',
  'country',
]);
export function blankDocument<T>(template: T, today = localDocumentDate()): T {
  function blank(value: unknown, key = ''): unknown {
    if (value === null) return null;
    if (Array.isArray(value)) return value.slice(0, 1).map((v) => blank(v));
    if (typeof value === 'object')
      return Object.fromEntries(Object.entries(value as object).map(([k, v]) => [k, blank(v, k)]));
    if (typeof value === 'boolean') return key === 'headerDivider' || key === 'footerDivider' ? value : false;
    if (typeof value !== 'string') return value;
    if (['quoteDate', 'invoiceDate', 'receiptDate'].includes(key)) return today;
    if (key === 'quantity') return '1';
    if (key === 'id') return 'item-1';
    return presentationKeys.has(key) ? value : '';
  }
  return blank(template) as T;
}
