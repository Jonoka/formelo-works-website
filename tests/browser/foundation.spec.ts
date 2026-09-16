import { test, expect, type Page, type TestInfo } from '@playwright/test';
import routes from '../../config/routes.json' with { type: 'json' };

const title = 'Custom apparel manufacturing for brands in motion.';
async function noOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}
async function screenshot(page: Page, info: TestInfo, name: string): Promise<void> {
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true, animations: 'disabled' });
  await info.attach(name, { path, contentType: 'image/png' });
  if (/^homepage-(1440|390)$/.test(name)) {
    const viewportPath = info.outputPath(`${name}-viewport.png`);
    await page.screenshot({ path: viewportPath, fullPage: false, animations: 'disabled' });
    await info.attach(`${name}-viewport`, { path: viewportPath, contentType: 'image/png' });
  }
}

for (const width of [320, 360, 390, 768, 1024, 1440]) {
  test(`homepage reflows at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    expect((await page.locator('.site-header > .wordmark').boundingBox())?.height).toBeGreaterThanOrEqual(48);
    await noOverflow(page);
    for (const button of await page.locator('.contact-actions button:visible').all()) {
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(48);
      await expect(button).toBeDisabled();
    }
    for (const image of await page.locator('img[data-preview-image]').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
      expect(await image.evaluate((node: HTMLImageElement) => Math.abs(node.naturalWidth / node.naturalHeight - Number(node.getAttribute('width')) / Number(node.getAttribute('height'))))).toBeLessThanOrEqual(0.015);
    }
    if (width < 768) {
      await page.locator('.footer-bottom').scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const bottom = await page.locator('.footer-bottom').boundingBox();
      const bar = await page.locator('.mobile-contact-bar').boundingBox();
      expect(bottom && bar && bottom.y + bottom.height <= bar.y).toBe(true);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    if (info.project.name === 'preview') await screenshot(page, info, `homepage-${width}`);
  });
}

test('section heading words remain separated in the tablet layout', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/');
  for (const [id, text] of [
    ['categories-heading', 'Apparel categories'], ['factory-heading', 'Behind the garment.'],
    ['process-heading', 'A straightforward process'], ['journal-heading', 'Ideas, process and perspectives'],
    ['faq-heading', 'A little clarity. A better brief.'],
  ] as const) {
    expect((await page.locator(`#${id}`).innerText()).replace(/\s+/g, ' ').trim()).toBe(text);
  }
});

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
  for (const button of await page.locator('.contact-actions button').all()) await expect(button).toBeDisabled();
  await expect(page.locator('#hero-contact-note')).toContainText('Contact details pending');
  await expect(page.locator('a[href^="mailto:"], a[href*="wa.me"], form, input, textarea, iframe')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await page.getByRole('link', { name: 'Explore the proposed approach' }).click();
  await expect(page).toHaveURL(/#capabilities$/);
  await expect(page.locator('#journal')).toContainText('Not published or factory-approved');
  await expect(page.locator('#journal [data-article-card]')).toHaveCount(2);
  await expect(page.locator('#journal .draft-status')).toHaveText(['Editorial draft / Not published', 'Editorial draft / Not published']);
  expect(externalRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('all homepage links resolve to implemented pages and actual fragments', async ({ page, request }) => {
  await page.goto('/');
  const links = await page.locator('a[href]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')!));
  for (const href of links) {
    expect(href).not.toBe('#');
    expect(href).not.toBe('/#');
    const target = new URL(href, 'http://127.0.0.1/');
    expect(routes.previewPages.map(page => page.path)).toContain(target.pathname);
    const response = await request.get(target.pathname);
    expect(response.status()).toBe(200);
    if (target.hash) expect(await response.text()).toContain(`id="${target.hash.slice(1)}"`);
  }
});

test('mobile disclosure supports keyboard, Escape, anchor navigation and an unobstructed contact bar', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  const trigger = page.locator('.mobile-nav > summary');
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.mobile-nav')).toHaveAttribute('open', '');
  await expect(page.locator('.mobile-contact-bar')).toBeHidden();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'T-shirts', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.mobile-nav')).not.toHaveAttribute('open', '');
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Enter');
  if (info.project.name === 'preview') await screenshot(page, info, 'homepage-mobile-menu');
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Journal', exact: true }).click();
  await expect(page).toHaveURL(/\/blog\/$/);
  await expect(page.locator('.mobile-nav')).not.toHaveAttribute('open', '');
  await expect(page.locator('h1')).toHaveText('Journal');
  await page.goto('/#journal');
  await expect(page.locator('#journal')).toBeInViewport();
});

