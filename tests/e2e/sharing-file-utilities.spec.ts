import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

async function onePagePdf(label: string) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([300, 400]);
  page.drawText(label, { x: 30, y: 350 });
  return Buffer.from(await pdf.save());
}

const configuredFlags = process.env.NEXT_PUBLIC_TOOL_FEATURE_FLAGS;
const waveEnabled =
  configuredFlags === undefined || configuredFlags.split(',').includes('sharing-file-utilities-wave');

test.describe('sharing and file utilities wave', () => {
  test.beforeEach(() => {
    test.skip(!waveEnabled, 'Run this suite with sharing-file-utilities-wave enabled.');
  });

  test('publishes QR, marketing and file categories behind the wave flag', async ({ page }) => {
    await page.goto('/categories/marketing-digital');
    await expect(page.getByRole('heading', { name: 'WhatsApp Link Generator' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Email Signature Generator' })).toBeVisible();

    await page.goto('/categories/media-files');
    await expect(page.getByRole('heading', { name: 'Photo Resizer & Compressor' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'PDF Merge & Split' })).toBeVisible();
  });

  test('generates a safe WhatsApp payload on desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Run once at the reference desktop width.');
    await page.goto('/tools/whatsapp-link-generator');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
    await page.getByRole('textbox', { name: 'Phone digits' }).fill('9876543210');
    await page.getByRole('textbox', { name: 'Optional message' }).fill('Hello & welcome');
    await page.getByRole('button', { name: 'Generate locally' }).click();
    await expect(page.getByText('https://wa.me/919876543210?text=Hello%20%26%20welcome')).toBeVisible();
  });

  test('reviews decoded content and renders a barcode on mobile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-390', 'Run once at the reference mobile width.');
    await page.goto('/tools/qr-barcode-scanner');
    await expect(
      page.locator('form[data-interactive="true"], button[data-interactive="true"]'),
    ).toBeVisible();
    await page.getByRole('textbox', { name: 'Or review decoded content' }).fill('javascript:alert(1)');
    await page.getByRole('button', { name: 'Review content safely' }).click();
    await expect(page.getByText(/never opened automatically|shown as text only/i)).toBeVisible();

    await page.goto('/tools/barcode-generator');
    await expect(page.locator('form[data-interactive="true"]')).toBeVisible();
    await page.getByLabel('Symbology').selectOption('ean13');
    await page.getByRole('textbox', { name: 'Value' }).fill('400638133393');
    await page.getByRole('button', { name: 'Generate barcode' }).click();
    await expect(page.locator('.barcode-preview svg')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download SVG' })).toBeVisible();
  });

  test('merges PDFs in a worker and exposes per-file controls', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Run once at the reference desktop width.');
    await page.goto('/tools/pdf-merge-split');
    await expect(page.locator('button[data-interactive="true"]')).toBeVisible({ timeout: 30_000 });
    await page.locator('#pdf-files').setInputFiles([
      { name: 'first.pdf', mimeType: 'application/pdf', buffer: await onePagePdf('First') },
      { name: 'second.pdf', mimeType: 'application/pdf', buffer: await onePagePdf('Second') },
    ]);
    await expect(page.getByRole('button', { name: 'Remove first.pdf' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear selected PDFs' })).toBeVisible();
    await page.getByRole('button', { name: 'Process locally' }).click();
    await expect(page.getByRole('heading', { name: 'PDF ready' })).toBeVisible();
    await expect(page.getByText('2 pages')).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    if (!stream) throw new Error('The merged PDF download was unavailable.');
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const merged = await PDFDocument.load(Buffer.concat(chunks));
    expect(merged.getPageCount()).toBe(2);
  });
});
