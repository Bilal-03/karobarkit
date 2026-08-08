import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const overflowRoutes = [
  '/',
  '/tools',
  '/categories',
  '/search?q=no-such-tool',
  '/categories/finance',
  '/tools/cagr-calculator',
  '/tools/roi-calculator',
  '/tools/gst-calculator',
  '/tools/url-qr',
  '/tools/upi-standee',
  '/tools/letterhead-generator',
  '/tools/payment-receipt-generator',
  '/tools/gst-invoice-generator',
  '/categories/generators',
  '/categories/startup',
  '/sources',
  '/contact',
  '/report-an-error',
];

const metadataRoutes = [
  {
    path: '/',
    title: 'The Business Toolkit for India',
    h1: 'Run the numbers. Create the document. Make the next decision.',
  },
  { path: '/tools', title: 'Business tools for India', h1: 'Find the right tool for the business task' },
  {
    path: '/categories',
    title: 'Business toolkit categories for India',
    h1: 'Browse tools by business task',
  },
  {
    path: '/tools/cagr-calculator',
    title: 'CAGR Calculator for Indian Businesses',
    h1: 'CAGR Calculator',
  },
  { path: '/tools/roi-calculator', title: 'ROI Calculator for Indian Businesses', h1: 'ROI Calculator' },
  { path: '/tools/gst-calculator', title: 'GST Calculator for Indian Businesses', h1: 'GST Calculator' },
  { path: '/tools/url-qr', title: 'URL QR Generator for Indian Businesses', h1: 'URL QR Generator' },
  {
    path: '/tools/upi-standee',
    title: 'UPI Standee Generator for Indian Businesses',
    h1: 'UPI Standee Generator',
  },
  {
    path: '/tools/letterhead-generator',
    title: 'Letterhead Generator for Indian Businesses',
    h1: 'Letterhead Generator',
  },
  {
    path: '/tools/payment-receipt-generator',
    title: 'Payment Receipt Generator for Indian Businesses',
    h1: 'Payment Receipt Generator',
  },
  {
    path: '/tools/gst-invoice-generator',
    title: 'GST Invoice Generator for Indian Businesses',
    h1: 'GST Invoice Generator',
  },
  {
    path: '/categories/business',
    title: 'Business tools',
    h1: 'Business',
  },
  {
    path: '/categories/gst-tax',
    title: 'GST & Tax tools',
    h1: 'GST & Tax',
  },
  {
    path: '/categories/startup',
    title: 'Startup tools',
    h1: 'Startup',
  },
  {
    path: '/categories/finance',
    title: 'Finance tools',
    h1: 'Finance',
  },
  {
    path: '/categories/ecommerce',
    title: 'E-commerce tools',
    h1: 'E-commerce',
  },
  {
    path: '/categories/hr-salary',
    title: 'HR & Salary tools',
    h1: 'HR & Salary',
  },
  {
    path: '/categories/generators',
    title: 'Generators tools',
    h1: 'Generators',
  },
  {
    path: '/categories/ai-tools',
    title: 'AI Tools tools',
    h1: 'AI Tools',
  },
  { path: '/search', title: 'Search business tools', h1: 'Find the right tool for the job' },
  {
    path: '/methodology',
    title: 'Methodology and review process',
    h1: 'A result should come with its working',
  },
  { path: '/gst-methodology', title: 'GST Calculator methodology', h1: 'GST methodology and limits' },
  { path: '/gst-policy-version', title: 'GST policy version', h1: 'GST policy version' },
  { path: '/gst-source-verification', title: 'GST source verification', h1: 'GST source verification' },
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
  test('supports homepage, search, category and related-tool discovery', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('What do you need to do?').fill('gst bill');
    await page.getByRole('button', { name: 'Search tools' }).click();
    await expect(page.getByRole('heading', { name: 'GST Invoice Generator' })).toBeVisible();
    await page.getByRole('link', { name: 'GST Invoice Generator' }).click();
    await page.getByRole('link', { name: 'GST Calculator' }).last().click();
    await expect(page).toHaveURL(/\/tools\/gst-calculator$/);
    await Promise.all([
      page.waitForURL(/\/categories\/gst-tax$/, { timeout: 30_000 }),
      page.getByRole('link', { name: 'Browse GST & Tax' }).click(),
    ]);
  });

  test('shows useful zero results and a noindex search policy', async ({ page }) => {
    await page.goto('/search?q=spaceship-telemetry');
    await expect(page.getByText('No matching tools yet')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('hydrates scalable directory filters from a canonical query URL', async ({ page }) => {
    await page.goto('/tools?category=gst-tax&type=calculator&execution=local&regulated=regulated');
    await expect(page.getByLabel('Category')).toHaveValue('gst-tax');
    await expect(page.getByLabel('Tool type')).toHaveValue('calculator');
    await expect(page.getByLabel('Data use')).toHaveValue('local');
    await expect(page.getByLabel('Scope')).toHaveValue('regulated');
    await expect(page.getByRole('heading', { name: 'GST Calculator' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'GST Invoice Generator' })).toHaveCount(0);
  });

  test('keeps roadmap categories honest and out of the index', async ({ page }) => {
    await page.goto('/categories/startup');
    await expect(page.getByText('This category is on the roadmap')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('.tool-card')).toHaveCount(0);
  });

  test('calculator metadata and canonical identify the same tool', async ({ page }) => {
    await page.goto('/tools/cagr-calculator');

    await expect(page.locator('h1')).toHaveText('CAGR Calculator');
    await expect(page).toHaveTitle(/CAGR Calculator for Indian Businesses/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/tools\/cagr-calculator$/);
    await expect(
      page.getByRole('heading', { name: 'Check the method before you rely on the result' }),
    ).toBeVisible();
    await expect(page.getByText('Reviewer status')).toBeVisible();
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
    test.setTimeout(120_000);
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
    for (const route of [
      '/tools/roi-calculator',
      '/tools/gst-calculator',
      '/tools/url-qr',
      '/tools/upi-standee',
      '/tools/letterhead-generator',
      '/tools/payment-receipt-generator',
      '/tools/gst-invoice-generator',
    ]) {
      await page.goto(route);
      const results = await new AxeBuilder({ page }).analyze();
      const seriousOrCritical = results.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      );
      expect(seriousOrCritical, route).toEqual([]);
    }
  });
});
