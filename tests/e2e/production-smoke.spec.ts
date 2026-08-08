import { expect, test } from '@playwright/test';

test('production-safe route smoke checks', async ({ page }) => {
  test.skip(
    test.info().project.name !== 'desktop-1440',
    'Smoke suite runs once at the reference desktop size.',
  );

  for (const route of [
    '/',
    '/tools',
    '/search',
    '/tools/cagr-calculator',
    '/tools/gst-calculator',
    '/tools/gst-invoice-generator',
    '/methodology',
    '/sources',
  ]) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator('h1'), route).toBeVisible();
  }

  const sitemap = await page.goto('/sitemap.xml');
  expect(sitemap?.status()).toBe(200);
  await expect(page.locator('body')).toContainText('/tools/gst-calculator');

  const robots = await page.goto('/robots.txt');
  expect(robots?.status()).toBe(200);
  await expect(page.locator('body')).toContainText('Sitemap:');

  const missing = await page.goto('/not-a-real-production-route');
  expect(missing?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('That page took a wrong turn.');
});

test('contact and error-report workflows never claim delivery without a backend', async ({ page }) => {
  test.skip(
    test.info().project.name !== 'desktop-1440',
    'Smoke suite runs once at the reference desktop size.',
  );

  await page.goto('/contact');
  await page.getByLabel('Message').fill('A safe test message.');
  await page.getByRole('button', { name: 'Prepare message' }).click();
  await expect(page.getByRole('heading', { name: 'Message ready to share' })).toBeVisible();
  await expect(page.getByText('Nothing has been transmitted by KarobarKit.')).toBeVisible();

  await page.goto('/report-an-error');
  await page.getByLabel('What happened?').fill('A safe test report.');
  await page.getByRole('button', { name: 'Prepare report' }).click();
  await expect(page.getByRole('heading', { name: 'Report ready to share' })).toBeVisible();
  await expect(page.getByText('Nothing has been transmitted by KarobarKit.')).toBeVisible();
});
