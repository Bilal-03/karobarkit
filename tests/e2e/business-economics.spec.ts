import { field } from './document-helpers';
import { test, expect } from '@playwright/test';

async function waitForInteractive(page: import('@playwright/test').Page) {
  await expect(page.locator('form[data-interactive="true"]')).toBeVisible({ timeout: 30_000 });
}

test.describe('Phase 2 business economics', () => {
  test('calculates a margin scenario and exposes a local CSV export', async ({ page }) => {
    await page.goto('/tools/margin-calculator');
    await waitForInteractive(page);

    await expect(page.locator('.workspace-heading')).not.toContainText('Beta');
    await field(page, 'Revenue').fill('100000');
    await field(page, 'Total cost').fill('70000');
    await page.getByRole('button', { name: 'Calculate scenario' }).press('Enter');

    await expect(page.getByText('30.00%', { exact: true })).toBeVisible();
    await expect(page.getByText('₹30,000.00')).toBeVisible();

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download CSV' }).click();
    expect((await download).suggestedFilename()).toBe('margin-scenario.csv');
  });

  test('supports an explicit tab-only handoff of matching assumptions', async ({ page }) => {
    await page.goto('/tools/pricing-calculator');
    await waitForInteractive(page);
    await page.getByRole('button', { name: 'Try an example' }).click();
    await page.getByRole('button', { name: 'Calculate scenario' }).click();
    await expect(page.getByText('₹1,180.00')).toBeVisible();
    await page.getByRole('button', { name: 'Save for a related tool' }).click();
    await expect(page.getByText('Saved for this tab')).toBeVisible();

    await page.goto('/tools/markup-calculator');
    await waitForInteractive(page);
    await expect(page.getByText('Scenario ready from Pricing Calculator')).toBeVisible();
    await page.getByRole('button', { name: 'Import matching inputs' }).click();
    await expect(field(page, 'Unit cost')).toHaveValue('600');
  });
});
