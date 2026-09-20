import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import routes from '../config/routes.json';
import { createOfflineSiteHarness, type OfflineSiteState } from './helpers/offline-site-server';
import { siteDeliveryFixture } from './fixtures/site-delivery';
import { mutateSite } from './fixtures/cms-site';
import { sourceIdentity } from './helpers/offline-cms-server';

function filesIn(root: string): string[] {
  return !existsSync(root) ? [] : readdirSync(root, { withFileTypes: true }).flatMap(item => item.isDirectory() ? filesIn(join(root, item.name)) : [join(root, item.name)]);
}
function hashTree(root: string) {
  const hash = createHash('sha256'); for (const file of filesIn(root).sort()) { hash.update(relative(root, file)); hash.update(readFileSync(file)); } return hash.digest('hex');
}
function build(harness: ReturnType<typeof createOfflineSiteHarness>, output: string) {
  return spawnSync(process.execPath, [harness.cli, 'build', '--root', 'web', '--outDir', output], { env: harness.env, encoding: 'utf8', timeout: 60000 });
}
const htmlName = (path: string) => path === '/' ? 'index.html' : `${path.slice(1)}index.html`;

test('default mock really builds eleven routes without a CMS transport call', { timeout: 90000 }, () => {
  const harness = createOfflineSiteHarness('mock', 'mock'), ordinary = hashTree('web/dist');
  try {
    const output = join(harness.directory, 'default-dist'), result = build(harness, output);
    assert.equal(result.status, 0, (result.stdout ?? '') + (result.stderr ?? ''));
    assert.equal(filesIn(output).filter(file => file.endsWith('.html')).length, 11);
    assert.deepEqual(harness.calls(), []); assert.equal(hashTree('web/dist'), ordinary);
    const boundary = spawnSync(process.execPath, ['scripts/check-cms-boundary.mjs', output], { env: harness.env, encoding: 'utf8' });
    assert.equal(boundary.status, 0, boundary.stdout + boundary.stderr);
  } finally { harness.dispose(); }
});

test('two actual isolated builds render revised CMS modules and a consistent brand/cards/details snapshot', { timeout: 180000 }, () => {
  const harness = createOfflineSiteHarness(), ordinary = hashTree('web/dist');
  const evidence = resolve('review/site-delivery/build'); mkdirSync(evidence, { recursive: true });
  try {
    const records = [];
    for (const revision of ['one', 'two']) {
      const output = join(harness.directory, `${revision}-dist`); harness.setState({ bundle: siteDeliveryFixture(revision) });
      const result = build(harness, output), log = (result.stdout ?? '') + (result.stderr ?? '');
      writeFileSync(join(evidence, `build-${revision}.txt`), log.replaceAll(harness.token, '[REDACTED]'));
      assert.equal(result.status, 0, 'Inspect dedicated offline build log.'); assert.ok(!log.includes(harness.token));
      const htmlFiles = filesIn(output).filter(file => file.endsWith('.html'));
      assert.equal(htmlFiles.length, 11);
      for (const file of htmlFiles) {
        const html = readFileSync(file, 'utf8');
        assert.ok(html.includes(`OFFLINE STUDIO ${revision}`), 'Every layout must use the same selected brand.');
        assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1);
        assert.match(html, /noindex, nofollow/); assert.match(html, /OFFLINE SYNTHETIC RESPONSE/);
        assert.doesNotMatch(html, /href="mailto:|href="https:\/\/wa.me|<form\b|<iframe\b|Email copied|Message sent|SANITY_READ_TOKEN|cms-site-query|cms_site_bundle|factory@example.invalid|8613800138000/);
        assert.ok(!html.includes(harness.token));
        for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
          assert.match(script[1]!, /src="\/_astro\/[^"?]+\.js"/); assert.equal(script[2]!.trim(), '');
        }
      }
      const home = readFileSync(join(output, 'index.html'), 'utf8');
      assert.ok(home.indexOf('data-category-card="hoodies"') < home.indexOf('data-category-card="t-shirts"'));
      for (const slug of ['t-shirts', 'hoodies']) {
        const category = readFileSync(join(output, `clothing/${slug}/index.html`), 'utf8');
        const name = `Offline ${slug === 'hoodies' ? 'Hoodies' : 'T-shirts'} ${revision}`;
        const intro = `OFFLINE ${revision}: ${slug} introduction and category-card summary from one record.`;
        assert.ok(home.includes(name) && category.includes(name)); assert.ok(home.includes(intro) && category.includes(intro));
        const heroAsset = category.match(/data-cms-asset-id="([^"]+)"/)?.[1]; assert.ok(heroAsset && home.includes(heroAsset));
        for (const marker of ['sample-grid', 'sample-specifications', '245 GSM', 'OFFLINE test technique notes', 'capability limitation', 'evidence-grid', 'Related reading.']) assert.ok(category.includes(marker), marker);
        assert.equal((category.match(/class="sample-card"/g) ?? []).length, 3);
        assert.match(category, slug === 'hoodies' ? /120 pieces/ : /Project-based; no fixed minimum quantity/);
        writeFileSync(join(evidence, `${slug}-${revision}.html`), category);
      }
      for (const marker of ['OFFLINE capability 1 business description', 'OFFLINE factory summary', 'OFFLINE process 1 business description', 'OFFLINE home answer 1', 'OFFLINE customization overview', 'OFFLINE sampling overview', 'not-supplied']) assert.ok(home.includes(marker), marker);
      assert.ok(!home.includes('An obsolete title hint')); writeFileSync(join(evidence, `home-${revision}.html`), home);
      for (const route of routes.pages) assert.ok(existsSync(join(output, htmlName(route.path))));
      const boundary = spawnSync(process.execPath, ['scripts/check-cms-boundary.mjs', output], { env: harness.env, encoding: 'utf8' });
      assert.notEqual(boundary.status, 0, 'Default scanner must continue to reject synthetic output.');
      assert.ok(!(boundary.stdout + boundary.stderr).includes(harness.token));
      records.push({ revision, files: htmlFiles.map(file => ({ path: relative(output, file), sha256: createHash('sha256').update(readFileSync(file)).digest('hex') })) });
    }
    assert.equal(hashTree('web/dist'), ordinary);
    assert.equal(harness.calls().filter(call => call.kind === 'site').length, 2, 'Exactly one site query in each new build.');
    assert.equal(harness.calls().filter(call => call.kind === 'article').length, 2, 'Reuse the article delivery snapshot.');
    assert.ok(harness.calls().every(call => call.allowed));
    writeFileSync(join(evidence, 'evidence.json'), JSON.stringify({ ...sourceIdentity(), scope: 'DEV-05E offline actual routes; fixed GROQ + Query envelope + reader + converter + existing templates', actualCloudRequests: 0, ordinaryOutputUntouched: true, records }, null, 2));
  } finally { harness.dispose(); }
});

