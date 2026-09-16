import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { readRuntime } from '../config/runtime';
import routes from '../config/routes.json';
import { loadContent } from '../web/src/lib/content';
import { pageContexts } from '../config/page-context';
import { titleWithBrand } from '../web/src/lib/seo';
import { validateManufacturingPreview, validateFactoryPreview, validateContactPreview } from '../web/src/lib/fixed-preview';
import { mockContent } from '../web/src/content/mock';

const root = fileURLToPath(new URL('../', import.meta.url));

test('local mode has safe defaults without a CMS account', () => {
  assert.deepEqual(readRuntime({}), { deployEnv: 'local', contentMode: 'mock', conceptMode: true, analyticsMode: 'off' });
});
for (const [name, env, message] of [
  ['production', { DEPLOY_ENV: 'production' }, /PRODUCTION_BLOCKED/],
  ['unknown environment', { DEPLOY_ENV: 'prod' }, /DEPLOY_ENV/],
  ['unimplemented CMS', { CONTENT_MODE: 'sanity' }, /No fallback/],
  ['disabled concept mode', { CONCEPT_MODE: 'false' }, /CONCEPT_MODE/],
  ['unapproved analytics', { ANALYTICS_MODE: 'approved' }, /ANALYTICS_MODE/],
] as const) {
  test(`configuration rejects ${name}`, () => assert.throws(() => readRuntime(env), message));
}

test('mock content has no contacts, invented factory facts, categories or articles', async () => {
  const content = await loadContent('mock');
  const settings = content.siteSettings;
  assert.equal(settings.email, null);
  assert.equal(settings.whatsappDigits, null);
  assert.deepEqual(settings.channelStatus, { emailEnabled: false, whatsappEnabled: false });
  assert.equal(settings.factoryName, null);
  assert.equal(settings.defaultMoq, null);
  assert.equal(settings.factConfirmedAt, null);
  assert.deepEqual(content.categories, []);
  assert.deepEqual(content.articles, []);
  assert.equal(content.home.pageKey, 'home');
});

test('mock snapshots are independent and an unknown provider cannot silently fall back', async () => {
  const first = await loadContent('mock');
  first.home.title = 'Changed only in this test';
  assert.notEqual((await loadContent('mock')).home.title, first.home.title);
  await assert.rejects(loadContent('sanity'), /refusing to fall back/);
});

test('planned ten-URL scope and process anchor are preserved', () => {
  assert.equal(routes.pages.length, 10);
  assert.equal(new Set(routes.pages.map(page => page.path)).size, 10);
  assert.equal(new Set(routes.pages.map(page => page.template)).size, 8);
  assert.equal(routes.processLink, '/manufacturing/#production');
});

test('Studio dev and build fail before loading the CLI when configuration is missing', { timeout: 15000 }, () => {
  for (const command of ['dev', 'build']) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/run-tool.mjs', import.meta.url)), 'sanity', command], {
      cwd: `${root}/studio`,
      // Empty existing values prevent a local .env from activating a real account in this negative test.
      env: { ...process.env, SANITY_STUDIO_PROJECT_ID: '', SANITY_STUDIO_DATASET: '', CI: 'true' },
      encoding: 'utf8', timeout: 5000,
    });
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout + result.stderr, /STUDIO_NOT_CONFIGURED/);
  }
});

test('the real Astro build command rejects a production attempt', { timeout: 30000 }, () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/run-tool.mjs', import.meta.url)), 'astro', 'build'], {
    cwd: `${root}/web`,
    env: { ...process.env, DEPLOY_ENV: 'production', CONTENT_MODE: 'mock', CONCEPT_MODE: 'true', ANALYTICS_MODE: 'off', CI: 'true' },
    encoding: 'utf8', timeout: 25000,
  });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /PRODUCTION_BLOCKED/);
});

test('category previews stay distinct, registered and separate from formal CMS content', async () => {
  const { validateCategoryPreviews } = await import('../web/src/lib/category-preview');
  const content = await loadContent('mock');
  assert.deepEqual(content.categoryPreviews.map(item => item.slug), ['t-shirts', 'hoodies']);
  validateCategoryPreviews(content.categoryPreviews);
  for (const key of ['intro', 'moqNotes', 'samplingNotes'] as const) {
    assert.notEqual(content.categoryPreviews[0]![key], content.categoryPreviews[1]![key]);
  }
  assert.notDeepEqual(content.categoryPreviews[0]!.discussion, content.categoryPreviews[1]!.discussion);
  assert.notDeepEqual(content.categoryPreviews[0]!.faqItems, content.categoryPreviews[1]!.faqItems);
  assert.notEqual(content.categoryPreviews[0]!.image.src, content.categoryPreviews[1]!.image.src);
  for (const item of content.categoryPreviews) {
    assert.equal(item.productionAllowed, false); assert.equal(item.kind, 'category_preview');
    for (const key of ['samples', 'factConfirmedAt', 'approvedAt', '_type']) assert.equal(key in item, false);
    assert.equal('asset' in item.image, false);
    assert.deepEqual(content.homepagePreview.demonstrationCategories.find(card => card.anchor === item.slug)?.image, item.image);
  }
  const changed = await loadContent('mock'); changed.categoryPreviews[0]!.title = 'Changed';
  assert.notEqual((await loadContent('mock')).categoryPreviews[0]!.title, 'Changed');
});
test('category mapping rejects invalid routes, incomplete content, fake approvals and wrong assets', async () => {
  const { validateCategoryPreviews } = await import('../web/src/lib/category-preview');
  for (const change of [
    { slug: '../unknown' }, { slug: 'hoodies' }, { referenceCode: 'WEB-HOME' }, { status: 'published' },
    { productionAllowed: true }, { samples: [] }, { factConfirmedAt: '2026-09-14' }, { title: '' }, { discussion: [] }, { faqItems: [] },
  ]) {
    const items = (await loadContent('mock')).categoryPreviews;
    Object.assign(items[0]!, change); assert.throws(() => validateCategoryPreviews(items));
  }
  const items = (await loadContent('mock')).categoryPreviews;
  items[0]!.image = items[1]!.image; assert.throws(() => validateCategoryPreviews(items), /Unregistered/);
  assert.throws(() => validateCategoryPreviews([]), /count mismatch/);
});

