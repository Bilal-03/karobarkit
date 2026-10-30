import { expect, test } from '@playwright/test';

test.setTimeout(90_000);

test('freelancer entry keeps the wider toolkit accessible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'From quotation to payment receipt.' })).toBeVisible();
  await page.getByRole('link', { name: 'See the workflow' }).click();
  await expect(page.getByRole('heading', { name: 'One job. Less repeated paperwork.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse the full business toolkit' })).toBeVisible();
  await page.getByRole('link', { name: 'Prepare a quotation', exact: true }).click();
  await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
});

test('income tax explains the extra cess on desktop and mobile', async ({ page }) => {
  await page.goto('/tools/income-tax-calculator');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await page.locator('#salaryIncome').fill('1800000');
  await page.getByRole('button', { name: 'Calculate estimate' }).click();
  await expect(page.locator('.result-panel__value')).toHaveText('₹1,66,400.00');
  await expect(page.getByText('Health and education cess', { exact: true })).toBeVisible();
  await expect(page.getByText('₹6,400.00', { exact: true })).toBeVisible();
  await expect(page.getByText('Estimated balance after credit', { exact: true })).toBeVisible();
});
