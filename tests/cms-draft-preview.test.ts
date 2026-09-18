import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { parse, evaluate } from 'groq-js';
import { convertCmsDraftPreviewArticle, dev05bDraftScope } from '../shared/cms-draft-preview';
import { CmsContentError } from '../shared/cms-validation';
import { fixtureBody, mutate } from './fixtures/cms-articles';
import { draftPreviewConfigFromEnvironment, draftPreviewQuery, draftPreviewQueryPolicy, createDraftPreviewReader, type DraftPreviewTransport } from '../web/src/lib/server/cms-draft-preview-query';
import type { EditorialBlock } from '../shared/editorial';

const canary = `DRAFT_TEST_${randomUUID()}`;
const now = Date.parse('2026-09-17T12:00:00Z');
const context = { projectId: dev05bDraftScope.projectId, dataset: dev05bDraftScope.dataset, perspective: 'drafts' as const, now };
const config = () => ({ projectId: dev05bDraftScope.projectId, dataset: dev05bDraftScope.dataset, token: canary, documentIds: [dev05bDraftScope.documentId] });
const body: EditorialBlock[] = [
  { type: 'paragraph', content: [{ type: 'text', text: 'Unpublished draft fixture.' }] },
  { type: 'callout', title: 'Draft only', content: [{ type: 'text', text: 'No factory claim.' }] },
  { type: 'heading', level: 2, text: 'Prepare' },
  { type: 'paragraph', content: [{ type: 'text', text: 'Describe the style.' }] },
  { type: 'heading', level: 2, text: 'Quantities' },
  { type: 'table', caption: 'Planning fields', columns: ['Field', 'Value'], rows: [['Style', 'Working name'], ['Quantity', 'Proposal']] },
  { type: 'heading', level: 2, text: 'Enquiry' },
  { type: 'template', title: 'Draft enquiry', text: 'Subject: draft only\n\nQuantity: [proposal]' },
];
function draftDocument() {
  return { _type: 'article', _id: dev05bDraftScope.documentId, _originalId: `drafts.${dev05bDraftScope.documentId}`, _rev: 'draft-revision-1', _updatedAt: '2026-09-17T06:12:50Z',
    title: 'What to Send Before Requesting a Custom Clothing Quote', slug: { current: dev05bDraftScope.slug }, excerpt: 'DEV-05B draft fixture — not published.', referenceCode: dev05bDraftScope.referenceCode,
    seo: { _type: 'seo', seoTitle: 'Draft quote guide', seoDescription: 'Unpublished technical fixture.' }, factReviewStatus: 'pending', body: fixtureBody(body) };
}
const errorCode = (code?: string) => (error: unknown): boolean => error instanceof CmsContentError && (!code || error.code === code) && !String(error.stack).includes(canary) && !('cause' in error);
const response = (result: unknown): DraftPreviewTransport => async () => new Response(JSON.stringify({ result }), { status: 200 });
const reader = (transport: DraftPreviewTransport, timeoutMs = 1000) => createDraftPreviewReader(config(), { transport, timeoutMs, now: () => now });

 test('draft converter returns an explicit non-production preview without inventing publication fields', () => {
  const converted = convertCmsDraftPreviewArticle([draftDocument()], context);
  assert.equal(converted.kind, 'cms_article_draft_preview'); assert.equal(converted.cmsPerspective, 'drafts');
  assert.equal(converted.status, 'cms_draft_preview'); assert.equal(converted.websitePublication, 'not_published'); assert.equal(converted.productionAllowed, false);
  assert.equal(converted.factReviewStatus, 'pending'); assert.deepEqual(converted.body, body);
  for (const key of ['authorDisplay', 'publishedAt', 'contentUpdatedAt', 'factConfirmedAt', 'cover', 'coverImage', 'publicUseApproved']) assert.equal(key in converted, false, key);
});

