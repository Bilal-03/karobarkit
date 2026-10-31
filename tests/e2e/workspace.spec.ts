import { expect, test } from '@playwright/test';
test('drafts resume directly, update without duplication and survive backup restore', async ({ page }) => {
  test.setTimeout(120000);
  page.on('dialog', (d) => d.accept());
  await page.goto('/workspace?kk_traffic=verification');
  await page.getByText('My business details', { exact: true }).click();
  await page.getByRole('textbox', { name: 'Business name', exact: true }).fill('Example Studio');
  await page.getByRole('button', { name: 'Save business details', exact: true }).click();
  await page.goto('/tools/quotation-generator');
  await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Business name', exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'Use saved details', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Business name', exact: true })).toHaveValue(
    'Example Studio',
  );
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page).toHaveURL(/\?draft=[a-f0-9-]+$/);
  const resumeUrl = page.url();
  await page.goto('/workspace');
  await page.getByRole('link', { name: 'Continue editing', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Business name', exact: true })).toHaveValue(
    'Example Studio',
  );
  await page.getByRole('textbox', { name: 'Business name', exact: true }).fill('Updated Studio');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device.' })).toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('karobarkit:workspace:v1')!).drafts.length),
  ).toBe(1);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Business name', exact: true })).toHaveValue(
    'Updated Studio',
  );
  await page.getByRole('button', { name: 'Save a copy', exact: true }).click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('karobarkit:workspace:v1')!).drafts.length),
  ).toBe(2);
  await page.goto('/workspace');
  await page.getByRole('button', { name: 'Make a copy', exact: true }).first().click();
  await expect(page.getByText('My draft copy', { exact: true })).toBeVisible();
  await page.getByText('Backup & data settings', { exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download private backup', exact: true }).click();
  const backup = await pending;
  const backupPath = await backup.path();
  await page.getByRole('button', { name: 'Delete all saved data', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('karobarkit:workspace:v1'))).toBeNull();
  await page.locator('input[type="file"]').setInputFiles(backupPath!);
  await expect(page.getByText('My draft copy', { exact: true })).toBeVisible();
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"version":2}') });
  await expect(page.getByRole('status')).toContainText('unsupported version or invalid data');
  await expect(page.getByText('My draft copy', { exact: true })).toBeVisible();
  await page.goto(resumeUrl);
  await expect(page.getByRole('textbox', { name: 'Business name', exact: true })).toHaveValue(
    'Updated Studio',
  );
  await page.getByRole('button', { name: 'Try an example', exact: true }).click();
  await page.getByRole('button', { name: 'Start my own document', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save draft', exact: true })).toBeEnabled();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('karobarkit:workspace:v1')!).drafts[0].values.businessName,
    ),
  ).toBe('Updated Studio');
});

test('missing drafts and unavailable storage give recovery paths, never false saves', async ({ page }) => {
  await page.goto(
    '/tools/quotation-generator?draft=00000000-0000-4000-8000-000000000000&kk_traffic=verification',
  );
  await expect(page.getByRole('status').filter({ hasText: 'unavailable in this browser' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save draft', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: 'Start a new document', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save draft', exact: true })).toBeEnabled();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Quota exceeded');
    };
  });
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Quota exceeded' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save draft', exact: true })).toBeEnabled();
});
