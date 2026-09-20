import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import routes from '../config/routes.json';
import { createOfflineSiteHarness, type OfflineSiteState } from './helpers/offline-site-server';
import { siteDeliveryFixture } from './fixtures/site-delivery';
import { mutateSite } from './fixtures/cms-site';
import { sourceIdentity } from './helpers/offline-cms-server';

const fixed = [['manufacturing', '/manufacturing/'], ['factory', '/our-factory/'], ['contact', '/contact/'], ['blogIndex', '/blog/'], ['privacy', '/privacy/']] as const;
function filesIn(root: string): string[] {
  return !existsSync(root) ? [] : readdirSync(root, { withFileTypes: true }).flatMap(item => item.isDirectory() ? filesIn(join(root, item.name)) : [join(root, item.name)]);
}
function hashTree(root: string) {
  const hash = createHash('sha256'); for (const file of filesIn(root).sort()) { hash.update(relative(root, file)); hash.update(readFileSync(file)); } return hash.digest('hex');
}
const htmlName = (path: string) => path === '/' ? 'index.html' : `${path.slice(1)}index.html`;
function build(harness: ReturnType<typeof createOfflineSiteHarness>, output: string) {
  return spawnSync(process.execPath, [harness.cli, 'build', '--root', 'web', '--outDir', output], { env: harness.env, encoding: 'utf8', timeout: 60000 });
}

test('all five original templates render two strict CMS body revisions in isolated actual builds', { timeout: 180000 }, () => {
  const harness = createOfflineSiteHarness('published', 'published', 'published'), ordinary = hashTree('web/dist');
  const evidence = resolve('review/fixed-delivery', `build-${randomUUID()}`); mkdirSync(evidence, { recursive: true });
  try {
    const records = [];
    for (const revision of ['one', 'two']) {
      harness.setState({ bundle: siteDeliveryFixture(revision) });
      const output = join(harness.directory, `${revision}-fixed-dist`), result = build(harness, output);
      const log = (result.stdout ?? '') + (result.stderr ?? '');
      writeFileSync(join(evidence, `build-${revision}.txt`), log.replaceAll(harness.token, '[REDACTED]'));
      assert.equal(result.status, 0, log.replaceAll(harness.token, '[REDACTED]'));
      assert.equal(filesIn(output).filter(file => file.endsWith('.html')).length, 11);
      const titles = new Set<string>(), descriptions = new Set<string>();
      for (const route of routes.pages) {
        const html = readFileSync(join(output, htmlName(route.path)), 'utf8');
        assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1);
        assert.match(html, /noindex, nofollow/); assert.ok(html.includes(`OFFLINE STUDIO ${revision}`));
        assert.doesNotMatch(html, /href="mailto:|href="https:\/\/wa.me|<form\b|<iframe\b|Email copied|Message sent|SANITY_READ_TOKEN|cms-site-query|cms_site_bundle|factory@example.invalid|8613800138000/);
        assert.ok(!html.includes(harness.token));
        const title = html.match(/<title>(.*?)<\/title>/)?.[1], description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
        assert.ok(title && description); assert.ok(!titles.has(title)); assert.ok(!descriptions.has(description));
        titles.add(title); descriptions.add(description);
        for (const [, href] of html.matchAll(/<a\b[^>]*href="(\/[^"?]*|#[^"]+)"/g)) {
          const link = new URL(href!, `http://127.0.0.1${route.path}`), target = join(output, htmlName(link.pathname));
          assert.ok(existsSync(target), `Missing internal target ${link.pathname}`);
          if (link.hash) assert.ok(readFileSync(target, 'utf8').includes(`id="${link.hash.slice(1)}"`), `Missing fragment ${href}`);
        }
      }
      for (const [key, path] of fixed) {
        const html = readFileSync(join(output, htmlName(path)), 'utf8');
        assert.match(html, /data-page-source="sanity"/); assert.match(html, /data-page-status="cms_published"/);
        assert.ok(html.includes(`data-page-revision="offline-${key}-${revision}"`));
        const markers: Record<string, string[]> = {
          manufacturing: [`OFFLINE manufacturing productionSteps 1 ${revision}`, `OFFLINE manufacturing FAQ 1 ${revision}`, `OFFLINE manufacturing options 1 ${revision}`, `OFFLINE preparation note ${revision}`],
          factory: [`OFFLINE factory overview ${revision}`, `OFFLINE factory arrangements 1 ${revision}`, `OFFLINE factory qualityDiscussion 1 ${revision}`],
          contact: [`OFFLINE contact preparation 1 ${revision}`, `OFFLINE contact preparation note ${revision}`],
          blogIndex: [`OFFLINE Journal column note ${revision}`, 'data-article-card', 'data-article-source="sanity"'],
          privacy: [`OFFLINE policy paragraph ${revision}`, 'draft_not_in_effect', 'not in effect', 'data-legal-review-status="pending"'],
        };
        for (const marker of markers[key]!) assert.ok(html.includes(marker), `${key}: ${marker}`);
        if (key === 'manufacturing') {
          for (const anchor of ['options', 'moq', 'prepare', 'sampling', 'production', 'faq']) assert.ok(html.includes(`id="${anchor}"`));
          assert.match(html, /data-moq-mode="projectBased"/); assert.doesNotMatch(html, /120 pieces/);
        }
        if (key === 'factory') {
          assert.match(html, /data-factory-media-status="awaiting_factory"/);
          assert.doesNotMatch(html, /data-factory-gallery|data-factory-credentials/);
        }
        if (key === 'privacy') assert.doesNotMatch(html, /class="mobile-contact-bar"|class="footer-contact-row"|class="pending-contact"|data-reference-code/);
        if (key === 'blogIndex') assert.equal((html.match(/data-article-card=/g) ?? []).length, 2);
        writeFileSync(join(evidence, `${key}-${revision}.html`), html);
      }
      const home = readFileSync(join(output, 'index.html'), 'utf8'), journal = readFileSync(join(output, 'blog/index.html'), 'utf8');
      for (const slug of ['what-to-send-for-a-clothing-quote', 'moq-per-style-per-color']) {
        assert.ok(home.includes(`/blog/${slug}/`) && journal.includes(`/blog/${slug}/`));
        assert.match(readFileSync(join(output, `blog/${slug}/index.html`), 'utf8'), /data-article-source="sanity"/);
      }
      const notFound = readFileSync(join(output, '404.html'), 'utf8');
      assert.doesNotMatch(notFound, /class="mobile-contact-bar"|class="footer-contact-row"|data-reference-code/);
      const boundary = spawnSync(process.execPath, ['scripts/check-cms-boundary.mjs', output], { env: harness.env, encoding: 'utf8' });
      assert.notEqual(boundary.status, 0, 'Normal public-output scanner must reject synthetic site content.');
      records.push({ revision, files: filesIn(output).filter(file => file.endsWith('.html')).map(file => ({ path: relative(output, file), sha256: createHash('sha256').update(readFileSync(file)).digest('hex') })) });
    }
    assert.equal(hashTree('web/dist'), ordinary);
    assert.equal(harness.calls().filter(call => call.kind === 'site').length, 2);
    assert.equal(harness.calls().filter(call => call.kind === 'article').length, 2);
    assert.ok(harness.calls().every(call => call.allowed));
    writeFileSync(join(evidence, 'evidence.json'), JSON.stringify({ ...sourceIdentity(), scope: 'DEV-05F five original fixed templates; actual GROQ, HTTP envelope, reader, converter, snapshot and Astro build', source: 'OFFLINE SYNTHETIC; NOT REAL SANITY CONTENT', actualCloudRequests: 0, ordinaryOutputUntouched: true, records }, null, 2));
  } finally { harness.dispose(); }
});

