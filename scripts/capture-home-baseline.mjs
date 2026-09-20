// Loopback-only static review: actual PR base, or the five current mock pages. No deployment.
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { relative, isAbsolute } from 'node:path';
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--fixed-current')) throw new Error('BASELINE_ARGUMENT');
const current = args.includes('--fixed-current');
const baseline = resolve(process.env.FORMELO_REVIEW_BASELINE_ROOT ?? '.review-baseline');
const inside = relative(process.cwd(), baseline);
if (!inside || inside.startsWith('..') || isAbsolute(inside)) throw new Error('BASELINE_PATH');
const checkout = current ? process.cwd() : baseline;
const git = (...args) => execFileSync('git', ['-C', checkout, ...args], { encoding: 'utf8' }).trim();
const sha = git('rev-parse', 'HEAD'), tree = git('rev-parse', 'HEAD^{tree}');
if (git('status', '--porcelain=v1', '--untracked-files=all')) throw new Error('CAPTURE_DIRTY_SOURCE');
const capturedAt = new Date().toISOString();
const screenshots = [], blocked = [];
const root = resolve(checkout, 'web/dist');
const output = resolve(current ? 'review/current-fixed' : 'review/before');
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
  const fixed = [{ path: '/manufacturing/', name: 'manufacturing' }, { path: '/our-factory/', name: 'factory' }, { path: '/contact/', name: 'contact' }, { path: '/blog/', name: 'journal' }, { path: '/privacy/', name: 'privacy' }];
  const targets = current ? fixed : [{ path: '/', name: 'homepage' }, { path: '/clothing/t-shirts/', name: 't-shirts' }, { path: '/clothing/hoodies/', name: 'hoodies' }, ...fixed];
  for (const target of targets) for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
    const address = server.address();
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin === `http://127.0.0.1:${address.port}`) return route.continue();
      blocked.push(url.origin); return route.abort();
    });
    const response = await page.goto(`http://127.0.0.1:${address.port}${target.path}`);
    if (response.status() !== 200) throw new Error(`Baseline page not served: ${target.path}`);
    const html = await response.text();
    if (/OFFLINE SYNTHETIC RESPONSE|data-page-source="sanity"|mailto:|wa\.me\//.test(html)) throw new Error('CAPTURE_NOT_DEFAULT_MOCK');
    for (const img of await page.locator('img').all()) {
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(async node => { await node.decode(); });
    }
    await page.evaluate(() => scrollTo(0, 0));
    metrics.push({ width, path: target.path, ...(await page.evaluate(() => ({
      imageTop: document.querySelector('.hero .media-frame')?.getBoundingClientRect().top ?? null,
      title: document.title,
    }))) });
    const file = `${target.name}-${width}.png`;
    const bytes = await page.screenshot({ path: `${output}/${file}`, fullPage: true, animations: 'disabled' });
    screenshots.push({ file, width, height: bytes.readUInt32BE(20), sha256: createHash('sha256').update(bytes).digest('hex'), htmlSha256: createHash('sha256').update(html).digest('hex') });
    if (!current) await page.screenshot({ path: `${output}/${target.name}-${width}-viewport.png`, animations: 'disabled' });
    await page.close();
  }
  await writeFile(`${output}/metrics.json`, JSON.stringify(metrics, null, 2));
  if (blocked.length) throw new Error('CAPTURE_EXTERNAL_REQUEST');
  await writeFile(`${output}/capture.json`, JSON.stringify({ sha, tree, capturedAt, source: current ? 'Current-head default mock' : 'Actual PR base default mock', workingTreeClean: true, browserVersion: browser.version(), node: process.version, platform: process.platform, screenshots }, null, 2));
  console.log('Captured actual-base Home, Category and fixed-page baselines at 1440x900 and 390x844.');
} finally {
  if (browser) await browser.close();
  await new Promise(done => server.close(done));
}
