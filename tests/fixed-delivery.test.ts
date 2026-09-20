import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluate, parse } from 'groq-js';
import { createSiteDeliveryLoader } from '../web/src/lib/server/site-delivery';
import { siteBundleQuery } from '../web/src/lib/server/cms-site-query';
import { readSiteModes, contactReleasePolicy } from '../shared/site-delivery';
import { convertCmsSiteBundle } from '../shared/cms-site';
import { CmsContentError, type RecordValue } from '../shared/cms-validation';
import { fixedPageKeys } from '../shared/cms-fixed';
import { validatePageTemplateInput } from '../studio/schemaTypes/page-content';
import { siteDeliveryFixture } from './fixtures/site-delivery';
import { fixtureApprovedImage, fixtureSiteContext, fixtureSiteDataset, mutateSite } from './fixtures/cms-site';

const env = { FORMELO_ENV_FILES: 'ignore', HOME_CATEGORY_CONTENT_MODE: 'published', FIXED_PAGE_CONTENT_MODE: 'published', ARTICLE_CONTENT_MODE: 'published',
  SANITY_SITE_READ_ENABLED: '1', SANITY_PROJECT_ID: 'offline1', SANITY_DATASET: 'offline-fixture', SANITY_API_VERSION: '2025-02-19', SANITY_READ_TOKEN: 'offline-fixed-test-token-not-real', DEPLOY_ENV: 'local', CONTENT_MODE: 'mock', CONCEPT_MODE: 'true', ANALYTICS_MODE: 'off' };
const pageIndex = (key: string) => ['home', ...fixedPageKeys].indexOf(key);
const invalid = (error: unknown) => error instanceof CmsContentError && /^(CMS|SITE)_/.test(error.code) && !error.message.includes(env.SANITY_READ_TOKEN);
function harness() {
  let bundle = siteDeliveryFixture(), calls = 0, status = 200;
  const load = createSiteDeliveryLoader({ now: () => fixtureSiteContext.now, transport: async (_input, init) => {
    calls++; assert.equal(init?.method, 'POST'); assert.equal(init?.cache, 'no-store');
    assert.equal(JSON.parse(String(init?.body)).query, siteBundleQuery);
    return new Response(JSON.stringify({ ms: 4, syncTags: ['test-query-metadata'], result: bundle }), { status });
  } });
  return { load, set: (value: RecordValue) => { bundle = value; }, status: (value: number) => { status = value; }, calls: () => calls };
}

test('fixed source has exactly three legal combinations and preserves the old three-page switch', () => {
  assert.deepEqual(readSiteModes({}), { homeCategory: 'mock', fixed: 'mock' });
  assert.deepEqual(readSiteModes({ HOME_CATEGORY_CONTENT_MODE: 'published' }), { homeCategory: 'published', fixed: 'mock' });
  assert.deepEqual(readSiteModes(env), { homeCategory: 'published', fixed: 'published' });
  for (const mode of ['sanity', 'draft-preview', '', 'other']) assert.throws(() => readSiteModes({ FIXED_PAGE_CONTENT_MODE: mode }), /SITE_SOURCE_CONFIG/);
  assert.throws(() => readSiteModes({ FIXED_PAGE_CONTENT_MODE: 'published' }), /SITE_SOURCE_CONFLICT/);
});

test('default full mock and conflicting source configuration make zero site requests', async () => {
  const h = harness();
  const local = await h.load({ env: { ...env, HOME_CATEGORY_CONTENT_MODE: 'mock', FIXED_PAGE_CONTENT_MODE: 'mock' }, command: 'build', buildId: 'mock' });
  assert.equal(h.calls(), 0);
  for (const key of fixedPageKeys) assert.equal(local.fixedPages[key].source, 'local');
  await assert.rejects(h.load({ env: { ...env, HOME_CATEGORY_CONTENT_MODE: 'mock' }, command: 'dev' }), /SITE_SOURCE_CONFLICT/);
  assert.equal(h.calls(), 0);
});

