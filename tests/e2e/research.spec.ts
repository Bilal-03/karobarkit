import { expect, test } from '@playwright/test';
test('recruitment is paused and points to the portfolio', async ({ page }) => {
  await page.goto('/research?kk_traffic=verification');
  await expect(page.getByRole('heading', { name: 'Research recruitment is paused' })).toBeVisible();
  await expect(page.locator('form')).toHaveCount(0);
  await page.getByRole('link', { name: 'Explore the product case study' }).click();
  await expect(
    page.getByRole('heading', { name: 'Turning a broad toolkit into a focused workflow' }),
  ).toBeVisible();
});
