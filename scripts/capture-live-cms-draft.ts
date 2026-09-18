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
const worktree = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], { encoding: 'utf8' }).trim();
assert.equal(worktree, '', 'LIVE_CMS_EVIDENCE: exact-head capture requires a clean tracked/untracked worktree.');
const draftReader = createDraftPreviewReader(draftPreviewConfigFromEnvironment(process.env));
const draft = await draftReader.read(dev05bDraftScope.documentId, dev05bDraftScope.slug);
let publishedHidden = false;
try {
  await createArticleReader(articleReaderConfigFromEnvironment(process.env)).read(dev05bDraftScope.documentId, dev05bDraftScope.slug);
} catch (error) {
  publishedHidden = error instanceof CmsContentError && error.code === 'CMS_EMPTY';
}
assert.equal(publishedHidden, true, 'LIVE_CMS_EVIDENCE: published perspective unexpectedly exposed the draft.');

const runStamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = resolve('.local/cms-draft-review', runStamp); mkdirSync(output, { recursive: true });
const child = spawn(process.execPath, ['scripts/run-tool.mjs', 'astro', 'dev', '--root', 'web', '--host', '127.0.0.1', '--port', '4323'], {
  cwd: process.cwd(), env: { ...process.env, DEV_CMS_DRAFT_PREVIEW: '1', ARTICLE_CONTENT_MODE: 'draft-preview', ASTRO_TELEMETRY_DISABLED: '1', DO_NOT_TRACK: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
child.stdout?.on('data', chunk => { serverLog += String(chunk); }); child.stderr?.on('data', chunk => { serverLog += String(chunk); });
const origin = 'http://127.0.0.1:4323';
const target = `${origin}/blog/${dev05bDraftScope.slug}/`;
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
  const quotePath = `/blog/${dev05bDraftScope.slug}/`;
  const cardSelector = `[data-article-card="${dev05bDraftScope.slug}"]`;
  const surfaces = [
    { name: 'home-journal', path: '/', selector: cardSelector, detail: false },
    { name: 'journal', path: '/blog/', selector: cardSelector, detail: false },
    { name: 'quote', path: quotePath, selector: '.article-page', detail: true },
  ] as const;
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
    const external: string[] = [], errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => { if (new URL(route.request().url()).hostname !== '127.0.0.1') { external.push(route.request().url()); return route.abort(); } return route.continue(); });
    for (const surface of surfaces) {
      const response = await page.goto(`${origin}${surface.path}`); assert.equal(response?.status(), 200);
      assert.ok(response?.headers()['cache-control']?.includes('no-store'), `LIVE_CMS_EVIDENCE: ${surface.name} must be no-store.`);
      const record = page.locator(surface.selector);
      assert.equal(await record.getAttribute('data-article-source'), 'sanity');
      assert.equal(await record.getAttribute('data-preview-status'), 'cms_draft_preview');
      assert.equal(await record.getAttribute('data-production-allowed'), 'false');
      assert.equal(await record.getAttribute('data-article-reference'), dev05bDraftScope.referenceCode);
      assert.equal(await record.getAttribute('data-cms-perspective'), 'drafts');
      assert.equal(await record.getAttribute('data-cms-revision'), draft.revision, `Rendered ${surface.name} revision must match the independent server read.`);
      assert.equal(await record.getAttribute('data-cover-state'), 'missing');
      assert.equal(await record.locator('img').count(), 0, 'Live draft must not invent or reuse an approved CMS cover.');
      assert.equal(await record.locator('.article-cover-empty').count(), 1);
      if (surface.detail) {
        assert.equal(await page.locator('h1').innerText(), draft.title);
        assert.equal(await page.locator('.article-header .intro').innerText(), draft.excerpt);
        assert.equal(await page.locator('.article-header .draft-status').innerText(), 'CMS draft preview / Not published');
        assert.equal(await page.locator('.editorial-template pre').count(), 1);
        assert.equal(await page.locator('table').count(), 1);
        assert.equal(await page.locator('.article-toc a').count(), 7);
      } else {
        assert.equal(await record.locator('h2 a, h3 a').innerText(), draft.title);
        assert.equal(await record.locator('.card-excerpt').innerText(), draft.excerpt);
        assert.equal(await record.locator('.draft-status').innerText(), 'CMS draft preview / Not published');
        assert.equal(await record.locator('h2 a, h3 a').getAttribute('href'), quotePath);
        const localMoq = page.locator('[data-article-card="moq-per-style-per-color"]');
        assert.equal(await localMoq.getAttribute('data-article-source'), 'local');
        assert.equal(await localMoq.getAttribute('data-preview-status'), 'editorial_draft');
      }
      assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
      assert.equal(await page.locator('form, iframe, input, textarea, a[href^="mailto:"], a[href*="wa.me"]').count(), 0);
      assert.equal(await page.locator('.pending-contact button:not([disabled])').count(), 0, 'Pending contact controls must remain disabled.');
      for (const image of await page.locator('img').all()) { await image.scrollIntoViewIfNeeded(); assert.equal(await image.evaluate(element => (element as HTMLImageElement).complete), true); }
      const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth })); assert.ok(size.document <= size.viewport + 1, JSON.stringify(size));
      const html = await response!.text(), token = process.env['SANITY_READ_TOKEN']; if (token) assert.equal(html.includes(token), false);
      assert.deepEqual(errors, []); assert.deepEqual(external, []);
      await page.evaluate(() => scrollTo(0, 0));
      const name = `cms-live-${surface.name}-${width}`, path = `${output}/${name}.png`;
      await page.screenshot({ path, fullPage: true, animations: 'disabled' });
      const bytes = readFileSync(path), image = dimensions(bytes); assert.equal(image.width, width);
      screenshots.push({ name, ...image, sha256: createHash('sha256').update(bytes).digest('hex') });
    }
    await page.close();
  }
  const hashText = (value: string) => createHash('sha256').update(value).digest('hex');
  const evidence = { scope: 'DEV-05C local-only real Sanity draft delivery review across Home, Journal and quote detail; distinct from default mock/offline synthetic CI evidence and never a published-site or visual-approval claim.', head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(), platform: process.platform, node: process.version, browser: browser.version(), testedAt: new Date().toISOString(),
    projectId: dev05bDraftScope.projectId, dataset: dev05bDraftScope.dataset, documentId: draft.documentId, revision: draft.revision, draftSavedAt: draft.draftSavedAt,
    factReviewStatus: draft.factReviewStatus, titleLength: draft.title.length, titleSha256: hashText(draft.title), excerptLength: draft.excerpt.length, excerptSha256: hashText(draft.excerpt),
    bodyBlocks: draft.body.length, tables: draft.body.filter(block => block.type === 'table').length, templates: draft.body.filter(block => block.type === 'template').length,
    draftPerspectiveReadable: true, publishedPerspectiveReadable: false, productionAllowed: draft.productionAllowed, contactsConfigured: false,
    deliveryMode: 'draft-preview', surfaces: surfaces.map(surface => surface.name), screenshots };
  writeFileSync(`${output}/evidence.json`, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ documentId: draft.documentId, revision: draft.revision, publishedPerspectiveReadable: false, screenshots: screenshots.length, evidence: `${output}/evidence.json` }));
} catch (error) {
  const token = process.env['SANITY_READ_TOKEN']; const safe = token ? serverLog.split(token).join('[REDACTED]') : serverLog;
  if (safe) console.error(safe.slice(-4000)); throw error;
} finally {
  if (browser) await browser.close(); child.kill('SIGTERM');
}
