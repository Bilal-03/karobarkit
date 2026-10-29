import { field } from './document-helpers';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('GST Calculator', () => {
  test('supports a preset, exclusive calculation and separate source context', async ({ page }) => {
    await page.goto('/tools/gst-calculator');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
    await field(page, 'Amount (₹)').fill('1000');
    await page.getByRole('button', { name: 'Calculate GST' }).click();
    await expect(page.locator('.studio-result-summary')).toContainText('₹1,180.00');
    await expect(page.getByRole('region', { name: 'GST result' })).toContainText('₹180.00');
    await expect(page.getByRole('radio', { name: '5%', exact: true })).toBeVisible();
    await page.goto('/tools/gst-calculator/help');
    await expect(page.getByRole('link', { name: /Notification No\. 09\/2025/ }).first()).toHaveAttribute(
      'href',
      /taxinformation\.cbic\.gov\.in/,
    );
  });

  test('completes an inclusive inter-state calculation from the keyboard', async ({ page }) => {
    await page.goto('/tools/gst-calculator');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
    await field(page, 'Amount (₹)').fill('1050');
    await page.getByRole('radio', { name: '5%', exact: true }).check();
    await page.getByRole('radio', { name: 'Remove GST' }).check();
    await page.getByText('Split tax components', { exact: true }).click();
    await page.getByRole('radio', { name: 'Between states' }).check();
    await page.getByRole('button', { name: 'Calculate GST' }).press('Enter');
    const result = page.getByRole('region', { name: 'GST result' });
    await expect(result).toContainText('₹1,000.00');
    await expect(result).toContainText('₹50.00');
    await page.getByText('Tax components', { exact: true }).click();
    await expect(result.getByText('IGST', { exact: true })).toBeVisible();
  });

  test('keeps custom rates explicit and calculator values out of analytics', async ({ page }) => {
    // Vercel serves this asset at the edge; the local production server does not.
    await page.route('**/_vercel/insights/script.js', (route) =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
    );
    const payloads: string[] = [];
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.exposeFunction('captureKarobarAnalytics', (payload: unknown) =>
      payloads.push(JSON.stringify(payload)),
    );
    await page.addInitScript(() => {
      window.addEventListener('karobarkit:analytics', (event) => {
        void (
          window as unknown as { captureKarobarAnalytics: (payload: unknown) => void }
        ).captureKarobarAnalytics((event as CustomEvent).detail);
      });
    });
    await page.goto('/tools/gst-calculator');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
    await page.getByRole('radio', { name: 'Custom', exact: true }).check();
    await field(page, 'Custom rate (%)').fill('5.5');
    await field(page, 'Amount (₹)').fill('1234.56');
    await page.getByRole('button', { name: 'Calculate GST' }).click();
    await expect(page.getByText('Use a rate you have verified for your transaction.')).toBeVisible();
    await expect(page.getByRole('region', { name: 'GST result' })).toContainText('₹1,302.46');
    expect(payloads.join(' ')).not.toContain('1234.56');
    expect(payloads.join(' ')).not.toContain('5.5');
    expect(consoleErrors).toEqual([]);
  });

  test('has no serious or critical axe violations', async ({ page }) => {
    await page.goto('/tools/gst-calculator');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual([]);
  });
});
