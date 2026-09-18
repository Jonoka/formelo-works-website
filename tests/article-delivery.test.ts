import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { parse, evaluate } from 'groq-js';
import type { Environment } from '../config/runtime';
import { articleCardData, findDeliveredArticle, readArticleDeliveryMode } from '../shared/article-delivery';
import { CmsContentError } from '../shared/cms-validation';
import { dev05bDraftScope } from '../shared/cms-draft-preview';
import { createArticleDeliveryLoader } from '../web/src/lib/server/article-delivery';
import { createArticleReader, articleCollectionQuery, type ArticleTransport } from '../web/src/lib/server/cms-article-query';
import { assertCmsDraftPreviewLoopback } from '../web/src/lib/server/cms-draft-preview-mode';
import { fixtureArticle, fixtureContext, fixtureDataset, mutate, previews } from './fixtures/cms-articles';
import { draftDeliveryFixture } from './fixtures/cms-delivery';

const canary = `OFFLINE_TEST_${randomUUID()}`;
const now = Date.parse('2026-09-18T00:00:00Z');
const origin = new URL('http://127.0.0.1:4322/');
const mockEnv: Environment = { DEPLOY_ENV: 'local', CONTENT_MODE: 'mock', CONCEPT_MODE: 'true', ANALYTICS_MODE: 'off', DEV_CMS_DRAFT_PREVIEW: '0', ARTICLE_CONTENT_MODE: 'mock' };
const draftEnv: Environment = { ...mockEnv, DEV_CMS_DRAFT_PREVIEW: '1', ARTICLE_CONTENT_MODE: 'draft-preview', SANITY_PROJECT_ID: dev05bDraftScope.projectId, SANITY_DATASET: dev05bDraftScope.dataset,
  SANITY_API_VERSION: '2025-02-19', SANITY_READ_TOKEN: canary, SANITY_ARTICLE_READ_IDS: dev05bDraftScope.documentId };
const documents = () => previews.map(fixtureArticle);
const publishedEnv: Environment = { ...mockEnv, ARTICLE_CONTENT_MODE: 'published', SANITY_PROJECT_ID: fixtureContext.projectId, SANITY_DATASET: fixtureContext.dataset,
  SANITY_API_VERSION: '2025-02-19', SANITY_READ_TOKEN: canary, SANITY_ARTICLE_READ_IDS: documents().map(doc => doc['_id']).join(',') };
const response = (result: unknown): ArticleTransport => async () => new Response(JSON.stringify({ result }));
const safeError = (code?: string) => (error: unknown): boolean => error instanceof CmsContentError && (!code || code === error.code) && !String(error.stack).includes(canary) && !('cause' in error);

 test('article source selection is explicit, independent, and rejects conflicting switches', () => {
  assert.equal(readArticleDeliveryMode({}), 'mock');
  assert.equal(readArticleDeliveryMode({ DEV_CMS_DRAFT_PREVIEW: '1' }), 'draft-preview');
  assert.equal(readArticleDeliveryMode({ ARTICLE_CONTENT_MODE: 'published' }), 'published');
  for (const env of [
    { ARTICLE_CONTENT_MODE: '' }, { ARTICLE_CONTENT_MODE: 'sanity' }, { DEV_CMS_DRAFT_PREVIEW: 'true' },
    { ARTICLE_CONTENT_MODE: 'draft-preview' }, { ARTICLE_CONTENT_MODE: 'mock', DEV_CMS_DRAFT_PREVIEW: '1' },
    { ARTICLE_CONTENT_MODE: 'published', DEV_CMS_DRAFT_PREVIEW: '1' },
  ]) assert.throws(() => readArticleDeliveryMode(env), safeError());
});

test('default collection preserves the two local records and never opens either CMS transport', async () => {
  let calls = 0;
  const transport: ArticleTransport = async () => { calls++; throw new Error(canary); };
  const load = createArticleDeliveryLoader({ draft: { transport }, published: { transport } });
  const collection = await load({ env: mockEnv, command: 'dev', url: origin });
  assert.equal(calls, 0); assert.equal(collection.mode, 'mock');
  assert.deepEqual(collection.articles.map(article => article.slug), previews.map(article => article.slug));
  for (const [index, article] of collection.articles.entries()) {
    assert.equal(article.source, 'local'); assert.equal(article.status, 'editorial_draft'); assert.equal(article.coverState, 'local_concept');
    assert.deepEqual(article.body, previews[index]!.body);
    assert.equal(findDeliveredArticle(collection, article.slug), article);
    const card = articleCardData(article);
    assert.deepEqual([card.title, card.excerpt, card.slug, card.status, card.coverState], [article.title, article.excerpt, article.slug, article.status, article.coverState]);
    assert.equal(card.href, `/blog/${article.slug}/`);
  }
});

