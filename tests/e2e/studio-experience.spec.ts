import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test.setTimeout(120000);
test('studio discovery, themes, keyboard search and separate help', async ({ page }, info) => {
  test.setTimeout(120000);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your work, made simpler.' })).toBeVisible();
  await expect(page.locator('.tool-card--featured')).toHaveCount(6);
  const search = page.getByLabel('What do you need to do?');
  const box = await search.boundingBox();
  expect(box!.y + box!.height).toBeLessThan(page.viewportSize()!.height);
  await page.getByRole('button', { name: 'Use dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Search all tools').fill('gst');
  await page
    .getByRole('dialog')
    .getByRole('link', { name: /GST Calculator/ })
    .click();
  await expect(page.getByRole('heading', { name: 'GST Calculator', exact: true })).toBeVisible();
  await expect(page.locator('#amount')).toHaveValue('');
  await expect(page.getByText('Sources & limitations', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Policy context', { exact: true })).toHaveCount(0);
  await page.locator('#amount').fill('1000');
  await expect(page.getByText('₹1,180.00', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('gst-dark.png'), fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Use light theme' }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goto('/tools/gst-calculator#source-register');
  await expect(page).toHaveURL(/\/help#source-register$/);
  await expect(page.locator('#source-register')).toBeVisible();
  await page.goto('/tools?group=files');
  await expect(page.getByRole('heading', { name: 'Photo Resizer & Compressor' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'GST Calculator', exact: true })).toHaveCount(0);
});
test('EMI has three primary inputs, retained extras and a result', async ({ page }) => {
  await page.goto('/tools/emi-calculator');
  await expect(page.locator('form[data-interactive=true]')).toBeVisible();
  await page.locator('#loanAmount').fill('100000');
  await page.locator('#annualRatePercent').fill('10');
  await page.locator('#tenureMonths').fill('2');
  await expect(page.locator('.result-panel__value').first()).toHaveText('₹4,614.49');
  const fees = page.getByText('Add fees or a rate change', { exact: true });
  await fees.click();
  await page.locator('#processingFee').fill('500');
  await fees.click();
  await fees.click();
  await expect(page.locator('#processingFee')).toHaveValue('500');
});
test('invoice parties, items, edit, reset and PDF export', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/tools/invoice-generator');
  await expect(page.locator('form[data-interactive=true]')).toBeVisible();
  await page.getByLabel('Business name').fill('Example Shop');
  await page.getByLabel('Business address').fill('Market Road, Pune');
  await page.getByLabel('Customer name').fill('Example Customer');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByLabel('Invoice number', { exact: false }).fill('INV-001');
  await page.locator('[id="items.0.description"]').fill('Consulting');
  await page.locator('[id="items.0.unitPrice"]').fill('1000');
  await page.getByRole('button', { name: 'Review document' }).click();
  await expect(page.getByTestId('document-preview')).toBeVisible();
  await page.getByRole('button', { name: 'Edit parties' }).click();
  await expect(page.getByLabel('Business name')).toHaveValue('Example Shop');
  await page.locator('.document-steps button').last().click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
  page.on('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.locator('form')).toHaveAttribute('data-step', 'parties');
});

test('navigation drawers, collapsed sidebar and search restore keyboard focus', async ({ page }) => {
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Open navigation' });
  if (await menu.isVisible()) {
    await menu.click();
    await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeFocused();
    await menu.click();
    await page.getByRole('dialog').getByRole('link', { name: 'Files', exact: true }).click();
    await expect(page).toHaveURL(/group=files/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  } else {
    await page.getByRole('button', { name: 'Collapse sidebar' }).click();
    await expect(page.locator('.studio-shell')).toHaveClass(/sidebar-collapsed/);
    await page.getByRole('button', { name: 'Help & more', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Terms', exact: true }).first()).toBeVisible();
  }
  const search = page.getByRole('button', { name: /Find a tool/ });
  await search.focus();
  await page.keyboard.press('Control+k');
  await expect(page.getByLabel('Search all tools')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(search).toBeFocused();
});
