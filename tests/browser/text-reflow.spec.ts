import { test, expect } from '@playwright/test';

// Include the homepage in narrow, enlarged-text coverage. Text-range diagnostics
// distinguish overflowing glyphs/anonymous flex items from overflowing boxes.
for (const width of [320, 390]) {
  test(`homepage narrow 200-percent text reflow at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    const layout = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const textOverflow: { text: string; parent: string; right: number; top: number }[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (!node.textContent?.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rect of range.getClientRects()) {
          if (rect.right > innerWidth) textOverflow.push({ text: node.textContent.slice(0, 100), parent: node.parentElement?.outerHTML.slice(0, 300) ?? '', right: rect.right, top: rect.top });
        }
      }
      return {
        viewport: innerWidth, width: document.documentElement.scrollWidth,
        overflowingContent: [...document.querySelectorAll<HTMLElement>('body *')].filter(node => node.scrollWidth > node.clientWidth + 1).map(node => ({
          tag: node.tagName, className: node.className, width: node.clientWidth, scrollWidth: node.scrollWidth,
          right: node.getBoundingClientRect().right, top: node.getBoundingClientRect().top,
          wrap: getComputedStyle(node).overflowWrap, text: node.textContent?.slice(0, 80),
        })), textOverflow,
      };
    });
    await info.attach('text-reflow-layout', { body: JSON.stringify(layout, null, 2), contentType: 'application/json' });
    const path = info.outputPath(`homepage-text-200-${width}.png`);
    await page.screenshot({ path, fullPage: true, animations: 'disabled' });
    await info.attach('homepage-text-200', { path, contentType: 'image/png' });
    expect(layout.width, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport);
  });
}
