import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID, createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { relative, resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { convertCmsArticles } from '../shared/cms-article';
import type { EditorialBlock } from '../shared/editorial';
import { fixtureArticle, fixtureContext, previews } from './fixtures/cms-articles';

// This isolated Astro root is created by the test and removed afterwards. It is NEVER web/src/pages.
test('offline CMS bodies really render through existing EditorialBody, including quantity-table semantics and escaped marks', { timeout: 120000 }, () => {
  const root = resolve('.'); mkdirSync(join(root, '.local'), { recursive: true });
  const temporary = mkdtempSync(join(root, '.local/cms-render-'));
  const pages = join(temporary, 'src/pages'); mkdirSync(pages, { recursive: true });
  const canary = `OFFLINE_TEST_${randomUUID()}`;
  const env = { ...process.env, SANITY_READ_TOKEN: canary, ASTRO_TELEMETRY_DISABLED: '1', DO_NOT_TRACK: '1' };
  const evidence = join(root, 'review/cms-render-offline'); mkdirSync(evidence, { recursive: true });
  try {
    const documents = convertCmsArticles(previews.map(fixtureArticle), fixtureContext);
    const marked: EditorialBlock[] = [{ type: 'paragraph', content: [
      { type: 'text', text: 'Strong emphasis', marks: ['strong', 'em'] }, { type: 'text', text: ' ' },
      { type: 'link', href: '/manufacturing/#prepare', text: 'Internal emphasis', marks: ['em'] },
      { type: 'text', text: '<script>literal content only</script>', marks: ['strong'] },
    ] }, { type: 'template', title: 'Literal template', text: 'First line\n\n<img src=x onerror=invalid>\nLast line' }];
    const cases = [['quote', documents[0]!.body], ['moq', documents[1]!.body], ['marks', marked]] as const;
    const component = relative(pages, join(root, 'web/src/components/EditorialBody.astro')).replaceAll('\\', '/');
    for (const [name, body] of cases) {
      writeFileSync(join(temporary, `src/${name}.json`), JSON.stringify(body));
      writeFileSync(join(pages, `${name}.astro`), `---\nimport EditorialBody from '${component}';\nimport body from '../${name}.json';\n---\n<html lang="en"><head><title>Offline renderer verification only</title></head><body><EditorialBody body={body} /></body></html>\n`);
    }
    writeFileSync(join(temporary, 'astro.config.mjs'), "export default {output:'static',trailingSlash:'always',devToolbar:{enabled:false}};\n");
    const result = spawnSync(process.execPath, ['scripts/run-tool.mjs', 'astro', 'build', '--root', relative(root, temporary)], { cwd: root, env, encoding: 'utf8', timeout: 100000 });
    const log = (result.stdout ?? '') + (result.stderr ?? '');
    writeFileSync(join(evidence, 'build.txt'), log.split(canary).join('[REDACTED]'));
    assert.ok(!log.includes(canary), 'A server token appeared in renderer logs.');
    assert.equal(result.status, 0, 'Isolated Astro renderer build failed; inspect the sanitized offline evidence.');
    const quote = readFileSync(join(temporary, 'dist/quote/index.html'), 'utf8');
    const moq = readFileSync(join(temporary, 'dist/moq/index.html'), 'utf8');
    const marks = readFileSync(join(temporary, 'dist/marks/index.html'), 'utf8');
    assert.equal((quote.match(/<table>/g) ?? []).length, 1); assert.equal((moq.match(/<table>/g) ?? []).length, 2);
    assert.match(moq, /quantity-description/); assert.match(moq, /<th scope="row">Style A T-shirt \/ cream<\/th>/);
    assert.match(moq, /Hypothetical proposal: two styles, three style–color lines, 180 pieces total/);
    assert.match(moq, /aria-describedby="body-block-\d+-scroll-hint"/);
    assert.match(quote, /Subject: Custom clothing enquiry/); assert.match(quote, /<pre>[\s\S]*Total project budget/);
    assert.match(marks, /<strong><em>Strong emphasis<\/em><\/strong>/);
    assert.match(marks, /<em>Internal emphasis<\/em>/); assert.match(marks, /&lt;script&gt;literal content only&lt;\/script&gt;/);
    assert.match(marks, /First line\n\n&lt;img src=x onerror=invalid&gt;\nLast line/);
    const hashes: Record<string, string> = {};
    for (const [name, html] of [['quote', quote], ['moq', moq], ['marks', marks]]) {
      assert.ok(!html!.includes(canary), 'A server token appeared in renderer output.');
      assert.doesNotMatch(html!, /<script>|<iframe|<img src=x|SANITY_READ_TOKEN/);
      writeFileSync(join(evidence, `${name}.html`), html!); hashes[name!] = createHash('sha256').update(html!).digest('hex');
    }
    writeFileSync(join(evidence, 'summary.json'), JSON.stringify({ scope: 'Offline synthetic CMS bodies rendered by the existing component, not live CMS or normal-site content.', passed: true, secretCanaryLeaked: false, htmlSha256: hashes }, null, 2));
  } finally { rmSync(temporary, { recursive: true, force: true }); } // only the unique directory this test created
});
test('browser-output scanner fails without disclosing a supplied token and rejects fixture/provider leaks', () => {
  const root = resolve('.'); mkdirSync(join(root, '.local'), { recursive: true });
  const temporary = mkdtempSync(join(root, '.local/cms-secret-scan-'));
  const canary = `OFFLINE_TEST_${randomUUID()}`;
  try {
    for (const content of [canary, 'SANITY_READ_TOKEN', 'SANITY_SITE_READ_ENABLED', 'cms-article-query', 'cms-draft-preview-query', 'cms-site-query', 'cms_article_draft_preview', 'cms_site_bundle', 'cms_site_settings', 'cms_category', 'cms_page', 'CMS draft preview / Not published', 'DEV_CMS_DRAFT_PREVIEW', 'OFFLINE FIXTURE']) {
      writeFileSync(join(temporary, 'output.js'), JSON.stringify(content));
      const result = spawnSync(process.execPath, ['scripts/check-cms-boundary.mjs', temporary], { cwd: root, env: { ...process.env, SANITY_READ_TOKEN: canary }, encoding: 'utf8' });
      assert.notEqual(result.status, 0); assert.ok(!(result.stdout + result.stderr).includes(canary));
    }
    writeFileSync(join(temporary, 'output.js'), 'console.log("harmless test");');
    const result = spawnSync(process.execPath, ['scripts/check-cms-boundary.mjs', temporary], { cwd: root, encoding: 'utf8' }); assert.equal(result.status, 0);
  } finally { rmSync(temporary, { recursive: true, force: true }); }
});
