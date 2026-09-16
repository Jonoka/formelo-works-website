import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { pageContexts } from '../../config/page-context';
import routes from '../../config/routes.json' with { type: 'json' };
import settings from '../../config/site.example.json' with { type: 'json' };

const pages = [
  { key: 'manufacturing', ...pageContexts.manufacturing, title: 'Custom clothing manufacturing.' },
  { key: 'factory', ...pageContexts.factory, title: 'Our factory.' },
  { key: 'contact', ...pageContexts.contact, title: 'Contact our factory.' },
] as const;
const allowedPaths = routes.previewPages.map(page => page.path);

async function noOverflow(page: Page): Promise<void> {
  const layout = await page.evaluate(() => ({
    viewport: innerWidth, width: document.documentElement.scrollWidth,
    overflow: [...document.querySelectorAll('body *')].map(node => {
      const box = node.getBoundingClientRect();
      return { tag: node.tagName, className: node.className, right: box.right, left: box.left, text: node.textContent?.slice(0, 80) };
    }).filter(node => node.right > innerWidth + 1 || node.left < -1),
  }));
  if (layout.width > layout.viewport) {
    await test.info().attach('information-reflow-diagnostics', { body: JSON.stringify(layout, null, 2), contentType: 'application/json' });
    await page.screenshot({ path: test.info().outputPath('overflow.png'), fullPage: true });
  }
  expect(layout.width, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport);
}
async function footerClear(page: Page): Promise<void> {
  await expect.poll(async () => {
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    const footer = await page.locator('.footer-bottom').boundingBox();
    const bar = await page.locator('.mobile-contact-bar').boundingBox();
    return Boolean(footer && bar && footer.y + footer.height <= bar.y + 1);
  }).toBe(true);
}
async function capture(page: Page, info: TestInfo, name: string, viewport = false): Promise<void> {
  if (info.project.name !== 'preview') return;
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true, animations: 'disabled' });
  await info.attach(name, { path, contentType: 'image/png' });
  if (viewport) {
    const first = info.outputPath(`${name}-viewport.png`);
    await page.screenshot({ path: first, animations: 'disabled' });
    await info.attach(`${name}-viewport`, { path: first, contentType: 'image/png' });
  }
}

