import { field } from './document-helpers';
import { test, expect } from '@playwright/test';
import { openDocumentOptions, reviewDocument } from './document-helpers';

async function waitForInteractive(page: import('@playwright/test').Page) {
  await expect(page.locator('form[data-interactive="true"]')).toBeVisible({ timeout: 30_000 });
}

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

test.describe('document generators', () => {
  test('letterhead supports local logo processing, preview, PDF download and print', async ({ page }) => {
    test.setTimeout(120_000);
    await page.addInitScript(() => {
      window.print = () => {
        document.body.setAttribute('data-print-called', 'true');
      };
    });
    await page.goto('/tools/letterhead-generator');
    await waitForInteractive(page);

    await field(page, 'Business name').fill('नमस्ते Studio');
    await field(page, 'Business address').fill('12 Market Road\nPune, Maharashtra');
    await openDocumentOptions(page);
    await field(page, 'Email (optional)').fill('hello@example.com');
    await field(page, 'Website (optional)').fill('example.com');
    await field(page, 'Recipient name (optional)').fill('Asha Traders');
    await field(page, 'Subject (optional)').fill('A note for your records');
    await field(page, 'Letter body (optional)').fill('Thank you for working with us.\n\nRegards.');
    await field(page, 'Signatory name (optional)').fill('Bilal');
    await field(page, 'Signatory designation (optional)').fill('Owner');
    await page.locator('#business-logo').setInputFiles({
      name: 'logo.png',
      mimeType: 'image/png',
      buffer: onePixelPng,
    });
    await expect(page.getByText('Logo ready')).toBeVisible();
    await page.getByRole('button', { name: 'Remove logo' }).click();
    await reviewDocument(page);

    await expect(page.getByTestId('document-preview')).toBeVisible();
    await expect(page.getByText('नमस्ते Studio')).toBeVisible();
    await expect(page.getByTestId('a4-page')).toHaveCount(1);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('karobarkit-letterhead.pdf');

    await page.getByRole('button', { name: 'Print' }).click();
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('body')).toHaveAttribute('data-print-called', 'true');
    const printGeometry = await page.getByTestId('a4-page').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    expect(printGeometry.width).toBeGreaterThan(700);
    expect(printGeometry.height).toBeGreaterThan(1000);
  });

  test('letterhead keeps long plain text on multiple A4 pages', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/tools/letterhead-generator');
    await waitForInteractive(page);
    await field(page, 'Business name').fill('Long Letter Co');
    await field(page, 'Business address').fill('A long address');
    await openDocumentOptions(page);
    await field(page, 'Letter body (optional)').fill('A '.repeat(1800));
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await field(page, 'Layout').selectOption('formal');
    await reviewDocument(page);

    await expect(page.getByTestId('a4-page')).toHaveCount(2);
    await expect(page.locator('.a4-page--formal')).toHaveCount(2);
  });

  test('payment receipt formats amount in words and exports a declared-payment acknowledgement', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto('/tools/payment-receipt-generator');
    await waitForInteractive(page);
    await field(page, 'Business name').fill('Ravi & Sons');
    await field(page, 'Business address').fill('Market Road, Pune');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await openDocumentOptions(page);
    await field(page, 'Receipt number').fill('RCPT/2026-001');
    await field(page, 'Receipt date').fill('2026-08-06');
    await field(page, 'Received from').fill('Nikhil');
    await field(page, 'Amount received').fill('1250.50');
    await field(page, 'Payment purpose').fill('Consulting retainer');
    await field(page, 'Payment method (optional)').selectOption('upi');
    await field(page, 'Transaction reference (optional)').fill('UPI-REF-001');
    await reviewDocument(page);

    await expect(page.getByTestId('document-preview')).toBeVisible();
    await expect(page.getByTestId('a4-page').getByText('₹1,250.50', { exact: true })).toBeVisible();
    await expect(
      page.getByTestId('a4-page').getByText('One Thousand Two Hundred Fifty Rupees and Fifty Paise Only', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByTestId('a4-page').getByText(/not bank confirmation, proof of settlement/iu),
    ).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('karobarkit-payment-receipt.pdf');
  });

  test('payment receipt rejects invalid amount and resets from the keyboard journey', async ({ page }) => {
    await page.goto('/tools/payment-receipt-generator');
    await waitForInteractive(page);
    await field(page, 'Business name').fill('Keyboard Shop');
    await field(page, 'Business address').fill('Address');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await openDocumentOptions(page);
    await field(page, 'Receipt number').fill('RCPT/1');
    await field(page, 'Receipt date').fill('2026-08-06');
    await field(page, 'Received from').fill('Customer');
    await field(page, 'Amount received').fill('-1');
    await field(page, 'Payment purpose').fill('Service');
    await page.getByRole('button', { name: 'Review document' }).press('Enter');

    const summary = page.getByRole('alert', { name: 'Check the highlighted fields' });
    await expect(summary).toBeVisible();
    await expect(field(page, 'Amount received')).toHaveAttribute('aria-invalid', 'true');
    await expect(summary).toContainText('Amount must be greater than zero');

    await field(page, 'Amount received').fill('10.00');
    await page.getByRole('button', { name: 'Review document' }).press('Enter');
    await expect(page.getByTestId('document-preview')).toBeVisible();
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(field(page, 'Business name')).toHaveValue('');
    await expect(page.getByTestId('document-preview')).toHaveCount(0);
  });
});
