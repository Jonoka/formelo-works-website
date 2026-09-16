import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { loadContent } from '../web/src/lib/content';
import { validateArticlePreviews, validatePrivacyPreview, validateEditorialBody, validateEditorialLink, prepareEditorialBody } from '../web/src/lib/editorial';
import type { EditorialBlock } from '../shared/editorial';
import sourcePolicy from '../config/editorial-sources.json';

const heading = (text: string, level: 2 | 3 = 2): EditorialBlock => ({ type: 'heading', level, text });
test('two complete local drafts have different purchasing tasks and no published CMS records', async () => {
  const c = await loadContent('mock');
  validateArticlePreviews(c.articlePreviews);
  assert.deepEqual(c.articles, []);
  assert.deepEqual(c.articlePreviews.map(a => a.slug), ['what-to-send-for-a-clothing-quote', 'moq-per-style-per-color']);
  const [quote, moq] = c.articlePreviews;
  assert.ok(quote && moq);
  const quoteText = JSON.stringify(quote.body), moqText = JSON.stringify(moq.body);
  assert.notEqual(quoteText, moqText);
  for (const concept of ['Size allocation', 'Delivery country', 'Target garment unit price', 'Total project budget', 'Styles and details', 'Specifications still missing']) assert.ok(quoteText.includes(concept), concept);
  assert.ok(quote.body.some(b => b.type === 'template' && b.text.includes('Subject:') && b.text.includes('Hello,')));
  assert.ok(quote.body.some(b => b.type === 'list' && b.items.length >= 6));
  assert.match(quoteText, /without a tech pack/); assert.match(quoteText, /Do not assume that the factory will provide every/);
  for (const concept of ['Per style', 'Per color', 'Mixed sizes', 'Total order', 'Fabric:', 'Trims and labels:', 'Hypothetical example', '15 + 25 + 20 = 60', '120 + 60 = 180', '30-piece']) assert.ok(moqText.includes(concept), concept);
  const example = moq.body.find(b => b.type === 'table' && b.caption.startsWith('Hypothetical proposal'));
  assert.ok(example && example.type === 'table');
  assert.equal(example.rows.reduce((sum, row) => { const values = row.slice(1).map(Number); assert.equal(values[0]! + values[1]! + values[2]!, values[3]); return sum + values[3]!; }, 0), 180);
  assert.equal(c.siteSettings.defaultMoq, null);
  assert.equal(c.siteSettings.factConfirmedAt, null);
  for (const article of c.articlePreviews) {
    assert.equal(article.draftUpdatedAt, null);
    assert.equal(article.status, 'editorial_draft'); assert.equal(article.productionAllowed, false);
    for (const forbidden of ['author', 'publishedAt', 'approvedAt', 'reviewedAt', '_type', '_id']) assert.equal(forbidden in article, false);
    assert.equal('asset' in article.cover.image, false);
    assert.equal(article.cover.usage, 'registered_concept_reuse');
    assert.ok(article.body.some(b => b.type === 'paragraph' && b.content.some(i => i.type === 'link' && i.href === '/contact/')));
  }
});
test('article and privacy snapshots are isolated from mutable callers', async () => {
  const c = await loadContent('mock'); c.articlePreviews[0]!.title = 'Changed'; c.privacyPreview.title = 'Changed';
  const next = await loadContent('mock'); assert.notEqual(next.articlePreviews[0]!.title, 'Changed'); assert.notEqual(next.privacyPreview.title, 'Changed');
});
test('TOC appears at three H2s, is stable and deduplicates H2/H3 and suffix collisions', () => {
  assert.deepEqual(prepareEditorialBody([heading('One'), heading('Two')]).toc, []);
  const body = [heading('Details'), heading('Details', 3), heading('Details'), heading('Details-2'), heading('!'), heading('!')];
  const first = prepareEditorialBody(body); assert.deepEqual(first, prepareEditorialBody(structuredClone(body)));
  assert.equal(first.toc.length, 5);
  assert.equal(new Set(first.blocks.map(b => b.id)).size, body.length);
  assert.deepEqual(first.blocks.map(b => b.id), ['section-details', 'section-details-2', 'section-details-3', 'section-details-2-2', 'section-heading', 'section-heading-2']);
});
test('internal and explicitly reviewed HTTPS links pass; resource permission is not granted', () => {
  for (const href of ['/blog/', '/privacy/', '/manufacturing/#prepare', '/manufacturing/#moq', '/clothing/hoodies/', '/blog/moq-per-style-per-color/']) assert.equal(validateEditorialLink(href), 'internal');
  for (const source of sourcePolicy.sources) assert.equal(validateEditorialLink(source.href), 'source');
});
test('unsafe protocols, lookalike source links and unimplemented paths are rejected', () => {
  for (const href of ['javascript:alert(1)', 'data:text/html,<script>', 'vbscript:fixture', '//example.com/', '/\\example.com/', 'https://www.shopify.com@evil.invalid/', 'http://www.shopify.com/blog/minimum-order-quantity', 'https://www.shopify.com/blog/minimum-order-quantity?track=x', 'https://www.shopify.com/blog/minimum-order-quantity#x', 'https://unreviewed.invalid/', '/clothing/', '/blog/unknown/', '/manufacturing/#missing', '/manufacturing/#moq#x', '/blog/?q=x', '\njavascript:fixture']) assert.throws(() => validateEditorialLink(href), href);
});
test('controlled rich text rejects scripts, raw HTML, embeds and extra event/style fields', () => {
  for (const block of [
    { type: 'html', html: '<script>alert(1)</script>' }, { type: 'iframe', src: 'https://example.invalid/' },
    { type: 'paragraph', content: [{ type: 'text', text: 'Text' }], onclick: 'alert(1)' },
    { type: 'paragraph', content: [{ type: 'link', text: 'Click', href: 'javascript:alert(1)' }] },
    { type: 'paragraph', content: [{ type: 'html', text: '<b>raw</b>' }] },
    { type: 'heading', level: 1, text: 'Another H1' },
    { type: 'table', caption: 'Broken', columns: ['A', 'B'], rows: [['A']] },
    { type: 'list', ordered: false, items: [] }, { type: 'template', title: 'Fixture', text: '\u0000' },
  ]) assert.throws(() => validateEditorialBody([block]));
  assert.throws(() => validateEditorialBody([heading('Orphan', 3)]));
  // A literal string is data, never raw HTML. Astro's text expressions perform escaping.
  validateEditorialBody([{ type: 'paragraph', content: [{ type: 'text', text: '<script>not markup</script>' }] }]);
  for (const path of ['EditorialBody', 'EditorialInline']) assert.doesNotMatch(readFileSync(new URL(`../web/src/components/${path}.astro`, import.meta.url), 'utf8'), /set:html|innerHTML/);
});
test('draft mappings reject fake publication, wrong references, extra assets and incomplete arrays', async () => {
  for (const changes of [{ status: 'published' }, { productionAllowed: true }, { referenceCode: 'WEB-HOME' }, { slug: 'unplanned' }, { author: 'Fabricated author' }, { publishedAt: '2026-09-01' }, { reviewedAt: '2026-09-01' }, { draftUpdatedAt: '2026-02-30' }, { _type: 'article' }, { body: [] }]) {
    const articles = (await loadContent('mock')).articlePreviews;
    Object.assign(articles[0]!, changes); assert.throws(() => validateArticlePreviews(articles));
  }
  const articles = (await loadContent('mock')).articlePreviews;
  assert.throws(() => validateArticlePreviews([])); assert.throws(() => validateArticlePreviews([articles[0]!]));
  assert.throws(() => validateArticlePreviews([articles[0]!, articles[0]!]));
  articles[0]!.cover = articles[1]!.cover; assert.throws(() => validateArticlePreviews(articles));
});
test('legal preview preserves pending operational details, not a fake live policy', async () => {
  const c = await loadContent('mock'); validatePrivacyPreview(c.privacyPreview);
  for (const key of ['referenceCode', 'legalEntity', 'privacyContact', 'providers', 'retention', 'effectiveAt'] as const) assert.equal(c.privacyPreview[key], null);
  const text = JSON.stringify(c.privacyPreview.body);
  for (const note of ['Analytics is off', 'not been configured', 'not currently receiving', 'To be confirmed', 'not in effect', 'No cookie banner']) assert.ok(text.includes(note), note);
  for (const changes of [{ referenceCode: 'WEB-CONTACT' }, { effectiveAt: '2026-09-16' }, { legalEntity: 'Invented Ltd' }, { providers: ['Candidate host'] }, { status: 'published' }, { privacyContact: 'fixture@example.invalid' }, { retention: 'Forever' }]) {
    assert.throws(() => validatePrivacyPreview(Object.assign(structuredClone(c.privacyPreview), changes)));
  }
});