test('nine marketing page contexts match the ten concept routes; Privacy has no source code', () => {
  assert.equal(routes.previewPages.length, 10);
  assert.deepEqual(Object.values(pageContexts).map(item => item.referenceCode), ['WEB-HOME', 'WEB-TSHIRTS', 'WEB-HOODIES', 'WEB-MANUFACTURING', 'WEB-FACTORY', 'WEB-CONTACT', 'WEB-BLOG', 'WEB-QUOTE-GUIDE', 'WEB-MOQ-GUIDE']);
  for (const context of Object.values(pageContexts)) {
    assert.equal(routes.pages.find(page => page.path === context.path)?.referenceCode, context.referenceCode);
    assert.ok(routes.previewPages.some(page => page.path === context.path));
  }
  assert.equal(routes.pages.length, 10);
});
test('fixed previews remain separate from CMS documents, approvals and real assets', async () => {
  const content = await loadContent('mock');
  validateManufacturingPreview(content.manufacturingPreview);
  validateFactoryPreview(content.factoryPreview);
  validateContactPreview(content.contactPreview);
  for (const preview of [content.manufacturingPreview, content.factoryPreview, content.contactPreview]) {
    assert.equal(preview.kind, 'fixed_page_preview'); assert.equal(preview.status, 'concept_only');
    assert.equal(preview.factsStatus, 'unconfirmed'); assert.equal(preview.productionAllowed, false);
    for (const key of ['_type', 'asset', 'heroImage', 'factConfirmedAt', 'approvedAt', 'contentUpdatedAt']) assert.equal(key in preview, false);
  }
  assert.deepEqual(content.factoryPreview.photography, { assetId: 'FACTORY-001', status: 'awaiting_factory' });
  assert.deepEqual(content.categories, []); assert.deepEqual(content.articles, []);
  content.manufacturingPreview.options[0]!.title = 'Local mutation only';
  assert.notEqual((await loadContent('mock')).manufacturingPreview.options[0]!.title, 'Local mutation only');
});
test('fixed mappings reject wrong contexts, fake approvals and incomplete buyer guidance', async () => {
  for (const change of [{ referenceCode: 'WEB-HOME' }, { pageKey: 'factory' }, { factsStatus: 'confirmed' }, { status: 'published' }, { productionAllowed: true }, { factConfirmedAt: '2026-09-15' }, { asset: { _ref: 'fake' } }, { title: '' }, { options: [] }, { preparation: [] }, { sampling: [] }, { faqItems: [] }]) {
    const preview = (await loadContent('mock')).manufacturingPreview;
    Object.assign(preview, change); assert.throws(() => validateManufacturingPreview(preview));
  }
  for (const change of [{ certifications: [] }, { capacity: 'unconfirmed numeric fixture' }, { photography: { assetId: 'HERO-001', status: 'awaiting_factory' } }, { qualityDiscussion: [] }]) {
    const preview = (await loadContent('mock')).factoryPreview;
    Object.assign(preview, change); assert.throws(() => validateFactoryPreview(preview));
  }
  const contact = (await loadContent('mock')).contactPreview;
  Object.assign(contact, { email: null }); assert.throws(() => validateContactPreview(contact), /global contact settings/);
});
test('all contact identity and schedule fields remain null and cannot silently activate', async () => {
  const fields = ['email', 'whatsappDigits', 'contactPersonOrTeam', 'businessHours', 'timezone', 'publicAddress'] as const;
  for (const field of fields) {
    assert.equal((await loadContent('mock')).siteSettings[field], null);
    try {
      // In-memory invalid fixture, never an address/phone saved or rendered on the website.
      mockContent.siteSettings[field] = 'invalid-unit-fixture';
      await assert.rejects(loadContent('mock'));
    } finally { mockContent.siteSettings[field] = null; }
  }
});
test('page-specific SEO titles receive their brand suffix only from configuration', async () => {
  const content = await loadContent('mock');
  const pages = [content.home, ...content.categoryPreviews, content.manufacturingPreview, content.factoryPreview, content.contactPreview, ...content.articlePreviews, content.privacyPreview];
  const titles = pages.map(page => page.seo.seoTitle);
  assert.equal(new Set(titles).size, 9);
  assert.equal(new Set(pages.map(page => page.seo.seoDescription)).size, 9);
  for (const title of titles) {
    assert.ok(!title.includes(content.siteSettings.brandName));
    assert.equal(titleWithBrand(title, 'Renamed Factory'), `${title} — Renamed Factory`);
  }
  assert.throws(() => titleWithBrand('', content.siteSettings.brandName));
  assert.throws(() => titleWithBrand('A title', ''));
});
