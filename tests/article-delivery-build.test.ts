import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { createOfflineCmsHarness, newEvidenceDirectory, sourceIdentity } from './helpers/offline-cms-server';
import { fixtureArticle, previews, mutate } from './fixtures/cms-articles';

function hashTree(root: string): string {
  if (!existsSync(root)) return 'absent';
  const hash = createHash('sha256');
  function visit(directory: string) {
    for (const item of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, item.name);
      if (item.isDirectory()) visit(path);
      else { hash.update(relative(root, path)); hash.update(readFileSync(path)); }
    }
  }
  visit(root); return hash.digest('hex');
}

test('published collection really builds all three surfaces through the existing templates in dedicated offline output only', { timeout: 120000 }, () => {
  const harness = createOfflineCmsHarness('published');
  const ordinary = resolve('web/dist'), before = hashTree(ordinary);
  const output = join(harness.directory, 'published-dist'), evidence = newEvidenceDirectory('offline-published-build');
  try {
    const built = spawnSync(process.execPath, [harness.cli, 'build', '--root', 'web', '--outDir', output], { env: harness.env, encoding: 'utf8', timeout: 60000 });
    const log = (built.stdout ?? '') + (built.stderr ?? '');
    writeFileSync(join(evidence, 'build.txt'), log.replaceAll(harness.token, '[REDACTED_OFFLINE_TOKEN]'));
    assert.equal(built.status, 0, 'Dedicated published renderer build failed; inspect its offline evidence.');
    assert.equal(log.includes(harness.token), false);
    assert.equal(hashTree(ordinary), before, 'Offline published verification must not touch the normal mock site.');
    const calls = harness.calls(); assert.equal(calls.length, 1, 'One actual build must share one published collection snapshot.');
    assert.ok(calls.every(call => call.allowed && call.perspective === 'published'));
    const doc = harness.initial[0]!;
    const paths = ['index.html', 'blog/index.html', 'blog/what-to-send-for-a-clothing-quote/index.html'];
    const files = paths.map(path => {
      const html = readFileSync(join(output, path), 'utf8');
      assert.ok(html.includes(doc.title) && html.includes(doc.excerpt));
      assert.ok(html.includes('data-preview-status="cms_published"') && html.includes('data-cms-perspective="published"'));
      assert.ok(html.includes(`data-cms-revision="${doc._rev}"`)); assert.ok(html.includes('data-cover-state="approved"'));
      assert.ok(!html.includes(harness.token)); assert.doesNotMatch(html, /cms_article_draft_preview|data-article-source="local"/);
      assert.match(html, /name="robots" content="noindex, nofollow"/); assert.doesNotMatch(html, /href="mailto:|href="https:\/\/wa.me|<form\b/);
      writeFileSync(join(evidence, path.replaceAll('/', '-')), html);
      return { path, sha256: createHash('sha256').update(html).digest('hex') };
    });
    const scanner = spawnSync(process.execPath, ['scripts/check-cms-boundary.mjs', output], { env: harness.env, encoding: 'utf8', timeout: 10000 });
    assert.notEqual(scanner.status, 0, 'The normal artifact scanner must reject offline published fixtures.');
    assert.ok(!((scanner.stdout ?? '') + (scanner.stderr ?? '')).includes(harness.token));
    writeFileSync(join(evidence, 'evidence.json'), JSON.stringify({ ...sourceIdentity(), scope: 'OFFLINE published records rendered by the actual existing routes; not a normal-site artifact or a live publication rehearsal.',
      passed: true, networkCalls: 0, interceptedPublishedReads: calls.length, ordinaryMockOutputUntouched: true, normalScannerRejectedFixture: true, files }, null, 2));
  } finally { harness.dispose(); }
});

for (const scenario of ['empty', 'broken reference'] as const) test(`actual published build aborts on ${scenario}; no draft or local fallback`, { timeout: 60000 }, () => {
  const harness = createOfflineCmsHarness('published');
  try {
    const docs = previews.map(fixtureArticle);
    if (scenario === 'broken reference') mutate(docs[0], ['relatedCategories', 0, 'document'], null);
    harness.setResponse(scenario === 'empty' ? [] : docs);
    const result = spawnSync(process.execPath, [harness.cli, 'build', '--root', 'web', '--outDir', join(harness.directory, 'failed-dist')], { env: harness.env, encoding: 'utf8', timeout: 45000 });
    const log = (result.stdout ?? '') + (result.stderr ?? '');
    assert.notEqual(result.status, 0); assert.match(log, scenario === 'empty' ? /CMS_EMPTY/ : /CMS_INVALID|CMS_REFERENCE/);
    assert.ok(!log.includes(harness.token)); assert.equal(existsSync(join(harness.directory, 'failed-dist', 'index.html')), false);
    assert.ok(harness.calls().every(call => call.allowed));
  } finally { harness.dispose(); }
});

for (const host of ['0.0.0.0', '::']) test(`actual draft dev rejects nonloopback listener ${host} before any CMS query`, { timeout: 20000 }, () => {
  const harness = createOfflineCmsHarness('draft-preview');
  try {
    const result = spawnSync(process.execPath, [harness.cli, 'dev', '--root', 'web', '--host', host], { env: harness.env, encoding: 'utf8', timeout: 15000 });
    assert.notEqual(result.status, 0); assert.match((result.stdout ?? '') + (result.stderr ?? ''), /CMS_DRAFT_PREVIEW_LOOPBACK_ONLY/);
    assert.deepEqual(harness.calls(), []);
  } finally { harness.dispose(); }
});
