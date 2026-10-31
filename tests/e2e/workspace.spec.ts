import { expect, test } from '@playwright/test';
test('goal guidance, comparisons and optional draft persistence', async ({ page }) => {
  test.setTimeout(120000);
  page.on('dialog', (d) => d.accept());
  await page.goto('/get-started?kk_traffic=verification');
  await page.getByLabel('What would you like to accomplish?').selectOption('scenarios');
  await page.getByRole('link', { name: 'Open decision workbench', exact: true }).click();
  await expect(page.getByText('₹20,000.00', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add alternative', exact: true }).click();
  await page.locator('#scenario-1-discount').fill('10');
  await expect(page.getByText('₹10,000.00', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save comparisons on this device', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Load saved comparisons', exact: true }).click();
  await expect(page.locator('#scenario-1-discount')).toHaveValue('10');
  await page.goto('/workspace');
  await page.getByRole('button', { name: 'Open device workspace', exact: true }).click();
  await page.getByLabel('Business name', { exact: true }).fill('Example Studio');
  await page.getByRole('button', { name: 'Save business details', exact: true }).click();
  await page.goto('/tools/quotation-generator');
  await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
  await page.getByText('Optional device workspace', { exact: true }).click();
  await page.getByRole('button', { name: 'Apply saved business details', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Business name', exact: true })).toHaveValue(
    'Example Studio',
  );
  await page.getByRole('button', { name: 'Save draft on this device', exact: true }).click();
  await expect(page.getByText('Draft saved on this device.', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByText('Optional device workspace', { exact: true }).click();
  await page.getByRole('button', { name: 'Find saved drafts', exact: true }).click();
  await page.getByLabel('Saved draft', { exact: true }).selectOption({ label: 'My draft' });
  await page.getByRole('button', { name: 'Load selected draft', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Business name', exact: true })).toHaveValue(
    'Example Studio',
  );
  await page.goto('/workspace');
  await page.getByRole('button', { name: 'Open device workspace', exact: true }).click();
  await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
  await expect(page.getByText('My draft copy (quotation)', { exact: false })).toBeVisible();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download private backup', exact: true }).click();
  const backup = await pending;
  expect(backup.suggestedFilename()).toBe('karobarkit-private-workspace.json');
  const backupPath = await backup.path();
  await page.getByRole('button', { name: 'Delete entire workspace', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('karobarkit:workspace:v1'))).toBeNull();
  await page.locator('input[type="file"]').setInputFiles(backupPath!);
  await expect(page.getByLabel('Business name', { exact: true })).toHaveValue('Example Studio');
  await expect(page.getByText('My draft copy (quotation)', { exact: false })).toBeVisible();
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"version":2}') });
  await expect(page.getByRole('status')).toContainText('unsupported version or invalid data');
  await expect(page.getByLabel('Business name', { exact: true })).toHaveValue('Example Studio');
  await page.getByRole('button', { name: 'Delete entire workspace', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('karobarkit:workspace:v1'))).toBeNull();
});
