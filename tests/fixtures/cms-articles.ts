// OFFLINE-ONLY SYNTHETIC QUERY FIXTURES. Never import from web/ pages or upload these documents.
// Invented identities, dates and approvals below are test inputs, not factory facts or publishable seed data.
import type { ArticlePreview, EditorialBlock, Inline } from '../../shared/editorial';
import { quoteGuidePreview } from '../../web/src/content/quote-guide-preview';
import { moqGuidePreview } from '../../web/src/content/moq-guide-preview';
import { articleScopes, type CmsReadContext } from '../../shared/cms-article';
import { record, type RecordValue } from '../../shared/cms-validation';
export const fixtureContext: CmsReadContext = { projectId: 'offline1', dataset: 'offline-fixture', perspective: 'published', now: Date.parse('2026-09-16T12:00:00Z') };
export const previews = [quoteGuidePreview, moqGuidePreview];
const publication = '2026-09-14T00:00:00Z', update = '2026-09-15T00:00:00Z', confirmation = '2026-09-15';
export function fixtureReference(href: string): RecordValue {
  const path = href.split('#')[0]!;
  const pages: Record<string, string> = { '/': 'home', '/manufacturing/': 'manufacturing', '/contact/': 'contact', '/blog/': 'blogIndex', '/privacy/': 'privacy', '/our-factory/': 'factory' };
  let doc: RecordValue;
  if (pages[path]) doc = { _id: `offline.page.${pages[path]}`, _type: 'page', pageKey: pages[path] };
  else if (path.startsWith('/clothing/')) { const current = path.split('/')[2]!; doc = { _id: `offline.category.${current}`, _type: 'category', slug: { current }, referenceCode: current === 't-shirts' ? 'WEB-TSHIRTS' : 'WEB-HOODIES' }; }
  else {
    const current = path.split('/')[2] as keyof typeof articleScopes;
    const scope = articleScopes[current]; if (!scope) throw new Error('Unknown offline fixture path');
    doc = { _id: `offline.article.${current}`, _type: 'article', slug: { current }, referenceCode: scope.referenceCode, factReviewStatus: 'confirmed', publishedAt: publication };
  }
  return { _type: 'reference', _ref: doc['_id'], _weak: false, document: { _originalId: null, routeCount: 1, factConfirmedAt: confirmation, ...doc } };
}
function textBlock(content: Inline[], key: string, style = 'normal'): RecordValue {
  const markDefs: RecordValue[] = [];
  const children = content.map((item, index) => {
    const marks: string[] = [...(item.marks ?? [])];
    if (item.type === 'link') {
      const _key = `annotation-${index}`; marks.push(_key);
      markDefs.push(item.href.startsWith('/')
        ? { _type: 'editorialInternalLink', _key, target: fixtureReference(item.href), fragment: item.href.split('#')[1] ?? null }
        : { _type: 'editorialExternalLink', _key, href: item.href });
    }
    return { _type: 'span', _key: `span-${index}`, text: item.text, marks };
  });
  return { _type: 'block', _key: key, style, children, markDefs, listItem: null, level: null };
}
/** Reverse mapping exists in tests ONLY to compare every original block/character with the converter output. */
export function fixtureBody(body: EditorialBlock[]): RecordValue[] {
  return body.flatMap((block, index): RecordValue[] => {
    const key = `block-${index}`;
    if (block.type === 'heading') return [textBlock([{ type: 'text', text: block.text }], key, `h${block.level}`)];
    if (block.type === 'paragraph') return [textBlock(block.content, key)];
    if (block.type === 'list') return block.items.map((item, row) => ({ ...textBlock(item, `${key}-${row}`), listItem: block.ordered ? 'number' : 'bullet', level: 1 }));
    if (block.type === 'table') return [{ _type: 'editorialTable', _key: key, caption: block.caption, columns: [...block.columns], rows: block.rows.map((cells, row) => ({ _type: 'editorialTableRow', _key: `row-${row}`, cells: [...cells] })) }];
    if (block.type === 'callout') return [{ _type: 'editorialCallout', _key: key, title: block.title, content: [textBlock(block.content, `${key}-content`)] }];
    return [{ _type: 'editorialTemplate', _key: key, title: block.title, text: block.text }];
  });
}
export function fixtureArticle(preview: ArticlePreview = quoteGuidePreview): RecordValue {
  const assetId = `image-${'a'.repeat(40)}-1200x800-webp`;
  return { _type: 'article', _id: `offline.article.${preview.slug}`, _rev: 'offline-revision-1', _originalId: null,
    title: preview.title, slug: { current: preview.slug }, slugCount: 1, referenceCode: preview.referenceCode, excerpt: preview.excerpt, seo: { ...preview.seo },
    authorDisplay: 'OFFLINE FIXTURE — NOT A REAL AUTHOR', publishedAt: publication, contentUpdatedAt: update, factConfirmedAt: confirmation, factReviewStatus: 'confirmed',
    coverImage: { _type: 'approvedImage', alt: 'OFFLINE FIXTURE — NO LICENSE CLAIM', publicUseApproved: true, decorative: false, caption: null, crop: null, hotspot: null,
      asset: { _type: 'reference', _ref: assetId, _weak: false, document: { _id: assetId, _type: 'sanity.imageAsset', _originalId: null,
        url: `https://cdn.sanity.io/images/${fixtureContext.projectId}/${fixtureContext.dataset}/${'a'.repeat(40)}-1200x800.webp`, metadata: { dimensions: { width: 1200, height: 800 } } } } },
    body: fixtureBody(preview.body), relatedCategories: [fixtureReference('/clothing/t-shirts/')], relatedArticles: [], linkToManufacturing: true };
}
/** Turn projected fixtures into a synthetic, in-memory GROQ dataset. No Sanity SDK, credentials or network. */
export function fixtureDataset(documents = previews.map(fixtureArticle)): RecordValue[] {
  const targets = new Map<string, RecordValue>();
  function strip(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(strip);
    if (!value || typeof value !== 'object') return value;
    const obj = record(value, 'fixture');
    if (obj['_type'] === 'reference' && obj['document']) {
      const doc = strip(obj['document']) as RecordValue;
      targets.set(String(doc['_id']), doc);
    }
    return Object.fromEntries(Object.entries(obj).filter(([key]) => !['document', 'slugCount', 'routeCount'].includes(key)).map(([key, item]) => [key, strip(item)]));
  }
  const roots = documents.map(doc => strip(doc) as RecordValue);
  for (const doc of roots) targets.set(String(doc['_id']), doc);
  return [...targets.values()];
}
export function mutate(root: unknown, path: (string | number)[], value: unknown): void {
  let current = root as Record<string | number, unknown>;
  for (const key of path.slice(0, -1)) current = current[key] as Record<string | number, unknown>;
  current[path.at(-1)!] = value;
}
