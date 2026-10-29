import { expect, test } from '@playwright/test';

test.describe('Phase 5 startup and marketplace beta', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop-1440',
      'Phase 5 smoke checks run once at the reference desktop size.',
    );
  });

  test('publishes CAC with a local scenario result and CSV export', async ({ page }) => {
    const response = await page.goto('/tools/cac-calculator');
    expect(response?.status()).toBe(200);
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'CAC Calculator' })).toBeVisible();

    await page.getByRole('button', { name: 'Try an example' }).click();
    await page.getByRole('button', { name: 'Calculate scenario' }).click();

    await expect(page.getByText('₹5,000.00', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('₹60,000.00', { exact: true })).toBeVisible();

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download CSV' }).click();
    expect((await download).suggestedFilename()).toBe('cac-scenario.csv');
    await page.goto('/tools/cac-calculator/help');
    await expect(page.getByText(/stay in this browser/).first()).toBeVisible();
  });

  test('shows the official marketplace snapshot and estimate boundary', async ({ page }) => {
    const response = await page.goto('/tools/amazon-fees-calculator');
    expect(response?.status()).toBe(200);
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Amazon Fees Calculator' })).toBeVisible();

    await page.clock.setFixedTime(new Date('2026-08-10T12:00:00Z'));
    await page.reload();
    await page.getByRole('button', { name: 'Try an example' }).click();
    await page.locator('form details.field-group > summary').click();
    await page.getByRole('textbox', { name: /Category referral fee override/ }).fill('0');
    await page.getByRole('textbox', { name: /Weight-handling \/ shipping fee/ }).fill('0');
    await page.getByRole('button', { name: 'Calculate scenario' }).click();

    await expect(page.getByText('-₹202.18', { exact: true }).first()).toBeVisible();
    await page.goto('/tools/amazon-fees-calculator/help');
    await expect(page.getByText(/not a seller settlement/).first()).toBeVisible();
  });
});
