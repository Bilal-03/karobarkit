import { test, expect } from '@playwright/test';

test.describe('Phase 4 HRA controlled beta', () => {
  test('calculates a policy-scoped illustration and shows the review boundary', async ({ page }) => {
    await page.goto('/tools/hra-calculator');

    await expect(page.getByText('GST & Tax · Local-first · Beta')).toBeVisible();
    await page.getByRole('button', { name: 'Calculate HRA exemption' }).click();

    await expect(page.getByRole('heading', { name: 'HRA exemption illustration' })).toBeVisible();
    await expect(page.locator('.result-panel__value')).toHaveText('₹1,20,000.00');
    await expect(page.getByText(/confirm the result with payroll/iu).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /CBDT e-Filing ITR-4 Validation Rules/iu })).toBeVisible();
  });
});
