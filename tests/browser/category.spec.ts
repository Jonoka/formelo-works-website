import { test, expect } from '@playwright/test';
const categoryPreviews = [{
  slug: 't-shirts', name: 'T-shirts', title: 'Custom T-shirt manufacturing.',
  seo: {
    seoTitle: 'T-shirt manufacturing concept — FORMELO WORKS',
    seoDescription: 'Explore a T-shirt manufacturing concept for independent brands: jersey, fit, neckline and artwork discussion points. Factory capability and terms are unconfirmed.',
  },
}];

for (const category of categoryPreviews) {
  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    test(`${category.slug} reflows at ${width}px`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      const response = await page.goto(`/clothing/${category.slug}/`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(category.title);
      await expect(page).toHaveTitle(category.seo.seoTitle);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'seoDescription' in category.seo ? category.seo.seoDescription : '');
      const crumb = page.getByRole('navigation', { name: 'Breadcrumb' });
      await expect(crumb.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute('href', '/');
      await expect(crumb.locator('[aria-current="page"]')).toHaveText(category.name);
      await expect(crumb.locator('[aria-current="page"] a')).toHaveCount(0);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
      await expect(page.locator('a[href^="mailto:"], a[href*="wa.me"], link[rel="canonical"], form, iframe')).toHaveCount(0);
      await expect(page.locator('img')).toHaveCount(1);
      const image = page.locator('img');
      await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
      await expect(page.locator('figcaption')).toContainText('AI-generated garment concept — not a factory sample.');
      expect(await image.evaluate(node => getComputedStyle(node).objectFit)).toBe('cover');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const button of await page.locator('.contact-actions button:visible').all()) {
        await expect(button).toBeDisabled();
        expect((await button.boundingBox())?.height).toBeGreaterThanOrEqual(48);
      }
      if (width < 768) {
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        const footer = await page.locator('.footer-bottom').boundingBox();
        const bar = await page.locator('.mobile-contact-bar').boundingBox();
        expect(footer && bar && footer.y + footer.height <= bar.y).toBe(true);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      if (info.project.name === 'preview') {
        const path = info.outputPath(`${category.slug}-${width}.png`);
        await page.screenshot({ path, fullPage: true, animations: 'disabled' });
        await info.attach(`${category.slug}-${width}`, { path, contentType: 'image/png' });
        if (width === 390 || width === 1440) await page.screenshot({ path: info.outputPath(`${category.slug}-${width}-viewport.png`), animations: 'disabled' });
      }
    });
  }
}
