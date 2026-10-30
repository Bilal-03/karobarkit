import { test, expect } from '@playwright/test';

test.describe('Phase 4 HRA controlled beta', () => {
  test('calculates a policy-scoped illustration and shows the review boundary', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-30T12:00:00Z'));
    await page.goto('/tools/hra-calculator');
    await expect(page.getByText(/Temporarily unavailable/)).toBeVisible();
    await expect(page.locator('form')).toHaveCount(0);

    await page.clock.setFixedTime(new Date('2026-08-10T12:00:00Z'));
    await page.reload();
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Try an example' }).click();
    await page.getByRole('button', { name: 'Calculate HRA exemption' }).click();

    await expect(page.getByRole('heading', { name: 'HRA exemption illustration' })).toBeVisible();
    await expect(page.locator('.result-panel__value')).toHaveText('₹1,20,000.00');
    await page.goto('/tools/hra-calculator/help');
    await expect(page.getByText(/confirm the result with payroll/iu).first()).toBeVisible();
    await expect(
      page.getByRole('link', { name: /CBDT e-Filing ITR-4 Validation Rules/iu }).first(),
    ).toBeVisible();
  });
});
