import { expect, test } from '@playwright/test';

const configuredFlags = process.env.NEXT_PUBLIC_TOOL_FEATURE_FLAGS;
const everydayWaveEnabled =
  configuredFlags === undefined || configuredFlags.split(',').includes('everyday-utilities-wave');

test.describe('everyday utilities wave', () => {
  test.beforeEach(() => {
    test.skip(!everydayWaveEnabled, 'Run this suite with everyday-utilities-wave enabled.');
  });

  test('publishes the new directory categories and keeps the feature flag explicit', async ({ page }) => {
    await page.goto('/categories/daily-utilities');
    await expect(page.getByText(/\d+ published tools? in this category/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Percentage Calculator' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Password Toolkit' })).toBeVisible();

    await page.goto('/categories/retail-logistics');
    await expect(page.getByText(/\d+ published tools? in this category/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Volumetric Weight Calculator' })).toBeVisible();
  });

  test('completes a percentage journey on the desktop reference viewport', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Run once at the reference desktop width.');
    await page.goto('/tools/percentage-calculator');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
    const base = page.getByRole('textbox', { name: 'Base value' });
    await base.fill('1250');
    await expect(base).toHaveValue('1250');
    await page.getByRole('textbox', { name: 'Percentage' }).fill('12.5');
    await expect(base).toHaveValue('1250');
    await page.getByRole('button', { name: 'Calculate result' }).click();
    await expect(page.getByText('156.25', { exact: true })).toBeVisible();
    await expect(page.getByText(/1250 × 12.5 ÷ 100/)).toBeVisible();
  });

  test('keeps text and checklist inputs local on a mobile viewport', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-390', 'Run once at the reference mobile width.');
    await page.goto('/tools/word-character-counter');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
    await page.getByRole('textbox', { name: 'Text' }).fill('Hello दुनिया');
    await expect(page.getByText('2', { exact: true })).toBeVisible();
    await expect(
      page
        .getByRole('region', { name: 'Text summary' })
        .getByText(/not sent to analytics, a backend, a URL or a log/),
    ).toBeVisible();

    await page.goto('/tools/todo-checklist');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
    await page.getByLabel('Task').fill('Call the supplier');
    await page.getByRole('button', { name: 'Add task' }).click();
    await expect(page.getByText('Call the supplier')).toBeVisible();
    await expect(page.getByText('0.00%')).toBeVisible();
  });

  test('hands a discounted amount to GST only after explicit import', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Run once at the reference desktop width.');
    await page.goto('/tools/discount-calculator');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Calculate result' }).click();
    await page.getByRole('button', { name: 'Continue final price to GST Calculator' }).click();
    await expect(page).toHaveURL(/\/tools\/gst-calculator$/u);
    await expect(page.getByText(/final price is ready from Discount Calculator/i)).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Amount' })).toHaveValue('1000');
    await page.getByRole('button', { name: 'Import final price' }).click();
    await expect(page.getByRole('textbox', { name: 'Amount' })).toHaveValue('900');
  });
});