const failureCases: [string, string, (state: OfflineSiteState) => void][] = [
  ['missing home group', 'CMS_INVALID', state => mutateSite(state.bundle!, ['pages', 0, 'templateContent'], null)],
  ['missing non-migrated page', 'CMS_INVALID', state => (state.bundle!['pages'] as unknown[]).pop()],
  ['duplicate route', 'CMS_DUPLICATE_ROUTE', state => mutateSite(state.bundle!, ['pages', 1, 'pageKey'], 'home')],
  ['broken reference', 'CMS_INVALID', state => mutateSite(state.bundle!, ['categories', 0, 'relatedArticles', 0, '_ref'], 'missing.document')],
  ['unapproved image', 'CMS_ASSET_APPROVAL', state => mutateSite(state.bundle!, ['categories', 0, 'heroImage', 'publicUseApproved'], false)],
  ['unsafe copy', 'CMS_UNSAFE_TEXT', state => mutateSite(state.bundle!, ['pages', 0, 'templateContent', 'factorySummary'], '<script>alert(1)</script>')],
  ['unknown projected business field', 'CMS_UNSUPPORTED_FIELD', state => { state.resultPatch = { path: ['settings', 0, 'style'], value: 'invalid' }; }],
  ['401', 'CMS_UNAUTHENTICATED', state => { state.status = 401; }],
  ['403', 'CMS_FORBIDDEN', state => { state.status = 403; }],
  ['timeout', 'CMS_TIMEOUT', state => { state.delayMs = 10000; }],
];
for (const [name, code, change] of failureCases) test(`actual three-page published build fails without fallback: ${name}`, { timeout: 90000 }, () => {
  const harness = createOfflineSiteHarness('mock'), ordinary = hashTree('web/dist');
  try {
    const state: OfflineSiteState = { bundle: siteDeliveryFixture() }; change(state); harness.setState(state);
    const output = join(harness.directory, 'failed-dist'), result = build(harness, output), log = (result.stdout ?? '') + (result.stderr ?? '');
    assert.notEqual(result.status, 0); assert.ok(log.includes(code), `Expected ${code}; actual output is retained only on failure: ${log.replaceAll(harness.token, '[REDACTED]')}`);
    assert.ok(!log.includes(harness.token)); assert.equal(existsSync(join(output, 'index.html')), false);
    assert.equal(hashTree('web/dist'), ordinary); assert.ok(harness.calls().every(call => call.allowed));
  } finally { harness.dispose(); }
});
