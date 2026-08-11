import { test, expect } from '@playwright/test';

test.describe('Phase 3 document workflow wave', () => {
  async function waitForInteractive(page: import('@playwright/test').Page) {
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible({ timeout: 30_000 });
  }

  async function fillMinimumInvoice(page: import('@playwright/test').Page) {
    const fill = async (id: string, value: string) => page.locator(`[id="${id}"]`).fill(value);
    await fill('invoiceNumber', 'INV-001');
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
    await fill('items.0.description', 'Consulting service');
    await fill('items.0.unitPrice', '1000');
  }

  test('creates, exports and prints a quotation, then exposes the invoice handoff', async ({ page }) => {
    test.setTimeout(120_000);
    await page.addInitScript(() => {
      window.print = () => document.body.setAttribute('data-print-called', 'true');
    });
    await page.goto('/tools/quotation-generator');
    await waitForInteractive(page);
    await page.getByLabel('Business name').fill('Ravi & Sons');
    await page.getByLabel('Business address').fill('Market Road, Pune');
    await page.getByLabel('Quote number').fill('QT/2026-001');
    await page.getByLabel('Quote date').fill('2026-08-06');
    await page.getByLabel('Customer name').fill('Nikhil Foods');
    await page.locator('[id="items.0.description"]').fill('Consulting retainer');
    await page.locator('[id="items.0.unitPrice"]').fill('1900');
    await page.getByRole('button', { name: 'Create quotation' }).click();

    await expect(page.getByTestId('document-preview')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('a4-page').getByRole('heading', { name: 'Quotation' })).toBeVisible();
    await expect(page.getByText(/not a GST tax invoice/iu).first()).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('quotation-qt-2026-001-2026-08-06.pdf');
    await page.getByRole('button', { name: 'Print' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-print-called', 'true');

    await page.getByRole('button', { name: 'Continue to GST invoice' }).click();
    await expect(page).toHaveURL(/\/tools\/gst-invoice-generator$/u);
    await expect(page.getByText('A quotation is ready to continue')).toBeVisible();
    await page.getByRole('button', { name: 'Import quotation details' }).click();
    await expect(page.getByLabel('Invoice number')).toHaveValue('QT/2026-001');
    await expect(page.locator('[id="items.0.description"]')).toHaveValue('Consulting retainer');
  });

  test('creates a business-card proof and invoice-number preview', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/tools/business-card-generator');
    await waitForInteractive(page);
    await page.getByLabel('Business name').fill('Ravi & Sons');
    await page.getByLabel('Business address').fill('Market Road');
    await page.getByLabel('Person name').fill('Nikhil Sharma');
    await page.getByLabel('Card email').fill('nikhil@example.com');
    await page.getByRole('button', { name: 'Create business card' }).click();
    await expect(page.getByTestId('document-preview')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Nikhil Sharma')).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('karobarkit-business-card.pdf');

    await page.goto('/tools/invoice-number-generator');
    await waitForInteractive(page);
    await page.getByRole('button', { name: 'Generate invoice number' }).click();
    await expect(page.getByTestId('invoice-number-result')).toHaveText('INV/2026-27/0001');
    await expect(page.getByText(/does not reserve or guarantee uniqueness/iu).first()).toBeVisible();
  });

  test('creates a commercial invoice and continues to a receipt draft', async ({ page }) => {
    test.setTimeout(120_000);
    await page.addInitScript(() => {
      window.print = () => document.body.setAttribute('data-print-called', 'true');
    });
    await page.goto('/tools/invoice-generator');
    await waitForInteractive(page);
    await page.getByLabel('Business name').fill('Ravi & Sons');
    await page.getByLabel('Business address').fill('Market Road, Pune');
    await page.getByLabel('Invoice number').fill('INV/2026-001');
    await page.getByLabel('Invoice date').fill('2026-08-06');
    await page.getByLabel('Customer name').fill('Nikhil Foods');
    await page.locator('[id="items.0.description"]').fill('Consulting retainer');
    await page.locator('[id="items.0.unitPrice"]').fill('1900');
    await page.getByRole('button', { name: 'Create invoice draft' }).click();

    await expect(page.getByTestId('document-preview')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('a4-page').getByRole('heading', { name: 'Invoice' })).toBeVisible();
    await expect(page.getByText(/not a GST tax invoice/iu).first()).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('invoice-inv-2026-001-2026-08-06.pdf');
    await page.getByRole('button', { name: 'Print' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-print-called', 'true');

    await page.getByRole('button', { name: 'Continue to payment receipt' }).click();
    await expect(page).toHaveURL(/\/tools\/payment-receipt-generator$/u);
    await expect(page.getByText('An invoice is ready for a receipt draft')).toBeVisible();
    await page.getByRole('button', { name: 'Import invoice details' }).click();
    await expect(page.getByLabel('Received from')).toHaveValue('Nikhil Foods');
    await expect(page.getByLabel('Amount received')).toHaveValue('1900.00');
  });

  test('continues a GST invoice into receipt and UPI drafts with explicit import', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/tools/gst-invoice-generator');
    await waitForInteractive(page);
    await fillMinimumInvoice(page);
    await page.getByRole('button', { name: 'Create GST invoice draft' }).click();
    await expect(page.getByTestId('document-preview')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Continue to payment receipt' }).click();
    await expect(page).toHaveURL(/\/tools\/payment-receipt-generator$/u);
    await expect(page.getByText('An invoice is ready for a receipt draft')).toBeVisible();
    await page.getByRole('button', { name: 'Import invoice details' }).click();
    await expect(page.getByLabel('Received from')).toHaveValue('Recipient Private Limited');
    await expect(page.getByLabel('Amount received')).toHaveValue('1180.00');

    await page.goto('/tools/gst-invoice-generator');
    await waitForInteractive(page);
    await fillMinimumInvoice(page);
    await page.getByRole('button', { name: 'Create GST invoice draft' }).click();
    await page.getByRole('button', { name: 'Continue to UPI QR' }).click();
    await expect(page).toHaveURL(/\/tools\/upi-standee$/u);
    await expect(page.getByText('An invoice total is ready for a UPI QR draft')).toBeVisible();
    await page.getByRole('button', { name: 'Import invoice amount' }).click();
    await expect(page.getByLabel('Fixed amount (optional)')).toHaveValue('1180.00');
    await expect(page.getByLabel('Payment note (optional)')).toHaveValue('Invoice INV-001');
  });
});
