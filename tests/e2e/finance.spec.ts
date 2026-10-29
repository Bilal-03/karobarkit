import { test, expect } from '@playwright/test';

test.describe('Phase 3 finance foundation', () => {
  test('calculates EMI, exposes the amortization output and links its sources', async ({ page }) => {
    await page.goto('/tools/emi-calculator');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: 'Try an example' }).click();
    await page.getByRole('button', { name: 'Calculate scenario' }).click();

    await expect(page.locator('.result-panel__value')).toHaveText('₹21,247.04');
    await expect(page.getByText(/Repayment schedule/)).toBeVisible();

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download CSV' }).click();
    expect((await download).suggestedFilename()).toBe('emi-scenario.csv');
    await page.goto('/tools/emi-calculator/help');
    await expect(page.getByRole('link', { name: /FAQs on reset/ })).toBeVisible();
  });
});
