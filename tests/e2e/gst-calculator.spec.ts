import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('GST Calculator', () => {
  test('supports current preset, exclusive calculation and source context', async ({ page }) => {
    await page.goto('/tools/gst-calculator');

    await expect(page.getByText('Active policy: gst-general-rates-2025-09-22-v1')).toBeVisible();
    await page.getByRole('button', { name: 'Calculate GST' }).click();

    await expect(page.locator('.gst-calculator-result .result-panel__value')).toHaveText('₹180.00');
    await expect(
      page.locator('.gst-breakdown').getByRole('cell', { name: '₹1,180.00', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('5% · current headline rate', { exact: true })).toBeVisible();
    await expect(
      page.locator('.gst-result-sources').getByRole('link', { name: /Notification No\. 09\/2025/ }),
    ).toHaveAttribute('href', /taxinformation\.cbic\.gov\.in/);
  });

  test('completes an inclusive inter-state calculation from the keyboard', async ({ page }) => {
    await page.goto('/tools/gst-calculator');

    await page.getByLabel('Amount').fill('1050');
    await page.getByRole('radio', { name: '5% · current headline rate' }).check();
    await page.getByRole('radio', { name: 'GST inclusive' }).check();
    await page.getByRole('radio', { name: 'Inter-state · IGST' }).check();
    await page.getByRole('button', { name: 'Calculate GST' }).press('Enter');

    await expect(
      page.locator('.gst-breakdown').getByRole('cell', { name: '₹1,000.00', exact: true }),
    ).toBeVisible();
    await expect(
      page
        .locator('.gst-breakdown')
        .getByRole('row', { name: /GST amount/ })
        .getByRole('cell', { name: '₹50.00', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('row', { name: /IGST/ })).toBeVisible();
  });

  test('shows custom-rate warning and protects analytics from calculator values', async ({ page }) => {
    const analyticsPayloads: string[] = [];
    const consoleErrors: string[] = [];
    await page.exposeFunction('captureKarobarAnalytics', (payload: unknown) => {
      analyticsPayloads.push(JSON.stringify(payload));
    });
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.addInitScript(() => {
      window.addEventListener('karobarkit:analytics', (event) => {
        void (
          window as unknown as { captureKarobarAnalytics?: (payload: unknown) => void }
        ).captureKarobarAnalytics?.((event as CustomEvent).detail);
      });
    });

    await page.goto('/tools/gst-calculator');
    await page.getByRole('radio', { name: 'Custom rate · not policy-verified' }).check();
    await page.getByLabel('Custom GST rate (%)').fill('5.5');
    await page.getByLabel('Amount').fill('1234.56');
    await page.getByRole('button', { name: 'Calculate GST' }).click();

    await expect(page.getByText('Custom-rate warning')).toBeVisible();
    expect(consoleErrors).toEqual([]);
    expect(analyticsPayloads.join(' ')).not.toContain('1234.56');
    expect(analyticsPayloads.join(' ')).not.toContain('5.5');
  });

  test('has no serious or critical axe violations', async ({ page }) => {
    await page.goto('/tools/gst-calculator');
    const results = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    );
    expect(seriousOrCritical).toEqual([]);
  });
});
