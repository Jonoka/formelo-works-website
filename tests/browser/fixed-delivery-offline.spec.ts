import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { startOfflineSiteServer, type OfflineSiteState } from '../helpers/offline-site-server';
import { offlineImage } from '../helpers/offline-image';
import { siteDeliveryFixture } from '../fixtures/site-delivery';
import { fixtureApprovedImage, mutateSite } from '../fixtures/cms-site';
import { fixtureBody } from '../fixtures/cms-articles';
import { sourceIdentity, pngEvidence } from '../helpers/offline-cms-server';
import type { RecordValue } from '../../shared/cms-validation';

const pages = [
  ['/manufacturing/', 'manufacturing', 'WEB-MANUFACTURING'], ['/our-factory/', 'factory', 'WEB-FACTORY'],
  ['/contact/', 'contact', 'WEB-CONTACT'], ['/blog/', 'blogIndex', 'WEB-BLOG'], ['/privacy/', 'privacy', null],
] as const;
const anchors = ['options', 'moq', 'prepare', 'sampling', 'production', 'faq'];
async function isolate(context: BrowserContext, origin: string, failImages = false) {
  const unexpected: string[] = [];
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    if (url.origin === 'https://cdn.sanity.io' && url.pathname.startsWith('/images/offline1/offline-fixture/')) return failImages ? route.abort() : route.fulfill({ contentType: 'image/png', body: offlineImage(url) });
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
const markers = (key: (typeof pages)[number][1], revision: string) => ({
  manufacturing: [`OFFLINE manufacturing productionSteps 1 ${revision}`, `OFFLINE manufacturing FAQ 1 ${revision}`, `OFFLINE preparation note ${revision}`],
  factory: [`OFFLINE factory overview ${revision}`, `OFFLINE factory qualityDiscussion 1 ${revision}`],
  contact: [`OFFLINE contact preparation 1 ${revision}`, `OFFLINE contact preparation note ${revision}`],
  blogIndex: [`OFFLINE Journal column note ${revision}`], privacy: [`OFFLINE policy paragraph ${revision}`],
})[key]!;

test.describe('DEV-05F five isolated actual fixed-page templates', () => {
  test.describe.configure({ mode: 'serial' });
  let server: Awaited<ReturnType<typeof startOfflineSiteServer>>;
  test.beforeAll(async () => { test.setTimeout(60000); server = await startOfflineSiteServer('published', 'published'); });
  test.afterAll(async () => { if (server) await server.stop(); });

  for (const width of [320, 360, 390, 768, 1024, 1440]) test(`five complete CMS bodies reflow with independent metadata at ${width}px`, async ({ browser }) => {
    test.setTimeout(60000); server.setState();
    const context = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 } });
    const unexpected = await isolate(context, server.origin), page = await context.newPage();
    const output = resolve('review/fixed-delivery', `offline-${width}-${randomUUID().slice(0, 8)}`); mkdirSync(output, { recursive: true });
    const screenshots = [], titles = new Set<string>(), descriptions = new Set<string>(), errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      for (const [path, key, reference] of pages) {
        const response = await page.goto(server.origin + path); expect(response?.status()).toBe(200); expect(response?.headers()['cache-control']).toContain('no-store');
        await expect(page.locator('[data-page-source]')).toHaveAttribute('data-page-source', 'sanity');
        await expect(page.locator('[data-page-status]')).toHaveAttribute('data-page-status', 'cms_published');
        await expect(page.locator('[data-page-revision]')).toHaveAttribute('data-page-revision', `offline-${key}-one`);
        await expect(page.locator('.preview-notice')).toContainText('OFFLINE SYNTHETIC RESPONSE');
        await expect(page.locator('.site-header > .wordmark')).toHaveText('OFFLINE STUDIO one');
        await expect(page.locator('h1')).toHaveCount(1); await expect(page.locator('h1')).toHaveText(`OFFLINE ${key} title one`);
        for (const text of markers(key, 'one')) await expect(page.locator('main')).toContainText(text);
        const title = await page.title(), description = (await page.locator('meta[name="description"]').getAttribute('content'))!;
        expect(title).toContain('OFFLINE STUDIO one'); expect(titles.has(title)).toBe(false); expect(descriptions.has(description)).toBe(false); titles.add(title); descriptions.add(description);
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
        await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
        if (reference) for (const group of await page.locator('.pending-contact').all()) await expect(group).toHaveAttribute('data-reference-code', reference);
        if (key === 'manufacturing') {
          for (const anchor of anchors) await expect(page.locator(`#${anchor}`)).toHaveCount(1);
          await expect(page.locator('.process-grid li')).toHaveCount(4);
          await expect(page.locator('.moq-details')).toHaveAttribute('data-moq-mode', 'projectBased');
          await expect(page.locator('.moq-details')).toContainText('no fixed minimum quantity');
        }
        if (key === 'factory') {
          await expect(page.locator('[data-factory-media-status="awaiting_factory"]')).toHaveCount(1);
          await expect(page.locator('[data-factory-gallery], [data-factory-credentials], main img')).toHaveCount(0);
        }
        if (key === 'contact') await expect(page.locator('[data-contact-field="email"]')).toHaveAttribute('data-contact-state', 'withheld_by_website_stage');
        if (key === 'blogIndex') {
          await expect(page.locator('[data-article-card]')).toHaveCount(2);
          await expect(page.locator('[data-article-card][data-article-source="sanity"]')).toHaveCount(2);
        }
        if (key === 'privacy') {
          await expect(page.locator('[data-policy-status]')).toHaveAttribute('data-policy-status', 'draft_not_in_effect');
          await expect(page.locator('.mobile-contact-bar, .footer-contact-row, .pending-contact, [data-reference-code]')).toHaveCount(0);
          await expect(page.locator('.draft-status')).toContainText('not in effect');
        }
        await noActiveContact(page); await noOverflow(page); if (width < 768 && reference) await footerClear(page);
        for (const image of await page.locator('img').all()) {
          await image.scrollIntoViewIfNeeded(); await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
        }
        await page.evaluate(() => scrollTo(0, 0));
        if ([1440, 390].includes(width)) {
          const file = join(output, `${key}-${width}.png`); await page.screenshot({ path: file, fullPage: true, animations: 'disabled' }); screenshots.push(pngEvidence(file));
        }
        expect(await response!.text()).not.toContain(server.token);
      }
      expect(errors).toEqual([]); expect(unexpected).toEqual([]); expect(server.calls().every(call => call.allowed)).toBe(true);
      writeFileSync(join(output, 'evidence.json'), JSON.stringify({ ...sourceIdentity(), source: 'OFFLINE SYNTHETIC RESPONSE; NOT REAL SANITY CONTENT', scope: 'DEV-05F five fixed routes', capturedAt: new Date().toISOString(), viewport: width, actualCloudRequests: 0, screenshots, browserVersion: browser.version() }, null, 2));
    } finally { await context.close(); }
  });

  test('changing below-title CMS fields updates all five pages without restarting dev', async ({ browser }) => {
    const context = await browser.newContext(); await isolate(context, server.origin); const page = await context.newPage();
    try {
      for (const revision of ['one', 'two']) {
        server.setState({ bundle: siteDeliveryFixture(revision) });
        for (const [path, key] of pages) {
          await page.goto(server.origin + path);
          for (const text of markers(key, revision)) await expect(page.locator('main')).toContainText(text);
          if (revision === 'two') for (const old of markers(key, 'one')) await expect(page.locator('main')).not.toContainText(old);
        }
      }
    } finally { server.setState(); await context.close(); }
  });

  test('401, 403, timeout and required-content errors return five unavailable pages, never stale bodies', async ({ browser }) => {
    test.setTimeout(150000);
    const context = await browser.newContext(); await isolate(context, server.origin); const page = await context.newPage();
    const failures: [OfflineSiteState, string][] = [[{ status: 401 }, 'CMS_UNAUTHENTICATED'], [{ status: 403 }, 'CMS_FORBIDDEN'], [{ delayMs: 10000 }, 'CMS_TIMEOUT'], [{ resultPatch: { path: ['pages', 1, 'templateContent'], value: null } }, 'CMS_INVALID']];
    try {
      for (const [path] of pages) await page.goto(server.origin + path);
      for (const [state, code] of failures) {
        server.setState(state);
        for (const [path, key] of pages) {
          const response = await page.goto(server.origin + path); expect(response?.status()).toBe(503);
          await expect(page.locator('[data-site-delivery-error]')).toHaveAttribute('data-site-delivery-error', code);
          await expect(page.locator('.information-page, .journal-page, .legal-page')).toHaveCount(0);
          const html = await response!.text(); expect(html).not.toContain(server.token); expect(html).not.toContain('OFFLINE STUDIO');
          for (const text of markers(key, 'one')) expect(html).not.toContain(text);
        }
      }
    } finally { server.setState(); await context.close(); }
  });

  for (const javaScriptEnabled of [true, false]) test(`native keyboard, reduced motion, anchors and sticky reserve with JS ${javaScriptEnabled}`, async ({ browser }) => {
    test.setTimeout(60000); server.setState();
    const context = await browser.newContext({ javaScriptEnabled, reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
    await isolate(context, server.origin); const page = await context.newPage();
    try {
      for (const [path, key, reference] of pages) {
        await page.goto(server.origin + path); await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
        await page.keyboard.press('Enter'); await expect(page.locator('main')).toBeFocused();
        const menu = page.locator('.mobile-nav > summary'); await menu.focus(); await page.keyboard.press('Enter');
        await expect(page.locator('.mobile-contact-bar')).toBeHidden();
        await menu.focus(); await page.keyboard.press('Enter');
        if (key === 'manufacturing') {
          for (const anchor of anchors) {
            await page.locator(`.guide-contents a[href="#${anchor}"]`).focus(); await page.keyboard.press('Enter');
            await expect(page.locator(`#${anchor} h2`)).toBeInViewport();
            const heading = await page.locator(`#${anchor} h2`).boundingBox(), bar = await page.locator('.mobile-contact-bar').boundingBox();
            expect(heading!.y).toBeGreaterThanOrEqual(0); expect(heading!.y + heading!.height).toBeLessThanOrEqual(bar?.y ?? 844);
          }
          await page.locator('.faq-item summary').first().focus(); await page.keyboard.press('Enter'); await expect(page.locator('.faq-item').first()).toHaveAttribute('open', '');
        }
        if (reference) {
          expect(await page.locator('.button').first().evaluate(node => getComputedStyle(node).transitionDuration)).toBe('0s');
          await footerClear(page);
        }
        await noActiveContact(page); await noOverflow(page);
      }
    } finally { await context.close(); }
  });

  test('cross-page links, shared Journal articles, quantity table and 404 keep their contracts', async ({ browser }) => {
    server.setState(); const context = await browser.newContext({ viewport: { width: 390, height: 844 } }); await isolate(context, server.origin); const page = await context.newPage();
    try {
      for (const [path] of pages) {
        await page.goto(server.origin + path);
        for (const href of await page.locator('main a[href^="/"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')!))) {
          const target = new URL(href, server.origin); const response = await context.request.get(target.href); expect(response.status()).toBe(200);
          if (target.hash) expect(await response.text()).toContain(`id="${target.hash.slice(1)}"`);
        }
      }
      await page.goto(server.origin + '/blog/'); const cardTitles = await page.locator('[data-article-card] h2, [data-article-card] h3').allTextContents();
      await page.locator('[data-article-card]').first().getByRole('link').first().click();
      await expect(page.locator('h1')).toHaveCount(1); await expect(page.locator('h1')).toContainText(cardTitles[0]!.replace('↗', '').trim());
      await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Journal', exact: true }).click(); await expect(page).toHaveURL(server.origin + '/blog/');
      await page.goto(server.origin + '/blog/moq-per-style-per-color/'); await expect(page.locator('.editorial-table--quantity')).toHaveAttribute('tabindex', '0'); await expect(page.locator('main')).toContainText('180 pieces total');
      await noOverflow(page);
      const missing = await page.goto(server.origin + '/privacy/missing/'); expect(missing?.status()).toBe(404);
      await expect(page.locator('.mobile-contact-bar, .footer-contact-row, [data-reference-code]')).toHaveCount(0);
    } finally { await context.close(); }
  });

  for (const javaScriptEnabled of [true, false]) test(`optional approved factory images preserve alt/layout when requests fail with JS ${javaScriptEnabled}`, async ({ browser }) => {
    const fixture = siteDeliveryFixture();
    mutateSite(fixture, ['pages', 2, 'heroImage'], fixtureApprovedImage('f'));
    mutateSite(fixture, ['pages', 2, 'templateContent', 'gallery'], [fixtureApprovedImage('g')]);
    mutateSite(fixture, ['pages', 2, 'templateContent', 'credentials'], [{ title: 'OFFLINE credential note', description: 'Synthetic supporting text, not a real certificate.' }]); server.setState({ bundle: fixture });
    const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 390, height: 844 } }); await isolate(context, server.origin, true); const page = await context.newPage();
    try {
      await page.goto(server.origin + '/our-factory/'); await expect(page.locator('main img')).toHaveCount(2);
      await expect(page.locator('[data-factory-media-status="awaiting_factory"]')).toHaveCount(0);
      await expect(page.locator('[data-factory-credentials]')).toContainText('Synthetic supporting text');
      for (const image of await page.locator('main img').all()) { await expect(image).toHaveAttribute('alt', /OFFLINE/); await image.scrollIntoViewIfNeeded(); }
      if (javaScriptEnabled) for (const error of await page.locator('main [data-image-error]').all()) await expect(error).toBeVisible();
      expect((await page.locator('.information-hero .media-frame').boundingBox())?.height).toBeGreaterThan(200);
      await noOverflow(page); await footerClear(page); await noActiveContact(page);
    } finally { server.setState(); await context.close(); }
  });

  for (const width of [320, 1440]) test(`long CMS titles, rows, policy table and 200-percent CSS text at ${width}px`, async ({ browser }) => {
    test.setTimeout(60000); const fixture = siteDeliveryFixture();
    const rawPages = fixture['pages'] as RecordValue[];
    for (const page of rawPages.filter(page => page['pageKey'] !== 'home')) { page['title'] = 'A detailed conversation about an independent collection, project requirements and supporting information'; page['intro'] = 'LongUnbrokenReference'.repeat(12); }
    mutateSite(fixture, ['pages', 1, 'templateContent', 'preparation', 0, 'description'], 'PreparationReference'.repeat(24));
    mutateSite(fixture, ['pages', 2, 'templateContent', 'overview'], 'ManufacturingArrangementsReference'.repeat(20));
    mutateSite(fixture, ['pages', 3, 'templateContent', 'preparation', 0, 'title'], 'LongPreparationTitle'.repeat(18));
    mutateSite(fixture, ['pages', 4, 'templateContent', 'columnNote'], 'JournalColumnReference'.repeat(24));
    const body = (rawPages[5]!['templateContent'] as RecordValue)['body'] as RecordValue[];
    body.push(...fixtureBody([{ type: 'table', caption: 'OFFLINE policy drafting questions, not a retention policy', columns: ['Question', 'Owner', 'Pending review', 'Current state', 'Next action'], rows: [['Information handling scope', 'Not established', 'Authorization required', 'Not in effect', 'Review before activation']] }]).map(item => ({ ...item, _key: `policy-table-${String(item['_key'])}` })));
    server.setState({ bundle: fixture });
    const context = await browser.newContext({ viewport: { width, height: 900 } }); await isolate(context, server.origin); const page = await context.newPage();
    try {
      for (const [path, key, reference] of pages) {
        await page.goto(server.origin + path); await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
        await noOverflow(page); if (width < 768 && reference) await footerClear(page);
        if (key === 'privacy') {
          await expect(page.locator('table')).toHaveCount(2);
          for (const table of await page.locator('.editorial-table').all()) await expect(table).toHaveAttribute('tabindex', '0');
          await expect(page.getByRole('region', { name: 'OFFLINE policy drafting questions, not a retention policy' })).toBeVisible();
        }
      }
    } finally { server.setState(); await context.close(); }
  });

  test('a recorded synthetic legal review neither activates the policy nor exposes a marketing/contact action', async ({ browser }) => {
    const fixture = siteDeliveryFixture(); mutateSite(fixture, ['pages', 5, 'templateContent', 'legalReviewStatus'], 'reviewed'); mutateSite(fixture, ['pages', 5, 'templateContent', 'legalReviewedAt'], '2026-09-17'); server.setState({ bundle: fixture });
    const context = await browser.newContext(); await isolate(context, server.origin); const page = await context.newPage();
    try {
      await page.goto(server.origin + '/privacy/'); await expect(page.locator('[data-legal-review-status]')).toHaveAttribute('data-legal-review-status', 'reviewed');
      await expect(page.locator('.draft-status')).toContainText('not in effect'); await expect(page.locator('main')).toContainText('does not activate the policy');
      await expect(page.locator('.pending-contact, .mobile-contact-bar, .footer-contact-row, [data-reference-code]')).toHaveCount(0); await noActiveContact(page);
    } finally { server.setState(); await context.close(); }
  });
});
