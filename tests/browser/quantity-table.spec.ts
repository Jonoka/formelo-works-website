import { test, expect, type Locator, type Page, type TestInfo } from '@playwright/test';

const caption = 'Hypothetical proposal: two styles, three style–color lines, 180 pieces total';
const moqPath = '/blog/moq-per-style-per-color/';
const rows = [
  ['Style A T-shirt / cream', '15', '25', '20', '60'],
  ['Style A T-shirt / charcoal', '10', '30', '20', '60'],
  ['Style B hoodie / charcoal', '20', '20', '20', '60'],
];
const pairs = [
  { name: 'moq-questions', path: moqPath, caption: 'Four different quantity questions', rows: 4 },
  { name: 'quote', path: '/blog/what-to-send-for-a-clothing-quote/', caption: 'Quantity-planning fields — fill in your own proposal, not a factory minimum', rows: 5 },
  { name: 'privacy', path: '/privacy/', caption: 'Pending operational details — no values are assumed', rows: 6 },
];
async function save(target: Locator, info: TestInfo, name: string) {
  if (info.project.name !== 'preview') return;
  const page = target.page(), viewport = page.viewportSize()!;
  const box = await target.boundingBox();
  const bars = page.locator('.mobile-contact-bar');
  const bar = await bars.count() ? await bars.boundingBox() : null;
  // A full-block crop taller than the viewport can include the fixed contact bar.
  // Expand height only for the evidence crop; do not hide UI or change text/width.
  const height = Math.max(viewport.height, Math.ceil((box?.height ?? 0) + (bar?.height ?? 0) + 96));
  const path = info.outputPath(`${name}.png`);
  try {
    if (height !== viewport.height) await page.setViewportSize({ width: viewport.width, height });
    await target.scrollIntoViewIfNeeded();
    await target.screenshot({ path, animations: 'disabled' });
    await info.attach(name, { path, contentType: 'image/png' });
    await info.attach(`${name}-capture`, { body: JSON.stringify({ testViewport: viewport, captureViewport: { width: viewport.width, height }, purpose: 'Unobscured full-block crop; normal-height row reachability tested separately.' }), contentType: 'application/json' });
  } finally {
    if (height !== viewport.height) await page.setViewportSize(viewport);
  }
}
async function rowsReachable(page: Page, table: Locator, info: TestInfo, name: string) {
  for (const row of await table.locator('tbody tr').all()) {
    await row.evaluate(n => n.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }));
    const visible = await row.evaluate(n => {
      const r = n.getBoundingClientRect(), region = n.closest('table')!.parentElement!.getBoundingClientRect();
      const bar = document.querySelector<HTMLElement>('.mobile-contact-bar');
      const limit = bar && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect().top : innerHeight;
      const x = Math.max(region.left, r.left) + 8, y = (r.top + r.bottom) / 2;
      return r.top >= 0 && r.bottom <= limit && n.contains(document.elementFromPoint(x, y));
    });
    expect(visible, 'Every row can be read above the unchanged fixed contact bar').toBe(true);
  }
  if (info.project.name === 'preview') {
    const path = info.outputPath(`${name}-last-row-viewport.png`);
    await page.screenshot({ path, animations: 'disabled' });
    await info.attach(`${name}-last-row-viewport`, { path, contentType: 'image/png' });
  }
}
async function pageFits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
}
async function captionFits(table: Locator) {
  const fits = await table.locator('caption').evaluate(c => {
    const range = document.createRange(); range.selectNodeContents(c.querySelector('span') ?? c);
    const region = c.closest('table')!.parentElement!.getBoundingClientRect();
    return [...range.getClientRects()].every(r => r.left >= region.left - 1 && r.right <= region.right + 1);
  });
  expect(fits, 'Complete caption fits the visible scroll region').toBe(true);
}
async function columnVisible(table: Locator, column: number) {
  return table.evaluate((t, index) => {
    const region = t.parentElement!.getBoundingClientRect();
    return [...t.querySelectorAll('tr')].every(row => {
      const r = row.children[index]!.getBoundingClientRect();
      return r.left >= region.left - 1 && r.right <= region.right + 1;
    });
  }, column);
}
async function arrowToColumn(page: Page, table: Locator, column: 0 | 4) {
  const region = table.locator('..'); await region.focus(); await expect(region).toBeFocused();
  for (let i = 0; i < 50 && !(await columnVisible(table, column)); i++) {
    await page.keyboard.press(column === 4 ? 'ArrowRight' : 'ArrowLeft');
    await page.waitForTimeout(60); // Wait for native keyboard scrolling, not website JavaScript.
  }
  await expect.poll(() => columnVisible(table, column)).toBe(true);
}
for (const width of [320, 360, 390, 1440]) for (const textScale of [100, 200]) for (const js of [true, false]) {
  test(`quantity table and two-column regressions ${width}px text-${textScale} JS-${js}`, async ({ browser, baseURL }, info) => {
    const context = await browser.newContext({ baseURL: baseURL!, viewport: { width, height: 1000 }, javaScriptEnabled: js, reducedMotion: 'reduce' });
    try {
      // Deliver the text-size fixture in HTML: addStyleTag waits for an event with JS disabled.
      if (textScale === 200) await context.route('**/*', async route => {
        if (!route.request().isNavigationRequest()) return route.continue();
        const response = await route.fetch();
        const body = (await response.text()).replace('</head>', '<style>html { font-size: 200% !important; }</style></head>');
        await route.fulfill({ response, body });
      });
      const page = await context.newPage(); await page.goto(moqPath);
      const table = page.getByRole('table', { name: caption, exact: true });
      await expect(table).toHaveCount(1);
      await expect(page.locator('table').nth(1)).toHaveAccessibleName(caption);
      const region = page.getByRole('region', { name: caption, exact: true });
      await expect(region).toHaveAttribute('tabindex', '0');
      await expect(region).toHaveAccessibleDescription(/swipe or scroll horizontally.*left and right arrow keys/);
      await expect(table.locator('thead th[scope="col"]')).toHaveText(['Style / color', 'S', 'M', 'L', 'Total']);
      await expect(table.locator('tbody th[scope="row"]')).toHaveText(rows.map(row => row[0]!));
      for (let i = 0; i < rows.length; i++) await expect(table.locator('tbody tr').nth(i).locator('th, td')).toHaveText(rows[i]!);
      await expect(page.locator('.editorial-callout')).toContainText(['No factory minimum is announced here', 'Hypothetical example — not this factory’s MOQ']);
      await expect(page.locator('.editorial-prose')).toContainText('120 + 60 = 180');
      const metrics = await table.evaluate(t => {
        const font = parseFloat(getComputedStyle(t).fontSize);
        const description = t.querySelector<HTMLElement>('tbody th')!;
        const wordsIntact = [...t.querySelectorAll('tbody th')].every(th => {
          const node = th.firstChild!;
          return [...(node.textContent ?? '').matchAll(/cream|charcoal|hoodie/g)].every(match => {
            const range = document.createRange(); range.setStart(node, match.index!); range.setEnd(node, match.index! + match[0].length);
            return [...range.getClientRects()].filter(r => r.width > 0).length === 1;
          });
        });
        return {
          font, widths: [...t.querySelectorAll('thead th')].map(c => c.getBoundingClientRect().width), wordsIntact,
          descWidth: description.getBoundingClientRect().width - parseFloat(getComputedStyle(description).paddingLeft) - parseFloat(getComputedStyle(description).paddingRight),
          numericFits: [...t.querySelectorAll<HTMLElement>('tbody td')].every(c => c.scrollWidth <= c.clientWidth + 1 && getComputedStyle(c).whiteSpace === 'nowrap'),
          regionWidth: t.parentElement!.clientWidth, scrollWidth: t.parentElement!.scrollWidth,
        };
      });
      expect(metrics.font).toBeGreaterThanOrEqual(textScale === 200 ? 32 : 16);
      expect(metrics.widths[0]!).toBeGreaterThan(metrics.widths[1]! * 1.4);
      expect(metrics.descWidth).toBeGreaterThanOrEqual(Math.min(metrics.font * 11, metrics.regionWidth * .6));
      expect(metrics.wordsIntact, 'cream / charcoal / hoodie must not fragment').toBe(true);
      expect(metrics.numericFits).toBe(true);
      await pageFits(page); await captionFits(table);
      const name = `quantity-${width}-text-${textScale}-js-${js}`;
      await save(region.locator('..'), info, `${name}-left`);
      if (width < 768 || textScale === 200) {
        expect(metrics.scrollWidth).toBeGreaterThan(metrics.regionWidth);
        await arrowToColumn(page, table, 4);
        await captionFits(table); await save(region.locator('..'), info, `${name}-right`);
        for (const column of [1, 2, 3]) {
          await table.locator('thead th').nth(column).scrollIntoViewIfNeeded();
          expect(await columnVisible(table, column)).toBe(true);
        }
        await arrowToColumn(page, table, 0);
      } else expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.regionWidth + 1);
      await region.focus();
      expect(await region.evaluate(n => getComputedStyle(n).outlineStyle)).not.toBe('none');
      await page.keyboard.press('Tab'); await expect(region).not.toBeFocused();
      await rowsReachable(page, table, info, name);
      await pageFits(page);
      for (const pair of pairs) {
        await page.goto(pair.path);
        const two = page.getByRole('table', { name: pair.caption, exact: true });
        await expect(two.locator('thead th[scope="col"]')).toHaveCount(2);
        await expect(two.locator('tbody th[scope="row"]')).toHaveCount(pair.rows);
        await expect(two.locator('colgroup')).toHaveCount(0);
        await expect(two.locator('..')).not.toHaveClass(/editorial-table--quantity/);
        const sizes = await two.evaluate(t => ({ widths: [...t.querySelectorAll('thead th')].map(c => c.getBoundingClientRect().width), region: t.parentElement!.clientWidth, scroll: t.parentElement!.scrollWidth, font: parseFloat(getComputedStyle(t).fontSize) }));
        expect(Math.abs(sizes.widths[0]! - sizes.widths[1]!)).toBeLessThanOrEqual(1);
        expect(sizes.scroll).toBeLessThanOrEqual(sizes.region + 1);
        expect(sizes.font).toBeGreaterThanOrEqual(textScale === 200 ? 30 : 15);
        await pageFits(page); await save(two.locator('..'), info, `${pair.name}-${width}-text-${textScale}-js-${js}`);
      }
    } finally { await context.close(); }
  });
}
for (const width of [320, 360, 390]) for (const js of [true, false]) test(`quantity table native touch pan ${width}px JS-${js}`, async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ baseURL: baseURL!, viewport: { width, height: 900 }, hasTouch: true, isMobile: true, javaScriptEnabled: js });
  try {
    const page = await context.newPage(); await page.goto(moqPath);
    const table = page.getByRole('table', { name: caption, exact: true });
    const region = table.locator('..'); await region.scrollIntoViewIfNeeded();
    const cell = await table.locator('tbody tr').first().boundingBox(); const box = await region.boundingBox();
    expect(cell && box).toBeTruthy();
    const cdp = await context.newCDPSession(page);
    const x = box!.x + box!.width - 20, y = cell!.y + 12;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 12; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - i * 18, y }] });
      await page.waitForTimeout(20);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => columnVisible(table, 4)).toBe(true);
    await pageFits(page); await captionFits(table);
    await save(region.locator('..'), info, `quantity-touch-${width}-js-${js}`);
    await cdp.detach();
  } finally { await context.close(); }
});
