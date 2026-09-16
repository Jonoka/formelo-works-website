import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { parse, evaluate } from 'groq-js';
import { articleScopes, convertCmsArticles, resolveCmsReference } from '../shared/cms-article';
import { convertCmsBody, validateCmsBodyInput } from '../shared/cms-body';
import { CmsContentError, record } from '../shared/cms-validation';
import { prepareEditorialBody, validateEditorialBody } from '../shared/editorial-policy';
import { articleQuery, articleQueryPolicy, createArticleReader, articleReaderConfigFromEnvironment, type ArticleTransport } from '../web/src/lib/server/cms-article-query';
import { requireStudioEnvironment } from '../studio/environment';
import { loadContent } from '../web/src/lib/content';
import { readRuntime } from '../config/runtime';
import { fixtureArticle, fixtureBody, fixtureContext, fixtureDataset, fixtureReference, mutate, previews } from './fixtures/cms-articles';
import type { EditorialBlock } from '../shared/editorial';

const canary = `OFFLINE_TEST_${randomUUID()}`;
const config = () => ({ projectId: fixtureContext.projectId, dataset: fixtureContext.dataset, token: canary, documentIds: previews.map(p => `offline.article.${p.slug}`) });
const convert = (doc = fixtureArticle()) => convertCmsArticles([doc], fixtureContext)[0]!;
const errorCode = (code?: string) => (error: unknown): boolean => error instanceof CmsContentError && (!code || error.code === code) && !String(error.stack).includes(canary) && !('cause' in error);
const response = (result: unknown): ArticleTransport => async () => new Response(JSON.stringify({ result }), { status: 200 });
const reader = (transport: ArticleTransport, timeoutMs = 1000) => createArticleReader(config(), { transport, timeoutMs, now: () => fixtureContext.now });
const read = (transport: ArticleTransport, timeoutMs = 1000) => reader(transport, timeoutMs).read(config().documentIds[0]!, previews[0]!.slug);

