import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { startOfflineSiteServer, type OfflineSiteState } from '../helpers/offline-site-server';
import { offlineImage } from '../helpers/offline-image';
import { siteDeliveryFixture } from '../fixtures/site-delivery';
import { fixtureApprovedImage, mutateSite } from '../fixtures/cms-site';
import { sourceIdentity, pngEvidence } from '../helpers/offline-cms-server';
import type { RecordValue } from '../../shared/cms-validation';

const pages = [['/', 'home'], ['/clothing/t-shirts/', 't-shirts'], ['/clothing/hoodies/', 'hoodies']] as const;
async function isolate(context: BrowserContext, origin: string, failImages = false) {
  const unexpected: string[] = [];
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    if (url.origin === 'https://cdn.sanity.io' && url.pathname.startsWith('/images/offline1/offline-fixture/')) {
      return failImages ? route.abort() : route.fulfill({ contentType: 'image/png', body: offlineImage(url) });
    }
    unexpected.push(url.origin); return route.abort();
  });
  return unexpected;
}
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true); }
async function footerClear(page: Page) {
  await expect.poll(async () => {
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    const footer = await page.locator('.footer-bottom').boundingBox(), bar = await page.locator('.mobile-contact-bar').boundingBox();
    return !!footer && !!bar && footer.y + footer.height <= bar.y + 1;
  }).toBe(true);
}
async function noActiveContact(page: Page) {
  await expect(page.locator('a[href^="mailto:"], a[href*="wa.me"], form, input, textarea, iframe')).toHaveCount(0);
  for (const button of await page.locator('.contact-actions button').all()) await expect(button).toBeDisabled();
  expect(await page.content()).not.toMatch(/factory@example.invalid|8613800138000|Email copied|Message sent/);
}