test('all five typed contents pass the actual fixed GROQ and strict reader into shared delivery', async () => {
  const dataset = fixtureSiteDataset(siteDeliveryFixture());
  const queryResult = await (await evaluate(parse(siteBundleQuery), { dataset, params: { pageKeys: ['home', ...fixedPageKeys], categorySlugs: ['t-shirts', 'hoodies'] } })).get();
  const h = harness(); h.set(queryResult);
  const site = await h.load({ env, command: 'dev' });
  assert.equal(h.calls(), 1); assert.equal(site.fixedMode, 'published');
  for (const key of fixedPageKeys) {
    assert.equal(site.fixedPages[key].source, 'sanity'); assert.equal(site.fixedPages[key].pageKey, key);
    assert.equal(site.fixedPages[key].status, 'cms_published'); assert.equal(site.fixedPages[key].productionAllowed, false);
    assert.equal(site.fixedPages[key].websitePublication, 'not_verified');
  }
  assert.match(site.fixedPages.manufacturing.productionSteps[0]!.description, /productionSteps 1 one/);
  assert.deepEqual(site.fixedPages.manufacturing.defaultMoq, site.cms?.siteSettings.defaultMoq);
  assert.match(site.fixedPages.factory.overview, /factory overview one/);
  assert.match(site.fixedPages.contact.preparation[0]!.description, /contact preparation 1 one/);
  assert.match(site.fixedPages.blogIndex.columnNote, /Journal column note one/);
  assert.match(JSON.stringify(site.fixedPages.privacy.body), /policy paragraph one/);
  assert.equal(site.fixedPages.privacy.referenceCode, null); assert.equal(site.fixedPages.privacy.effectiveAt, null);
  assert.equal(site.shell.contact.enabled, false); assert.equal(site.shell.contact.copyingAllowed, false);
  assert.equal(contactReleasePolicy.activationAllowed, false);
});

test('explicit old Home/Category-only mode keeps every fixed body local rather than partially mixing CMS', async () => {
  const h = harness(), site = await h.load({ env: { ...env, FIXED_PAGE_CONTENT_MODE: 'mock' }, command: 'dev' });
  assert.equal(site.home.source, 'sanity');
  for (const key of fixedPageKeys) { assert.equal(site.fixedPages[key].source, 'local'); assert.doesNotMatch(JSON.stringify(site.fixedPages[key]), /OFFLINE/); }
  assert.equal(h.calls(), 1);
});

test('fixed page revisions refresh in dev and new builds, while a build protects its snapshot and source mode', async () => {
  const h = harness();
  const first = await h.load({ env, command: 'build', buildId: 'first' });
  h.set(siteDeliveryFixture('two'));
  const same = await h.load({ env, command: 'build', buildId: 'first' });
  assert.deepEqual(same, first); assert.equal(h.calls(), 1);
  same.fixedPages.contact.preparation[0]!.description = 'caller mutation';
  assert.match((await h.load({ env, command: 'build', buildId: 'first' })).fixedPages.contact.preparation[0]!.description, /one/);
  await assert.rejects(h.load({ env: { ...env, FIXED_PAGE_CONTENT_MODE: 'mock' }, command: 'build', buildId: 'first' }), /SITE_BUILD_SOURCE_CHANGED/);
  const second = await h.load({ env, command: 'build', buildId: 'second' });
  assert.match(second.fixedPages.factory.overview, /two/);
  h.set(siteDeliveryFixture('three'));
  assert.match((await h.load({ env, command: 'dev' })).fixedPages.factory.overview, /three/);
});

for (const [key, field, value] of [
  ['manufacturing', 'productionSteps', []], ['factory', 'overview', ''], ['contact', 'preparation', []], ['blogIndex', 'columnNote', null], ['privacy', 'body', []],
] as const) test(`${key}: missing required body rejects after success with no previous-content fallback`, async () => {
  const h = harness(); await h.load({ env, command: 'dev' });
  const fixture = siteDeliveryFixture(); mutateSite(fixture, ['pages', pageIndex(key), 'templateContent', field], value); h.set(fixture);
  await assert.rejects(h.load({ env, command: 'dev' }), invalid);
  await assert.rejects(h.load({ env, command: 'build', buildId: 'bad' }), invalid);
});

for (const [name, path, value] of [
  ['mismatched pageKey', ['pages', 1, 'templateContent', 'pageKey'], 'factory'],
  ['mismatched type', ['pages', 1, 'templateContent', '_type'], 'homeTemplateContent'],
  ['duplicate route', ['pages', 2, 'pageKey'], 'manufacturing'],
  ['bad strong reference', ['pages', 3, 'templateContent', 'relatedLinks', 0, 'target', '_ref'], 'missing.document'],
  ['unknown business field', ['pages', 2, 'templateContent', 'productionCapacity'], 'invented'],
  ['unlicensed factory image', ['pages', 2, 'templateContent', 'gallery'], [{ ...fixtureApprovedImage('f'), publicUseApproved: false }]],
  ['unsafe plain text', ['pages', 1, 'templateContent', 'options', 0, 'description'], '<iframe src="https://example.invalid"></iframe>'],
  ['unsafe fragment', ['pages', 3, 'templateContent', 'relatedLinks', 0, 'fragment'], 'javascript:alert(1)'],
  ['wrong-page hero', ['pages', 3, 'heroImage'], fixtureApprovedImage('f')],
  ['test release field', ['pages', 3, 'templateContent', 'contactsEnabled'], true],
  ['configured token leakage', ['pages', 3, 'templateContent', 'preparationNote'], env.SANITY_READ_TOKEN],
] as [string, (string | number)[], unknown][]) test(`five-page strict boundary: ${name}`, async () => {
  const h = harness(), fixture = siteDeliveryFixture(); mutateSite(fixture, path, value); h.set(fixture);
  await assert.rejects(h.load({ env, command: 'dev' }), invalid);
});

