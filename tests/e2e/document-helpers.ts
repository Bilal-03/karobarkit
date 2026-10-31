import { expect, type Page } from '@playwright/test';

export async function openDocumentOptions(page: Page) {
  for (let depth = 0; depth < 20; depth += 1) {
    const options = page.locator(
      'form details.optional-fields:not([open]) > summary:visible, form details.field-group:not([open]) > summary:visible',
    );
    if (!(await options.count())) break;
    await options.first().click();
  }
}

export async function reviewDocument(page: Page) {
  const next = page.getByRole('button', { name: 'Next', exact: true });
  if (await next.isVisible()) await next.click();
  await page.getByRole('button', { name: 'Review document', exact: true }).click();
  await expect(page.getByTestId('document-preview')).toBeVisible();
}

export async function fillMinimumGstInvoice(page: Page) {
  const fill = async (id: string, value: string) => page.locator(`[id="${id}"]`).fill(value);
  await fill('supplier.legalName', 'Supplier Private Limited');
  await fill('supplier.gstin', '27ABCDE1234F1Z5');
  await fill('supplier.address.line1', '12 Market Road');
  await fill('supplier.address.city', 'Pune');
  await fill('supplier.address.state', 'Maharashtra');
  await fill('supplier.address.stateCode', '27');
  await fill('supplier.address.postalCode', '411001');
  await fill('recipient.legalName', 'Recipient Private Limited');
  await fill('recipient.gstin', '29ABCDE1234F1Z5');
  await fill('recipient.address.line1', '44 Business Park');
  await fill('recipient.address.city', 'Bengaluru');
  await fill('recipient.address.state', 'Karnataka');
  await fill('recipient.address.stateCode', '29');
  await fill('recipient.address.postalCode', '560001');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await fill('invoiceNumber', 'INV-001');
  await fill('items.0.description', 'Consulting service');
  await fill('items.0.unitPrice', '1000');
  await fill('placeOfSupply.state', 'Karnataka');
  await fill('placeOfSupply.stateCode', '29');
  await page.locator('#supplyType').selectOption('inter-state');
  await page.locator('[id="items.0.ratePresetId"]').selectOption('gst-headline-rate-18');
}

// Help summaries also have accessible names; address the actual form control.
export function field(page: Page, label: string | RegExp, options?: { exact?: boolean }) {
  return page.getByLabel(label, options).and(page.locator('input, select, textarea'));
}
