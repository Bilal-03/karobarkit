import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const overflowRoutes = [
  '/',
  '/tools',
  '/categories/financial-calculators',
  '/tools/cagr-calculator',
  '/tools/roi-calculator',
  '/tools/url-qr',
  '/tools/upi-standee',
  '/sources',
  '/contact',
  '/report-an-error',
];

const metadataRoutes = [
  {
    path: '/',
    title: 'Private business tools for India',
    h1: 'Numbers you can explain. Tools you can trust.',
  },
  { path: '/tools', title: 'All business tools', h1: 'Tools for the numbers behind your business' },
  {
    path: '/tools/cagr-calculator',
    title: 'CAGR Calculator for Indian Businesses',
    h1: 'CAGR Calculator',
  },
  { path: '/tools/roi-calculator', title: 'ROI Calculator for Indian Businesses', h1: 'ROI Calculator' },
  { path: '/tools/url-qr', title: 'URL QR Generator for Indian Businesses', h1: 'URL QR Generator' },
  {
    path: '/tools/upi-standee',
    title: 'UPI Standee Generator for Indian Businesses',
    h1: 'UPI Standee Generator',
  },
  {
    path: '/categories/financial-calculators',
    title: 'Financial calculations tools',
    h1: 'Financial calculations',
  },
  {
    path: '/categories/marketing-barcodes',
    title: 'Marketing & QR codes tools',
    h1: 'Marketing & QR codes',
  },
  { path: '/search', title: 'Search business tools', h1: 'Find the right tool for the job' },
  {
    path: '/methodology',
    title: 'Methodology and review process',
    h1: 'A result should come with its working',
  },
  { path: '/sources', title: 'Sources and formula register', h1: 'Sources we can point to' },
  { path: '/about', title: 'About KarobarKit', h1: 'Useful business tools, with fewer surprises' },
  { path: '/contact', title: 'Contact KarobarKit', h1: 'Tell us what would make this useful' },
  { path: '/faq', title: 'Frequently asked questions', h1: 'Questions, answered plainly' },
  { path: '/privacy', title: 'Privacy', h1: 'Private by default, clear by design' },
  { path: '/terms', title: 'Terms of use', h1: 'Terms of use' },
  { path: '/disclaimer', title: 'Disclaimer', h1: 'A calculation is not a conclusion' },
  {
    path: '/report-an-error',
    title: 'Report an error',
    h1: 'Report an error without sending your numbers',
  },
  { path: '/404', title: 'Page not found', h1: 'That page took a wrong turn.' },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.describe('foundation routes', () => {
  test('calculator metadata and canonical identify the same tool', async ({ page }) => {
    await page.goto('/tools/cagr-calculator');

    await expect(page.locator('h1')).toHaveText('CAGR Calculator');
    await expect(page).toHaveTitle(/CAGR Calculator for Indian Businesses/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/tools\/cagr-calculator$/);
  });

  test('CAGR completes the required worked input', async ({ page }) => {
    await page.goto('/tools/cagr-calculator');

    await page.getByLabel('Beginning value').fill('100000');
    await page.getByLabel('Ending value').fill('161051');
    await page.getByLabel('Duration in years').fill('5');
    await page.getByRole('button', { name: 'Calculate result' }).click();

    await expect(page.getByText('10.00%', { exact: true })).toBeVisible();
    await expect(page.getByText('₹1,00,000.00')).toBeVisible();
  });

  test('ROI keyboard journey reports a complete loss safely', async ({ page }) => {
    await page.goto('/tools/roi-calculator');

    await page.getByLabel('Investment cost').fill('100000');
    await page.getByLabel('Final value (not profit)').fill('0');
    await page.getByRole('button', { name: 'Calculate result' }).press('Enter');

    await expect(page.getByText('-100.00%')).toBeVisible();
    await expect(page.getByText('-₹1,00,000.00')).toBeVisible();
  });

  test('mobile pages do not create horizontal overflow', async ({ page }) => {
    for (const route of overflowRoutes) {
      await page.goto(route);
      const widths = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      }));
      expect(widths.document, `${route} overflows at ${widths.viewport}px`).toBeLessThanOrEqual(
        widths.viewport + 1,
      );
    }
  });

  test('keyboard users can reach the mobile navigation and focus remains visible', async ({ page }) => {
    await page.goto('/tools');
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'KarobarKit home' })).toBeFocused();
  });

  test('mobile navigation opens, focuses its close control and closes on selection', async ({
    page,
  }, testInfo) => {
    test.skip(
      !testInfo.project.name.startsWith('mobile-'),
      'Mobile navigation is hidden at wider viewports.',
    );
    await page.goto('/tools');

    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(page.getByRole('dialog', { name: 'Mobile navigation' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeFocused();

    await page
      .getByRole('navigation', { name: 'Mobile primary navigation' })
      .getByRole('link', { name: 'Methodology' })
      .click();
    await expect(page).toHaveURL(/\/methodology$/);
    await expect(page.locator('.mobile-menu')).toHaveCount(0);
  });

  test('invalid input is announced and linked to its field', async ({ page }) => {
    await page.goto('/tools/cagr-calculator');

    await page.getByLabel('Beginning value').fill('0');
    await page.getByRole('button', { name: 'Calculate result' }).click();

    const summary = page.getByRole('alert', { name: 'Check the highlighted fields' });
    await expect(summary).toBeFocused();
    const field = page.getByLabel('Beginning value');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAttribute('aria-describedby', /beginningValue-error/);
  });

  test('calculator controls meet the minimum touch target height', async ({ page }, testInfo) => {
    test.skip(
      !testInfo.project.name.startsWith('mobile-'),
      'Touch target audit is scoped to mobile layouts.',
    );
    await page.goto('/tools/upi-standee');

    const heights = await page
      .locator(
        '.calculator-card button, .calculator-card input, .calculator-card textarea, .calculator-card select',
      )
      .evaluateAll((elements) =>
        elements.map((element) => Math.round(element.getBoundingClientRect().height)),
      );
    expect(heights.length).toBeGreaterThan(0);
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
  });
});

test.describe('route metadata', () => {
  test('every foundation route has a title, description, canonical URL and H1', async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    test.skip(
      testInfo.project.name !== 'desktop-1440',
      'Run the metadata matrix once at the reference desktop width.',
    );

    for (const route of metadataRoutes) {
      await page.goto(route.path);
      await expect(page.locator('h1')).toHaveText(route.h1);
      await expect(page).toHaveTitle(new RegExp(escapeRegExp(route.title)));
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBeTruthy();
      expect(new URL(canonical as string).pathname).toBe(route.path);
    }
  });
});

test.describe('accessibility', () => {
  test('home page has no serious or critical axe violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    );
    expect(seriousOrCritical).toEqual([]);
  });

  test('calculator page has no serious or critical axe violations', async ({ page }) => {
    test.setTimeout(120_000);
    for (const route of ['/tools/roi-calculator', '/tools/url-qr', '/tools/upi-standee']) {
      await page.goto(route);
      const results = await new AxeBuilder({ page }).analyze();
      const seriousOrCritical = results.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      );
      expect(seriousOrCritical, route).toEqual([]);
    }
  });
});