for (const [field, value] of [['policyStatus', 'in_effect'], ['effectiveAt', '2026-09-17'], ['legalEntity', 'A test company'], ['privacyContact', 'factory@example.invalid'], ['providers', ['invented provider']], ['retention', 'five years'], ['legalReviewStatus', 'approved']] as const) test(`Privacy cannot manufacture ${field}`, () => {
  const fixture = siteDeliveryFixture(); mutateSite(fixture, ['pages', 5, 'templateContent', field], value);
  assert.throws(() => convertCmsSiteBundle(fixture, fixtureSiteContext), invalid);
});

test('recorded legal review remains separate from technical publication and policy effectiveness', async () => {
  const fixture = siteDeliveryFixture(); mutateSite(fixture, ['pages', 5, 'templateContent', 'legalReviewStatus'], 'reviewed'); mutateSite(fixture, ['pages', 5, 'templateContent', 'legalReviewedAt'], '2026-09-17');
  const h = harness(); h.set(fixture); const page = (await h.load({ env, command: 'dev' })).fixedPages.privacy;
  assert.equal(page.status, 'cms_published'); assert.equal(page.legalReviewStatus, 'reviewed'); assert.equal(page.policyStatus, 'draft_not_in_effect'); assert.equal(page.effectiveAt, null); assert.equal(page.websitePublication, 'not_verified'); assert.equal(page.referenceCode, null);
});

test('optional factory image/credential groups are omitted only when absent or empty; required profile never is', async () => {
  const h = harness();
  const page = (await h.load({ env, command: 'dev' })).fixedPages.factory;
  assert.equal(page.heroImage, null); assert.deepEqual(page.gallery, []); assert.deepEqual(page.credentials, []);
  const fixture = siteDeliveryFixture(); mutateSite(fixture, ['pages', 2, 'templateContent', 'gallery'], [fixtureApprovedImage('f')]); mutateSite(fixture, ['pages', 2, 'templateContent', 'credentials'], [{ title: 'OFFLINE supporting credential note', description: 'Synthetic test evidence, not a real certificate.' }]); h.set(fixture);
  const withMaterial = (await h.load({ env, command: 'dev' })).fixedPages.factory;
  assert.equal(withMaterial.gallery.length, 1); assert.equal(withMaterial.credentials.length, 1); assert.equal(withMaterial.productionAllowed, false);
});

for (const status of [401, 403]) test(`fixed pages retain ${status} failure instead of serving a previous snapshot`, async () => {
  const h = harness(); await h.load({ env, command: 'dev' }); h.status(status);
  await assert.rejects(h.load({ env, command: 'dev' }), new RegExp(status === 401 ? 'CMS_UNAUTHENTICATED' : 'CMS_FORBIDDEN'));
});

test('new controlled Studio union compiles pageKey ownership and rejects hidden cross-page fields', () => {
  const pages = siteDeliveryFixture()['pages'] as RecordValue[];
  for (const key of fixedPageKeys) {
    const value = pages[pageIndex(key)]!['templateContent'];
    assert.equal(validatePageTemplateInput(value, key), true);
    assert.notEqual(validatePageTemplateInput(value, key === 'privacy' ? 'contact' : 'privacy'), true);
  }
  assert.notEqual(validatePageTemplateInput({ _type: 'pageTemplateContent', pageKey: 'contact', arbitraryCss: 'body{}' }, 'contact'), true);
});

test('new Studio Home object and unchanged legacy DEV-05E Home object share the same renderer contract', () => {
  const fixture = siteDeliveryFixture(), legacy = convertCmsSiteBundle(fixture, fixtureSiteContext);
  mutateSite(fixture, ['pages', 0, 'templateContent', '_type'], 'pageTemplateContent'); mutateSite(fixture, ['pages', 0, 'templateContent', 'pageKey'], 'home');
  assert.deepEqual(convertCmsSiteBundle(fixture, fixtureSiteContext).pages[0], legacy.pages[0]);
});