test('draft query is exact-scope and retains supported body blocks for validation', async () => {
  const result = await (await evaluate(parse(draftPreviewQuery), { dataset: [draftDocument()], params: { id: dev05bDraftScope.documentId, slug: dev05bDraftScope.slug } })).get();
  assert.equal(result.length, 1); assert.equal(convertCmsDraftPreviewArticle(result, context).body.length, body.length);
  const unknown = draftDocument(); unknown.body.push({ _type: 'unknownBlock', _key: 'unknown', secret: canary });
  const projected = await (await evaluate(parse(draftPreviewQuery), { dataset: [unknown], params: { id: dev05bDraftScope.documentId, slug: dev05bDraftScope.slug } })).get();
  assert.throws(() => convertCmsDraftPreviewArticle(projected, context), errorCode('CMS_UNSUPPORTED_BLOCK'));
});

test('draft reader uses drafts/no-store POST policy and only the authorized ID and slug', async () => {
  let calls = 0;
  const transport: DraftPreviewTransport = async (url, init) => {
    calls++; const endpoint = new URL(url);
    assert.equal(endpoint.hostname, `${dev05bDraftScope.projectId}.api.sanity.io`);
    assert.equal(endpoint.pathname, `/v${draftPreviewQueryPolicy.apiVersion}/data/query/${dev05bDraftScope.dataset}`);
    assert.equal(endpoint.searchParams.get('perspective'), 'drafts'); assert.equal(endpoint.searchParams.get('returnQuery'), 'false');
    assert.equal(init.method, 'POST'); assert.equal(init.cache, 'no-store'); assert.equal(init.redirect, 'error'); assert.equal(init.credentials, 'omit');
    assert.equal(new Headers(init.headers).get('Authorization'), `Bearer ${canary}`);
    const payload = JSON.parse(String(init.body)); assert.equal(payload.query, draftPreviewQuery); assert.deepEqual(payload.params, { id: dev05bDraftScope.documentId, slug: dev05bDraftScope.slug });
    assert.ok(!url.includes(canary) && !String(init.body).includes(canary));
    return new Response(JSON.stringify({ result: [draftDocument()] }));
  };
  const instance = reader(transport); const value = await instance.read(dev05bDraftScope.documentId, dev05bDraftScope.slug);
  assert.equal(value.documentId, dev05bDraftScope.documentId); assert.equal(calls, 1); assert.deepEqual(instance.policy, draftPreviewQueryPolicy); assert.ok(!JSON.stringify(instance).includes(canary));
  await assert.rejects(instance.read('not-authorized', dev05bDraftScope.slug), errorCode('CMS_NOT_AUTHORIZED'));
  await assert.rejects(instance.read(dev05bDraftScope.documentId, 'moq-per-style-per-color'), errorCode('CMS_NOT_AUTHORIZED')); assert.equal(calls, 1);
});

test('draft reader configuration is explicit and fixed to the authorized project, dataset and one ID', () => {
  assert.throws(() => draftPreviewConfigFromEnvironment({}), errorCode('CMS_NOT_CONFIGURED'));
  const env = { SANITY_PROJECT_ID: dev05bDraftScope.projectId, SANITY_DATASET: dev05bDraftScope.dataset, SANITY_READ_TOKEN: canary, SANITY_ARTICLE_READ_IDS: dev05bDraftScope.documentId, SANITY_API_VERSION: draftPreviewQueryPolicy.apiVersion };
  assert.deepEqual(draftPreviewConfigFromEnvironment(env), config());
  for (const patch of [{ SANITY_PROJECT_ID: 'other' }, { SANITY_DATASET: 'other' }, { SANITY_READ_TOKEN: '' }, { SANITY_ARTICLE_READ_IDS: `${dev05bDraftScope.documentId},other` }, { SANITY_ARTICLE_READ_IDS: 'other' }, { SANITY_API_VERSION: '2026-01-01' }]) {
    assert.throws(() => draftPreviewConfigFromEnvironment({ ...env, ...patch }), errorCode());
  }
});

