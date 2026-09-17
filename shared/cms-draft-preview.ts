import { pageContexts } from '../config/page-context';
import type { Seo } from './content';
import type { EditorialBlock } from './editorial';
import { articleSlug } from './cms-article';
import { convertCmsBody } from './cms-body';
import { array, date, fail, id, record, string } from './cms-validation';

/** DEV-05B is intentionally one-document-only. This is not a general draft CMS provider. */
export const dev05bDraftScope = Object.freeze({
  projectId: 'iajvl7ka',
  dataset: 'production',
  documentId: '1d86cc37-7f67-47e0-b29a-3eac5aa0a3ae',
  slug: 'what-to-send-for-a-clothing-quote',
  referenceCode: pageContexts.quoteGuide.referenceCode,
} as const);

export interface CmsDraftPreviewContext {
  projectId: string;
  dataset: string;
  perspective: 'drafts';
  now: number;
}

/** Validated unpublished preview data. It deliberately omits publication, author, review-date and asset-approval fields. */
export interface CmsArticleDraftPreviewData {
  kind: 'cms_article_draft_preview';
  source: 'sanity';
  documentId: typeof dev05bDraftScope.documentId;
  revision: string;
  cmsPerspective: 'drafts';
  status: 'cms_draft_preview';
  websitePublication: 'not_published';
  productionAllowed: false;
  slug: typeof dev05bDraftScope.slug;
  referenceCode: typeof dev05bDraftScope.referenceCode;
  title: string;
  excerpt: string;
  seo: Seo;
  body: EditorialBlock[];
  draftSavedAt: string;
  factReviewStatus: 'pending' | 'confirmed';
}

export function convertCmsDraftPreviewArticle(value: unknown, context: CmsDraftPreviewContext): CmsArticleDraftPreviewData {
  if (context.projectId !== dev05bDraftScope.projectId || context.dataset !== dev05bDraftScope.dataset ||
      context.perspective !== 'drafts' || !Number.isFinite(context.now)) fail('context', 'CMS_CONFIG');
  const documents = array(value, 'articles', 0, 2);
  if (documents.length === 0) fail('articles', 'CMS_EMPTY');
  if (documents.length !== 1) fail('articles', 'CMS_SCOPE');
  const doc = record(documents[0], 'articles[0]', ['_type', '_id', '_rev', '_originalId', '_updatedAt', 'title', 'slug', 'excerpt', 'referenceCode', 'seo', 'body', 'factReviewStatus']);
  if (doc['_type'] !== 'article') fail('articles[0]', 'CMS_DOCUMENT_TYPE');
  const documentId = id(doc['_id'], 'articles[0]._id');
  if (documentId !== dev05bDraftScope.documentId || doc['_originalId'] !== `drafts.${documentId}`) fail('articles[0]', 'CMS_SCOPE');
  const slug = articleSlug(record(doc['slug'], 'articles[0].slug', ['current', '_type'])['current']);
  if (slug !== dev05bDraftScope.slug || doc['referenceCode'] !== dev05bDraftScope.referenceCode) fail('articles[0]', 'CMS_SCOPE');
  const review = doc['factReviewStatus'];
  if (review !== 'pending' && review !== 'confirmed') fail('articles[0].factReviewStatus', 'CMS_REVIEW');
  const seo = record(doc['seo'], 'articles[0].seo', ['_type', 'seoTitle', 'seoDescription']);
  const body = convertCmsBody(doc['body'], (_reference, field) => fail(`articles[0].${field}`, 'CMS_DRAFT_REFERENCE'));
  if (body.filter(block => block.type === 'heading' && block.level === 2).length < 3) fail('articles[0].body', 'CMS_INCOMPLETE_ARTICLE');
  return {
    kind: 'cms_article_draft_preview', source: 'sanity', documentId: dev05bDraftScope.documentId,
    revision: id(doc['_rev'], 'articles[0]._rev'), cmsPerspective: 'drafts', status: 'cms_draft_preview',
    websitePublication: 'not_published', productionAllowed: false, slug: dev05bDraftScope.slug,
    referenceCode: dev05bDraftScope.referenceCode, title: string(doc['title'], 'articles[0].title'),
    excerpt: string(doc['excerpt'], 'articles[0].excerpt'),
    seo: { seoTitle: string(seo['seoTitle'], 'articles[0].seo.seoTitle'), seoDescription: string(seo['seoDescription'], 'articles[0].seo.seoDescription') },
    body, draftSavedAt: date(doc['_updatedAt'], 'articles[0]._updatedAt', context.now, true), factReviewStatus: review,
  };
}
