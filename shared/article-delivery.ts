import type { ArticlePreview } from './editorial';
import type { CmsArticleDraftPreviewData } from './cms-draft-preview';
import { articleScopes, type ArticleSlug, type CmsArticleRenderData } from './cms-article';
import { CmsContentError } from './cms-validation';

export type ArticleDeliveryMode = 'mock' | 'draft-preview' | 'published';
export type ArticleDelivery =
  | (ArticlePreview & { source: 'local'; cmsPerspective: null; websitePublication: 'not_published'; coverState: 'local_concept' })
  | (CmsArticleDraftPreviewData & { coverState: 'missing' })
  | (CmsArticleRenderData & { status: 'cms_published'; coverState: 'approved' });
export interface ArticleCollection { mode: ArticleDeliveryMode; articles: ArticleDelivery[] }

/** Article selection is independent of the still mock-only full-site CONTENT_MODE. */
export function readArticleDeliveryMode(env: Record<string, string | undefined>): ArticleDeliveryMode {
  const flag = env['DEV_CMS_DRAFT_PREVIEW'];
  if (flag !== undefined && flag !== '0' && flag !== '1') throw new CmsContentError('ARTICLE_SOURCE_CONFIG', 'DEV_CMS_DRAFT_PREVIEW');
  const mode = env['ARTICLE_CONTENT_MODE'] ?? (flag === '1' ? 'draft-preview' : 'mock');
  if (mode !== 'mock' && mode !== 'draft-preview' && mode !== 'published') throw new CmsContentError('ARTICLE_SOURCE_CONFIG', 'ARTICLE_CONTENT_MODE');
  if ((mode === 'draft-preview') !== (flag === '1')) throw new CmsContentError('ARTICLE_SOURCE_CONFLICT', 'configuration');
  return mode;
}

export function deliverLocalArticle(article: ArticlePreview): ArticleDelivery {
  return { ...article, source: 'local', cmsPerspective: null, websitePublication: 'not_published', coverState: 'local_concept' };
}
export function deliverDraftArticle(article: CmsArticleDraftPreviewData): ArticleDelivery {
  return { ...article, coverState: 'missing' };
}
export function deliverPublishedArticle(article: CmsArticleRenderData): ArticleDelivery {
  return { ...article, status: 'cms_published', coverState: 'approved' };
}
export function findDeliveredArticle(collection: ArticleCollection, slug: ArticleSlug): ArticleDelivery | undefined {
  return collection.articles.find(article => article.slug === slug);
}
export function articleStatusLabel(article: ArticleDelivery): string {
  if (article.kind === 'article_preview') return 'Editorial draft / Not published';
  if (article.kind === 'cms_article_draft_preview') return 'CMS draft preview / Not published';
  return 'CMS published / Website release not verified';
}
export function articleSourceLabel(article: ArticleDelivery): string {
  if (article.kind === 'article_preview') return 'Local editorial draft';
  return article.cmsPerspective === 'drafts' ? 'Sanity draft preview' : 'Sanity published record';
}
/** Cards are a projection of the same validated record used by ArticleLayout, never a separate query. */
export function articleCardData(article: ArticleDelivery) {
  return {
    slug: article.slug, href: articleScopes[article.slug].path, title: article.title, excerpt: article.excerpt,
    referenceCode: article.referenceCode, source: article.source, status: article.status,
    cmsPerspective: article.cmsPerspective, revision: article.kind === 'article_preview' ? null : article.revision,
    coverState: article.coverState, statusLabel: articleStatusLabel(article), sourceLabel: articleSourceLabel(article),
  };
}
export function articleCollectionNotice(mode: ArticleDeliveryMode): string {
  if (mode === 'mock') return 'Two editorial drafts for your next brief. Not published or factory-approved.';
  if (mode === 'draft-preview') return 'One authorized Sanity draft and one local editorial draft. Sources are labeled separately; neither is website-published.';
  return 'Published Sanity records only. Website release remains blocked; no draft or local substitute is included.';
}