for (const [status, code] of [[401, 'CMS_UNAUTHENTICATED'], [403, 'CMS_FORBIDDEN'], [429, 'CMS_HTTP'], [500, 'CMS_HTTP']] as const) test(`draft HTTP ${status} is sanitized and has no fallback`, async () => {
  let calls = 0; await assert.rejects(reader(async () => { calls++; return new Response(canary, { status }); }).read(dev05bDraftScope.documentId, dev05bDraftScope.slug), errorCode(code)); assert.equal(calls, 1);
});

test('draft reader rejects empty, malformed, wrong-scope and secret-bearing transport failures', async () => {
  for (const result of [null, undefined, [], {}, 'not an array']) await assert.rejects(reader(response(result)).read(dev05bDraftScope.documentId, dev05bDraftScope.slug), errorCode());
  const wrongId = draftDocument(); mutate(wrongId, ['_id'], 'other'); await assert.rejects(reader(response([wrongId])).read(dev05bDraftScope.documentId, dev05bDraftScope.slug), errorCode('CMS_SCOPE'));
  const wrongSlug = draftDocument(); mutate(wrongSlug, ['slug', 'current'], 'moq-per-style-per-color'); await assert.rejects(reader(response([wrongSlug])).read(dev05bDraftScope.documentId, dev05bDraftScope.slug), errorCode('CMS_SCOPE'));
  await assert.rejects(reader(async () => { throw new Error(canary); }).read(dev05bDraftScope.documentId, dev05bDraftScope.slug), errorCode('CMS_TRANSPORT'));
  await assert.rejects(reader(async () => new Response(canary)).read(dev05bDraftScope.documentId, dev05bDraftScope.slug), errorCode('CMS_INVALID_JSON'));
  await assert.rejects(reader(async () => new Response('x'.repeat(draftPreviewQueryPolicy.maxResponseBytes + 1))).read(dev05bDraftScope.documentId, dev05bDraftScope.slug), errorCode('CMS_RESPONSE_LIMIT'));
});

test('draft reader deadline covers transport and body reads', async () => {
  await assert.rejects(reader(async () => new Promise<Response>(() => undefined), 10).read(dev05bDraftScope.documentId, dev05bDraftScope.slug), errorCode('CMS_TIMEOUT'));
  await assert.rejects(reader(async () => new Response(new ReadableStream({ start() {} })), 10).read(dev05bDraftScope.documentId, dev05bDraftScope.slug), errorCode('CMS_TIMEOUT'));
});

test('draft body validation still rejects unknown blocks, dangerous links, bad tables and internal references', () => {
  const unknown = draftDocument(); unknown.body.push({ _type: 'iframe', _key: 'bad', src: canary }); assert.throws(() => convertCmsDraftPreviewArticle([unknown], context), errorCode('CMS_UNSUPPORTED_BLOCK'));
  const badTable = draftDocument(); mutate(badTable, ['body', 5, 'rows', 0, 'cells'], ['only-one']); assert.throws(() => convertCmsDraftPreviewArticle([badTable], context), errorCode());
  const dangerous = draftDocument(); dangerous.body = fixtureBody([{ type: 'heading', level: 2, text: 'A' }, { type: 'heading', level: 2, text: 'B' }, { type: 'heading', level: 2, text: 'C' }, { type: 'paragraph', content: [{ type: 'link', text: 'Source', href: 'https://www.shopify.com/blog/minimum-order-quantity' }] }]); mutate(dangerous, ['body', 3, 'markDefs', 0, 'href'], 'javascript:alert(1)'); assert.throws(() => convertCmsDraftPreviewArticle([dangerous], context), errorCode('CMS_LINK'));
  const internal = draftDocument(); internal.body = fixtureBody([{ type: 'heading', level: 2, text: 'A' }, { type: 'heading', level: 2, text: 'B' }, { type: 'heading', level: 2, text: 'C' }, { type: 'paragraph', content: [{ type: 'link', text: 'Internal', href: '/manufacturing/' }] }]); assert.throws(() => convertCmsDraftPreviewArticle([internal], context), errorCode('CMS_DRAFT_REFERENCE'));
});
