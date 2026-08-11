import { test, expect } from '@playwright/test';

test.describe('QR generators', () => {
  test('URL QR normalizes, renders, downloads and prints locally', async ({ page }) => {
    await page.addInitScript(() => {
      window.print = () => {
        document.body.setAttribute('data-print-called', 'true');
      };
    });
    await page.goto('/tools/url-qr');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible({ timeout: 30_000 });

    await page.getByRole('textbox', { name: 'URL' }).fill('example.com/menu?source=sign');
    await page.getByRole('combobox', { name: 'Output size' }).selectOption('256');
    await page.getByRole('button', { name: 'Generate QR code' }).click();

    const preview = page.getByTestId('qr-preview');
    await expect(preview).toBeVisible();
    await expect(preview).toHaveAttribute('src', /^data:image\/png;base64,/);
    await expect(page.getByText('https://example.com/menu?source=sign')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PNG' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('karobarkit-url-qr.png');

    await page.getByRole('button', { name: 'Print' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-print-called', 'true');
  });

  test('URL QR rejects unsafe protocols accessibly', async ({ page }) => {
    await page.goto('/tools/url-qr');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('textbox', { name: 'URL' }).fill('javascript:alert(1)');
    await page.getByRole('button', { name: 'Generate QR code' }).click();

    const summary = page.getByRole('alert', { name: 'Check the highlighted fields' });
    await expect(summary).toBeFocused();
    await expect(page.getByRole('textbox', { name: 'URL' })).toHaveAttribute('aria-invalid', 'true');
    await expect(summary).toContainText('Only HTTP and HTTPS URLs are supported');
    await expect(page.getByTestId('qr-preview')).toHaveCount(0);
  });

  test('UPI standee encodes details and keeps the ownership limitation visible', async ({ page }) => {
    await page.goto('/tools/upi-standee');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible({ timeout: 30_000 });
    await page.getByLabel('Payee name').fill('Ravi & Sons');
    await page.getByLabel('UPI ID').fill('ravi.shop@bank');
    await page.getByLabel('Fixed amount (optional)').fill('125.50');
    await page.getByLabel('Payment note (optional)').fill('Order #1 & tea');
    await page.getByRole('button', { name: 'Generate UPI standee' }).click();

    await expect(page.getByTestId('qr-preview')).toBeVisible();
    await page.getByText('Show generated UPI payment URI').click();
    await expect(page.getByTestId('upi-payment-uri')).toHaveText(
      'upi://pay?pa=ravi.shop%40bank&pn=Ravi%20%26%20Sons&am=125.5&cu=INR&tn=Order%20%231%20%26%20tea',
    );
    await expect(
      page
        .getByRole('region', { name: 'Your UPI standee is ready' })
        .getByText(/not proof that the account exists/),
    ).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PNG' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('karobarkit-upi-standee.png');
  });

  test('UPI form can be completed with keyboard and reset safely', async ({ page }) => {
    await page.goto('/tools/upi-standee');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible({ timeout: 30_000 });
    await page.getByLabel('Payee name').fill('Keyboard Shop');
    await page.getByLabel('UPI ID').fill('keyboard@bank');
    await page.getByRole('button', { name: 'Generate UPI standee' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('qr-preview')).toBeVisible();

    const dialogPromise = page.waitForEvent('dialog');
    const resetClickPromise = page.getByRole('button', { name: 'Reset' }).click();
    await (await dialogPromise).accept();
    await resetClickPromise;
    await expect(page.getByLabel('Payee name')).toHaveValue('');
    await expect(page.getByTestId('qr-preview')).toHaveCount(0);
  });
});
