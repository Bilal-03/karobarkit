import { test, expect } from '@playwright/test';

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

    await page.getByLabel('Business name').fill('नमस्ते Studio');
    await page.getByLabel('Business address').fill('12 Market Road\nPune, Maharashtra');
    await page.getByLabel('Email (optional)').fill('hello@example.com');
    await page.getByLabel('Website (optional)').fill('example.com');
    await page.getByLabel('Recipient name (optional)').fill('Asha Traders');
    await page.getByLabel('Subject (optional)').fill('A note for your records');
    await page.getByLabel('Letter body (optional)').fill('Thank you for working with us.\n\nRegards.');
    await page.getByLabel('Signatory name (optional)').fill('Bilal');
    await page.getByLabel('Signatory designation (optional)').fill('Owner');
    await page.locator('#business-logo').setInputFiles({
      name: 'logo.png',
      mimeType: 'image/png',
      buffer: onePixelPng,
    });
    await expect(page.getByText('Logo ready')).toBeVisible();
    await page.getByRole('button', { name: 'Remove logo' }).click();
    await page.getByRole('button', { name: 'Create letterhead' }).click();

    await expect(page.getByTestId('document-preview')).toBeVisible();
    await expect(page.getByText('नमस्ते Studio')).toBeVisible();
    await expect(page.getByTestId('a4-page')).toHaveCount(1);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('karobarkit-letterhead.pdf');

    await page.emulateMedia({ media: 'print' });
    await page.getByRole('button', { name: 'Print' }).click();
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
    await page.getByLabel('Business name').fill('Long Letter Co');
    await page.getByLabel('Business address').fill('A long address');
    await page.getByLabel('Layout').selectOption('formal');
    await page.getByLabel('Letter body (optional)').fill('A '.repeat(1800));
    await page.getByRole('button', { name: 'Create letterhead' }).click();

    await expect(page.getByTestId('a4-page')).toHaveCount(2);
    await expect(page.locator('.a4-page--formal')).toHaveCount(2);
  });

  test('payment receipt formats amount in words and exports a declared-payment acknowledgement', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto('/tools/payment-receipt-generator');
    await page.getByLabel('Business name').fill('Ravi & Sons');
    await page.getByLabel('Business address').fill('Market Road, Pune');
    await page.getByLabel('Receipt number').fill('RCPT/2026-001');
    await page.getByLabel('Receipt date').fill('2026-08-06');
    await page.getByLabel('Received from').fill('Nikhil');
    await page.getByLabel('Amount received').fill('1250.50');
    await page.getByLabel('Payment purpose').fill('Consulting retainer');
    await page.getByLabel('Payment method (optional)').selectOption('upi');
    await page.getByLabel('Transaction reference (optional)').fill('UPI-REF-001');
    await page.getByRole('button', { name: 'Create receipt' }).click();

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
    await page.getByLabel('Business name').fill('Keyboard Shop');
    await page.getByLabel('Business address').fill('Address');
    await page.getByLabel('Receipt number').fill('RCPT/1');
    await page.getByLabel('Receipt date').fill('2026-08-06');
    await page.getByLabel('Received from').fill('Customer');
    await page.getByLabel('Amount received').fill('-1');
    await page.getByLabel('Payment purpose').fill('Service');
    await page.getByRole('button', { name: 'Create receipt' }).press('Enter');

    const summary = page.getByRole('alert', { name: 'Check the highlighted fields' });
    await expect(summary).toBeFocused();
    await expect(page.getByLabel('Amount received')).toHaveAttribute('aria-invalid', 'true');
    await expect(summary).toContainText('Amount must be greater than zero');

    await page.getByLabel('Amount received').fill('10.00');
    await page.getByRole('button', { name: 'Create receipt' }).press('Enter');
    await expect(page.getByTestId('document-preview')).toBeVisible();
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.getByLabel('Business name')).toHaveValue('');
    await expect(page.getByTestId('document-preview')).toHaveCount(0);
  });
});
