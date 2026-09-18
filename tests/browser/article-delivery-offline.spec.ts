import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dev05bDraftScope } from '../../shared/cms-draft-preview';
import { previews } from '../fixtures/cms-articles';
import { draftDeliveryFixture } from '../fixtures/cms-delivery';
import { newEvidenceDirectory, pngEvidence, sourceIdentity, startOfflineCmsServer, publishedDeliveryFixtures } from '../helpers/offline-cms-server';

const quotePath = `/blog/${dev05bDraftScope.slug}/`;
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
async function isolateBrowser(context: BrowserContext, origin: string, allowFixtureCover: boolean) {
  const unexpected: string[] = [];
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    if (allowFixtureCover && url.origin === 'https://cdn.sanity.io' && url.pathname.startsWith('/images/offline1/offline-fixture/')) return route.fulfill({ contentType: 'image/png', body: pixel });
    unexpected.push(url.origin); return route.abort();
  });
  return unexpected;
}
async function checkRecord(page: Page, source: string, title: string, excerpt: string, revision: string, cover: string, status: string) {
  const record = page.locator(source);
  await expect(record).toHaveAttribute('data-article-source', 'sanity');
  await expect(record).toHaveAttribute('data-cms-revision', revision);
  await expect(record).toHaveAttribute('data-cover-state', cover);
  await expect(record).toHaveAttribute('data-preview-status', status);
  if (source === '.article-page') {
    await expect(page.locator('h1')).toHaveText(title); await expect(page.locator('.article-header .intro')).toHaveText(excerpt);
  } else {
    await expect(record.locator('h2 a, h3 a')).toHaveText(title); await expect(record.locator('.card-excerpt')).toHaveText(excerpt);
    await expect(record.locator('h2 a, h3 a')).toHaveAttribute('href', quotePath);
  }
}

