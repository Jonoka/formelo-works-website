// Capture the exact pre-fix PR #6 tables on loopback, never deploy or change that checkout.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';

const source = resolve('.review-moq-baseline');
const root = resolve(source, 'web/dist');
const output = resolve('review/moq-table-before');
const expectedHead = 'c02116e38b17f61323090b2ba5eaa8cf43c4db31';
const git = (...args) => execFileSync('git', ['-C', source, ...args], { encoding: 'utf8' }).trim();
assert.equal(git('rev-parse', 'HEAD'), expectedHead, 'The table comparison must use the actual pre-fix head.');
assert.equal(git('status', '--porcelain', '--untracked-files=no'), '', 'Do not mislabel a changed baseline.');
await mkdir(output); // Fail rather than overwrite an existing capture.
const targets = [
  ['moq', '/blog/moq-per-style-per-color/', 'Hypothetical proposal: two styles, three style–color lines, 180 pieces total'],
  ['quote', '/blog/what-to-send-for-a-clothing-quote/', 'Quantity-planning fields — fill in your own proposal, not a factory minimum'],
  ['privacy', '/privacy/', 'Pending operational details — no values are assumed'],
];
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    let file = resolve(root, `.${decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname)}`);
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': mime[extname(file)] ?? 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise((ok, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', ok); });
let browser;
try {
  browser = await chromium.launch();
  const measurements = [], screenshots = [];
  for (const [name, path, caption] of targets) for (const width of [320, 360, 390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const response = await page.goto(`http://127.0.0.1:${server.address().port}${path}`);
    assert.equal(response.status(), 200);
    const table = page.getByRole('table', { name: caption, exact: true });
    assert.equal(await table.count(), 1);
    await table.scrollIntoViewIfNeeded();
    for (const [suffix, target] of [['table', table.locator('..')], ['viewport', page]]) {
      const filename = `${name}-${width}-${suffix}.png`;
      const image = await target.screenshot({ path: resolve(output, filename), animations: 'disabled' });
      screenshots.push({ filename, width, sha256: createHash('sha256').update(image).digest('hex') });
    }
    measurements.push({ name, width, caption, ...await table.evaluate(t => ({ columns: [...t.querySelectorAll('thead th')].map(c => c.getBoundingClientRect().width), regionWidth: t.parentElement.clientWidth, scrollWidth: t.parentElement.scrollWidth, pageWidth: document.documentElement.scrollWidth })) });
    await page.close();
  }
  await writeFile(resolve(output, 'source.json'), JSON.stringify({ head: expectedHead, tree: git('rev-parse', 'HEAD^{tree}'), capturedAt: new Date().toISOString(), platform: process.platform, node: process.version, browser: browser.version(), scope: 'Pre-fix PR #6 quantity table and unchanged two-column regression tables, not accepted final output.', measurements, screenshots }, null, 2));
  console.log(`Captured PR #6 pre-fix tables at 320/360/390/1440 from ${expectedHead}.`);
} finally {
  if (browser) await browser.close();
  await new Promise(ok => server.close(ok));
}
