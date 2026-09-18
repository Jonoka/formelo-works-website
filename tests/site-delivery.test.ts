import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluate, parse } from 'groq-js';
import { createSiteDeliveryLoader } from '../web/src/lib/server/site-delivery';
import { categoryCardData, relatedCategoryArticles, contactReleasePolicy, deliverLocalSite } from '../shared/site-delivery';
import { siteBundleQuery } from '../web/src/lib/server/cms-site-query';
import { siteDeliveryFixture } from './fixtures/site-delivery';
import { fixtureSiteContext, fixtureSiteDataset, mutateSite } from './fixtures/cms-site';
import { CmsContentError } from '../shared/cms-validation';
import { loadContent } from '../web/src/lib/content';
import { cmsImagePresentation } from '../web/src/lib/cms-image-presentation';

const env = { HOME_CATEGORY_CONTENT_MODE: 'published', SANITY_SITE_READ_ENABLED: '1', SANITY_PROJECT_ID: 'offline1', SANITY_DATASET: 'offline-fixture', SANITY_READ_TOKEN: 'OFFLINE_TEST_SITE_SECRET', SANITY_API_VERSION: '2025-02-19' };
const scope = { pageKeys: ['home', 'manufacturing', 'factory', 'contact', 'blogIndex', 'privacy'], categorySlugs: ['t-shirts', 'hoodies'] };
const isCode = (code: string) => (error: unknown) => error instanceof CmsContentError && error.code === code && !String(error.stack).includes(env.SANITY_READ_TOKEN);
function loader() {
  let bundle = siteDeliveryFixture(), calls = 0, status = 200;
  const load = createSiteDeliveryLoader({ now: () => fixtureSiteContext.now, transport: async (_url, init) => {
    calls++; assert.equal(JSON.parse(String(init.body)).query, siteBundleQuery);
    if (status !== 200) return new Response(env.SANITY_READ_TOKEN, { status });
    return new Response(JSON.stringify({ ms: 4, syncTags: ['metadata-not-for-pages'], result: bundle }));
  } });
  return { load, calls: () => calls, set: (next: typeof bundle) => { bundle = next; }, status: (next: number) => { status = next; } };
}
test('default site and existing content entry make zero site transport calls even with test CMS config present', async () => {
  const testLoader = loader();
  const result = await testLoader.load({ env: { ...env, HOME_CATEGORY_CONTENT_MODE: 'mock' }, command: 'dev' });
  assert.equal(result.mode, 'mock'); assert.equal(result.home.source, 'local'); assert.equal(testLoader.calls(), 0);
  assert.deepEqual(result, deliverLocalSite(await loadContent('mock')));
  await assert.rejects(testLoader.load({ env: { ...env, HOME_CATEGORY_CONTENT_MODE: 'sanity' } }), isCode('SITE_SOURCE_CONFIG'));
  await assert.rejects(testLoader.load({ env: { ...env, SANITY_SITE_READ_ENABLED: '0' } }), isCode('CMS_SITE_READ_NOT_AUTHORIZED'));
  assert.equal(testLoader.calls(), 0);
});
test('fixed GROQ really projects the Home content group without exposing private extra fields', async () => {
  const bundle = siteDeliveryFixture(); mutateSite(bundle, ['pages', 0, 'templateContent', 'privateNote'], 'OFFLINE_TEST_PRIVATE_CANARY');
  const projected = await (await evaluate(parse(siteBundleQuery), { dataset: fixtureSiteDataset(bundle), params: scope })).get();
  const load = createSiteDeliveryLoader({ now: () => fixtureSiteContext.now, transport: async () => new Response(JSON.stringify({ ms: 1, result: projected })) });
  const result = await load({ env, command: 'dev' });
  assert.equal(result.home.factorySummary, 'OFFLINE factory summary. Synthetic content for template verification, not a claim about a real factory.');
  assert.ok(!JSON.stringify(result).includes('OFFLINE_TEST_PRIVATE_CANARY'));
});
test('same category records supply ordered cards, full samples, capabilities, evidence and effective MOQ', async () => {
  const testLoader = loader(); const result = await testLoader.load({ env, command: 'dev' });
  assert.deepEqual(result.cards.map(card => card.slug), ['hoodies', 't-shirts']);
  for (const category of result.categories) {
    assert.equal(category.kind, 'cms_category'); if (category.kind !== 'cms_category') throw new Error('Expected published record');
    assert.deepEqual(result.cards.find(card => card.slug === category.slug), categoryCardData(category));
    assert.equal(category.samples.length, 3); assert.equal(category.samples[0]!.images.length, 2);
    assert.equal(category.samples[0]!.weightGsm, 245); assert.equal(category.samples[1]!.weightGsm, null);
    assert.equal(category.capabilityRows.length, 1); assert.ok(category.capabilityRows[0]!.limitNote); assert.equal(category.evidenceImages.length, 1);
    assert.equal(category.effectiveMoq.mode, category.slug === 'hoodies' ? 'confirmedQuantity' : 'projectBased');
  }
  assert.equal(result.cms!.siteSettings.channelStatus.emailEnabled, true);
  assert.equal(result.cms!.siteSettings.email, 'factory@example.invalid');
  assert.equal(result.shell.contact.enabled, false); assert.equal(result.shell.contact.copyingAllowed, false);
  assert.equal(contactReleasePolicy.activationAllowed, false); assert.equal(result.cms!.productionAllowed, false);
  assert.deepEqual(result.home.titleLines, [result.home.title]);
});
test('dev revision updates title, summary and image together and never returns the last successful result', async () => {
  const testLoader = loader(); const first = await testLoader.load({ env, command: 'dev' });
  testLoader.set(siteDeliveryFixture('two')); const second = await testLoader.load({ env, command: 'dev' });
  for (let index = 0; index < 2; index++) {
    assert.notEqual(first.cards[index]!.name, second.cards[index]!.name); assert.notEqual(first.cards[index]!.summary, second.cards[index]!.summary);
    assert.notDeepEqual(first.cards[index]!.image, second.cards[index]!.image);
  }
  testLoader.status(401); await assert.rejects(testLoader.load({ env, command: 'dev' }), isCode('CMS_UNAUTHENTICATED'));
  testLoader.status(403); await assert.rejects(testLoader.load({ env, command: 'dev' }), isCode('CMS_FORBIDDEN'));
  assert.equal(testLoader.calls(), 4);
});
test('one build shares one protected snapshot; new build rereads; source changes during a build fail', async () => {
  const testLoader = loader(); const context = { env, command: 'build', buildId: 'first-build' };
  const first = await testLoader.load(context); first.cards[0]!.name = 'Template mutation must not persist';
  testLoader.set(siteDeliveryFixture('two'));
  const same = await testLoader.load(context); assert.notEqual(same.cards[0]!.name, first.cards[0]!.name); assert.equal(testLoader.calls(), 1);
  await assert.rejects(testLoader.load({ ...context, env: { ...env, HOME_CATEGORY_CONTENT_MODE: 'mock' } }), isCode('SITE_BUILD_SOURCE_CHANGED'));
  const next = await testLoader.load({ ...context, buildId: 'second-build' }); assert.match(next.cards[0]!.name, /two/); assert.equal(testLoader.calls(), 2);
});
for (const [name, path, value, code] of [
  ['missing required home group', ['pages', 0, 'templateContent'], null, 'CMS_INVALID'],
  ['missing business copy', ['pages', 0, 'templateContent', 'factorySummary'], '', 'CMS_INVALID'],
  ['unknown home field', ['pages', 0, 'templateContent', 'cssClass'], 'arbitrary', 'CMS_UNSUPPORTED_FIELD'],
  ['illegal home markup', ['pages', 0, 'templateContent', 'factorySummary'], '<script>alert(1)</script>', 'CMS_UNSAFE_TEXT'],
  ['missing other fixed page', ['pages'], [], 'CMS_INVALID'],
  ['duplicate route', ['pages', 1, 'pageKey'], 'home', 'CMS_DUPLICATE_ROUTE'],
  ['unapproved image', ['categories', 0, 'heroImage', 'publicUseApproved'], false, 'CMS_ASSET_APPROVAL'],
  ['bad image URL', ['categories', 0, 'heroImage', 'asset', 'document', 'url'], 'javascript:alert(1)', 'CMS_IMAGE'],
  ['bad reference', ['categories', 0, 'relatedArticles', 0, 'document'], null, 'CMS_INVALID'],
] as [string, (string | number)[], unknown, string][]) test(`delivery rejects ${name} through the real reader envelope`, async () => {
  const testLoader = loader(), invalid = siteDeliveryFixture(); mutateSite(invalid, path, value); testLoader.set(invalid);
  await assert.rejects(testLoader.load({ env, command: 'dev' }), isCode(code));
});
test('optional photograph and title hints have explicit rules, not a hidden mock fill', async () => {
  const testLoader = loader(), fixture = siteDeliveryFixture();
  mutateSite(fixture, ['pages', 0, 'templateContent', 'titleLineHints'], null); testLoader.set(fixture);
  const result = await testLoader.load({ env, command: 'dev' });
  assert.equal(result.home.factoryImage, null); assert.deepEqual(result.home.titleLines, [result.home.title]);
});
test('CMS references cannot resolve to local or missing article records', async () => {
  const result = await loader().load({ env, command: 'dev' }), category = result.categories[0]!;
  if (category.kind !== 'cms_category') throw new Error('Expected CMS');
  assert.throws(() => relatedCategoryArticles(category, { mode: 'published', articles: [] }), isCode('SITE_RELATED_ARTICLE_MISSING'));
  const { deliverLocalArticle } = await import('../shared/article-delivery');
  const articles = (await loadContent('mock')).articlePreviews.map(deliverLocalArticle);
  assert.throws(() => relatedCategoryArticles(category, { mode: 'mock', articles }), isCode('SITE_RELATED_ARTICLE_SOURCE'));
});
test('approved image presentation keeps crop, hotspot, dimensions, alt and bounded sizes', async () => {
  const result = await loader().load({ env, command: 'dev' }), image = result.cards[0]!.image;
  if (image.source !== 'sanity') throw new Error('Expected CMS');
  const attributes = cmsImagePresentation(image), url = new URL(attributes.src);
  assert.equal(url.searchParams.get('rect'), '120,40,840,640'); assert.equal(attributes.width, 840); assert.equal(attributes.height, 640);
  assert.equal(url.searchParams.get('w'), '840'); assert.match(attributes.position, /^71\.428/); assert.match(image.alt, /OFFLINE/);
  assert.ok(attributes.srcset.includes('480w') && !attributes.srcset.includes('1200w'));
});

test('credential text in an otherwise valid public field is rejected before template delivery', async () => {
  const testLoader = loader(), fixture = siteDeliveryFixture(); mutateSite(fixture, ['pages', 0, 'intro'], env.SANITY_READ_TOKEN); testLoader.set(fixture);
  await assert.rejects(testLoader.load({ env, command: 'dev' }), isCode('CMS_SECRET_IN_CONTENT'));
});