for (const mode of ['draft-preview', 'published'] as const) test.describe(`isolated ${mode} delivery`, () => {
  test.describe.configure({ mode: 'serial' });
  let server: Awaited<ReturnType<typeof startOfflineCmsServer>>;
  const docs = (revision = 'one') => mode === 'draft-preview' ? [draftDeliveryFixture(revision)] : publishedDeliveryFixtures(revision);
  const status = mode === 'draft-preview' ? 'cms_draft_preview' : 'cms_published';
  const cover = mode === 'draft-preview' ? 'missing' : 'approved';
  test.beforeAll(async () => { test.setTimeout(60000); server = await startOfflineCmsServer(mode); });
  test.afterAll(async () => { if (server) await server.stop(); });

  for (const width of [1440, 390]) test(`same record in all three positions and dedicated offline screenshots at ${width}`, async ({ browser }) => {
    server.setResponse(docs());
    const document = docs()[0]!;
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
    const unexpected = await isolateBrowser(context, server.origin, mode === 'published');
    const page = await context.newPage(), errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const output = newEvidenceDirectory(`offline-${mode}-${width}`), images = [];
    try {
      for (const [path, name] of [['/', 'home-journal'], ['/blog/', 'journal'], [quotePath, 'quote']] as const) {
        const response = await page.goto(`${server.origin}${path}`); expect(response?.status()).toBe(200);
        expect(response?.headers()['cache-control']).toContain('no-store');
        const selector = path === quotePath ? '.article-page' : `[data-article-card="${dev05bDraftScope.slug}"]`;
        await checkRecord(page, selector, document.title, document.excerpt, document._rev, cover, status);
        await expect(page.locator(selector)).toHaveAttribute('data-cms-perspective', mode === 'draft-preview' ? 'drafts' : 'published');
        await expect(page.locator(selector)).toHaveAttribute('data-article-reference', 'WEB-QUOTE-GUIDE');
        if (mode === 'draft-preview') {
          await expect(page.locator(`${selector} img`)).toHaveCount(0);
          await expect(page.locator(`${selector} .article-cover-empty`)).toBeVisible();
          if (path !== quotePath) {
            const localMoq = page.locator('[data-article-card="moq-per-style-per-color"]');
            await expect(localMoq).toHaveAttribute('data-article-source', 'local'); await expect(localMoq).toHaveAttribute('data-preview-status', 'editorial_draft');
          }
        } else await expect(page.locator(`${selector} [data-public-use-approved="true"] img`)).toHaveCount(1);
        await expect(page.locator('a[href^="mailto:"], a[href*="wa.me"], form, input, textarea, iframe')).toHaveCount(0);
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        if (path === quotePath) {
          await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', document.seo.seoDescription);
          expect(await page.title()).toContain(document.seo.seoTitle); await expect(page.locator('nav[aria-label="Breadcrumb"] li')).toHaveCount(3);
          await expect(page.locator('.editorial-template')).toHaveCount(1);
          if (mode === 'draft-preview') await expect(page.locator('.article-publication-details')).toHaveCount(0);
        }
        for (const image of await page.locator('img').all()) { await image.scrollIntoViewIfNeeded(); await expect(image).toHaveJSProperty('complete', true); }
        const file = join(output, `${name}-${width}.png`);
        if (path === '/') await page.locator('#journal').screenshot({ path: file }); else await page.screenshot({ path: file, fullPage: true });
        images.push(pngEvidence(file));
        expect(await response!.text()).not.toContain(server.token);
      }
      expect(errors).toEqual([]); expect(unexpected).toEqual([]);
      expect(server.calls().every(call => call.allowed)).toBe(true);
      writeFileSync(join(output, 'evidence.json'), JSON.stringify({ ...sourceIdentity(), capturedAt: new Date().toISOString(), mode, viewport: width,
        source: 'OFFLINE SYNTHETIC RESPONSE; NOT REAL SANITY CONTENT', fixtureRevision: document._rev, actualCloudRequests: 0,
        fakeCredentialLeaked: false, screenshots: images, checks: ['three-position metadata', 'cover/source distinction', 'independent SEO', 'noindex', 'disabled contacts', 'no overflow'] }, null, 2));
    } finally { await context.close(); }
  });

  test('reload changes home, Journal and detail to the next revision without restarting Astro', async ({ browser }) => {
    const context = await browser.newContext(); await isolateBrowser(context, server.origin, mode === 'published');
    const page = await context.newPage();
    try {
      for (const revision of ['first-save', 'second-save']) {
        const document = docs(revision)[0]!; server.setResponse(docs(revision));
        for (const path of ['/', '/blog/', quotePath]) {
          await page.goto(`${server.origin}${path}`);
          await checkRecord(page, path === quotePath ? '.article-page' : `[data-article-card="${dev05bDraftScope.slug}"]`, document.title, document.excerpt, document._rev, cover, status);
        }
        await page.reload(); await expect(page.locator('.article-page')).toHaveAttribute('data-cms-revision', document._rev);
      }
    } finally { await context.close(); }
  });

  test('query errors and empty content show an HTTP failure, no stale or local substitute', async ({ browser }) => {
    const context = await browser.newContext(); await isolateBrowser(context, server.origin, mode === 'published');
    const page = await context.newPage();
    try {
      for (const [httpStatus, code] of [[401, 'CMS_UNAUTHENTICATED'], [200, 'CMS_EMPTY']] as const) {
        server.setResponse([], httpStatus, httpStatus === 401 ? server.token : undefined);
        for (const path of ['/', '/blog/', quotePath]) {
          const response = await page.goto(`${server.origin}${path}`); expect(response?.status()).toBe(503);
          await expect(page.locator('[data-article-delivery-error]')).toHaveAttribute('data-article-delivery-error', code);
          await expect(page.locator('[data-article-card], .article-page')).toHaveCount(0);
          const html = await response!.text(); expect(html).not.toContain(server.token); expect(html).not.toContain(previews[0]!.title);
        }
      }
    } finally { server.setResponse(docs()); await context.close(); }
  });

  test('no-JS navigation, keyboard entry and narrow MOQ table remain usable', async ({ browser }) => {
    server.setResponse(docs());
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    await isolateBrowser(context, server.origin, mode === 'published');
    const page = await context.newPage();
    try {
      await page.goto(server.origin); await page.keyboard.press('Tab'); await expect(page.locator('.skip-link')).toBeFocused();
      await page.keyboard.press('Enter'); await expect(page.locator('#main')).toBeFocused();
      await page.locator('#journal a[href="/blog/"]').click(); await page.locator(`[data-article-card="${dev05bDraftScope.slug}"] h2 a`).click();
      await expect(page.locator('.editorial-template')).toHaveCount(1); await page.locator('.article-return a').click();
      await page.locator('[data-article-card="moq-per-style-per-color"] h2 a').click();
      const quantity = page.locator('.editorial-table--quantity');
      await expect(quantity).toHaveAttribute('tabindex', '0'); await quantity.focus(); await page.keyboard.press('ArrowRight');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await expect(page.locator('a[href^="mailto:"], a[href*="wa.me"], form')).toHaveCount(0);
      await expect.poll(async () => {
        await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
        const footer = await page.locator('.footer-bottom').boundingBox(), bar = await page.locator('.mobile-contact-bar').boundingBox();
        return !!footer && !!bar && footer.y + footer.height <= bar.y + 1;
      }).toBe(true);
      await page.locator('.article-return a').click(); await expect(page).toHaveURL(/\/blog\/$/);
    } finally { await context.close(); }
  });
});
