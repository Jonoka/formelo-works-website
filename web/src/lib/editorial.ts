import { pageContexts } from '../../../config/page-context';
import type { ArticlePreview, PrivacyPreview } from '../../../shared/editorial';
import { editorialObject as object, editorialText as text, validateEditorialBody } from '../../../shared/editorial-policy';
export { validateEditorialBody, validateEditorialLink, prepareEditorialBody } from '../../../shared/editorial-policy';
import { validateLocalImage } from './images';
import { localPreviewFromManifest } from '../content/local-media';

export const articlePath = (slug: ArticlePreview['slug']) => `/blog/${slug}/`;
export function validateArticlePreviews(items: ArticlePreview[]): void {
  if (!Array.isArray(items) || items.length !== 2 || new Set(items.map(item => item.slug)).size !== items.length) throw new Error('Invalid local article preview count.');
  for (const item of items) {
    object(item, ['kind', 'status', 'productionAllowed', 'slug', 'referenceCode', 'title', 'excerpt', 'seo', 'draftUpdatedAt', 'cover', 'body']);
    const quote = item.slug === 'what-to-send-for-a-clothing-quote';
    if (!quote && item.slug !== 'moq-per-style-per-color') throw new Error('Unplanned article slug.');
    const context = quote ? pageContexts.quoteGuide : pageContexts.moqGuide;
    if (item.kind !== 'article_preview' || item.status !== 'editorial_draft' || item.productionAllowed !== false || item.referenceCode !== context.referenceCode) throw new Error('Invalid editorial draft state or reference.');
    [item.title, item.excerpt].forEach(text);
    object(item.seo, ['seoTitle', 'seoDescription']); Object.values(item.seo).forEach(text);
    if (item.draftUpdatedAt !== null && (!/^\d{4}-\d{2}-\d{2}$/.test(item.draftUpdatedAt) || new Date(item.draftUpdatedAt).toISOString().slice(0, 10) !== item.draftUpdatedAt)) throw new Error('Invalid draft update date.');
    object(item.cover, ['image', 'usage', 'pendingAssetId']);
    validateLocalImage(item.cover.image);
    const expected = localPreviewFromManifest(quote ? 'CAT-TS-001' : 'CAT-HD-001', quote ? 'Cream T-shirt detail, reused as an editorial illustration.' : 'Charcoal hoodie detail, reused as an editorial illustration.');
    if (item.cover.usage !== 'registered_concept_reuse' || item.cover.pendingAssetId !== (quote ? 'JOURNAL-QUOTE-001' : 'JOURNAL-MOQ-001') || JSON.stringify(item.cover.image) !== JSON.stringify(expected)) throw new Error('Unregistered editorial cover reuse.');
    validateEditorialBody(item.body);
    if (item.body.filter(block => block.type === 'heading' && block.level === 2).length < 3) throw new Error('Article must provide a complete multi-section draft.');
  }
}
export function validatePrivacyPreview(item: PrivacyPreview): void {
  object(item, ['kind', 'status', 'productionAllowed', 'referenceCode', 'title', 'seo', 'legalEntity', 'privacyContact', 'providers', 'retention', 'effectiveAt', 'body']);
  if (item.kind !== 'legal_preview' || item.status !== 'draft_not_in_effect' || item.productionAllowed !== false ||
      [item.referenceCode, item.legalEntity, item.privacyContact, item.providers, item.retention, item.effectiveAt].some(value => value !== null)) throw new Error('Privacy must remain an unconfigured notice not in effect.');
  text(item.title); object(item.seo, ['seoTitle', 'seoDescription']); Object.values(item.seo).forEach(text);
  validateEditorialBody(item.body);
}
