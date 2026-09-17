import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { loadLocalEnvironment } from '../config/runtime';
import { CmsContentError } from '../shared/cms-validation';
import { dev05bDraftScope } from '../shared/cms-draft-preview';
import { articleReaderConfigFromEnvironment, createArticleReader } from '../web/src/lib/server/cms-article-query';
import { createDraftPreviewReader, draftPreviewConfigFromEnvironment } from '../web/src/lib/server/cms-draft-preview-query';

loadLocalEnvironment();
const expectedExcerpt = process.argv[2];
if (!expectedExcerpt) throw new Error('LIVE_CMS_EVIDENCE: pass the exact expected draft excerpt as the first argument.');
const draftReader = createDraftPreviewReader(draftPreviewConfigFromEnvironment(process.env));
const draft = await draftReader.read(dev05bDraftScope.documentId, dev05bDraftScope.slug);
assert.equal(draft.excerpt, expectedExcerpt, 'LIVE_CMS_EVIDENCE: live draft excerpt does not match the expected saved value.');
let publishedHidden = false;
try {
  await createArticleReader(articleReaderConfigFromEnvironment(process.env)).read(dev05bDraftScope.documentId, dev05bDraftScope.slug);
} catch (error) {
  publishedHidden = error instanceof CmsContentError && error.code === 'CMS_EMPTY';
}
assert.equal(publishedHidden, true, 'LIVE_CMS_EVIDENCE: published perspective unexpectedly exposed the draft.');

const output = resolve('.local/cms-draft-live'); mkdirSync(output, { recursive: true });
const child = spawn(process.execPath, ['scripts/run-tool.mjs', 'astro', 'dev', '--root', 'web', '--host', '127.0.0.1', '--port', '4323'], {
  cwd: process.cwd(), env: { ...process.env, DEV_CMS_DRAFT_PREVIEW: '1', ASTRO_TELEMETRY_DISABLED: '1', DO_NOT_TRACK: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
child.stdout?.on('data', chunk => { serverLog += String(chunk); }); child.stderr?.on('data', chunk => { serverLog += String(chunk); });
const target = 'http://127.0.0.1:4323/blog/what-to-send-for-a-clothing-quote/';
async function waitForServer() {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    if (child.exitCode != null) throw new Error(`LIVE_CMS_EVIDENCE: Astro exited early (${child.exitCode}).`);
    try { const response = await fetch(target); if (response.status === 200) return; } catch { /* bounded retry while the local server starts */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('LIVE_CMS_EVIDENCE: local preview server did not become ready.');
}
function dimensions(bytes: Buffer) {
  assert.ok(bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.toString('ascii', 12, 16) === 'IHDR');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
let browser;
try {
  await waitForServer(); browser = await chromium.launch();
  const screenshots: { name: string; width: number; height: number; sha256: string }[] = [];
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
    const external: string[] = [], errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => { if (new URL(route.request().url()).hostname !== '127.0.0.1') { external.push(route.request().url()); return route.abort(); } return route.continue(); });
    const response = await page.goto(target); assert.equal(response?.status(), 200);
    assert.equal(await page.locator('h1').innerText(), draft.title);
    assert.equal(await page.locator('.article-header .draft-status').innerText(), 'CMS draft preview / Not published');
    assert.equal(await page.locator('.article-header .intro').innerText(), expectedExcerpt);
    assert.equal(await page.locator('.article-cover').count(), 0, 'Live draft must not invent or reuse an approved CMS cover.');
    assert.equal(await page.locator('.editorial-template pre').count(), 1); assert.equal(await page.locator('table').count(), 1); assert.equal(await page.locator('.article-toc a').count(), 7);
    assert.equal(await page.locator('form, iframe, input, textarea, a[href^="mailto:"], a[href*="wa.me"]').count(), 0);
    const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth })); assert.ok(size.document <= size.viewport + 1, JSON.stringify(size));
    assert.deepEqual(errors, []); assert.deepEqual(external, []);
    const captures = [
      { name: `quote-live-${width}`, fullPage: true, prepare: async () => page.evaluate(() => scrollTo(0, 0)) },
      { name: `quote-live-${width}-viewport`, fullPage: false, prepare: async () => page.evaluate(() => scrollTo(0, 0)) },
      { name: `quote-live-${width}-table`, fullPage: false, prepare: async () => page.locator('.editorial-table').scrollIntoViewIfNeeded() },
      { name: `quote-live-${width}-template`, fullPage: false, prepare: async () => page.locator('.editorial-template').scrollIntoViewIfNeeded() },
    ];
    for (const capture of captures) {
      await capture.prepare(); const path = `${output}/${capture.name}.png`; await page.screenshot({ path, fullPage: capture.fullPage, animations: 'disabled' });
      const bytes = readFileSync(path), image = dimensions(bytes); assert.equal(image.width, width);
      screenshots.push({ name: capture.name, ...image, sha256: createHash('sha256').update(bytes).digest('hex') });
    }
    await page.close();
  }
  const evidence = { scope: 'DEV-05B local-only real Sanity draft preview; never a published-site or visual-approval claim.', head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(), platform: process.platform, node: process.version, browser: browser.version(), testedAt: new Date().toISOString(),
    projectId: dev05bDraftScope.projectId, dataset: dev05bDraftScope.dataset, documentId: draft.documentId, revision: draft.revision, excerpt: draft.excerpt,
    draftPerspectiveReadable: true, publishedPerspectiveReadable: false, productionAllowed: draft.productionAllowed, screenshots };
  writeFileSync(`${output}/evidence.json`, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ documentId: draft.documentId, revision: draft.revision, publishedPerspectiveReadable: false, screenshots: screenshots.length, evidence: '.local/cms-draft-live/evidence.json' }));
} catch (error) {
  const token = process.env['SANITY_READ_TOKEN']; const safe = token ? serverLog.split(token).join('[REDACTED]') : serverLog;
  if (safe) console.error(safe.slice(-4000)); throw error;
} finally {
  if (browser) await browser.close(); child.kill('SIGTERM');
}
