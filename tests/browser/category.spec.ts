import { test, expect, type Page, type TestInfo } from '@playwright/test';
const categories = [
  { slug: 't-shirts', name: 'T-shirts', title: 'Custom T-shirt manufacturing.', asset: 'CAT-TS-001', reference: 'WEB-TSHIRTS', seoTitle: 'T-shirt manufacturing concept — FORMELO WORKS' },
  { slug: 'hoodies', name: 'Hoodies', title: 'Custom hoodie manufacturing.', asset: 'CAT-HD-001', reference: 'WEB-HOODIES', seoTitle: 'Hoodie manufacturing concept — FORMELO WORKS' },
];
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function capture(page: Page, info: TestInfo, name: string) {
  if (info.project.name !== 'preview') return;
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true, animations: 'disabled' });
  await info.attach(name, { path, contentType: 'image/png' });
}
async function footerClear(page: Page) {
  await expect.poll(async () => {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const footer = await page.locator('.footer-bottom').boundingBox();
    const bar = await page.locator('.mobile-contact-bar').boundingBox();
    return Boolean(footer && bar && footer.y + footer.height <= bar.y + 1);
  }).toBe(true);
}
for (const category of categories) {
  const route = `/clothing/${category.slug}/`;
  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    test(`${category.slug} reflows at ${width}px`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(category.title);
      await expect(page).toHaveTitle(category.seoTitle);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', new RegExp(category.slug === 'hoodies' ? 'hood shape, layering' : 'jersey, fit, neckline'));
      const crumb = page.getByRole('navigation', { name: 'Breadcrumb' });
      await expect(crumb.locator('li')).toHaveCount(2);
      await expect(crumb.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute('href', '/');
      await expect(crumb.locator('[aria-current="page"]')).toHaveText(category.name);
      await expect(crumb.locator('[aria-current="page"] a')).toHaveCount(0);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
      await expect(page.locator('a[href^="mailto:"], a[href*="wa.me"], link[rel="canonical"], form, iframe, a[href="/clothing/"]')).toHaveCount(0);
      await expect(page.locator('img')).toHaveCount(1);
      const image = page.locator('img');
      await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
      await expect(image).toHaveAttribute('loading', 'eager');
      await expect(image).toHaveAttribute('fetchpriority', 'high');
      await expect(page.locator('figure')).toHaveAttribute('data-asset-id', category.asset);
      await expect(page.locator('figcaption')).toContainText('AI-generated garment concept — not a factory sample.');
      expect(await image.evaluate(node => getComputedStyle(node).objectFit)).toBe('cover');
      expect(await image.evaluate((node: HTMLImageElement) => Math.abs(node.naturalWidth / node.naturalHeight - 4 / 3))).toBeLessThan(.015);
      await noOverflow(page);
      for (const group of await page.locator('.pending-contact').all()) {
        await expect(group).toHaveAttribute('data-reference-code', category.reference);
        await expect(group.locator('.contact-note')).toContainText('channels inactive');
      }
      for (const button of await page.locator('.contact-actions button:visible').all()) {
        await expect(button).toBeDisabled();
        expect((await button.boundingBox())?.height).toBeGreaterThanOrEqual(48);
      }
      if (width < 768) await footerClear(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await capture(page, info, `${category.slug}-${width}`);
      if (info.project.name === 'preview' && [390, 1440].includes(width)) {
        await page.screenshot({ path: info.outputPath(`${category.slug}-${width}-viewport.png`), animations: 'disabled' });
      }
    });
  }
  test(`${category.slug} links resolve to real pages and fragments without external requests`, async ({ page, request }) => {
    const external: string[] = [], errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      if (new URL(route.request().url()).hostname !== '127.0.0.1') { external.push(route.request().url()); return route.abort(); }
      return route.continue();
    });
    await page.goto(route);
    for (const href of await page.locator('a[href]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')!))) {
      const target = new URL(href, `http://127.0.0.1${route}`);
      expect(['/', '/clothing/t-shirts/', '/clothing/hoodies/']).toContain(target.pathname);
      const response = await request.get(target.pathname);
      expect(response.status()).toBe(200);
      if (target.hash) expect(await response.text()).toContain(`id="${target.hash.slice(1)}"`);
    }
    for (const [label, href] of [['Manufacturing', '/#capabilities'], ['Our Factory', '/#factory'], ['Journal', '/#journal'], ['Contact', '/#contact']]) {
      await expect(page.locator('.desktop-nav').getByRole('link', { name: label!, exact: true })).toHaveAttribute('href', href!);
    }
    expect(external).toEqual([]); expect(errors).toEqual([]);
  });
  for (const javaScriptEnabled of [true, false]) {
    test(`${category.slug} image failure and native FAQ with JS ${javaScriptEnabled}`, async ({ browser, baseURL }, info) => {
      const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 390, height: 844 }, baseURL: baseURL! });
      try {
        const page = await context.newPage();
        await page.route('**/media/**', route => route.abort());
        await page.goto(route);
        await page.locator('figure').scrollIntoViewIfNeeded();
        await expect(page.locator('figcaption')).toContainText('AI-generated garment concept');
        await expect(page.locator('img')).toHaveAttribute('alt', /^AI-generated concept:/);
        expect((await page.locator('.media-frame').boundingBox())?.height).toBeGreaterThan(200);
        if (javaScriptEnabled) await expect(page.locator('[data-image-error]')).toBeVisible();
        const summary = page.locator('.faq-item summary').first();
        await summary.focus(); await page.keyboard.press('Enter');
        await expect(page.locator('.faq-item').first()).toHaveAttribute('open', '');
        await footerClear(page); await noOverflow(page);
        await capture(page, info, `${category.slug}-image-failure-js-${javaScriptEnabled}`);
      } finally { await context.close(); }
    });
  }
  test(`${category.slug} reduced motion`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto(route);
    expect(await page.locator('.button').first().evaluate(node => getComputedStyle(node).transitionDuration)).toBe('0s');
    await page.locator('.faq-item summary').first().click();
    await expect(page.locator('.faq-item').first()).toHaveAttribute('open', '');
    await capture(page, info, `${category.slug}-reduced-motion`);
  });
  for (const width of [320, 1440]) {
    test(`${category.slug} long title and discussion text at ${width}px`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 900 }); await page.goto(route);
      await page.locator('h1').evaluate(node => { node.textContent = 'A detailed manufacturing conversation for an independent collection with many design requirements'; });
      await page.locator('.discussion-list dd').first().evaluate(node => { node.textContent = 'LongUnbrokenFabricReference'.repeat(10) + ' Longer development notes. '.repeat(20); });
      await page.locator('.contact-actions .button-label').first().evaluate(node => { node.textContent = 'WhatsApp conversation about a detailed collection'; });
      await noOverflow(page);
      expect((await page.locator('h1').boundingBox())?.height).toBeGreaterThan(80);
      await capture(page, info, `${category.slug}-long-copy-${width}`);
    });
  }
  for (const width of [320, 390, 1440]) {
    test(`${category.slug} 200-percent text resize at ${width}px`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 900 }); await page.goto(route);
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      await noOverflow(page);
      if (width < 768) await footerClear(page);
      await capture(page, info, `${category.slug}-text-200-${width}`);
    });
  }
  test(`${category.slug} no-JS 200-percent text reserve`, async ({ browser, baseURL }, info) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, baseURL: baseURL! });
    try {
      const page = await context.newPage(); await page.goto(route);
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      await noOverflow(page); await footerClear(page);
      await capture(page, info, `${category.slug}-text-200-no-js`);
    } finally { await context.close(); }
  });
}
for (const javaScriptEnabled of [true, false]) for (const width of [390, 1440]) {
  test(`category journey by keyboard at ${width}px with JS ${javaScriptEnabled}`, async ({ browser, baseURL }, info) => {
    const context = await browser.newContext({ javaScriptEnabled, viewport: { width, height: 900 }, baseURL: baseURL! });
    try {
      const page = await context.newPage(); await page.goto('/');
      const disclosure = width < 1024 ? '.mobile-nav' : '.clothing-menu';
      const trigger = page.locator(`${disclosure} > summary`);
      await trigger.focus(); await page.keyboard.press('Enter');
      await expect(page.locator(disclosure)).toHaveAttribute('open', '');
      if (width < 768) await expect(page.locator('.mobile-contact-bar')).toBeHidden();
      if (javaScriptEnabled) {
        await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
        await expect(page.locator(disclosure)).not.toHaveAttribute('open', '');
        await page.keyboard.press('Enter');
      }
      await page.keyboard.press('Tab'); await expect(page.locator(`${disclosure} a`).first()).toBeFocused();
      await page.keyboard.press('Enter'); await expect(page).toHaveURL(/\/clothing\/t-shirts\/$/);
      await page.locator('.related-category-link').focus(); await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/clothing\/hoodies\/$/);
      await page.locator(`${disclosure} > summary`).focus(); await page.keyboard.press('Enter');
      await capture(page, info, `hoodies-menu-${width}-js-${javaScriptEnabled}`);
      await page.locator(width < 1024 ? '.mobile-nav' : '.desktop-nav').getByRole('link', { name: 'Manufacturing', exact: true }).click();
      await expect(page).toHaveURL(/\/#capabilities$/);
      await page.locator('#hoodies-heading a').focus(); await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/clothing\/hoodies\/$/);
      await page.locator('.related-category-link').click(); await expect(page).toHaveURL(/\/clothing\/t-shirts\/$/);
      await page.locator('.site-header > .wordmark').click(); await expect(page).toHaveURL(/\/$/);
      await page.locator('#t-shirts-heading a').click(); await expect(page).toHaveURL(/\/clothing\/t-shirts\/$/);
      await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link').click();
      await expect(page.locator('h1')).toHaveText('Custom apparel manufacturing for brands in motion.');
    } finally { await context.close(); }
  });
}
test('unknown category slugs and absent Clothing hub return actual 404s', async ({ page }) => {
  for (const path of ['/clothing/unknown-style/', '/clothing/', '/clothing/t-shirts/details/']) {
    const response = await page.goto(path); expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('This page is not here.');
    await expect(page.locator('.mobile-contact-bar')).toHaveCount(0);
  }
});
test('mobile contact labels, arrows and layout follow one rule on all three pages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/clothing/t-shirts/', '/clothing/hoodies/']) {
    await page.goto(path);
    for (const group of await page.locator('.pending-contact').all()) {
      await expect(group.locator('.button-label')).toHaveText(['WhatsApp', 'Email']);
      await expect(group.locator('.button-arrow[aria-hidden="true"]')).toHaveCount(2);
      const styles = await group.locator('.button').first().evaluate(node => {
        const s = getComputedStyle(node); return [s.fontSize, s.padding, s.gap, s.lineHeight];
      });
      const barStyles = await page.locator('.mobile-contact-bar .button').first().evaluate(node => {
        const s = getComputedStyle(node); return [s.fontSize, s.padding, s.gap, s.lineHeight];
      });
      expect(styles).toEqual(barStyles);
    }
  }
});
test('home 390 first fold shows positioning, contact and the start of the garment', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await expect.poll(() => page.locator('.hero img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  const metrics = await page.evaluate(() => {
    const image = document.querySelector('.hero .media-frame')!.getBoundingClientRect();
    const bar = document.querySelector('.mobile-contact-bar')!.getBoundingClientRect();
    const cta = document.querySelector('.hero .contact-actions')!.getBoundingClientRect();
    return { imageTop: image.top, visibleImageHeight: Math.max(0, Math.min(image.bottom, bar.top) - image.top), contactBottom: cta.bottom, barTop: bar.top };
  });
  expect(metrics.contactBottom).toBeLessThan(metrics.barTop);
  expect(metrics.visibleImageHeight).toBeGreaterThanOrEqual(100);
  await info.attach('home-first-fold-metrics', { body: JSON.stringify(metrics, null, 2), contentType: 'application/json' });
});