test('desktop clothing disclosure opens by keyboard and returns focus on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const trigger = page.locator('.clothing-menu > summary');
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.clothing-menu')).toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  await expect(page.locator('.clothing-menu a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.clothing-menu')).not.toHaveAttribute('open', '');
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Enter');
  await page.locator('.clothing-menu a').last().click();
  await expect(page).toHaveURL(/\/clothing\/hoodies\/$/);
  await expect(page.locator('.clothing-menu')).not.toHaveAttribute('open', '');
});

test('content, keyboard navigation and native FAQ work without JavaScript', async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, ...(baseURL ? { baseURL } : {}) });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    const menu = page.locator('.mobile-nav > summary');
    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.mobile-nav')).toHaveAttribute('open', '');
    await expect(page.locator('.mobile-contact-bar')).toBeHidden();
    await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Journal', exact: true }).click();
    await expect(page).toHaveURL(/\/blog\/$/);
    await expect(page.locator('[data-article-card]')).toHaveCount(2);
    // Cross-page navigation resets disclosure state naturally, even without JS.
    await expect(page.locator('.mobile-nav')).not.toHaveAttribute('open', '');
    await page.goto('/#enquiry-guide');
    const summary = page.locator('.faq-item > summary').first();
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.faq-item').first()).toHaveAttribute('open', '');
    await expect(page.getByText('Gather your sketches or reference images', { exact: false })).toBeVisible();
    await noOverflow(page);
    if (info.project.name === 'preview') await screenshot(page, info, 'homepage-no-javascript');
  } finally { await context.close(); }
});

test('reduced-motion preference removes nonessential transitions', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const styles = await page.locator('.hero .text-link').evaluate(node => ({ transition: getComputedStyle(node).transitionDuration, animation: getComputedStyle(node).animationName }));
  expect(styles.transition).toBe('0s');
  expect(styles.animation).toBe('none');
  if (info.project.name === 'preview') await screenshot(page, info, 'homepage-reduced-motion');
});

test('three unchanged local concepts and two registered reuses load with provenance', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const figures = page.locator('.preview-image');
  await expect(figures).toHaveCount(5);
  const expectedAssets = ['HERO-001', 'CAT-TS-001', 'CAT-HD-001', 'CAT-TS-001', 'CAT-HD-001'];
  for (let index = 0; index < expectedAssets.length; index += 1) {
    const figure = figures.nth(index);
    await figure.scrollIntoViewIfNeeded();
    await expect.poll(() => figure.locator('img').evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
    await expect(figure).toHaveAttribute('data-asset-id', expectedAssets[index]!);
    await expect(figure).toHaveAttribute('data-media-kind', 'concept');
    await expect(figure.locator('figcaption')).toContainText('AI-generated garment concept — not a factory sample.');
    const imageState = await figure.locator('img').evaluate((node: HTMLImageElement) => ({ complete: node.complete, naturalWidth: node.naturalWidth, naturalHeight: node.naturalHeight, alt: node.alt }));
    expect(imageState.complete).toBe(true);
    expect(imageState.naturalWidth).toBeGreaterThan(0);
    expect(imageState.naturalHeight).toBeGreaterThan(0);
    expect(imageState.alt).toMatch(/^AI-generated concept:/);
  }
});

