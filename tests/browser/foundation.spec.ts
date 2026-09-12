import { test, expect } from '@playwright/test';

for (const width of [320, 360, 390, 768, 1024, 1440]) {
  test(`foundation reflows at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Clothing, considered.');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    for (const button of await page.locator('.contact-actions button').all()) {
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
    if (testInfo.project.name === 'preview' && [390, 1440].includes(width)) {
      await page.screenshot({ path: testInfo.outputPath(`foundation-${width}.png`), fullPage: true });
    }
  });
}

test('page metadata, disabled contact actions and local-only requests', async ({ page }) => {
  const externalRequests: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => {
    if (new URL(route.request().url()).hostname !== '127.0.0.1') {
      externalRequests.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.getByRole('button', { name: 'Chat on WhatsApp' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Email Our Factory' })).toBeDisabled();
  await expect(page.getByText('Contact details pending.', { exact: false })).toBeVisible();
  await expect(page.locator('a[href^="mailto:"], a[href*="wa.me"], form, input, iframe')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await page.getByRole('link', { name: 'About this foundation' }).click();
  await expect(page).toHaveURL(/#foundation$/);
  expect(externalRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('content, keyboard navigation and native FAQ work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, ...(baseURL ? { baseURL } : {}) });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    const summary = page.locator('summary').first();
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('details').first()).toHaveAttribute('open', '');
    await expect(page.getByText('A minimal static page, local mock content', { exact: false })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('unknown routes return an actual 404 rather than the homepage', async ({ page, request }) => {
  const response = await page.goto('/this-route-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page is not here.');
  await expect(page.getByRole('link', { name: 'Return to the homepage' })).toHaveAttribute('href', '/');
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Disallow: /');
});
