import routes from '../../../config/routes.json';
import sourcePolicy from '../../../config/editorial-sources.json';
import { pageContexts } from '../../../config/page-context';
import type { ArticlePreview, EditorialBlock, Inline, PrivacyPreview } from '../../../shared/editorial';
import { validateLocalImage } from './images';
import { localPreviewFromManifest } from '../content/local-media';

const sources = sourcePolicy.sources as { href: string; title: string; reviewedAt: string }[];
const fragments: Record<string, string[]> = {
  '/manufacturing/': ['options', 'moq', 'prepare', 'sampling', 'production', 'faq'],
  '/': ['capabilities', 'categories', 't-shirts', 'hoodies', 'factory', 'production', 'journal', 'enquiry-guide', 'contact'],
};
function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some(key => !keys.includes(key)) || keys.some(key => !(key in value))) {
    throw new Error('Invalid editorial structure or unsupported fields.');
  }
  return value as Record<string, unknown>;
}
function text(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > 16000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) {
    throw new Error('Readable bounded editorial text required.');
  }
}
export function validateEditorialLink(href: string): 'internal' | 'source' {
  if (typeof href !== 'string' || /[\s\\\u0000-\u001f]/.test(href)) throw new Error('Unsafe editorial link.');
  if (href.startsWith('/') && !href.startsWith('//')) {
    const [path, fragment, extra] = href.split('#');
    if (!path || extra !== undefined || !routes.pages.some(page => page.path === path) ||
        (fragment !== undefined && !fragments[path]?.includes(fragment))) throw new Error('Unknown internal editorial link.');
    return 'internal';
  }
  if (!href.startsWith('https://') || !sources.some(source => source.href === href && source.title && source.reviewedAt)) {
    throw new Error('External editorial link is not a reviewed HTTPS source.');
  }
  const url = new URL(href);
  if (url.username || url.password || url.search || url.hash || url.href !== href) throw new Error('Unsafe source URL.');
  return 'source';
}
function inline(value: unknown): asserts value is Inline[] {
  if (!Array.isArray(value) || !value.length || value.length > 40) throw new Error('Invalid editorial inline content.');
  for (const item of value) {
    const kind = (item as Inline | null)?.type;
    object(item, kind === 'link' ? ['type', 'text', 'href'] : ['type', 'text']);
    if (kind !== 'text' && kind !== 'link') throw new Error('Unsupported editorial inline type.');
    text(item.text);
    if (kind === 'link') validateEditorialLink(item.href);
  }
}
export function validateEditorialBody(value: unknown): asserts value is EditorialBlock[] {
  if (!Array.isArray(value) || !value.length || value.length > 160) throw new Error('Invalid editorial body.');
  let hasH2 = false;
  for (const block of value) {
    switch (block?.type) {
      case 'heading':
        object(block, ['type', 'level', 'text']); text(block.text);
        if (block.level !== 2 && block.level !== 3) throw new Error('Only H2/H3 editorial headings are supported.');
        if (block.level === 3 && !hasH2) throw new Error('H3 requires a preceding H2.');
        if (block.level === 2) hasH2 = true;
        break;
      case 'paragraph': object(block, ['type', 'content']); inline(block.content); break;
      case 'list':
        object(block, ['type', 'ordered', 'items']);
        if (typeof block.ordered !== 'boolean' || !Array.isArray(block.items) || !block.items.length || block.items.length > 30) throw new Error('Invalid editorial list.');
        block.items.forEach(inline); break;
      case 'table':
        object(block, ['type', 'caption', 'columns', 'rows']); text(block.caption);
        if (!Array.isArray(block.columns) || block.columns.length < 2 || block.columns.length > 6 ||
            !Array.isArray(block.rows) || !block.rows.length || block.rows.length > 30) throw new Error('Invalid editorial table.');
        block.columns.forEach(text);
        for (const row of block.rows) {
          if (!Array.isArray(row) || row.length !== block.columns.length) throw new Error('Editorial table cells must match columns.');
          row.forEach(text);
        }
        break;
      case 'callout': object(block, ['type', 'title', 'content']); text(block.title); inline(block.content); break;
      case 'template': object(block, ['type', 'title', 'text']); text(block.title); text(block.text); break;
      default: throw new Error('Unsupported editorial block; raw HTML, scripts and embeds are forbidden.');
    }
  }
}
export function prepareEditorialBody(body: EditorialBlock[]) {
  validateEditorialBody(body);
  const used = new Set<string>();
  const blocks = body.map((block, index) => {
    if (block.type !== 'heading') return { block, id: `body-block-${index + 1}` };
    const base = `section-${block.text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'heading'}`;
    let id = base;
    for (let suffix = 2; used.has(id); suffix++) id = `${base}-${suffix}`;
    used.add(id);
    return { block, id };
  });
  const headings = blocks.flatMap(({ block, id }) => block.type === 'heading' && block.level === 2 ? [{ text: block.text, id }] : []);
  return { blocks, toc: headings.length >= 3 ? headings : [] };
}
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
