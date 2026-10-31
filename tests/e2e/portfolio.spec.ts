import { expect, test } from '@playwright/test';
test('case study distinguishes simulated analysis from real evidence', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/case-study?kk_traffic=verification');
  await expect(
    page.getByRole('heading', { name: 'Turning a broad toolkit into a focused workflow' }),
  ).toBeVisible();
  await expect(page.getByText('Simulated data only.', { exact: true })).toBeVisible();
  await expect(page.getByText('50.0%', { exact: true })).toBeVisible();
  await page.getByLabel('Scenario', { exact: true }).selectOption('b');
  await expect(page.getByText('66.7%', { exact: true })).toBeVisible();
  await page.getByLabel('Channel', { exact: true }).selectOption('direct');
  await expect(page.getByText('50.0%', { exact: true })).toBeVisible();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download simulated events (JSON)' }).click();
  expect((await pending).suggestedFilename()).toBe('synthetic-events-b-direct.json');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
