import { expect, test } from '@playwright/test';

test('volunteer can express interest without granting recording permission', async ({ page }) => {
  test.setTimeout(90_000);
  let submission: Record<string, string> | undefined;
  await page.route('**/api/contact', async (route) => {
    submission = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
  await page.goto('/research?kk_traffic=verification');
  await expect(page.getByRole('heading', { name: 'Help us understand your paperwork' })).toBeVisible();
  await page.getByLabel('Email address', { exact: true }).fill('volunteer@example.com');
  await page.getByLabel('Tell us about your paperwork process').fill('I use a spreadsheet for invoices.');
  await page.getByRole('button', { name: 'Express interview interest' }).click();
  expect(submission).toBeUndefined();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Express interview interest' }).click();
  await expect(page.getByRole('status')).toContainText('no session is booked yet');
  expect(submission).toMatchObject({ topic: 'research', researchConsent: 'on' });
});