const failures: [string, string, (state: OfflineSiteState) => void][] = [
  ['Manufacturing required process', 'CMS_INVALID', state => mutateSite(state.bundle!, ['pages', 1, 'templateContent', 'productionSteps'], [])],
  ['Factory required introduction', 'CMS_INVALID', state => mutateSite(state.bundle!, ['pages', 2, 'templateContent', 'overview'], '')],
  ['Contact required preparation', 'CMS_INVALID', state => mutateSite(state.bundle!, ['pages', 3, 'templateContent', 'preparation'], [])],
  ['Journal required column text', 'CMS_INVALID', state => mutateSite(state.bundle!, ['pages', 4, 'templateContent', 'columnNote'], null)],
  ['Privacy required body', 'CMS_INVALID', state => mutateSite(state.bundle!, ['pages', 5, 'templateContent', 'body'], [])],
  ['pageKey mismatch', 'CMS_TEMPLATE_SCOPE', state => mutateSite(state.bundle!, ['pages', 2, 'templateContent', 'pageKey'], 'contact')],
  ['unsafe policy HTML', 'CMS_UNSAFE_TEXT', state => mutateSite(state.bundle!, ['pages', 5, 'templateContent', 'body', 0, 'children', 0, 'text'], '<script>alert(1)</script>')],
  ['policy activation', 'CMS_POLICY_NOT_EFFECTIVE', state => mutateSite(state.bundle!, ['pages', 5, 'templateContent', 'policyStatus'], 'in_effect')],
];
for (const [name, code, change] of failures) test(`actual five-page CMS build rejects ${name}`, { timeout: 90000 }, () => {
  const harness = createOfflineSiteHarness('published', 'published', 'published'), ordinary = hashTree('web/dist');
  try {
    const state: OfflineSiteState = { bundle: siteDeliveryFixture() }; change(state); harness.setState(state);
    const output = join(harness.directory, 'failed-fixed-dist'), result = build(harness, output), log = (result.stdout ?? '') + (result.stderr ?? '');
    assert.notEqual(result.status, 0); assert.ok(log.includes(code), log.replaceAll(harness.token, '[REDACTED]'));
    assert.ok(!log.includes(harness.token)); assert.equal(existsSync(join(output, 'index.html')), false);
    assert.equal(hashTree('web/dist'), ordinary); assert.ok(harness.calls().every(call => call.allowed));
  } finally { harness.dispose(); }
});
