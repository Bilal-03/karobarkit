import { expect, test } from '@playwright/test';
import { field, reviewDocument } from './document-helpers';

test('quotation to invoice to receipt exports with explicit imports', async ({ page }) => {
  test.setTimeout(180_000);
  const measurementRequests: string[] = [];
  page.on('request', (request) => {
    if (/\/_vercel\/insights\/(view|event)/.test(request.url())) measurementRequests.push(request.url());
  });
  await page.goto('/freelancers?kk_traffic=verification');
  await page.getByRole('link', { name: 'Prepare a quotation', exact: true }).click();
  await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
  await field(page, 'Business name').fill('Pilot Verification Studio');
  await field(page, 'Business address').fill('Demo address, Pune');
  await field(page, 'Customer name').fill('Demo Client');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await field(page, 'Quote number').fill('PILOT-001');
  await field(page, 'Quote date').fill('2026-10-31');
  await page.locator('[id="items.0.description"]').fill('Demo service');
  await page.locator('[id="items.0.unitPrice"]').fill('1900');
  await reviewDocument(page);
  for (const stage of ['quotation', 'invoice', 'receipt']) {
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
    expect((await downloaded).suggestedFilename()).toMatch(/\.pdf$/);
    if (stage === 'quotation') {
      await page.getByRole('button', { name: 'Continue to invoice', exact: true }).click();
      await page.getByRole('button', { name: 'Import quotation details', exact: true }).click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(field(page, 'Invoice number')).toHaveValue('PILOT-001');
      await expect(page.locator('[id="items.0.description"]')).toHaveValue('Demo service');
      await reviewDocument(page);
    } else if (stage === 'invoice') {
      await page.getByRole('button', { name: 'Continue to payment receipt', exact: true }).click();
      await page.getByRole('button', { name: 'Import invoice details', exact: true }).click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(field(page, 'Received from')).toHaveValue('Demo Client');
      await expect(field(page, 'Amount received')).toHaveValue('1900.00');
      await reviewDocument(page);
    }
  }
  expect(await page.evaluate(() => sessionStorage.getItem('karobarkit:verification:v1'))).toBe('true');
  expect(measurementRequests).toEqual([]);
});