for (const preview of previews) test(`CMS offline round-trip preserves every block, table, link, template and TOC: ${preview.slug}`, () => {
  const doc = fixtureArticle(preview), mapped = convert(doc);
  assert.deepEqual(mapped.body, preview.body);
  assert.deepEqual(prepareEditorialBody(mapped.body), prepareEditorialBody(preview.body));
  assert.equal(mapped.title, preview.title); assert.equal(mapped.excerpt, preview.excerpt); assert.deepEqual(mapped.seo, preview.seo);
  assert.equal(mapped.referenceCode, preview.referenceCode);
  assert.equal(mapped.kind, 'cms_article'); assert.equal(mapped.websitePublication, 'not_verified'); assert.equal(mapped.productionAllowed, false);
  assert.equal(mapped.authorDisplay, doc['authorDisplay']); assert.equal(mapped.publishedAt, doc['publishedAt']); assert.equal(mapped.factConfirmedAt, doc['factConfirmedAt']);
  assert.ok(!('draftUpdatedAt' in mapped)); assert.ok(!('image' in mapped.cover));
});
test('CMS spans preserve marks, whitespace, ordered/bullet lists, plain escaped strings and duplicate heading IDs', () => {
  const body: EditorialBlock[] = [
    { type: 'heading', level: 2, text: 'Details' }, { type: 'heading', level: 3, text: 'Details' },
    { type: 'paragraph', content: [{ type: 'text', text: 'A', marks: ['strong', 'em'] }, { type: 'text', text: ' ' }, { type: 'link', text: 'source', href: 'https://www.shopify.com/blog/minimum-order-quantity', marks: ['em'] }, { type: 'text', text: '<script>not executable</script>' }] },
    { type: 'list', ordered: true, items: [[{ type: 'text', text: 'First' }], [{ type: 'text', text: 'Second', marks: ['strong'] }]] },
    { type: 'list', ordered: false, items: [[{ type: 'link', text: 'Prepare', href: '/manufacturing/#prepare', marks: ['strong'] }]] },
    { type: 'heading', level: 2, text: 'Details' }, { type: 'heading', level: 2, text: 'Details-2' },
  ];
  const mapped = convertCmsBody(fixtureBody(body), (ref, field) => resolveCmsReference(ref, field, fixtureContext));
  assert.deepEqual(mapped, body); assert.deepEqual(prepareEditorialBody(mapped), prepareEditorialBody(body));
  assert.throws(() => validateEditorialBody([{ type: 'paragraph', content: [{ type: 'text', text: 'Text', marks: ['style'] }] }]));
});
test('Studio body validation is offline and leaves reference resolution to the delivery adapter', () => {
  const dataset = fixtureDataset();
  const doc = dataset.find(d => d['_id'] === config().documentIds[0])!;
  assert.equal(validateCmsBodyInput(doc['body']), true);
  assert.throws(() => convert(doc), errorCode()); // unprojected unresolved raw CMS input is not rendering data
});
const invalidMetadata: [string, (string | number)[], unknown, string?][] = [
  ['draft document', ['_id'], 'drafts.offline.article'], ['release document', ['_id'], 'versions.release.offline.article'],
  ['normalized draft identity', ['_originalId'], 'drafts.offline.article'], ['wrong document type', ['_type'], 'page'],
  ['missing author', ['authorDisplay'], undefined], ['missing publication', ['publishedAt'], undefined],
  ['missing update', ['contentUpdatedAt'], undefined], ['missing review date', ['factConfirmedAt'], undefined],
  ['pending review', ['factReviewStatus'], 'pending', 'CMS_REVIEW'], ['missing review state', ['factReviewStatus'], undefined, 'CMS_REVIEW'],
  ['future publication', ['publishedAt'], '2099-01-01T00:00:00Z', 'CMS_DATE'], ['invalid calendar date', ['factConfirmedAt'], '2026-02-30', 'CMS_DATE'],
  ['update before publication', ['contentUpdatedAt'], '2026-09-13T00:00:00Z', 'CMS_DATE'], ['stale review', ['factConfirmedAt'], '2026-09-14', 'CMS_DATE'],
  ['wrong source', ['referenceCode'], 'WEB-HOME', 'CMS_SOURCE_CODE'], ['unplanned slug', ['slug', 'current'], 'unplanned-route', 'CMS_ROUTE'],
  ['duplicate outside selected ID', ['slugCount'], 2, 'CMS_DUPLICATE_SLUG'],
  ['missing permission', ['coverImage', 'publicUseApproved'], undefined, 'CMS_ASSET_APPROVAL'], ['unapproved image', ['coverImage', 'publicUseApproved'], false, 'CMS_ASSET_APPROVAL'],
  ['decorative cover', ['coverImage', 'decorative'], true, 'CMS_ASSET_APPROVAL'], ['missing alternative text', ['coverImage', 'alt'], ''],
  ['missing asset target', ['coverImage', 'asset', 'document'], null], ['asset ID mismatch', ['coverImage', 'asset', '_ref'], 'image-missing'],
  ['weak image reference', ['coverImage', 'asset', '_weak'], true], ['foreign image URL', ['coverImage', 'asset', 'document', 'url'], 'https://evil.invalid/image.webp', 'CMS_IMAGE'],
  ['wrong image dimensions', ['coverImage', 'asset', 'document', 'metadata', 'dimensions', 'width'], 1, 'CMS_IMAGE'],
  ['unrelated private fields', ['privateNote'], 'must not be projected', 'CMS_UNSUPPORTED_FIELD'],
];
for (const [name, path, value, code] of invalidMetadata) test(`CMS fails closed: ${name}`, () => {
  const doc = fixtureArticle(); mutate(doc, path, value); assert.throws(() => convert(doc), errorCode(code));
});
test('duplicate slugs/IDs and non-published perspectives never become previews', () => {
  const a = fixtureArticle(), b = structuredClone(a); b['_id'] = 'offline.other';
  assert.throws(() => convertCmsArticles([a, b], fixtureContext), errorCode('CMS_DUPLICATE_SLUG'));
  assert.throws(() => convertCmsArticles([a, a], fixtureContext), errorCode('CMS_DUPLICATE_SLUG'));
  for (const perspective of ['drafts', 'raw', ['release-fixture']]) assert.throws(() => convertCmsArticles([a], { ...fixtureContext, perspective } as never), errorCode('CMS_CONFIG'));
});
test('missing, draft, release, weak, ambiguous and stale article references fail explicitly', () => {
  for (const patch of [
    { document: null }, { _ref: 'drafts.offline.target' }, { _ref: 'versions.release.target' }, { _weak: true },
  ]) assert.throws(() => resolveCmsReference({ ...fixtureReference('/manufacturing/'), ...patch }, 'target', fixtureContext), errorCode());
  for (const patch of [{ _id: 'wrong' }, { _originalId: 'drafts.original' }, { routeCount: 2 }, { _type: 'unrecognized' }, { pageKey: 'unknown' }, { factConfirmedAt: null }]) {
    const ref = fixtureReference('/manufacturing/'); Object.assign(record(ref['document'], 'fixture'), patch);
    assert.throws(() => resolveCmsReference(ref, 'target', fixtureContext), errorCode());
  }
  const ref = fixtureReference(articleScopes['moq-per-style-per-color'].path); record(ref['document'], 'fixture')['factReviewStatus'] = 'pending';
  assert.throws(() => resolveCmsReference(ref, 'target', fixtureContext), errorCode('CMS_REVIEW'));
});
test('related content is bounded, unique, type-checked, and cannot refer to itself', () => {
  const doc = fixtureArticle();
  doc['relatedArticles'] = [fixtureReference(articleScopes['moq-per-style-per-color'].path)];
  assert.deepEqual(convert(doc).relatedArticles, [articleScopes['moq-per-style-per-color'].path]);
  for (const refs of [[fixtureReference('/contact/')], [fixtureReference('/clothing/t-shirts/'), fixtureReference('/clothing/t-shirts/')], [null]]) {
    doc['relatedCategories'] = refs; assert.throws(() => convert(doc), errorCode());
  }
  const self = fixtureArticle(); self['relatedArticles'] = [fixtureReference(articleScopes[previews[0]!.slug].path)];
  assert.throws(() => convert(self), errorCode('CMS_SELF_REFERENCE'));
});
test('unknown blocks, marks, nested lists, broken tables, empty templates and dangerous links are never dropped', () => {
  const badBlocks = [
    { _type: 'html', _key: 'bad', html: '<script>bad</script>' }, { _type: 'iframe', _key: 'bad', src: 'https://evil.invalid/' },
    { _type: 'editorialTemplate', _key: 'bad', title: 'Fixture', text: '' },
    { _type: 'editorialTable', _key: 'bad', caption: 'Fixture', columns: ['A', 'B'], rows: [{ _type: 'editorialTableRow', _key: 'r', cells: ['A'] }] },
  ];
  for (const block of badBlocks) { const doc = fixtureArticle(); (doc['body'] as unknown[]).push(block); assert.throws(() => convert(doc), errorCode()); assert.notEqual(validateCmsBodyInput(doc['body']), true); }
  const basic = fixtureBody([{ type: 'paragraph', content: [{ type: 'text', text: 'Fixture' }] }]);
  for (const [path, value] of [ [['style'], 'blockquote'], [['listItem'], 'checklist'], [['level'], 2], [['children', 0, 'marks'], ['unknown']], [['children', 0, 'onclick'], 'bad'] ] as [(string | number)[], unknown][]) {
    const body = structuredClone(basic); mutate(body[0], path, value); assert.throws(() => convertCmsBody(body, () => '/'), errorCode());
  }
  const markedHeading = fixtureBody([{ type: 'heading', level: 2, text: 'Heading' }]); mutate(markedHeading, [0, 'children', 0, 'marks'], ['strong']);
  assert.throws(() => convertCmsBody(markedHeading, () => '/'), errorCode('CMS_HEADING_FORMAT'));
  for (const href of ['javascript:alert(1)', 'data:text/html,fixture', '//evil.invalid/', 'https://www.shopify.com@evil.invalid/', 'https://www.shopify.com/blog/minimum-order-quantity?q=tracking']) {
    const body = fixtureBody([{ type: 'paragraph', content: [{ type: 'link', text: 'Source', href: 'https://www.shopify.com/blog/minimum-order-quantity' }] }]); mutate(body, [0, 'markDefs', 0, 'href'], href);
    assert.throws(() => convertCmsBody(body, () => '/'), errorCode('CMS_LINK'));
  }
  const fragment = fixtureBody([{ type: 'paragraph', content: [{ type: 'link', text: 'Link', href: '/manufacturing/#prepare' }] }]); mutate(fragment, [0, 'markDefs', 0, 'fragment'], 'missing');
  assert.throws(() => convertCmsBody(fragment, (r, p) => resolveCmsReference(r, p, fixtureContext)), errorCode('CMS_LINK'));
});
test('crop/hotspot are preserved, not discarded or invented; invalid geometry fails', () => {
  const doc = fixtureArticle(), crop = { top: 0.1, bottom: 0.1, left: 0.05, right: 0.05 }, hotspot = { x: 0.5, y: 0.5, width: 0.5, height: 0.5 };
  mutate(doc, ['coverImage', 'crop'], crop); mutate(doc, ['coverImage', 'hotspot'], hotspot);
  assert.deepEqual(convert(doc).cover.crop, crop); assert.deepEqual(convert(doc).cover.hotspot, hotspot);
  mutate(doc, ['coverImage', 'crop', 'left'], 1); assert.throws(() => convert(doc), errorCode('CMS_IMAGE'));
  assert.equal(convert().cover.crop, null); assert.equal(convert().cover.hotspot, null);
});
test('real GROQ parses and evaluates offline, dereferences only needed fields and retains unknown blocks', async () => {
  const dataset = fixtureDataset(), own = dataset.find(d => d['_id'] === config().documentIds[0])!;
  own['privateNote'] = canary;
  const result = await (await evaluate(parse(articleQuery), { dataset, params: { id: config().documentIds[0], slug: previews[0]!.slug } })).get();
  assert.deepEqual(convertCmsArticles(result, fixtureContext)[0]!.body, previews[0]!.body);
  assert.ok(!JSON.stringify(result).includes(canary)); assert.ok(!JSON.stringify(result).includes('privateNote'));
  (own['body'] as unknown[]).push({ _type: 'unknown-block', _key: 'unknown', secret: canary });
  const bad = await (await evaluate(parse(articleQuery), { dataset, params: { id: config().documentIds[0], slug: previews[0]!.slug } })).get();
  assert.throws(() => convertCmsArticles(bad, fixtureContext), errorCode('CMS_UNSUPPORTED_BLOCK'));
});
test('GROQ duplicate detection does not hide another published document outside the selected ID', async () => {
  const dataset = fixtureDataset(), own = dataset.find(d => d['_id'] === config().documentIds[0])!;
  dataset.push({ ...structuredClone(own), _id: 'offline.duplicate' });
  const result = await (await evaluate(parse(articleQuery), { dataset, params: { id: own['_id'], slug: previews[0]!.slug } })).get();
  assert.throws(() => convertCmsArticles(result, fixtureContext), errorCode('CMS_DUPLICATE_SLUG'));
});
test('GROQ defensive filters keep draft/release variants out of published counts and results', async () => {
  const dataset = fixtureDataset(), own = dataset.find(d => d['_id'] === config().documentIds[0])!;
  for (const prefix of ['drafts.', 'versions.release-fixture.']) dataset.push({ ...structuredClone(own), _id: prefix + own['_id'], privateVariant: canary });
  const result = await (await evaluate(parse(articleQuery), { dataset, params: { id: own['_id'], slug: previews[0]!.slug } })).get();
  assert.deepEqual(convertCmsArticles(result, fixtureContext)[0]!.body, previews[0]!.body);
  assert.ok(!JSON.stringify(result).includes(canary));
});
test('Studio refuses public-prefixed credential variables without echoing their values', () => {
  for (const key of ['SANITY_STUDIO_READ_TOKEN', 'SANITY_STUDIO_SECRET', 'SANITY_STUDIO_API_KEY']) {
    assert.throws(() => requireStudioEnvironment({ SANITY_STUDIO_PROJECT_ID: 'offline1', SANITY_STUDIO_DATASET: 'offline-fixture', [key]: canary }), error => error instanceof Error && error.message.startsWith('STUDIO_PUBLIC_SECRET_FORBIDDEN') && !String(error.stack).includes(canary));
  }
});
test('reader uses exact API/published/no-store/query-only policy, parameters and authorized document IDs', async () => {
  let calls = 0;
  const transport: ArticleTransport = async (url, init) => {
    calls++; const endpoint = new URL(url);
    assert.equal(endpoint.hostname, `${fixtureContext.projectId}.api.sanity.io`);
    assert.equal(endpoint.pathname, `/v2025-02-19/data/query/${fixtureContext.dataset}`);
    assert.equal(endpoint.searchParams.get('perspective'), 'published'); assert.equal(endpoint.searchParams.get('returnQuery'), 'false');
    assert.equal(init.method, 'POST'); assert.equal(init.cache, 'no-store'); assert.equal(init.redirect, 'error'); assert.equal(init.credentials, 'omit');
    assert.ok(new Headers(init.headers).get('Authorization') === `Bearer ${canary}`);
    const payload = JSON.parse(String(init.body)); assert.equal(payload.query, articleQuery);
    assert.deepEqual(payload.params, { id: config().documentIds[0], slug: previews[0]!.slug });
    assert.ok(!url.includes(canary) && !String(init.body).includes(canary));
    return new Response(JSON.stringify({ result: [fixtureArticle()] }));
  };
  const r = reader(transport); assert.equal((await r.read(config().documentIds[0]!, previews[0]!.slug)).kind, 'cms_article'); assert.equal(calls, 1);
  assert.deepEqual(r.policy, articleQueryPolicy); assert.ok(!JSON.stringify(r).includes(canary));
  await assert.rejects(r.read('offline.unapproved', previews[0]!.slug), errorCode('CMS_NOT_AUTHORIZED')); assert.equal(calls, 1);
});
test('no configuration or explicit environment authorization cannot initiate transport', () => {
  let calls = 0; const transport: ArticleTransport = async () => { calls++; throw new Error(canary); };
  assert.throws(() => createArticleReader(undefined, { transport }), errorCode('CMS_NOT_CONFIGURED'));
  assert.throws(() => articleReaderConfigFromEnvironment({}), errorCode('CMS_NOT_CONFIGURED'));
  assert.throws(() => articleReaderConfigFromEnvironment({ SANITY_STUDIO_PROJECT_ID: 'offline1', SANITY_STUDIO_DATASET: 'offline-fixture' }), errorCode('CMS_NOT_CONFIGURED'));
  assert.throws(() => createArticleReader({ ...config(), token: '' }, { transport }), errorCode());
  assert.equal(calls, 0);
});
for (const [status, code] of [[401, 'CMS_UNAUTHENTICATED'], [403, 'CMS_FORBIDDEN'], [429, 'CMS_HTTP'], [500, 'CMS_HTTP']] as const) test(`HTTP ${status} is a sanitized failure, without retries or mock fallback`, async () => {
  let calls = 0; await assert.rejects(read(async () => { calls++; return new Response(canary, { status }); }), errorCode(code)); assert.equal(calls, 1);
});
for (const result of [null, undefined, [], {}, 'not an array']) test(`empty or malformed query result fails: ${JSON.stringify(result)}`, async () => { await assert.rejects(read(response(result)), errorCode()); });
test('invalid JSON, empty HTTP body, oversized responses and transport exceptions are sanitized', async () => {
  await assert.rejects(read(async () => new Response('')), errorCode('CMS_EMPTY'));
  await assert.rejects(read(async () => new Response(canary)), errorCode('CMS_INVALID_JSON'));
  await assert.rejects(read(async () => new Response('x'.repeat(articleQueryPolicy.maxResponseBytes + 1))), errorCode('CMS_RESPONSE_LIMIT'));
  await assert.rejects(read(async () => { throw new Error(canary); }), errorCode('CMS_TRANSPORT'));
});
test('deadline covers fetch and body reading, including a transport ignoring AbortSignal', async () => {
  let signal: AbortSignal | null | undefined;
  await assert.rejects(read(async (_url, init) => { signal = init.signal; return new Promise<Response>(() => undefined); }, 10), errorCode('CMS_TIMEOUT'));
  assert.equal(signal?.aborted, true);
  await assert.rejects(read(async () => new Response(new ReadableStream({ start() {} })), 10), errorCode('CMS_TIMEOUT'));
});
test('bad query documents fail instead of falling back to local previews', async () => {
  const bad = fixtureArticle(); bad['factReviewStatus'] = 'pending'; await assert.rejects(read(response([bad])), errorCode('CMS_REVIEW'));
  const wrong = fixtureArticle(previews[1]); await assert.rejects(read(response([wrong])), errorCode('CMS_SCOPE'));
  const draft = fixtureArticle(); draft['_originalId'] = 'drafts.offline'; await assert.rejects(read(response([draft])), errorCode('CMS_UNPUBLISHED'));
});
test('CMS errors, defaults, source boundary and preview production/channel/privacy gates remain isolated', async () => {
  const before = await loadContent('mock'); await assert.rejects(read(response([])), errorCode('CMS_EMPTY'));
  assert.deepEqual(await loadContent('mock'), before); assert.deepEqual(before.articles, []);
  await assert.rejects(loadContent('sanity'), /refusing to fall back/);
  assert.throws(() => readRuntime({ CONTENT_MODE: 'sanity' }), /No fallback/);
  assert.throws(() => readRuntime({ DEPLOY_ENV: 'production' }), /PRODUCTION_BLOCKED/);
  assert.equal(before.siteSettings.email, null); assert.equal(before.siteSettings.whatsappDigits, null); assert.equal(before.siteSettings.defaultMoq, null); assert.equal(before.privacyPreview.effectiveAt, null);
  for (const path of ['web/src/lib/content.ts', ...readdirSync('web/src/scripts').map(name => `web/src/scripts/${name}`)]) assert.doesNotMatch(readFileSync(path, 'utf8'), /cms-article-query|fixtures\/cms-articles|SANITY_READ_TOKEN/);
  for (const name of ['EditorialBody', 'EditorialInline', 'EditorialText']) assert.doesNotMatch(readFileSync(`web/src/components/${name}.astro`, 'utf8'), /set:html|innerHTML/);
  assert.throws(() => requireStudioEnvironment({}), /STUDIO_NOT_CONFIGURED/);
});