test('local concept image failures preserve captions, dimensions and usable content', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/media/**', route => route.abort());
  await page.goto('/');
  for (const figure of await page.locator('.preview-image').all()) {
    await figure.scrollIntoViewIfNeeded();
    await expect(figure.locator('img')).toHaveAttribute('data-failed', 'true');
    await expect(figure.locator('[data-image-error]')).toBeVisible();
    await expect(figure.locator('[data-image-error]')).toHaveText('Image could not be loaded.');
  }
  await expect(page.locator('.preview-image figcaption')).toHaveCount(5);
  for (const frame of await page.locator('.media-frame').all()) { const box = await frame.boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(box!.width * 9 / 16 - 1); }
  await expect(page.locator('#factory')).toContainText('No generated production imagery.');
  await noOverflow(page);
  if (info.project.name === 'preview') await screenshot(page, info, 'homepage-image-failure');
});

for (const width of [320, 1440]) {
  test(`long editorial copy and unbroken names reflow at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await page.goto('/');
    await page.locator('h1').evaluate(node => { node.textContent = 'Custom apparel manufacturing for independent brands preparing a detailed international collection brief.'; });
    await page.locator('.hero .intro').evaluate(node => { node.textContent = 'MaterialReferenceWithoutAnySpaces'.repeat(7) + ' A longer editorial paragraph to check wrapping without clipping or horizontal scrolling. '.repeat(3); });
    await page.locator('.site-header .wordmark').evaluate(node => { node.textContent = 'FORMELOWORKSWITHALONGERPROVISIONALBRANDNAME'; });
    await page.locator('.category-copy h3').first().evaluate(node => { node.textContent = 'A longer proposed T-shirt category name for the next collection'; });
    await noOverflow(page);
    const heading = await page.locator('h1').boundingBox();
    expect(heading?.height).toBeGreaterThan(80);
    if (info.project.name === 'preview') await screenshot(page, info, `homepage-long-copy-${width}`);
  });
}

test('200-percent text resizing remains usable (not a real-device zoom claim)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await noOverflow(page);
  await expect(page.locator('.faq-item > summary').first()).toBeVisible();
});

test('customer-facing copy and explicit fact status remain separate', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero .intro')).toContainText('fabric, fit and finish');
  await expect(page.locator('.hero .fact-note')).toContainText('not yet factory-confirmed');
  await expect(page.locator('.category-copy .eyebrow')).toHaveCount(2);
  await expect(page.locator('#factory img')).toHaveCount(0);
  for (const paragraph of await page.locator('.capability p, .category-copy > p:not(.eyebrow):not(.unavailable), .process-grid p').all()) {
    expect(await paragraph.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
  }
});

test('broken images without JavaScript retain labelled space and native FAQ', async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, ...(baseURL ? { baseURL } : {}) });
  try {
    const page = await context.newPage();
    await page.route('**/media/**', route => route.abort());
    await page.goto('/');
    for (const figure of await page.locator('.preview-image').all()) {
      await figure.scrollIntoViewIfNeeded();
      await expect(figure.locator('figcaption')).toContainText('AI-generated garment concept');
      await expect(figure.locator('img')).toHaveAttribute('alt', /^AI-generated concept:/);
      const box = await figure.locator('.media-frame').boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(box!.width * 9 / 16 - 1);
    }
    await page.locator('.faq-item > summary').first().click();
    await expect(page.locator('.faq-item').first()).toHaveAttribute('open', '');
    await noOverflow(page);
    if (info.project.name === 'preview') await screenshot(page, info, 'homepage-image-failure-no-javascript');
  } finally { await context.close(); }
});

test('unknown routes return an actual 404 rather than the homepage', async ({ page, request }) => {
  const response = await page.goto('/this-route-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page is not here.');
  await expect(page.getByRole('link', { name: 'Return to the homepage' })).toHaveAttribute('href', '/');
  await expect(page.locator('.mobile-contact-bar')).toHaveCount(0);
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Disallow: /');
});
