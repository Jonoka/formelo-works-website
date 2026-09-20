import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { evaluate, parse } from 'groq-js';
import { pageKeys } from '../shared/content';
import { CmsContentError, record, type RecordValue } from '../shared/cms-validation';
import { cmsCategoryScopes, convertCmsSiteBundle } from '../shared/cms-site';
import { readRuntime } from '../config/runtime';
import { loadContent } from '../web/src/lib/content';
import { createSiteReader, siteBundleQuery, siteQueryPolicy, siteReaderConfigFromEnvironment, type SiteTransport } from '../web/src/lib/server/cms-site-query';
import { fixtureSiteBundle, fixtureSiteContext, fixtureSiteDataset, mutateSite } from './fixtures/cms-site';

const canary = 'OFFLINE_SITE_TOKEN_CANARY';
const config = () => ({ projectId: fixtureSiteContext.projectId, dataset: fixtureSiteContext.dataset, token: canary });
const errorCode = (code?: string) => (error: unknown) => error instanceof CmsContentError && (!code || error.code === code) && !String(error.stack).includes(canary);
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const response = (result: unknown, status = 200, metadata: Record<string, unknown> = { ms: 4 }) => jsonResponse({ ...metadata, result }, status);

test('published site bundle converts one settings singleton, six fixed routes and two categories without becoming a website-release approval', () => {
  const mapped = convertCmsSiteBundle(fixtureSiteBundle(), fixtureSiteContext);
  assert.equal(mapped.kind, 'cms_site_bundle'); assert.equal(mapped.productionAllowed, false); assert.equal(mapped.websitePublication, 'not_verified');
  assert.deepEqual(mapped.pages.map(page => page.pageKey).sort(), [...pageKeys].sort());
  assert.deepEqual(mapped.categories.map(category => category.slug).sort(), Object.keys(cmsCategoryScopes).sort());
  assert.deepEqual(new Set(mapped.siteSettings.featuredCategories), new Set(['/clothing/t-shirts/', '/clothing/hoodies/']));
  assert.equal(mapped.siteSettings.logo.publicUseApproved, true);
  assert.equal(mapped.pages.find(page => page.pageKey === 'blogIndex')?.factConfirmedAt, null);
  assert.equal(mapped.pages.find(page => page.pageKey === 'privacy')?.factConfirmedAt, null);
  for (const category of mapped.categories) {
    assert.equal(category.samples.length, 3); assert.equal(category.capabilityRows.length, 1); assert.equal(category.evidenceImages.length, 1);
    assert.deepEqual(category.effectiveMoq, mapped.siteSettings.defaultMoq);
    assert.equal(category.heroImage.source, 'sanity'); assert.equal(category.productionAllowed, false);
  }
});

const invalid: [string, (string | number)[], unknown, string?][] = [
  ['settings singleton missing', ['settings'], [], 'CMS_INVALID'],
  ['duplicate page identity', ['pages', 1, 'pageKey'], 'home', 'CMS_DUPLICATE_ROUTE'],
  ['page count ambiguous', ['pages', 0, 'pageKeyCount'], 2, 'CMS_DUPLICATE_ROUTE'],
  ['category source code wrong', ['categories', 0, 'referenceCode'], 'WEB-HOME', 'CMS_SOURCE_CODE'],
  ['category code wrong', ['categories', 0, 'categoryCode'], 'shirts', 'CMS_SOURCE_CODE'],
  ['too few samples', ['categories', 0, 'samples'], [], 'CMS_INVALID'],
  ['missing capability rows', ['categories', 0, 'capabilityRows'], [], 'CMS_INVALID'],
  ['missing evidence images', ['categories', 0, 'evidenceImages'], [], 'CMS_INVALID'],
  ['missing customization notes', ['categories', 0, 'customizationNotes'], null, 'CMS_INVALID'],
  ['missing sampling notes', ['categories', 0, 'samplingNotes'], null, 'CMS_INVALID'],
  ['contact email malformed', ['settings', 0, 'email'], 'a@example.invalid\nBcc:x', 'CMS_CONTACT'],
  ['WhatsApp malformed', ['settings', 0, 'whatsappDigits'], '+8613800138000', 'CMS_CONTACT'],
  ['unapproved logo', ['settings', 0, 'logo', 'publicUseApproved'], false, 'CMS_ASSET_APPROVAL'],
  ['project MOQ with quantity', ['settings', 0, 'defaultMoq', 'quantity'], 1, 'CMS_MOQ'],
  ['future fact date', ['pages', 0, 'factConfirmedAt'], '2099-01-01', 'CMS_DATE'],
  ['business page missing fact date', ['pages', 0, 'factConfirmedAt'], null, 'CMS_REVIEW'],
  ['unsupported field', ['pages', 0, 'privateNote'], 'secret', 'CMS_UNSUPPORTED_FIELD'],
];
for (const [name, path, value, code] of invalid) test(`site provider fails closed: ${name}`, () => {
  const bundle = fixtureSiteBundle(); mutateSite(bundle, path, value);
  assert.throws(() => convertCmsSiteBundle(bundle, fixtureSiteContext), errorCode(code));
});
test('sample codes are globally unique and featured categories must be exactly the two planned published routes', () => {
  const duplicate = fixtureSiteBundle();
  const categories = duplicate['categories'] as RecordValue[];
  const firstCode = ((categories[0]!['samples'] as RecordValue[])[0]!['sampleCode']);
  ((categories[1]!['samples'] as RecordValue[])[0]!)['sampleCode'] = firstCode;
  assert.throws(() => convertCmsSiteBundle(duplicate, fixtureSiteContext), errorCode('CMS_DUPLICATE_SAMPLE'));
  const featured = fixtureSiteBundle(); (featured['settings'] as RecordValue[])[0]!['featuredCategories'] = [(featured['settings'] as RecordValue[])[0]!['featuredCategories'] as never];
  assert.throws(() => convertCmsSiteBundle(featured, fixtureSiteContext));
});

