import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { previews } from '../fixtures/cms-articles';
import { newEvidenceDirectory, pngEvidence, sourceIdentity } from '../helpers/offline-cms-server';

for (const width of [1440, 390]) test(`mock article delivery agrees across home, Journal and detail at ${width}`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  const output = newEvidenceDirectory(`mock-${info.project.name}-${width}`), images = [];
  for (const [path, name] of [['/', 'home-journal'], ['/blog/', 'journal']] as const) {
    const response = await page.goto(path); expect(response?.status()).toBe(200);
    for (const article of previews) {
      const card = page.locator(`[data-article-card="${article.slug}"]`);
      await expect(card.locator('h2 a, h3 a')).toHaveText(article.title);
      await expect(card.locator('.card-excerpt')).toHaveText(article.excerpt);
      await expect(card.locator('h2 a, h3 a')).toHaveAttribute('href', `/blog/${article.slug}/`);
      await expect(card).toHaveAttribute('data-preview-status', 'editorial_draft');
      await expect(card).toHaveAttribute('data-article-source', 'local');
      await expect(card).toHaveAttribute('data-article-reference', article.referenceCode);
      await expect(card).toHaveAttribute('data-cover-state', 'local_concept');
      await expect(card.locator('img')).toHaveCount(1);
      await card.locator('img').scrollIntoViewIfNeeded();
      await expect(card.locator('img')).toHaveJSProperty('complete', true);
    }
    const file = join(output, `${name}-${width}.png`);
    if (path === '/') await page.locator('#journal').screenshot({ path: file }); else await page.screenshot({ path: file, fullPage: true });
    images.push(pngEvidence(file));
  }
  const quote = previews[0]!;
  await page.locator(`[data-article-card="${quote.slug}"] h2 a`).click();
  await expect(page.locator('h1')).toHaveText(quote.title);
  await expect(page.locator('.article-header .intro')).toHaveText(quote.excerpt);
  await expect(page.locator('.article-page')).toHaveAttribute('data-article-source', 'local');
  await expect(page.locator('.article-page')).toHaveAttribute('data-preview-status', 'editorial_draft');
  await expect(page.locator('.article-page')).toHaveAttribute('data-cover-state', 'local_concept');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', quote.seo.seoDescription);
  expect(await page.title()).toContain(quote.seo.seoTitle);
  await expect(page.locator('nav[aria-label="Breadcrumb"] li')).toHaveCount(3);
  const quoteFile = join(output, `quote-${width}.png`); await page.screenshot({ path: quoteFile, fullPage: true }); images.push(pngEvidence(quoteFile));
  await page.locator('.article-return a').click(); await expect(page).toHaveURL(/\/blog\/$/);
  writeFileSync(join(output, 'evidence.json'), JSON.stringify({ ...sourceIdentity(), capturedAt: new Date().toISOString(), mode: 'mock', project: info.project.name, viewport: width,
    source: 'local editorial records; not CMS', consistency: 'title/excerpt/slug/reference/status/cover and independent detail SEO checked', screenshots: images }, null, 2));
});

for (const javaScriptEnabled of [true, false]) test(`mock home to Journal to quote to list works with JS=${javaScriptEnabled}`, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}/`); await page.locator('#journal a[href="/blog/"]').click();
    await page.locator('[data-article-card="what-to-send-for-a-clothing-quote"] h2 a').click();
    await expect(page.locator('.editorial-template')).toHaveCount(1);
    await page.locator('.article-return a').click(); await expect(page).toHaveURL(/\/blog\/$/);
    await expect(page.locator('[data-article-card]')).toHaveCount(2);
    await expect(page.locator('a[href^="mailto:"], a[href*="wa.me"], form, input, textarea, iframe')).toHaveCount(0);
  } finally { await context.close(); }
});
