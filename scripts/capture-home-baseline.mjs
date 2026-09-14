// CI-only, loopback-only review of the exact PR #3 static build. No website deployment.
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from '@playwright/test';
const root = resolve('.review-baseline/web/dist');
const output = resolve('review/before');
await mkdir(output, { recursive: true });
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  try {
    let file = resolve(root, `.${decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname)}`);
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': mime[extname(file)] ?? 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
let browser;
try {
  browser = await chromium.launch();
  const metrics = [];
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
    const address = server.address();
    const response = await page.goto(`http://127.0.0.1:${address.port}/`);
    if (response.status() !== 200) throw new Error('Baseline homepage not served.');
    for (const img of await page.locator('img').all()) {
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(async node => { await node.decode(); });
    }
    await page.evaluate(() => scrollTo(0, 0));
    metrics.push({ width, ...(await page.evaluate(() => ({
      imageTop: document.querySelector('.hero .media-frame').getBoundingClientRect().top,
      title: document.title,
    }))) });
    await page.screenshot({ path: `${output}/homepage-${width}.png`, fullPage: true, animations: 'disabled' });
    await page.screenshot({ path: `${output}/homepage-${width}-viewport.png`, animations: 'disabled' });
    await page.close();
  }
  await writeFile(`${output}/metrics.json`, JSON.stringify(metrics, null, 2));
  console.log('Captured PR #3 before screenshots at 1440x900 and 390x844.');
} finally {
  if (browser) await browser.close();
  await new Promise(done => server.close(done));
}
