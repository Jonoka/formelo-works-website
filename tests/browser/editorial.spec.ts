import { test, expect, type Page, type TestInfo } from '@playwright/test';
import sourcePolicy from '../../config/editorial-sources.json' with { type: 'json' };
import { pageContexts } from '../../config/page-context';
const pages = [
  { name: 'journal', path: '/blog/', title: 'Journal', groups: 3, reference: pageContexts.blog.referenceCode, kind: 'journal' },
  { name: 'quote', path: '/blog/what-to-send-for-a-clothing-quote/', title: 'What to Send Before Requesting a Custom Clothing Quote', groups: 2, reference: pageContexts.quoteGuide.referenceCode, kind: 'article' },
  { name: 'moq', path: '/blog/moq-per-style-per-color/', title: 'Clothing MOQ Explained: Per Style, Per Color and Mixed Sizes', groups: 2, reference: pageContexts.moqGuide.referenceCode, kind: 'article' },
  { name: 'privacy', path: '/privacy/', title: 'Privacy notice', groups: 0, reference: null, kind: 'legal' },
] as const;
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth)); }
async function footerClear(page: Page, marketing: boolean) {
  if (!marketing) { await expect(page.locator('.mobile-contact-bar, .footer-contact-row, .pending-contact')).toHaveCount(0); return; }
  await expect.poll(async () => {
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    const f = await page.locator('.footer-bottom').boundingBox(), b = await page.locator('.mobile-contact-bar').boundingBox();
    return !!f && !!b && f.y + f.height <= b.y + 1;
  }).toBe(true);
}
async function capture(page: Page, info: TestInfo, name: string, full = true) {
  if (info.project.name !== 'preview') return;
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: full, animations: 'disabled' });
  await info.attach(name, { path, contentType: 'image/png' });
}
for (const item of pages) {
  for (const width of [320, 360, 390, 768, 1024, 1440]) test(`${item.name} static editorial layout at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    const external: string[] = [], errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', route => { if (new URL(route.request().url()).hostname !== '127.0.0.1') { external.push(route.request().url()); return route.abort(); } return route.continue(); });
    expect((await page.goto(item.path))?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText(item.title);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(page.locator('time, form, input, textarea, iframe, link[rel="canonical"], script[type="application/ld+json"], a[href^="mailto:"], a[href*="wa.me"]')).toHaveCount(0);
    await expect(page.locator('.pending-contact')).toHaveCount(item.groups);
    for (const group of await page.locator('.pending-contact').all()) {
      await expect(group).toHaveAttribute('data-reference-code', item.reference!);
      for (const button of await group.getByRole('button').all()) await expect(button).toBeDisabled();
    }
    const crumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumb.locator('li')).toHaveCount(item.kind === 'article' ? 3 : 2);
    await expect(crumb.locator('[aria-current="page"]')).toHaveText(item.kind === 'legal' ? 'Privacy' : item.title);
    if (item.kind === 'article') {
      await expect(page.locator('.article-header .draft-status')).toHaveText('Editorial draft / Not published');
      for (const nav of ['.desktop-nav', '.mobile-nav', '.footer-bottom']) {
        await expect(page.locator(`${nav} a[data-section-parent="journal"]`)).toHaveAttribute('href', '/blog/');
        await expect(page.locator(`${nav} [aria-current]`)).toHaveCount(0);
      }
      const headings = await page.locator('.editorial-prose h2[id]').evaluateAll(nodes => nodes.map(n => n.id));
      expect(await page.locator('.article-toc a').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')))).toEqual(headings.map(id => `#${id}`));
      expect(new Set(headings).size).toBe(headings.length);
      await expect(page.locator('.article-cover')).toHaveAttribute('data-cover-usage', 'registered_concept_reuse');
    }
    if (item.kind === 'legal') {
      await expect(page.locator('.draft-status')).toHaveText('Draft privacy notice — not in effect');
      await expect(page.locator('.legal-page')).toContainText('Analytics is off');
      await expect(page.locator('.legal-page')).toContainText('To be confirmed');
      await expect(page.locator('[data-reference-code], .footer-contact-row, .mobile-contact-bar')).toHaveCount(0);
    }
    if (item.kind === 'journal') {
      await expect(page.locator('[data-article-card]')).toHaveCount(2);
      await expect(page.locator('.journal-card .draft-status')).toHaveText(['Editorial draft / Not published', 'Editorial draft / Not published']);
      await expect(page.locator('.desktop-nav [aria-current="page"]')).toHaveText('Journal');
    }
    for (const img of await page.locator('img').all()) { await img.scrollIntoViewIfNeeded(); await expect.poll(() => img.evaluate((n: HTMLImageElement) => n.complete && n.naturalWidth > 0)).toBe(true); }
    await noOverflow(page);
    if (width < 768) await footerClear(page, item.groups > 0);
    await page.evaluate(() => scrollTo(0, 0));
    await capture(page, info, `${item.name}-${width}`);
    if ([390,1440].includes(width)) {
      await capture(page, info, `${item.name}-${width}-viewport`, false);
      if (item.kind === 'article' || item.kind === 'legal') {
        await page.locator('.editorial-table').first().scrollIntoViewIfNeeded();
        await capture(page, info, `${item.name}-${width}-table`, false);
        if (item.kind === 'article') { await page.locator('.editorial-template').scrollIntoViewIfNeeded(); await capture(page, info, `${item.name}-${width}-long-text`, false); }
      }
    }
    expect(errors).toEqual([]); expect(external).toEqual([]);
  });
  for (const js of [true, false]) test(`${item.name} keyboard, no-images and reduced-motion with JS ${js}`, async ({ browser, baseURL }, info) => {
    const context = await browser.newContext({ javaScriptEnabled: js, reducedMotion: 'reduce', viewport: { width: 390, height: 844 }, baseURL: baseURL! });
    try {
      const page = await context.newPage(); await page.route('**/media/**', r => r.abort()); await page.goto(item.path);
      await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
      await page.keyboard.press('Enter'); await expect(page.locator('main')).toBeFocused();
      const menu = page.locator('.mobile-nav > summary'); await menu.focus(); await page.keyboard.press('Enter');
      await expect(page.locator('.mobile-nav')).toHaveAttribute('open', '');
      if (item.groups) await expect(page.locator('.mobile-contact-bar')).toBeHidden();
      await page.keyboard.press('Tab'); await expect(page.locator('.mobile-nav a').first()).toBeFocused();
      await capture(page, info, `${item.name}-menu-js-${js}`, false);
      if (js) { await page.keyboard.press('Escape'); await expect(menu).toBeFocused(); } else { await menu.focus(); await page.keyboard.press('Enter'); }
      await expect(page.locator('.mobile-nav')).not.toHaveAttribute('open', '');
      for (const figure of await page.locator('.preview-image').all()) {
        await figure.scrollIntoViewIfNeeded(); await expect(figure.locator('figcaption')).toContainText('AI-generated garment concept');
        await expect(figure.locator('img')).toHaveAttribute('alt', /^AI-generated concept:/);
        expect((await figure.locator('.media-frame').boundingBox())!.height).toBeGreaterThan(150);
        if (js) await expect(figure.locator('img')).toHaveAttribute('data-failed', 'true');
      }
      if (item.kind === 'article') {
        const first = page.locator('.article-toc a').first(); const href = await first.getAttribute('href');
        await first.focus(); await page.keyboard.press('Enter'); await expect(page.locator(href!)).toBeInViewport();
        await expect(page.locator('.editorial-prose')).toContainText(item.name === 'quote' ? 'Total project budget' : '120 + 60 = 180');
        await expect(page.locator('.editorial-template pre')).not.toBeEmpty();
      }
      if (item.groups) expect(await page.locator('.button').first().evaluate(n => getComputedStyle(n).transitionDuration)).toBe('0s');
      await noOverflow(page); await footerClear(page, item.groups > 0);
      await capture(page, info, `${item.name}-image-failure-reduced-js-${js}`);
    } finally { await context.close(); }
  });
  for (const width of [320, 390, 1440]) test(`${item.name} 200-percent CSS text at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 }); await page.goto(item.path);
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await noOverflow(page); if (width < 768) await footerClear(page, item.groups > 0);
    await capture(page, info, `${item.name}-text-200-${width}`);
  });
  for (const width of [320,1440]) test(`${item.name} long title, link and table cells at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 }); await page.goto(item.path);
    await page.locator('h1').evaluate(n => { n.textContent = 'A longer editorial title with several detailed purchasing questions for an international clothing collection'; });
    const link = page.locator('main a[href]').last();
    await link.evaluate(n => { n.textContent = 'https://www.example.invalid/' + 'VeryLongUnbrokenReference'.repeat(12); });
    if (item.kind !== 'journal') await page.locator('table td').first().evaluate(n => { n.textContent = 'UnbrokenMaterialSpecification'.repeat(12); });
    await noOverflow(page); await capture(page, info, `${item.name}-long-copy-${width}`);
  });
}
for (const width of [390,1440]) for (const js of [true,false]) for (const start of ['/', '/blog/']) test(`draft buyer journey from ${start} at ${width}px with JS ${js}`, async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: js, viewport: { width, height: 900 }, baseURL: baseURL! });
  try {
    const page = await context.newPage();
    for (const item of pages.filter(p => p.kind === 'article')) {
      await page.goto(start);
      const entry = page.locator(`[data-article-card="${item.path.split('/')[2]}"] a`);
      await entry.focus(); await page.keyboard.press('Enter'); await expect(page).toHaveURL(new RegExp(`${item.path}$`));
      const fragment = item.name === 'quote' ? 'prepare' : 'moq';
      await page.locator(`.editorial-prose a[href="/manufacturing/#${fragment}"]`).focus(); await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`/manufacturing/#${fragment}$`)); await expect(page.locator(`#${fragment} h2`)).toBeInViewport();
      await page.goto(item.path);
      await page.locator('.editorial-prose a[href="/clothing/t-shirts/"]').focus(); await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/clothing\/t-shirts\/$/);
      await page.goto(item.path);
      await page.locator('.editorial-prose a[href="/contact/"]').focus(); await page.keyboard.press('Enter'); await expect(page).toHaveURL(/\/contact\/$/);
      await expect(page.locator('[data-contact-state="unconfigured"]')).toHaveCount(6);
      await page.goto(item.path);
      await page.locator('.article-return a').focus(); await page.keyboard.press('Enter'); await expect(page).toHaveURL(/\/blog\/$/);
      await page.goto(item.path);
      await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Journal', exact: true }).click(); await expect(page).toHaveURL(/\/blog\/$/);
    }
    await capture(page, info, `journal-journey-${start === '/' ? 'home' : 'journal'}-${width}-js-${js}`);
  } finally { await context.close(); }
});
test('article source is an ordinary reviewed link and never an automatically loaded resource', async ({ page, request }) => {
  await page.goto('/blog/moq-per-style-per-color/');
  const source = page.locator('a[data-editorial-source="reviewed"]');
  await expect(source).toHaveCount(1); await expect(source).toHaveAttribute('href', sourcePolicy.sources[0]!.href);
  await expect(source).toHaveAttribute('rel', 'nofollow noreferrer noopener');
  await expect(page.locator('[src^="https:"], link[href^="https:"]')).toHaveCount(0);
  for (const item of pages) {
    const result = await request.get(item.path); expect(result.status()).toBe(200);
    expect(await result.text()).toContain(item.title);
  }
  for (const path of ['/blog/unknown-draft/', '/blog/moq-per-style-per-color/extra/', '/privacy/extra/']) {
    expect((await page.goto(path))?.status()).toBe(404);
    await expect(page.locator('.pending-contact, .mobile-contact-bar, .footer-contact-row')).toHaveCount(0);
  }
});