test('authorized draft and explicitly local MOQ form a declared mix, with no invented CMS cover or publication facts', async () => {
  let calls = 0;
  const load = createArticleDeliveryLoader({ draft: { now: () => now, transport: async () => { calls++; return new Response(JSON.stringify({ result: [draftDeliveryFixture()] })); } } });
  const collection = await load({ env: draftEnv, command: 'dev', url: origin });
  assert.equal(collection.mode, 'draft-preview'); assert.equal(calls, 1);
  const draft = findDeliveredArticle(collection, dev05bDraftScope.slug)!;
  assert.equal(draft.kind, 'cms_article_draft_preview'); assert.equal(draft.source, 'sanity'); assert.equal(draft.cmsPerspective, 'drafts');
  assert.equal(draft.coverState, 'missing'); assert.equal(draft.productionAllowed, false);
  for (const key of ['cover', 'authorDisplay', 'publishedAt', 'contentUpdatedAt', 'factConfirmedAt', 'publicUseApproved']) assert.equal(key in draft, false, key);
  const card = articleCardData(draft);
  assert.equal(card.title, draftDeliveryFixture().title); assert.equal(card.excerpt, draftDeliveryFixture().excerpt);
  assert.equal(card.revision, draftDeliveryFixture()._rev); assert.equal(card.referenceCode, dev05bDraftScope.referenceCode);
  const moq = findDeliveredArticle(collection, 'moq-per-style-per-color')!;
  assert.equal(moq.source, 'local'); assert.equal(moq.cmsPerspective, null); assert.equal(moq.status, 'editorial_draft');
  assert.deepEqual(moq.body, previews[1]!.body);
});

test('each dev load observes a new saved revision and never retains a prior success after a query error', async () => {
  let calls = 0;
  const load = createArticleDeliveryLoader({ draft: { now: () => now, transport: async () => {
    calls++; return calls === 3 ? new Response(canary, { status: 401 }) : new Response(JSON.stringify({ result: [draftDeliveryFixture(String(calls))] }));
  } } });
  const first = await load({ env: draftEnv, command: 'dev', url: origin });
  const second = await load({ env: draftEnv, command: 'dev', url: origin });
  assert.notEqual(first.articles[0]!.title, second.articles[0]!.title);
  assert.notEqual(articleCardData(first.articles[0]!).revision, articleCardData(second.articles[0]!).revision);
  await assert.rejects(load({ env: draftEnv, command: 'dev', url: origin }), safeError('CMS_UNAUTHENTICATED'));
  assert.equal(calls, 3);
});

test('draft route defense rejects non-dev commands, nonlocal deployments and nonloopback requests before transport', async () => {
  let calls = 0;
  const transport: ArticleTransport = async () => { calls++; throw new Error(canary); };
  const load = createArticleDeliveryLoader({ draft: { transport } });
  for (const command of [undefined, 'build', 'preview', 'sync', 'development']) await assert.rejects(load({ env: draftEnv, command, url: origin }));
  await assert.rejects(load({ env: { ...draftEnv, DEPLOY_ENV: 'preview' }, command: 'dev', url: origin }));
  for (const hostname of ['0.0.0.0', '192.168.1.20', 'example.invalid']) await assert.rejects(load({ env: draftEnv, command: 'dev', url: new URL(`http://${hostname}/`) }));
  await assert.rejects(load({ env: draftEnv, command: 'dev' }));
  for (const host of [true, false, undefined, '0.0.0.0', '::', '127.0.0.1.example.invalid']) assert.throws(() => assertCmsDraftPreviewLoopback(host));
  for (const host of ['127.0.0.1', '::1', '[::1]', 'localhost']) assert.doesNotThrow(() => assertCmsDraftPreviewLoopback(host));
  assert.equal(calls, 0);
});

for (const [status, code] of [[401, 'CMS_UNAUTHENTICATED'], [403, 'CMS_FORBIDDEN'], [429, 'CMS_HTTP'], [500, 'CMS_HTTP']] as const) test(`selected draft HTTP ${status} rejects the entire collection without returning local cards`, async () => {
  const load = createArticleDeliveryLoader({ draft: { transport: async () => new Response(canary, { status }) } });
  await assert.rejects(load({ env: draftEnv, command: 'dev', url: origin }), safeError(code));
});

test('selected draft missing configuration, timeout and broken content fail, never fall back', async () => {
  let calls = 0;
  const configured = createArticleDeliveryLoader({ draft: { transport: async () => { calls++; return new Response('{}'); } } });
  await assert.rejects(configured({ env: { ...draftEnv, SANITY_READ_TOKEN: '' }, command: 'dev', url: origin }), safeError('CMS_NOT_CONFIGURED'));
  assert.equal(calls, 0);
  const timeout = createArticleDeliveryLoader({ draft: { timeoutMs: 10, transport: async () => new Promise<Response>(() => undefined) } });
  await assert.rejects(timeout({ env: draftEnv, command: 'dev', url: origin }), safeError('CMS_TIMEOUT'));
  const invalid = draftDeliveryFixture(); invalid.body.push({ _type: 'unknownBlock', _key: 'invalid' });
  const bad = createArticleDeliveryLoader({ draft: { now: () => now, transport: response([invalid]) } });
  await assert.rejects(bad({ env: draftEnv, command: 'dev', url: origin }), safeError('CMS_UNSUPPORTED_BLOCK'));
});

