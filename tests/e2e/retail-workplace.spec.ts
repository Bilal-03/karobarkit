import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

async function downloadBytes(download: import('@playwright/test').Download) {
  const stream = await download.createReadStream();
  if (!stream) throw new Error('The browser did not expose the downloaded artifact.');
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) chunks.push(new Uint8Array(chunk));
  const length = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

const configuredFlags = process.env.NEXT_PUBLIC_TOOL_FEATURE_FLAGS;
const waveEnabled =
  configuredFlags === undefined || configuredFlags.split(',').includes('retail-workplace-wave');

test.describe('retail, documents and workplace operations wave', () => {
  test.beforeEach(() => {
    test.skip(!waveEnabled, 'Run this suite with retail-workplace-wave enabled.');
  });

  test('publishes the new tools in their intended categories', async ({ page }) => {
    await page.goto('/categories/retail-logistics');
    await expect(page.getByRole('heading', { name: 'Price Tag Generator' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Purchase Order Generator' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Shipping Label Generator' })).toBeVisible();

    await page.goto('/categories/hr-salary');
    await expect(page.getByRole('heading', { name: 'Wage Slip Generator' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Notice Period Calculator' })).toBeVisible();

    await page.goto('/categories/marketing-digital');
    await expect(page.getByRole('heading', { name: 'Menu Generator' })).toBeVisible();
  });

  test('generates a declared price tag on desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Run once at the reference desktop width.');
    await page.goto('/tools/price-tag-generator');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
    await page.getByRole('textbox', { name: 'Business name' }).fill('Shop');
    await page.getByRole('textbox', { name: 'Product name' }).fill('Notebook');
    await page.getByRole('button', { name: 'Generate price tag' }).click();
    await expect(page.getByText('Price Tag', { exact: true })).toBeVisible();
    await expect(page.getByText('Draft', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible();
  });

  test('calculates a notice-period estimate on mobile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-390', 'Run once at the reference mobile width.');
    await page.goto('/tools/notice-period-calculator');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
    await page.getByRole('button', { name: 'Calculate locally' }).click();
    await expect(page.getByText('9 September 2026', { exact: true })).toBeVisible();
    await expect(page.getByText(/Contract wording and employer policy remain authoritative/)).toBeVisible();
  });

  test('downloads non-empty PDFs at every declared print profile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Run once at the reference desktop width.');
    test.setTimeout(120_000);
    await page.goto('/tools/price-tag-generator');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('textbox', { name: 'Business name' }).fill('दुकान');
    await page.getByRole('textbox', { name: 'Product name' }).fill('मसाला चाय');
    await page.getByRole('textbox', { name: 'Barcode value (optional)' }).fill('SKU-2026-001');

    const expectedDimensions: Record<string, [number, number]> = {
      a4: [595.28, 841.89],
      'thermal-58': [164.41, 566.93],
      'thermal-80': [226.77, 566.93],
      'label-4x6': [288, 432],
      'label-sheet-a4': [595.28, 841.89],
    };

    for (const [profile, [expectedWidth, expectedHeight]] of Object.entries(expectedDimensions)) {
      await page.getByLabel('Print profile').selectOption(profile);
      await page.getByRole('button', { name: 'Generate price tag' }).click();
      await expect(page.locator('.workplace-code-graphic svg')).toBeVisible();
      const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
      await page.getByRole('button', { name: 'Download PDF' }).click();
      const bytes = await downloadBytes(await downloadPromise);
      expect(bytes.byteLength).toBeGreaterThan(1_000);
      const pdf = await PDFDocument.load(bytes);
      const size = pdf.getPage(0).getSize();
      expect(size.width).toBeCloseTo(expectedWidth, 0);
      expect(size.height).toBeCloseTo(expectedHeight, 0);
    }
  });

  test('exports a Devanagari menu with a scannable QR image', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Run once at the reference desktop width.');
    test.setTimeout(60_000);
    await page.goto('/tools/menu-generator');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('textbox', { name: 'Business name' }).fill('अपना कैफ़े');
    await page.getByRole('textbox', { name: 'Item 1 name' }).fill('मसाला चाय');
    await page.getByRole('checkbox', { name: 'Prepare an optional QR destination' }).check();
    await page.getByRole('textbox', { name: 'Menu URL' }).fill('https://example.com/menu');
    await page.getByRole('button', { name: 'Generate menu' }).click();
    await expect(page.locator('.workplace-code-graphic svg')).toBeVisible();
    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const bytes = await downloadBytes(await downloadPromise);
    expect(bytes.byteLength).toBeGreaterThan(1_000);
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(0);
  });
});
