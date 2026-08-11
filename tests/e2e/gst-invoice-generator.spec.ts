import { test, expect } from '@playwright/test';

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

test.describe('GST invoice generator', () => {
  test('creates a local A4 draft, downloads a safe PDF and prepares print', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.addInitScript(() => {
      window.print = () => document.body.setAttribute('data-print-called', 'true');
    });
    await page.goto('/tools/gst-invoice-generator');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible({ timeout: 30_000 });
    await fillMinimumInvoice(page);

    await page.getByRole('button', { name: 'Create GST invoice draft' }).click();
    await expect(page.getByTestId('document-preview')).toBeVisible();
    await expect(page.getByTestId('a4-page').getByRole('heading', { name: 'Tax Invoice' })).toBeVisible();
    await expect(page.getByTestId('a4-page')).toHaveCount(1);
    const totalLocator = testInfo.project.name.startsWith('mobile-')
      ? page.locator('.invoice-mobile-line summary strong')
      : page.locator('.invoice-table td strong');
    await expect(totalLocator.filter({ hasText: '₹1,180.00' }).first()).toBeVisible();
    await expect(page.getByTestId('a4-page').getByText(/not an e-invoice, IRN/i)).toBeVisible();

    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('gst-invoice-inv-001-2026-08-08.pdf');

    await page.getByRole('button', { name: 'Print' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-print-called', 'true');
  });

  test('keeps long invoices on separate A4 preview pages and rejects unsafe input', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/tools/gst-invoice-generator');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible({ timeout: 30_000 });
    await fillMinimumInvoice(page);
    await page.locator('[id="items.0.unitPrice"]').fill('1.234');
    await page.getByRole('button', { name: 'Create GST invoice draft' }).click();
    await expect(page.getByRole('alert', { name: 'Check the highlighted fields' })).toBeFocused();
    await expect(page.locator('[id="items.0.unitPrice"]')).toHaveAttribute('aria-invalid', 'true');

    await page.locator('[id="items.0.unitPrice"]').fill('100');
    for (let index = 0; index < 8; index += 1) {
      await page.getByRole('button', { name: 'Add item' }).click();
      await page.locator(`[id="items.${index + 1}.description"]`).fill(`Additional item ${index + 2}`);
      await page.locator(`[id="items.${index + 1}.unitPrice"]`).fill('100');
    }
    await page.getByRole('button', { name: 'Create GST invoice draft' }).click();
    await expect(page.getByTestId('a4-page')).toHaveCount(2);
    await expect(page.getByText('More invoice items continue on the next A4 page.')).toBeVisible();
  });
});