test('real GROQ parses/evaluates offline, returns only the fixed bundle and ignores draft/release variants', async () => {
  const dataset = fixtureSiteDataset();
  const root = dataset.find(doc => doc['_id'] === 'offline.site-settings')!; root['privateNote'] = canary;
  dataset.push({ ...structuredClone(root), _id: 'drafts.offline.site-settings' }, { ...structuredClone(root), _id: 'versions.release.offline.site-settings' });
  const result = await (await evaluate(parse(siteBundleQuery), { dataset, params: { pageKeys: [...pageKeys], categorySlugs: Object.keys(cmsCategoryScopes) } })).get();
  const mapped = convertCmsSiteBundle(result, fixtureSiteContext);
  assert.equal(mapped.pages.length, 6); assert.equal(mapped.categories.length, 2);
  assert.ok(!JSON.stringify(result).includes(canary)); assert.ok(!JSON.stringify(result).includes('privateNote'));
});

test('site reader is fixed published/no-store POST query with no arbitrary document selector', async () => {
  let calls = 0;
  const transport: SiteTransport = async (url, init) => {
    calls++; const endpoint = new URL(url), headers = new Headers(init.headers);
    assert.equal(endpoint.hostname, `${fixtureSiteContext.projectId}.api.sanity.io`);
    assert.equal(endpoint.pathname, '/v2025-02-19/data/query/offline-fixture');
    assert.equal(endpoint.searchParams.get('perspective'), 'published');
    assert.equal(init.method, 'POST'); assert.equal(init.cache, 'no-store'); assert.equal(init.redirect, 'error'); assert.equal(init.credentials, 'omit');
    assert.equal(headers.get('Authorization'), `Bearer ${canary}`);
    const body = JSON.parse(String(init.body)); assert.equal(body.query, siteBundleQuery);
    assert.deepEqual(body.params.pageKeys, [...pageKeys]); assert.deepEqual(body.params.categorySlugs, Object.keys(cmsCategoryScopes));
    assert.ok(!url.includes(canary) && !String(init.body).includes(canary));
    return response(fixtureSiteBundle());
  };
  const reader = createSiteReader(config(), { transport, now: () => fixtureSiteContext.now });
  assert.equal((await reader.read()).kind, 'cms_site_bundle'); assert.equal(calls, 1); assert.deepEqual(reader.policy, siteQueryPolicy);
});

test('site reader accepts the normal Query HTTP envelope with server processing time', async () => {
  const reader = createSiteReader(config(), { transport: async () => response(fixtureSiteBundle()), now: () => fixtureSiteContext.now });
  const mapped = await reader.read();
  assert.equal(mapped.kind, 'cms_site_bundle');
  assert.equal(Object.hasOwn(mapped, 'ms'), false); assert.equal(Object.hasOwn(mapped, 'syncTags'), false);
});

test('site reader accepts supported optional Query metadata without forwarding it', async () => {
  const reader = createSiteReader(config(), {
    transport: async () => response(fixtureSiteBundle(), 200, { ms: 1.25, syncTags: [canary, 'tag-b'] }),
    now: () => fixtureSiteContext.now,
  });
  const mapped = await reader.read();
  assert.equal(mapped.kind, 'cms_site_bundle');
  assert.equal(JSON.stringify(mapped).includes(canary), false);
});

