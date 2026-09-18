import { readRuntime, type Environment } from '../../../../config/runtime';
import { articleScopes } from '../../../../shared/cms-article';
import { dev05bDraftScope } from '../../../../shared/cms-draft-preview';
import { CmsContentError } from '../../../../shared/cms-validation';
import { deliverDraftArticle, deliverLocalArticle, deliverPublishedArticle, readArticleDeliveryMode, type ArticleCollection, type ArticleDeliveryMode } from '../../../../shared/article-delivery';
import { loadContent } from '../content';
import { articleReaderConfigFromEnvironment, createArticleReader, type ArticleReaderOptions } from './cms-article-query';
import { createDraftPreviewReader, draftPreviewConfigFromEnvironment, type DraftPreviewReaderOptions } from './cms-draft-preview-query';
import { assertCmsDraftPreviewDevCommand, assertCmsDraftPreviewLoopback, cmsDraftPreviewDevError, cmsDraftPreviewHostError } from './cms-draft-preview-mode';

export interface ArticleDeliveryContext { env?: Environment; command?: unknown; url?: URL }
export interface ArticleDeliveryReaderOptions { draft?: DraftPreviewReaderOptions; published?: ArticleReaderOptions }

/** A dev request always reads afresh. Only one actual build invocation shares an immutable-source snapshot. */
export function createArticleDeliveryLoader(options: ArticleDeliveryReaderOptions = {}) {
  let buildSnapshot: { key: string; value: Promise<ArticleCollection> } | undefined;
  async function read(env: Environment, mode: ArticleDeliveryMode): Promise<ArticleCollection> {
    if (mode === 'published') {
      const articles = await createArticleReader(articleReaderConfigFromEnvironment(env), options.published).list();
      return { mode, articles: articles.map(deliverPublishedArticle) };
    }
    const { articlePreviews } = await loadContent('mock');
    if (mode === 'mock') return { mode, articles: articlePreviews.map(deliverLocalArticle) };
    // Declared phase boundary: the quote is CMS; MOQ is local. This is not a catch/fallback branch.
    const draft = await createDraftPreviewReader(draftPreviewConfigFromEnvironment(env), options.draft).read(dev05bDraftScope.documentId, dev05bDraftScope.slug);
    const moq = articlePreviews.find(article => article.slug === 'moq-per-style-per-color');
    if (!moq || moq.referenceCode !== articleScopes['moq-per-style-per-color'].referenceCode) throw new CmsContentError('ARTICLE_LOCAL_SCOPE', 'moq');
    return { mode, articles: [deliverDraftArticle(draft), deliverLocalArticle(moq)] };
  }
  return async (context: ArticleDeliveryContext = {}): Promise<ArticleCollection> => {
    const env = context.env ?? process.env;
    const runtime = readRuntime(env);
    const mode = readArticleDeliveryMode(env);
    if (mode === 'draft-preview') {
      assertCmsDraftPreviewDevCommand(context.command, env);
      if (runtime.deployEnv !== 'local') throw new CmsContentError('CMS_DRAFT_PREVIEW_LOCAL_ONLY', 'runtime');
      assertCmsDraftPreviewLoopback(context.url?.hostname);
    }
    if (context.command !== 'build') return read(env, mode);
    // Private only; it is never logged or returned. A changed source during a build is an error.
    const key = JSON.stringify([mode, ...['SANITY_PROJECT_ID', 'SANITY_DATASET', 'SANITY_API_VERSION', 'SANITY_ARTICLE_READ_IDS', 'SANITY_READ_TOKEN'].map(name => env[name])]);
    if (buildSnapshot && buildSnapshot.key !== key) throw new CmsContentError('ARTICLE_BUILD_SOURCE_CHANGED', 'configuration');
    buildSnapshot ??= { key, value: read(env, mode) };
    return buildSnapshot.value;
  };
}
export const loadArticleCollection = createArticleDeliveryLoader();
export type ArticlePageResult = { ok: true; collection: ArticleCollection } | { ok: false; code: string };
/** Safe dev error state, never a successful empty collection. Build errors still abort the build. */
export async function loadArticlePage(context: ArticleDeliveryContext): Promise<ArticlePageResult> {
  try { return { ok: true, collection: await loadArticleCollection(context) }; }
  catch (error) {
    if (context.command !== 'dev') throw error;
    let code = 'ARTICLE_DELIVERY_FAILED';
    if (error instanceof CmsContentError && /^(?:CMS|ARTICLE)_[A-Z_]+$/.test(error.code)) code = error.code;
    else if (error instanceof Error && error.message === cmsDraftPreviewDevError) code = 'CMS_DRAFT_PREVIEW_DEV_ONLY';
    else if (error instanceof Error && error.message === cmsDraftPreviewHostError) code = 'CMS_DRAFT_PREVIEW_LOOPBACK_ONLY';
    return { ok: false, code };
  }
}