test('published collection query reads only its exact allowlist and reuses the strict projection', async () => {
  const docs = documents(), ids = docs.map(doc => String(doc['_id']));
  const dataset = fixtureDataset(docs);
  dataset.push({ ...dataset.find(doc => doc['_id'] === ids[0])!, _id: 'drafts.unrelated' });
  const projected = await (await evaluate(parse(articleCollectionQuery), { dataset, params: { ids } })).get();
  let calls = 0;
  const reader = createArticleReader({ projectId: fixtureContext.projectId, dataset: fixtureContext.dataset, token: canary, documentIds: ids }, { now: () => now, transport: async (url, init) => {
    calls++; assert.equal(new URL(url).searchParams.get('perspective'), 'published'); assert.equal(init.method, 'POST'); assert.equal(init.cache, 'no-store');
    assert.deepEqual(JSON.parse(String(init.body)), { query: articleCollectionQuery, params: { ids } });
    return new Response(JSON.stringify({ result: [...projected].reverse() }));
  } });
  const articles = await reader.list();
  assert.equal(calls, 1); assert.deepEqual(articles.map(article => article.documentId), ids);
  assert.ok(articles.every(article => article.cmsPerspective === 'published'));
});

test('published records reach the same collection/detail/card contract without any local record', async () => {
  const load = createArticleDeliveryLoader({ published: { now: () => now, transport: response(documents()) } });
  const collection = await load({ env: publishedEnv, command: 'dev', url: origin });
  assert.equal(collection.mode, 'published'); assert.equal(collection.articles.length, 2);
  for (const article of collection.articles) {
    assert.equal(article.kind, 'cms_article'); assert.equal(article.source, 'sanity'); assert.equal(article.status, 'cms_published'); assert.equal(article.cmsPerspective, 'published');
    assert.equal(article.coverState, 'approved'); assert.equal(article.productionAllowed, false);
    assert.equal(findDeliveredArticle(collection, article.slug), article);
    assert.equal(articleCardData(article).title, article.title); assert.equal(articleCardData(article).excerpt, article.excerpt);
  }
});

for (const scenario of ['empty', 'partial', 'missing title', 'missing author', 'missing cover', 'bad reference', 'duplicate slug', 'draft identity', 'unapproved cover'] as const) test(`published collection rejects ${scenario} without dropping failed entries or showing drafts`, async () => {
  let docs = documents();
  if (scenario === 'empty') docs = [];
  if (scenario === 'partial') docs = docs.slice(0, 1);
  if (scenario === 'missing title') delete docs[0]!['title'];
  if (scenario === 'missing author') delete docs[0]!['authorDisplay'];
  if (scenario === 'missing cover') delete docs[0]!['coverImage'];
  if (scenario === 'bad reference') mutate(docs[0], ['relatedCategories', 0, 'document'], null);
  if (scenario === 'duplicate slug') mutate(docs[1], ['slug', 'current'], dev05bDraftScope.slug);
  if (scenario === 'draft identity') mutate(docs[0], ['_originalId'], `drafts.${docs[0]!['_id']}`);
  if (scenario === 'unapproved cover') mutate(docs[0], ['coverImage', 'publicUseApproved'], false);
  const load = createArticleDeliveryLoader({ published: { now: () => now, transport: response(docs) } });
  await assert.rejects(load({ env: publishedEnv, command: 'dev', url: origin }), safeError(scenario === 'empty' ? 'CMS_EMPTY' : scenario === 'partial' ? 'CMS_INCOMPLETE_COLLECTION' : undefined));
});

test('one build shares one snapshot; the next build starts fresh, and a mid-build source change fails', async () => {
  let calls = 0;
  const options = { published: { now: () => now, transport: async () => { calls++; return new Response(JSON.stringify({ result: documents() })); } } };
  const load = createArticleDeliveryLoader(options);
  const [home, journal, detail] = await Promise.all([1, 2, 3].map(() => load({ env: publishedEnv, command: 'build' })));
  assert.equal(calls, 1); assert.equal(home, journal); assert.equal(journal, detail);
  await assert.rejects(load({ env: mockEnv, command: 'build' }), safeError('ARTICLE_BUILD_SOURCE_CHANGED'));
  await createArticleDeliveryLoader(options)({ env: publishedEnv, command: 'build' }); assert.equal(calls, 2);
});

test('article integration does not open full-site Sanity, production or analytics', async () => {
  const load = createArticleDeliveryLoader();
  for (const patch of [{ CONTENT_MODE: 'sanity' }, { DEPLOY_ENV: 'production' }, { ANALYTICS_MODE: 'on' }, { CONCEPT_MODE: 'false' }]) await assert.rejects(load({ env: { ...mockEnv, ...patch }, command: 'dev', url: origin }));
});