for (const item of pages) {
  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    test(`${item.key} reflows at ${width}px with correct context and navigation`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      const response = await page.goto(item.path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(item.title);
      expect(await page.title()).toContain(` — ${settings.brand.displayName}`);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
      expect((await page.locator('meta[name="description"]').getAttribute('content'))?.length).toBeGreaterThan(60);
      const crumb = page.getByRole('navigation', { name: 'Breadcrumb' });
      await expect(crumb.locator('li')).toHaveCount(2);
      await expect(crumb.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute('href', '/');
      await expect(crumb.locator('[aria-current="page"]')).toHaveText(item.label);
      await expect(crumb.locator('[aria-current="page"] a')).toHaveCount(0);
      await expect(page.locator('.desktop-nav [aria-current="page"]')).toHaveText(item.label);
      await expect(page.locator('.mobile-nav [aria-current="page"]')).toHaveText(item.label);
      await expect(page.locator('.footer-bottom [aria-current="page"]')).toHaveText(item.label);
      await expect(page.locator('.information-page')).toHaveAttribute('data-facts-status', 'unconfirmed');
      await expect(page.locator('.information-page')).toHaveAttribute('data-preview-status', 'concept_only');
      await expect(page.locator('.information-page')).toHaveAttribute('data-production-allowed', 'false');
      await expect(page.locator('img, form, input, textarea, iframe, a[href^="mailto:"], a[href*="wa.me"], link[rel="canonical"], a[href="/clothing/"]')).toHaveCount(0);
      await expect(page.getByRole('button', { name: /copy/i })).toHaveCount(0);
      await expect(page.locator('.pending-contact')).toHaveCount(3);
      for (const group of await page.locator('.pending-contact').all()) {
        await expect(group).toHaveAttribute('data-reference-code', item.referenceCode);
        await expect(group.locator('.contact-note')).toContainText('channels inactive');
      }
      for (const button of await page.locator('.contact-actions button:visible').all()) {
        await expect(button).toBeDisabled();
        expect((await button.boundingBox())?.height).toBeGreaterThanOrEqual(48);
      }
      if (item.key === 'factory') await expect(page.locator('[data-factory-media-status="awaiting_factory"]')).toHaveCount(1);
      if (item.key === 'contact') {
        await expect(page.locator('[data-contact-state="unconfigured"]')).toHaveCount(6);
        await expect(page.locator('a[href="/contact/"]')).toHaveCount(0);
      }
      await noOverflow(page);
      if (width < 768) await footerClear(page);
      await page.evaluate(() => scrollTo(0, 0));
      await capture(page, info, `${item.key}-${width}`, [390, 1440].includes(width));
    });
  }
  test(`${item.key} internal links and fragments resolve without external requests`, async ({ page, request }) => {
    const external: string[] = [], errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      if (new URL(route.request().url()).hostname !== '127.0.0.1') { external.push(route.request().url()); return route.abort(); }
      return route.continue();
    });
    await page.goto(item.path);
    for (const href of await page.locator('a[href]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')!))) {
      expect(href).not.toBe('#'); expect(href).not.toBe('/#');
      const target = new URL(href, `http://127.0.0.1${item.path}`);
      expect(target.origin).toBe('http://127.0.0.1'); expect(allowedPaths).toContain(target.pathname);
      const response = await request.get(target.pathname); expect(response.status()).toBe(200);
      if (target.hash) expect(await response.text()).toContain(`id="${target.hash.slice(1)}"`);
    }
    await expect(page.locator('.desktop-nav').getByRole('link', { name: 'Journal', exact: true })).toHaveAttribute('href', '/blog/');
    await expect(page.locator('.footer-bottom').getByRole('link', { name: 'Privacy', exact: true })).toHaveAttribute('href', '/privacy/');
    expect(external).toEqual([]); expect(errors).toEqual([]);
  });
  for (const javaScriptEnabled of [true, false]) {
    test(`${item.key} native mobile keyboard, reduced motion and image blocking with JS ${javaScriptEnabled}`, async ({ browser, baseURL }, info) => {
      const context = await browser.newContext({ javaScriptEnabled, reducedMotion: 'reduce', viewport: { width: 390, height: 844 }, baseURL: baseURL! });
      try {
        const page = await context.newPage();
        await page.route('**/media/**', route => route.abort());
        await page.goto(item.path);
        await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
        await page.keyboard.press('Enter'); await expect(page.locator('main')).toBeFocused();
        const trigger = page.locator('.mobile-nav > summary');
        await trigger.focus(); await page.keyboard.press('Enter');
        await expect(page.locator('.mobile-nav')).toHaveAttribute('open', '');
        await expect(page.locator('.mobile-contact-bar')).toBeHidden();
        await page.keyboard.press('Tab'); await expect(page.locator('.mobile-nav a').first()).toBeFocused();
        await capture(page, info, `${item.key}-mobile-menu-js-${javaScriptEnabled}`);
        if (javaScriptEnabled) {
          await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
        } else {
          await trigger.focus(); await page.keyboard.press('Enter');
        }
        await expect(page.locator('.mobile-nav')).not.toHaveAttribute('open', '');
        await expect(page.locator('.mobile-contact-bar')).toBeVisible();
        expect(await page.locator('.button').first().evaluate(node => getComputedStyle(node).transitionDuration)).toBe('0s');
        if (item.key === 'manufacturing') {
          await page.locator('.faq-item summary').first().focus(); await page.keyboard.press('Enter');
          await expect(page.locator('.faq-item').first()).toHaveAttribute('open', '');
          await expect(page.locator('.faq-answer').first()).toContainText('No.');
        }
        if (item.key === 'factory') await expect(page.locator('.factory-placeholder')).toContainText('No generated production imagery.');
        await noOverflow(page); await footerClear(page);
        await capture(page, info, `${item.key}-no-images-reduced-js-${javaScriptEnabled}`);
      } finally { await context.close(); }
    });
  }
  for (const width of [320, 1440]) {
    test(`${item.key} long title and unbroken buyer notes at ${width}px`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 900 }); await page.goto(item.path);
      await page.locator('h1').evaluate(node => { node.textContent = 'A detailed conversation about an international collection with many garment and manufacturing requirements'; });
      await page.locator('.information-hero .intro').evaluate(node => { node.textContent = 'LongUnbrokenReference'.repeat(12) + ' A longer collection brief with useful questions. '.repeat(10); });
      await page.locator('.information-rows dd').first().evaluate(node => { node.textContent = 'MaterialReferenceWithoutSpaces'.repeat(12); });
      await noOverflow(page);
      expect((await page.locator('h1').boundingBox())?.height).toBeGreaterThan(80);
      await capture(page, info, `${item.key}-long-copy-${width}`);
    });
  }
  for (const width of [320, 390, 1440]) {
    test(`${item.key} 200-percent CSS text at ${width}px (not browser UI zoom)`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 900 }); await page.goto(item.path);
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      await noOverflow(page); if (width < 768) await footerClear(page);
      await capture(page, info, `${item.key}-text-200-${width}`);
    });
  }
  test(`${item.key} no-JS 200-percent text retains footer clearance`, async ({ browser, baseURL }, info) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, baseURL: baseURL! });
    try {
      const page = await context.newPage(); await page.goto(item.path);
      await page.evaluate(() => {
        const style = document.createElement('style'); style.textContent = 'html { font-size: 200% !important; }'; document.head.append(style);
      });
      await noOverflow(page); await footerClear(page);
      await capture(page, info, `${item.key}-text-200-no-js`);
    } finally { await context.close(); }
  });
}

