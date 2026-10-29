import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { test, expect } from '@playwright/test';
test('light and dark design references and zoom reflow', async ({ page }, info) => {
  test.skip(
    !['desktop-1280', 'mobile-390'].includes(info.project.name),
    'Capture the reference desktop and mobile layouts.',
  );
  test.setTimeout(180000);
  for (const theme of ['light', 'dark']) {
    await page.addInitScript((value) => localStorage.setItem('kk-theme', value), theme);
    for (const [name, path] of [
      ['home', '/'],
      ['gst', '/tools/gst-calculator'],
      ['emi', '/tools/emi-calculator'],
      ['invoice', '/tools/invoice-generator'],
    ]) {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      if (name === 'gst' || name === 'emi') {
        await expect(page.locator('form[data-interactive=true]')).toBeVisible();
        await page.getByRole('button', { name: 'Try an example' }).click();
        await expect(page.locator('.studio-result-summary,.result-panel').first()).toBeVisible();
      }
      await expect(page.locator('.studio-reveal').first()).toHaveCSS('opacity', '1');
      const capture = info.outputPath(`${name}-${theme}.png`);
      await page.screenshot({ path: capture, fullPage: true });
      const referenceDir = join(tmpdir(), 'karobarkit-studio-preview');
      await mkdir(referenceDir, { recursive: true });
      await copyFile(capture, join(referenceDir, `${info.project.name}-${name}-${theme}.png`));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(
        true,
      );
    }
  }
  await page.goto('/tools/gst-calculator');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test('discovery stays visible before JavaScript loads', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:3000/');
    await expect(page.getByRole('heading', { name: 'Your work, made simpler.' })).toBeVisible();
    await expect(page.locator('.tool-card--featured')).toHaveCount(6);
    await expect(page.locator('.studio-reveal')).toHaveCSS('opacity', '1');
  } finally {
    await context.close();
  }
});
