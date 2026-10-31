import { expect, test } from '@playwright/test';

test('everyday tasks are direct and portfolio tools stay separate', async ({ page }) => {
  await page.goto('/?kk_traffic=verification');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const tasks = page.getByRole('region', { name: 'Everyday business tasks' });
  await expect(tasks.getByRole('link')).toHaveCount(6);
  await expect(page.getByRole('link', { name: 'Find my next step' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Compare business scenarios' })).toHaveCount(0);
  await page.goto('/get-started');
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/tools?group=documents');
  await expect(page.getByRole('heading', { name: 'Everyday documents' })).toBeVisible();
  await expect(page.locator('#directory-category')).toHaveCount(0);
  await expect(page.getByText('More filters', { exact: true })).toHaveCount(0);
  const links = page.locator('.tool-grid .tool-card__link');
  await expect(links.nth(0)).toHaveAttribute('href', '/tools/quotation-generator');
  await expect(links.nth(2)).toHaveAttribute('href', '/tools/gst-invoice-generator');
  await expect(page.getByRole('link', { name: 'Compare prices and costs', exact: true })).toBeVisible();
  await page.goto('/workspace');
  await expect(page.getByRole('link', { name: /Product Studio/ })).toHaveCount(0);
});

test('examples are previews, never exportable business documents', async ({ page }) => {
  test.setTimeout(120000);
  page.on('dialog', (d) => d.accept());
  for (const slug of [
    'quotation-generator',
    'invoice-generator',
    'payment-receipt-generator',
    'gst-invoice-generator',
    'upi-standee',
  ]) {
    await page.goto(`/tools/${slug}?kk_traffic=verification`);
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
    const identity =
      slug === 'upi-standee'
        ? '#payeeName'
        : slug === 'gst-invoice-generator'
          ? '[id="supplier.legalName"]'
          : '#businessName';
    await expect(page.locator(identity)).toHaveValue('');
    await expect(page.locator(identity)).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('button', { name: /Download (PDF|PNG)/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Try an example', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Start my own document', exact: true })).toBeVisible();
    // Even after review, examples cannot become exportable.
    if (slug !== 'upi-standee') {
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByRole('button', { name: 'Review document', exact: true }).click();
    } else await page.getByRole('button', { name: 'Generate UPI standee', exact: true }).click();
    const download = page.getByRole('button', { name: /Download (PDF|PNG)/ });
    await expect(download).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Print', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Start my own document', exact: true }).click();
    await expect(page.locator(identity)).toHaveValue('');
    if (slug === 'upi-standee') await expect(page.locator('#upiId')).toHaveValue('');
    else if (slug !== 'gst-invoice-generator') await expect(page.locator('#phone')).toHaveValue('');
    expect(await page.evaluate(() => localStorage.getItem('karobarkit:workspace:v1'))).toBeNull();
  }
});

test('pricing and income tax show all adjustments behind the total', async ({ page }) => {
  await page.goto('/tools/pricing-calculator?kk_traffic=verification');
  await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
  await expect(
    page.getByText('Applied: discount 0% · tax 0%. Adjust these under Additional assumptions.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Try an example', exact: true }).click();
  await expect(
    page.getByText('Applied: discount 10% · tax 18%. Adjust these under Additional assumptions.'),
  ).toBeVisible();
  await expect(page.getByText('Calculated selling price', { exact: true })).toBeVisible();
  await expect(page.getByText('₹1,180.00', { exact: true })).toBeVisible();
  const rows = page.locator('.result-breakdown');
  await expect(rows).toContainText('Unit cost');
  await expect(rows).toContainText('Target margin on pre-tax selling price');
  await expect(rows).toContainText('Tax amount');
  await expect(rows).toContainText('₹180.00');
  await page.goto('/tools/income-tax-calculator');
  await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
  await page.getByRole('button', { name: 'Try an example', exact: true }).click();
  await page.locator('#salaryIncome').fill('1800000');
  await expect(page.getByText('Health and education cess', { exact: true })).toBeVisible();
  await expect(page.getByText('₹6,400.00', { exact: true })).toBeVisible();
  await expect(page.locator('.result-panel__value').filter({ hasText: '₹1,66,400.00' })).toBeVisible();
});