test('site reader rejects missing result, invalid envelope types and invalid protocol metadata', async () => {
  const readEnvelope = (body: unknown) => createSiteReader(config(), {
    transport: async () => jsonResponse(body), now: () => fixtureSiteContext.now,
  }).read();
  await assert.rejects(readEnvelope({ ms: 1 }), errorCode('CMS_EMPTY'));
  await assert.rejects(readEnvelope([]), errorCode('CMS_INVALID'));
  await assert.rejects(readEnvelope(null), errorCode('CMS_INVALID'));
  await assert.rejects(readEnvelope({ ms: -1, result: fixtureSiteBundle() }), errorCode('CMS_INVALID'));
  await assert.rejects(readEnvelope({ ms: 1, syncTags: 'not-an-array', result: fixtureSiteBundle() }), errorCode('CMS_INVALID'));
});

test('site reader still rejects invalid result and unsupported business fields inside a valid HTTP envelope', async () => {
  await assert.rejects(createSiteReader(config(), { transport: async () => response({ settings: [], pages: [], categories: [] }), now: () => fixtureSiteContext.now }).read(), errorCode('CMS_INVALID'));
  const result = fixtureSiteBundle(); mutateSite(result, ['pages', 0, 'privateNote'], 'must stay rejected');
  await assert.rejects(createSiteReader(config(), { transport: async () => response(result, 200, { ms: 2, syncTags: ['tag-a'] }), now: () => fixtureSiteContext.now }).read(), errorCode('CMS_UNSUPPORTED_FIELD'));
});

test('missing configuration and malformed config cannot initiate site transport', () => {
  let calls = 0; const transport: SiteTransport = async () => { calls++; throw new Error(canary); };
  assert.throws(() => createSiteReader(undefined, { transport }), errorCode('CMS_NOT_CONFIGURED'));
  assert.throws(() => siteReaderConfigFromEnvironment({}), errorCode('CMS_SITE_READ_NOT_AUTHORIZED'));
  assert.throws(() => siteReaderConfigFromEnvironment({ SANITY_SITE_READ_ENABLED: '1' }), errorCode('CMS_NOT_CONFIGURED'));
  assert.throws(() => createSiteReader({ ...config(), token: '' }, { transport }), errorCode());
  assert.equal(calls, 0);
});

test('environment site reading needs a separate explicit opt-in beyond the existing token variables', () => {
  const base = { SANITY_PROJECT_ID: fixtureSiteContext.projectId, SANITY_DATASET: fixtureSiteContext.dataset, SANITY_READ_TOKEN: canary, SANITY_API_VERSION: siteQueryPolicy.apiVersion };
  assert.throws(() => siteReaderConfigFromEnvironment(base), errorCode('CMS_SITE_READ_NOT_AUTHORIZED'));
  assert.deepEqual(siteReaderConfigFromEnvironment({ ...base, SANITY_SITE_READ_ENABLED: '1' }), config());
});
for (const [status, code] of [[401, 'CMS_UNAUTHENTICATED'], [403, 'CMS_FORBIDDEN'], [429, 'CMS_HTTP'], [500, 'CMS_HTTP']] as const) test(`site HTTP ${status} is sanitized and has no fallback`, async () => {
  let calls = 0; const reader = createSiteReader(config(), { transport: async () => { calls++; return new Response(canary, { status }); }, now: () => fixtureSiteContext.now });
  await assert.rejects(reader.read(), errorCode(code)); assert.equal(calls, 1);
});
test('site reader sanitizes invalid JSON, oversized bodies, transport errors and timeouts', async () => {
  const read = (transport: SiteTransport, timeoutMs = 8000) => createSiteReader(config(), { transport, timeoutMs, now: () => fixtureSiteContext.now }).read();
  await assert.rejects(read(async () => new Response(canary)), errorCode('CMS_INVALID_JSON'));
  await assert.rejects(read(async () => new Response('x'.repeat(siteQueryPolicy.maxResponseBytes + 1))), errorCode('CMS_RESPONSE_LIMIT'));
  await assert.rejects(read(async () => { throw new Error(canary); }), errorCode('CMS_TRANSPORT'));
  await assert.rejects(read(async () => new Promise<Response>(() => undefined), 10), errorCode('CMS_TIMEOUT'));
});

test('full-site mode remains blocked; the default mock entry does not directly import a CMS transport', async () => {
  const before = await loadContent('mock');
  await assert.rejects(loadContent('sanity'), /refusing to fall back/);
  assert.throws(() => readRuntime({ CONTENT_MODE: 'sanity' }), /No fallback/);
  assert.deepEqual(await loadContent('mock'), before);
  assert.doesNotMatch(readFileSync('web/src/lib/content.ts', 'utf8'), /cms-site-query|SANITY_READ_TOKEN/);
});
