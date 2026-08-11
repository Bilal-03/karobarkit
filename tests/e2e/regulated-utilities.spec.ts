import { expect, test } from '@playwright/test';

const configuredFlags = process.env.NEXT_PUBLIC_TOOL_FEATURE_FLAGS;
const waveEnabled =
  configuredFlags === undefined || configuredFlags.split(',').includes('regulated-utilities-wave');

test.describe('data-backed and regulated utilities wave', () => {
  test.beforeEach(() => {
    test.skip(!waveEnabled, 'Run this suite with regulated-utilities-wave enabled.');
  });

  test('publishes the six tools under their intended categories', async ({ page }) => {
    await page.goto('/categories/gst-tax');
    await expect(page.getByRole('heading', { name: 'HSN/SAC Reference Samples' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'GST Filing Due-date Calendar' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Depreciation Calculator' })).toBeVisible();

    await page.goto('/categories/hr-salary');
    await expect(
      page.getByRole('heading', { name: 'Maharashtra Professional Tax Calculator' }),
    ).toBeVisible();
    await page.goto('/categories/business');
    await expect(page.getByRole('heading', { name: 'MSME Late-payment Interest Calculator' })).toBeVisible();
    await page.goto('/categories/finance');
    await expect(page.getByRole('heading', { name: 'Currency Converter' })).toBeVisible();
  });

  test('searches a bundled HSN fixture on desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Run once at the reference desktop width.');
    await page.goto('/tools/hsn-sac-finder');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
    await page.getByRole('textbox', { name: 'Code or keyword' }).fill('bread');
    await page.getByRole('button', { name: 'Calculate reference result' }).click();
    await expect(page.getByText('1905', { exact: true })).toBeVisible();
    await expect(page.getByText(/Reference search only/)).toBeVisible();
  });

  test('keeps currency conversion manual on mobile until a quote is explicitly requested', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-390', 'Run once at the reference mobile width.');
    await page.goto('/tools/currency-converter');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
    await page.getByRole('button', { name: 'Calculate reference result' }).click();
    await expect(page.getByText('12 USD', { exact: true })).toBeVisible();
    await expect(page.getByText('Manual rate · 1 INR = 0.012 USD', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fetch dated ECB reference quote' })).toBeVisible();
  });
});
