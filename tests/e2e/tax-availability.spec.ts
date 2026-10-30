import { expect, test } from '@playwright/test';

const calculators = [
  'income-tax-calculator',
  'tds-calculator',
  'corporate-tax-calculator',
  'presumptive-tax-calculator',
  'ctc-calculator',
  'in-hand-salary-calculator',
  'pf-calculator',
  'gratuity-calculator',
];

for (const slug of calculators) {
  test(`${slug} calculates after its review date`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2027-10-31T12:00:00Z'));
    await page.goto(`/tools/${slug}`);
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
    await page.getByRole('button', { name: 'Try an example' }).click();
    await page.getByRole('button', { name: 'Calculate estimate' }).click();
    await expect(page.locator('.result-panel__value')).toBeVisible();
    await expect(page.getByText(/This project estimate uses bundled rules/)).toBeVisible();
    await expect(page.getByRole('alert', { name: 'Check the highlighted fields' })).toHaveCount(0);
  });
}
