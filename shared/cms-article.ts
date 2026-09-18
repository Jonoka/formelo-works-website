import routes from '../config/routes.json' with { type: 'json' };
import { pageContexts } from '../config/page-context';
import type { EditorialBlock } from './editorial';
import type { Seo } from './content';
import { convertCmsBody } from './cms-body';
import { array, date, fail, id, record, reference, string, type RecordValue } from './cms-validation';
import { convertCmsApprovedImage, type CmsApprovedImage } from './cms-image';

export const articleScopes = {
  'what-to-send-for-a-clothing-quote': pageContexts.quoteGuide,
  'moq-per-style-per-color': pageContexts.moqGuide,
} as const;
export type ArticleSlug = keyof typeof articleScopes;
export interface CmsReadContext { projectId: string; dataset: string; perspective: 'published'; now: number }
export type CmsCover = CmsApprovedImage;
/** Validated delivery data, NOT ArticlePreview, a raw CMS document, or website publication approval. */
export interface CmsArticleRenderData {
  kind: 'cms_article'; source: 'sanity'; documentId: string; revision: string;
  cmsPerspective: 'published'; websitePublication: 'not_verified'; productionAllowed: false;
  slug: ArticleSlug; referenceCode: (typeof articleScopes)[ArticleSlug]['referenceCode'];
  title: string; excerpt: string; seo: Seo; cover: CmsCover; body: EditorialBlock[];
  authorDisplay: string; publishedAt: string; contentUpdatedAt: string;
  factReviewStatus: 'confirmed'; factConfirmedAt: string;
  relatedCategories: string[]; relatedArticles: string[]; linkToManufacturing: boolean;
}
export function articleSlug(value: unknown): ArticleSlug {
  if (typeof value !== 'string' || !Object.hasOwn(articleScopes, value)) fail('slug.current', 'CMS_ROUTE');
  return value as ArticleSlug;
}
function publishedIdentity(doc: RecordValue, field: string): string {
  const result = id(doc['_id'], `${field}._id`);
  if (doc['_originalId'] != null) fail(`${field}._originalId`, 'CMS_UNPUBLISHED');
  return result;
}
function review(doc: RecordValue, field: string, now: number) {
  if (doc['factReviewStatus'] !== 'confirmed') fail(`${field}.factReviewStatus`, 'CMS_REVIEW');
  return date(doc['factConfirmedAt'], `${field}.factConfirmedAt`, now);
}
const pagePaths: Record<string, string> = { home: '/', manufacturing: '/manufacturing/', factory: '/our-factory/', contact: '/contact/', blogIndex: '/blog/', privacy: '/privacy/' };
/** Dereferences only the explicit projected target; absent, weak, draft and ambiguous targets fail. */
export function resolveCmsReference(value: unknown, field: string, context: CmsReadContext, expectedType?: string): string {
  const ref = reference(value, field), doc = record(ref['document'], `${field}.document`);
  if (publishedIdentity(doc, `${field}.document`) !== ref['_ref'] || doc['routeCount'] !== 1 ||
      (expectedType !== undefined && doc['_type'] !== expectedType)) fail(field, 'CMS_REFERENCE');
  let path: string;
  if (doc['_type'] === 'article') {
    const slug = articleSlug(record(doc['slug'], `${field}.slug`)['current']);
    if (doc['referenceCode'] !== articleScopes[slug].referenceCode) fail(field, 'CMS_REFERENCE');
    review(doc, field, context.now);
    date(doc['publishedAt'], `${field}.publishedAt`, context.now, true);
    path = articleScopes[slug].path;
  } else if (doc['_type'] === 'category') {
    date(doc['factConfirmedAt'], `${field}.factConfirmedAt`, context.now);
    const slug = string(record(doc['slug'], `${field}.slug`)['current'], `${field}.slug.current`);
    if (slug !== 't-shirts' && slug !== 'hoodies') fail(field, 'CMS_REFERENCE');
    if (doc['referenceCode'] !== (slug === 't-shirts' ? pageContexts.tshirts.referenceCode : pageContexts.hoodies.referenceCode)) fail(field, 'CMS_REFERENCE');
    path = `/clothing/${slug}/`;
  } else if (doc['_type'] === 'page') {
    const pageKey = string(doc['pageKey'], `${field}.pageKey`);
    path = pagePaths[pageKey] ?? fail(field, 'CMS_REFERENCE');
    // Existing fixed-page schema uses the actual fact date, not the new article review flag.
    date(doc['factConfirmedAt'], `${field}.factConfirmedAt`, context.now);
  } else return fail(field, 'CMS_REFERENCE');
  if (!routes.pages.some(route => route.path === path)) fail(field, 'CMS_REFERENCE');
  return path;
}
/** No defaults for authors, dates, review or permission; no mock import, fallback or cloud writes. */
export function convertCmsArticles(value: unknown, context: CmsReadContext): CmsArticleRenderData[] {
  if (context.perspective !== 'published' || !Number.isFinite(context.now) || !/^[a-z0-9]+$/.test(context.projectId) || !/^[a-z0-9][a-z0-9_-]*$/.test(context.dataset)) fail('context', 'CMS_CONFIG');
  const documents = array(value, 'articles', 0, 20);
  if (!documents.length) fail('articles', 'CMS_EMPTY');
  const ids = new Set<string>(), slugs = new Set<string>();
  return documents.map((value, index) => {
    const field = `articles[${index}]`, doc = record(value, field, ['_type', '_id', '_rev', '_originalId', 'title', 'slug', 'slugCount', 'excerpt', 'referenceCode', 'seo', 'coverImage', 'body', 'authorDisplay', 'publishedAt', 'contentUpdatedAt', 'factReviewStatus', 'factConfirmedAt', 'relatedCategories', 'relatedArticles', 'linkToManufacturing']);
    if (doc['_type'] !== 'article') fail(field, 'CMS_DOCUMENT_TYPE');
    const documentId = publishedIdentity(doc, field), slug = articleSlug(record(doc['slug'], `${field}.slug`, ['current', '_type'])['current']);
    if (ids.has(documentId) || slugs.has(slug) || doc['slugCount'] !== 1) fail(field, 'CMS_DUPLICATE_SLUG');
    ids.add(documentId); slugs.add(slug);
    if (doc['referenceCode'] !== articleScopes[slug].referenceCode) fail(`${field}.referenceCode`, 'CMS_SOURCE_CODE');
    const publishedAt = date(doc['publishedAt'], `${field}.publishedAt`, context.now, true);
    const contentUpdatedAt = date(doc['contentUpdatedAt'], `${field}.contentUpdatedAt`, context.now, true);
    const factConfirmedAt = review(doc, field, context.now);
    if (Date.parse(contentUpdatedAt) < Date.parse(publishedAt) || factConfirmedAt < contentUpdatedAt.slice(0, 10)) fail(field, 'CMS_DATE');
    const seo = record(doc['seo'], `${field}.seo`, ['_type', 'seoTitle', 'seoDescription']);
    const related = (key: 'relatedCategories' | 'relatedArticles', type: string): string[] => {
      if (doc[key] == null) return [];
      const paths = array(doc[key], `${field}.${key}`, 0, 2).map((ref, i) => {
        if (record(ref, `${field}.${key}[${i}]`)['_ref'] === documentId) fail(`${field}.${key}`, 'CMS_SELF_REFERENCE');
        return resolveCmsReference(ref, `${field}.${key}[${i}]`, context, type);
      });
      if (new Set(paths).size !== paths.length) fail(`${field}.${key}`, 'CMS_REFERENCE');
      return paths;
    };
    if (doc['linkToManufacturing'] != null && typeof doc['linkToManufacturing'] !== 'boolean') fail(`${field}.linkToManufacturing`);
    const body = convertCmsBody(doc['body'], (ref, path) => resolveCmsReference(ref, `${field}.${path}`, context));
    if (body.filter(block => block.type === 'heading' && block.level === 2).length < 3) fail(`${field}.body`, 'CMS_INCOMPLETE_ARTICLE');
    return { kind: 'cms_article', source: 'sanity', documentId, revision: id(doc['_rev'], `${field}._rev`),
      cmsPerspective: 'published', websitePublication: 'not_verified', productionAllowed: false,
      slug, referenceCode: articleScopes[slug].referenceCode, title: string(doc['title'], `${field}.title`), excerpt: string(doc['excerpt'], `${field}.excerpt`),
      seo: { seoTitle: string(seo['seoTitle'], `${field}.seo.seoTitle`), seoDescription: string(seo['seoDescription'], `${field}.seo.seoDescription`) },
      authorDisplay: string(doc['authorDisplay'], `${field}.authorDisplay`), publishedAt, contentUpdatedAt, factConfirmedAt, factReviewStatus: 'confirmed',
      cover: convertCmsApprovedImage(doc['coverImage'], 'coverImage', context), body,
      relatedCategories: related('relatedCategories', 'category'), relatedArticles: related('relatedArticles', 'article'), linkToManufacturing: doc['linkToManufacturing'] === true };
  });
}
