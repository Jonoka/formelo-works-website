// Bounded, loopback-only Manufacturing checkpoint. Not a deployment or full acceptance.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile, readdir } from 'node:fs/promises';
import { resolve, extname, sep, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';
const root = resolve('web/dist');
const output = resolve('.local/core-information-review/manufacturing-first');
await mkdir(output, { recursive: true });
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    let file = resolve(root, `.${decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname)}`);
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    res.writeHead(200, { 'content-type': mime[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
let browser;
try {
  browser = await chromium.launch();
  const metrics = [];
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
    const response = await page.goto(`http://127.0.0.1:${server.address().port}/manufacturing/`);
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('img, form, input, textarea, a[href^="mailto:"], a[href*="wa.me"]').count(), 0);
    assert.deepEqual(await page.locator('.pending-contact').evaluateAll(nodes => [...new Set(nodes.map(node => node.dataset.referenceCode))]), ['WEB-MANUFACTURING']);
    for (const id of ['options', 'moq', 'prepare', 'sampling', 'production', 'faq']) assert.equal(await page.locator(`main #${id}`).count(), 1);
    const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, title: document.title }));
    assert.ok(size.document <= size.viewport + 1, JSON.stringify(size));
    metrics.push({ width, ...size });
    await page.screenshot({ path: `${output}/manufacturing-${width}.png`, fullPage: true, animations: 'disabled' });
    await page.screenshot({ path: `${output}/manufacturing-${width}-viewport.png`, animations: 'disabled' });
    await page.close();
  }
  const hashes = {};
  async function hashFiles(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = resolve(directory, entry.name);
      if (entry.isDirectory()) await hashFiles(file);
      else if (entry.isFile()) hashes[relative(process.cwd(), file).replaceAll('\\', '/')] = createHash('sha256').update(await readFile(file)).digest('hex');
    }
  }
  for (const directory of ['web/src', 'shared', 'config']) await hashFiles(resolve(directory));
  await writeFile(`${output}/source.json`, JSON.stringify({ headSha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), source: 'Working tree checkpoint; hashes below bind uncommitted source.', browser: browser.version(), platform: process.platform, metrics, hashes }, null, 2));
  console.log('Manufacturing checkpoint captured at 1440/390; assertions passed. Original PNGs and source hashes are in ' + output);
} finally {
  if (browser) await browser.close();
  await new Promise(done => server.close(done));
}