test.describe('DEV-05E isolated actual site templates', () => {
  test.describe.configure({ mode: 'serial' });
  let server: Awaited<ReturnType<typeof startOfflineSiteServer>>;
  test.beforeAll(async () => { test.setTimeout(60000); server = await startOfflineSiteServer(); });
  test.afterAll(async () => { if (server) await server.stop(); });

  for (const width of [320, 360, 390, 768, 1024, 1440]) test(`three routes, full modules, image geometry and isolated captures at ${width}`, async ({ browser }) => {
    server.setState();
    const context = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 } });
    const unexpected = await isolate(context, server.origin), page = await context.newPage();
    const output = resolve('review/site-delivery', `offline-${width}-${randomUUID().slice(0, 8)}`); mkdirSync(output, { recursive: true });
    const screenshots = [], errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    try {
      for (const [path, name] of pages) {
        const response = await page.goto(server.origin + path); expect(response?.status()).toBe(200);
        expect(response?.headers()['cache-control']).toContain('no-store');
        await expect(page.locator('[data-page-source]')).toHaveAttribute('data-page-source', 'sanity');
        await expect(page.locator('[data-page-status]')).toHaveAttribute('data-page-status', 'cms_published');
        await expect(page.locator('.preview-notice')).toContainText('OFFLINE SYNTHETIC RESPONSE');
        await expect(page.locator('.site-header > .wordmark')).toHaveText('OFFLINE STUDIO one');
        await expect(page.locator('h1')).toHaveCount(1); await noActiveContact(page); await noOverflow(page);
        if (name === 'home') {
          await expect(page.locator('.capability')).toHaveCount(4);
          await expect(page.locator('.factory-summary')).toContainText('OFFLINE factory summary');
          await expect(page.locator('.process-grid li')).toHaveCount(4);
          await expect(page.locator('#enquiry-guide .faq-item')).toHaveCount(3);
          await expect(page.locator('.category-card')).toHaveCount(2);
          await expect(page.locator('.category-card').first()).toHaveAttribute('data-category-card', 'hoodies');
          await expect(page.locator('#journal [data-article-card]')).toHaveCount(2);
          await expect(page.locator('[data-factory-image="not-supplied"]')).toBeVisible();
          await expect(page.locator('h1')).not.toContainText('obsolete');
        } else {
          await expect(page.locator('.sample-card')).toHaveCount(3);
          await expect(page.locator('.sample-card').first().locator('.sample-images img')).toHaveCount(2);
          await expect(page.locator('.sample-card').first().locator('.sample-specifications')).toContainText('245 GSM');
          await expect(page.locator('.sample-card').nth(1).locator('.sample-specifications')).toHaveCount(0);
          await expect(page.locator('.capability-limit')).toContainText('capability limitation');
          await expect(page.locator('.evidence-grid img')).toHaveCount(1);
          await expect(page.locator('.concept-observations')).toHaveCount(0);
          await expect(page.locator('.moq-details')).toHaveAttribute('data-moq-mode', name === 'hoodies' ? 'confirmedQuantity' : 'projectBased');
          await expect(page.locator('.moq-details')).toContainText(name === 'hoodies' ? '120 pieces' : 'no fixed minimum');
          const hero = page.locator('.category-hero img');
          await expect(hero).toHaveAttribute('width', '840'); await expect(hero).toHaveAttribute('height', '640');
          expect(new URL((await hero.getAttribute('src'))!).searchParams.get('rect')).toBe('120,40,840,640');
          expect(await hero.evaluate(node => getComputedStyle(node).objectPosition)).toMatch(/^71\.428/);
          await expect(page.locator('.pending-contact').first()).toHaveAttribute('data-reference-code', name === 'hoodies' ? 'WEB-HOODIES' : 'WEB-TSHIRTS');
          await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).locator('li')).toHaveCount(2);
          await expect(page.locator('.related-category-link')).toHaveAttribute('href', name === 'hoodies' ? '/clothing/t-shirts/' : '/clothing/hoodies/');
        }
        for (const image of await page.locator('img').all()) {
          await image.scrollIntoViewIfNeeded();
          await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
          expect(await image.evaluate((node: HTMLImageElement) => Math.abs(node.naturalWidth / node.naturalHeight - Number(node.getAttribute('width')) / Number(node.getAttribute('height'))))).toBeLessThan(.02);
        }
        if (width < 768) await footerClear(page);
        await page.evaluate(() => scrollTo(0, 0));
        if ([1440, 390].includes(width)) {
          for (const fullPage of [true, false]) {
            const file = join(output, `${name}-${width}${fullPage ? '' : '-viewport'}.png`);
            await page.screenshot({ path: file, fullPage, animations: 'disabled' }); screenshots.push(pngEvidence(file));
          }
        }
        expect(await response!.text()).not.toContain(server.token);
      }
      expect(errors).toEqual([]); expect(unexpected).toEqual([]); expect(server.calls().every(call => call.allowed)).toBe(true);
      writeFileSync(join(output, 'evidence.json'), JSON.stringify({ ...sourceIdentity(), source: 'OFFLINE SYNTHETIC RESPONSE; NOT REAL SANITY CONTENT', scope: 'DEV-05E actual home/category routes', capturedAt: new Date().toISOString(), viewport: width, actualCloudRequests: 0, screenshots, browserVersion: browser.version() }, null, 2));
    } finally { await context.close(); }
  });

  test('CMS input name, summary, image and revision update in home cards and details without restarting dev', async ({ browser }) => {
    const context = await browser.newContext(); await isolate(context, server.origin); const page = await context.newPage();
    try {
      const seen: string[] = [];
      for (const revision of ['one', 'two']) {
        server.setState({ bundle: siteDeliveryFixture(revision) });
        for (const slug of ['t-shirts', 'hoodies']) {
          await page.goto(server.origin); const card = page.locator(`[data-category-card="${slug}"]`);
          const name = await card.locator('h3').innerText(), summary = await card.locator('.category-card-summary').innerText();
          const image = await card.locator('img').getAttribute('src'), alt = await card.locator('img').getAttribute('alt');
          await expect(card).toHaveAttribute('data-category-revision', `offline-category-${slug}-${revision}`);
          await card.locator('h3 a').click(); await expect(page.locator('.category-hero .intro')).toHaveText(summary);
          await expect(page.locator('nav[aria-label="Breadcrumb"] [aria-current="page"]')).toHaveText(name.replace(/\s*↗$/, ''));
          await expect(page.locator('.category-hero img')).toHaveAttribute('src', image!); await expect(page.locator('.category-hero img')).toHaveAttribute('alt', alt!);
          await expect(page.locator('.category-page')).toHaveAttribute('data-page-revision', `offline-category-${slug}-${revision}`);
          seen.push(JSON.stringify([name, summary, image]));
        }
      }
      expect(seen[0]).not.toBe(seen[2]); expect(seen[1]).not.toBe(seen[3]);
    } finally { server.setState(); await context.close(); }
  });

  test('401, 403, timeout and invalid content produce sanitized unavailable pages with no stale data', async ({ browser }) => {
    test.setTimeout(120000);
    const context = await browser.newContext(); await isolate(context, server.origin); const page = await context.newPage();
    try {
      await page.goto(server.origin);
      const failures: [OfflineSiteState, string][] = [
        [{ status: 401 }, 'CMS_UNAUTHENTICATED'], [{ status: 403 }, 'CMS_FORBIDDEN'],
        [{ delayMs: 10000 }, 'CMS_TIMEOUT'],
        [{ resultPatch: { path: ['pages'], value: [] } }, 'CMS_INVALID'],
      ];
      for (const [state, code] of failures) {
        server.setState(state);
        for (const [path] of pages) {
          const response = await page.goto(server.origin + path); expect(response?.status()).toBe(503);
          await expect(page.locator('[data-site-delivery-error]')).toHaveAttribute('data-site-delivery-error', code);
          await expect(page.locator('.home-page, .category-page, .category-card, .sample-card')).toHaveCount(0);
          const html = await response!.text(); expect(html).not.toContain(server.token); expect(html).not.toContain('OFFLINE STUDIO');
        }
      }
    } finally { server.setState(); await context.close(); }
  });

  test('other seven content URLs, article table and 404 retain shared brand and disabled channel state', async ({ browser }) => {
    server.setState(); const context = await browser.newContext({ viewport: { width: 390, height: 844 } }); await isolate(context, server.origin);
    const page = await context.newPage();
    try {
      for (const path of ['/manufacturing/', '/our-factory/', '/contact/', '/privacy/', '/blog/', '/blog/what-to-send-for-a-clothing-quote/', '/blog/moq-per-style-per-color/']) {
        const response = await page.goto(server.origin + path); expect(response?.status()).toBe(200);
        await expect(page.locator('.site-header > .wordmark')).toHaveText('OFFLINE STUDIO one'); expect(await page.title()).toContain('OFFLINE STUDIO one');
        await noActiveContact(page); await noOverflow(page);
        if (path === '/privacy/') { await expect(page.locator('.mobile-contact-bar, .footer-contact-row')).toHaveCount(0); await expect(page.locator('main')).toContainText('not in effect'); }
        if (path === '/contact/') await expect(page.locator('[data-contact-field="email"]')).toHaveAttribute('data-contact-state', 'withheld_by_website_stage');
        if (path === '/blog/moq-per-style-per-color/') { await expect(page.locator('.editorial-table--quantity')).toHaveAttribute('tabindex', '0'); await expect(page.locator('main')).toContainText('180 pieces total'); }
      }
      const missing = await page.goto(server.origin + '/clothing/missing/'); expect(missing?.status()).toBe(404);
      await expect(page.locator('.mobile-contact-bar, .footer-contact-row')).toHaveCount(0);
    } finally { await context.close(); }
  });

  for (const javaScriptEnabled of [true, false]) test(`keyboard, FAQ, broken images and bottom-bar reserve with JavaScript ${javaScriptEnabled}`, async ({ browser }) => {
    server.setState(); const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 390, height: 844 } });
    await isolate(context, server.origin, true); const page = await context.newPage();
    try {
      await page.goto(server.origin); await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
      await page.keyboard.press('Enter'); await expect(page.locator('main')).toBeFocused();
      const trigger = page.locator('.mobile-nav > summary'); await trigger.focus(); await page.keyboard.press('Enter');
      await expect(page.locator('.mobile-contact-bar')).toBeHidden();
      if (javaScriptEnabled) { await page.keyboard.press('Escape'); await expect(trigger).toBeFocused(); await page.keyboard.press('Enter'); }
      await page.keyboard.press('Tab'); await page.keyboard.press('Enter'); await expect(page).toHaveURL(/\/clothing\/hoodies\/$/);
      const faq = page.locator('.faq-item').first(); await faq.locator('summary').focus(); await page.keyboard.press('Enter'); await expect(faq).toHaveAttribute('open', '');
      await expect(page.locator('.category-hero img')).toHaveAttribute('alt', /OFFLINE/);
      expect((await page.locator('.category-hero .media-frame').boundingBox())?.height).toBeGreaterThan(200);
      if (javaScriptEnabled) await expect(page.locator('.category-hero [data-image-error]')).toBeVisible();
      await noOverflow(page); await footerClear(page); await noActiveContact(page);
    } finally { await context.close(); }
  });

  for (const width of [320, 1440]) test(`long CMS title/sample name, multi-image records and 200-percent text at ${width}`, async ({ browser }) => {
    const fixture = siteDeliveryFixture();
    mutateSite(fixture, ['pages', 0, 'title'], 'A detailed clothing development conversation for an independent collection with many considerations');
    mutateSite(fixture, ['categories', 0, 'title'], 'A detailed manufacturing conversation for an independent clothing collection with many requirements');
    mutateSite(fixture, ['categories', 0, 'samples', 0, 'name'], 'LongUnbrokenSampleReference'.repeat(10));
    mutateSite(fixture, ['categories', 0, 'samples', 0, 'images'], [fixtureApprovedImage('d'), fixtureApprovedImage('e'), fixtureApprovedImage('f')]);
    server.setState({ bundle: fixture });
    const context = await browser.newContext({ viewport: { width, height: 900 } }); await isolate(context, server.origin); const page = await context.newPage();
    try {
      for (const [path] of pages) {
        await page.goto(server.origin + path); await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
        await noOverflow(page); if (width < 768) await footerClear(page);
        for (const button of await page.locator('.contact-actions button:visible').all()) expect((await button.boundingBox())?.height).toBeGreaterThanOrEqual(48);
      }
    } finally { server.setState(); await context.close(); }
  });

  test('an optional approved factory image renders, while missing sample specifications do not get fake defaults', async ({ browser }) => {
    const fixture = siteDeliveryFixture(); mutateSite(fixture, ['pages', 0, 'templateContent', 'factoryImage'], fixtureApprovedImage('m')); server.setState({ bundle: fixture });
    const context = await browser.newContext(); await isolate(context, server.origin); const page = await context.newPage();
    try {
      await page.goto(server.origin); await expect(page.locator('#factory [data-public-use-approved] img')).toHaveCount(1);
      await expect(page.locator('[data-factory-image="not-supplied"]')).toHaveCount(0);
      await page.goto(server.origin + '/clothing/t-shirts/'); await expect(page.locator('.sample-card').nth(1).locator('dl')).toHaveCount(0);
    } finally { server.setState(); await context.close(); }
  });
});

test('declared CMS pages plus local articles works only without incompatible published article references', async ({ browser }) => {
  test.setTimeout(90000); const server = await startOfflineSiteServer('mock');
  const context = await browser.newContext(); await isolate(context, server.origin); const page = await context.newPage();
  try {
    await page.goto(server.origin); await expect(page.locator('#journal')).toHaveAttribute('data-article-mode', 'mock');
    await expect(page.locator('#journal [data-article-source="local"]')).toHaveCount(2);
    await page.goto(server.origin + '/clothing/t-shirts/'); await expect(page.locator('#category-articles-heading')).toHaveCount(0);
    server.setState({ bundle: siteDeliveryFixture('one', true) });
    const response = await page.reload(); expect(response?.status()).toBe(503);
    await expect(page.locator('[data-site-delivery-error]')).toHaveAttribute('data-site-delivery-error', 'SITE_RELATED_ARTICLE_SOURCE');
    await expect(page.locator('.category-page')).toHaveCount(0);
  } finally { await context.close(); await server.stop(); }
});
