import { expect, test } from '@playwright/test';
test('plans experiments, ranks candidates and persists reasoned decisions', async ({ page }) => {
  test.setTimeout(120000);
  page.on('dialog', (d) => d.accept());
  await page.goto('/product-studio?kk_traffic=verification');
  for (const key of [
    'title',
    'problem',
    'hypothesis',
    'change',
    'audience',
    'primaryMetric',
    'guardrails',
    'duration',
    'stopping',
  ])
    await page.locator(`#experiment-${key}`).fill(`Planned ${key}`);
  await page.getByRole('button', { name: 'Add or update experiment', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Planned title — planned', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit experiment', exact: true }).click();
  await page.getByLabel('Evidence status', { exact: true }).selectOption('simulated');
  await page.locator('#experiment-evidence').fill('Invented data for planning only.');
  await page.getByRole('button', { name: 'Add or update experiment', exact: true }).click();
  for (const [title, reach, fit] of [
    ['A', 100, 1],
    ['B', 80, 5],
  ] as const) {
    await page.locator('#initiative-title').fill(title);
    await page.locator('#initiative-benefit').fill('Assumed completion benefit');
    await page.locator('#initiative-evidence').fill('Hypothesis, not customer evidence');
    await page.locator('#initiative-reach').fill(String(reach));
    await page.locator('#initiative-confidence').fill('100');
    await page.locator('#initiative-fit').fill(String(fit));
    await page.getByRole('button', { name: 'Add or update candidate', exact: true }).click();
  }
  await page.getByLabel('Strategic weighting sensitivity', { exact: true }).selectOption('0');
  await expect(page.locator('tbody tr').first()).toContainText('A');
  await page.getByLabel('Strategic weighting sensitivity', { exact: true }).selectOption('2');
  await expect(page.locator('tbody tr').first()).toContainText('B');
  await page.getByLabel('Decision candidate', { exact: true }).selectOption({ label: 'B' });
  for (const key of ['owner', 'rationale', 'alternatives', 'reverse'])
    await page.locator(`#decision-${key}`).fill(`Test ${key}`);
  await page.locator('#decision-revisit').fill('2026-12-01');
  await page.getByRole('button', { name: 'Record decision', exact: true }).click();
  await page.getByRole('button', { name: 'Save studio on this device', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Product Studio saved on this device.');
  await page.reload();
  await page.getByRole('button', { name: 'Load saved studio', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Planned title — simulated', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'B — investigate', exact: true })).toBeVisible();
  await page.goto('/workspace');
  await page.getByText('Backup & data settings', { exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download private backup', exact: true }).click();
  const file = await download;
  const backupPath = await file.path();
  await page.getByRole('button', { name: 'Delete all saved data', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('karobarkit:workspace:v1'))).toBeNull();
  await page.locator('input[type="file"]').setInputFiles(backupPath!);
  await page.goto('/product-studio');
  await page.getByRole('button', { name: 'Load saved studio', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Planned title — simulated', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'B — investigate', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