// Exercise the shared desktop disclosure on every new page, not only on Home.
for (const item of pages) for (const javaScriptEnabled of [true, false]) {
  test(`${item.key} desktop disclosure by keyboard with JS ${javaScriptEnabled}`, async ({ browser, baseURL }, info) => {
    const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 1440, height: 900 }, baseURL: baseURL! });
    try {
      const page = await context.newPage(); await page.goto(item.path);
      const trigger = page.locator('.clothing-menu > summary');
      await trigger.focus(); await page.keyboard.press('Enter');
      await expect(page.locator('.clothing-menu')).toHaveAttribute('open', '');
      await page.keyboard.press('Tab'); await expect(page.locator('.clothing-menu a').first()).toBeFocused();
      await capture(page, info, `${item.key}-desktop-menu-js-${javaScriptEnabled}`);
      if (javaScriptEnabled) {
        await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
        await expect(page.locator('.clothing-menu')).not.toHaveAttribute('open', '');
        await page.keyboard.press('Enter');
      }
      await page.locator('.clothing-menu a').first().focus(); await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/clothing\/t-shirts\/$/);
    } finally { await context.close(); }
  });
}
for (const javaScriptEnabled of [true, false]) for (const width of [390, 1440]) {
  test(`all Manufacturing anchors reveal their heading at ${width}px with JS ${javaScriptEnabled}`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled, viewport: { width, height: 900 }, baseURL: baseURL! });
    try {
      const page = await context.newPage(); await page.goto('/manufacturing/');
      for (const id of ['options', 'moq', 'prepare', 'sampling', 'production', 'faq']) {
        const link = page.locator(`.guide-contents a[href="#${id}"]`);
        await link.focus(); await page.keyboard.press('Enter');
        await expect(page).toHaveURL(new RegExp(`#${id}$`));
        const heading = page.locator(`#${id} h2`);
        await expect(heading).toBeInViewport();
        const headingBox = await heading.boundingBox();
        const barBox = await page.locator('.mobile-contact-bar').boundingBox();
        expect(headingBox!.y).toBeGreaterThanOrEqual(0);
        expect(headingBox!.y + headingBox!.height).toBeLessThanOrEqual(barBox?.y ?? 900);
      }
    } finally { await context.close(); }
  });
}

test('all ten pages have distinct SEO metadata, and absent routes return real 404s', async ({ page }) => {
  const titles = new Set<string>(), descriptions = new Set<string>();
  for (const path of allowedPaths) {
    await page.goto(path);
    const title = await page.title(), description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(titles.has(title)).toBe(false); expect(descriptions.has(description!)).toBe(false);
    titles.add(title); descriptions.add(description!);
    await expect(page.locator('h1')).toHaveCount(1); await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  }
  for (const path of ['/missing-page/', '/manufacturing/unknown/', '/our-factory/unknown/', '/contact/unknown/', '/clothing/missing/', '/blog/unknown/', '/blog/unpublished/', '/privacy/unknown/', '/clothing/']) {
    const response = await page.goto(path); expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('This page is not here.');
    await expect(page.locator('.mobile-contact-bar, .pending-contact')).toHaveCount(0);
  }
});
for (const javaScriptEnabled of [true, false]) for (const width of [390, 1440]) {
  test(`whole buyer journey by keyboard at ${width}px with JS ${javaScriptEnabled}`, async ({ browser, baseURL }, info) => {
    const context = await browser.newContext({ javaScriptEnabled, viewport: { width, height: 900 }, baseURL: baseURL! });
    try {
      const page = await context.newPage(); await page.goto('/');
      await page.locator('#t-shirts-heading a').focus(); await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/clothing\/t-shirts\/$/);
      await page.locator('a[href="/manufacturing/#moq"]').focus(); await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/manufacturing\/#moq$/);
      await expect(page.locator('#moq')).toBeInViewport();
      await page.locator('.guide-contents a[href="#sampling"]').focus(); await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/#sampling$/); await expect(page.locator('#sampling')).toBeInViewport();
      await page.locator('.information-next-links a[href="/our-factory/"]').focus(); await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/our-factory\/$/);
      await page.locator('.information-next-links a[href="/contact/"]').focus(); await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/contact\/$/);
      await expect(page.locator('a[href="/contact/"], a[href^="mailto:"], a[href*="wa.me"], form')).toHaveCount(0);
      await expect(page.locator('a[href="/manufacturing/#prepare"]')).toHaveCount(1);
      await page.locator('.information-category-links a[href="/clothing/hoodies/"]').focus(); await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/clothing\/hoodies\/$/);
      const disclosure = width < 1024 ? '.mobile-nav' : '.clothing-menu';
      await page.locator(`${disclosure} > summary`).focus(); await page.keyboard.press('Enter');
      await expect(page.locator(disclosure)).toHaveAttribute('open', '');
      await page.keyboard.press('Tab'); await expect(page.locator(`${disclosure} a`).first()).toBeFocused();
      await page.keyboard.press('Enter'); await expect(page).toHaveURL(/\/clothing\/t-shirts\/$/);
      await capture(page, info, `whole-journey-${width}-js-${javaScriptEnabled}`);
    } finally { await context.close(); }
  });
}
