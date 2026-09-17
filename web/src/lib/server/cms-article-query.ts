// Node/build-only boundary. Not imported by loadContent, pages or browser scripts.
import { release } from 'node:process';
import { articleSlug, convertCmsArticles, type ArticleSlug, type CmsArticleRenderData } from '../../../../shared/cms-article';
import { array, CmsContentError, fail, id, record, string } from '../../../../shared/cms-validation';

export const articleQueryPolicy = Object.freeze({ apiVersion: '2025-02-19', perspective: 'published', useCdn: false, cache: 'no-store', maxResponseBytes: 1048576 } as const);
const publishedFilter = '!(_id in path("drafts.**")) && !(_id in path("versions.**"))';
const target = `_id, _type, _originalId, pageKey, slug{current}, referenceCode, factConfirmedAt, factReviewStatus, publishedAt,
  "routeCount": count(*[_type == ^._type && ${publishedFilter} && ((^._type == "page" && pageKey == ^.pageKey) || (^._type != "page" && slug.current == ^.slug.current))])`;
const ref = `_type, _key, _ref, _weak, "document": @->{${target}}`;
const annotations = `_type, _key,
  _type == "editorialExternalLink" => {href},
  _type == "editorialInternalLink" => {fragment, target{${ref}}}`;
const block = `_type, _key, style, listItem, level, children[]{_type, _key, text, marks}, markDefs[]{${annotations}}`;
/** No [0] selection or block-type filtering: duplicate documents and unknown blocks must survive to validation. */
export const articleQuery = `*[_type == "article" && _id == $id && slug.current == $slug && ${publishedFilter}]{
  _type, _id, _rev, _originalId, title, slug{current}, excerpt, referenceCode,
  "slugCount": count(*[_type == "article" && slug.current == ^.slug.current && ${publishedFilter}]),
  seo{seoTitle, seoDescription}, authorDisplay, publishedAt, contentUpdatedAt, factReviewStatus, factConfirmedAt,
  relatedCategories[]{${ref}}, relatedArticles[]{${ref}}, linkToManufacturing,
  coverImage{_type, alt, caption, publicUseApproved, decorative, crop{top, bottom, left, right}, hotspot{x, y, width, height},
    asset{_type, _ref, _weak, "document": @->{_id, _type, _originalId, url, metadata{dimensions{width, height}}}}},
  body[]{_type, _key,
    _type == "block" => {style, listItem, level, children[]{_type, _key, text, marks}, markDefs[]{${annotations}}},
    _type == "editorialTable" => {caption, columns, rows[]{_type, _key, cells}},
    _type == "editorialCallout" => {title, content[]{${block}}},
    _type == "editorialTemplate" => {title, text}
  }
}`;
export interface ArticleReaderConfig { projectId: string; dataset: string; token: string; documentIds: string[] }
export type ArticleTransport = (url: string, init: RequestInit) => Promise<Response>;
export interface ArticleReaderOptions { transport?: ArticleTransport; timeoutMs?: number; now?: () => number }
/** Explicit opt-in only. This function does not load files or inspect process.env. */
export function articleReaderConfigFromEnvironment(env: Record<string, string | undefined>): ArticleReaderConfig {
  for (const key of ['SANITY_PROJECT_ID', 'SANITY_DATASET', 'SANITY_READ_TOKEN', 'SANITY_ARTICLE_READ_IDS']) {
    if (!env[key]?.trim()) fail('configuration', 'CMS_NOT_CONFIGURED');
  }
  if (env['SANITY_API_VERSION'] !== articleQueryPolicy.apiVersion) fail('SANITY_API_VERSION', 'CMS_CONFIG');
  return { projectId: env['SANITY_PROJECT_ID']!, dataset: env['SANITY_DATASET']!, token: env['SANITY_READ_TOKEN']!, documentIds: env['SANITY_ARTICLE_READ_IDS']!.split(',').map(v => v.trim()) };
}
function validateConfig(value: unknown): ArticleReaderConfig {
  const config = record(value, 'configuration', ['projectId', 'dataset', 'token', 'documentIds']);
  const projectId = string(config['projectId'], 'configuration.projectId'), dataset = string(config['dataset'], 'configuration.dataset');
  if (!/^[a-z0-9]{1,64}$/.test(projectId) || /^(example|placeholder|yourprojectid|changeme)$/.test(projectId) || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(dataset)) fail('configuration', 'CMS_CONFIG');
  const token = string(config['token'], 'configuration.token');
  if (/\s/.test(token) || token.length > 4096) fail('configuration.token', 'CMS_CONFIG');
  const documentIds = array(config['documentIds'], 'configuration.documentIds', 1, 2).map(v => id(v, 'configuration.documentIds'));
  if (new Set(documentIds).size !== documentIds.length) fail('configuration.documentIds', 'CMS_CONFIG');
  return { projectId, dataset, token, documentIds };
}
async function responseData(response: Response, signal: AbortSignal): Promise<unknown> {
  if (!response.body) fail('response', 'CMS_EMPTY');
  const reader = response.body.getReader(), parts: Uint8Array[] = [];
  const cancel = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener('abort', cancel, { once: true });
  if (signal.aborted) { cancel(); fail('response', 'CMS_TIMEOUT'); }
  let size = 0;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > articleQueryPolicy.maxResponseBytes) fail('response', 'CMS_RESPONSE_LIMIT');
      parts.push(next.value);
    }
  } finally { signal.removeEventListener('abort', cancel); await reader.cancel().catch(() => undefined); }
  if (signal.aborted) fail('response', 'CMS_TIMEOUT');
  if (!size) fail('response', 'CMS_EMPTY');
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown; }
  catch { return fail('response', 'CMS_INVALID_JSON'); }
}
/** Only POST /data/query is exposed; no mutation client, retries, drafts, release views or deployment. */
export function createArticleReader(input: unknown, options: ArticleReaderOptions = {}) {
  if (release.name !== 'node' || typeof window !== 'undefined') fail('runtime', 'CMS_SERVER_ONLY');
  if (input == null) fail('configuration', 'CMS_NOT_CONFIGURED');
  const config = validateConfig(input); // private copy, never returned or logged
  const transport = options.transport ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? 8000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) fail('timeoutMs', 'CMS_CONFIG');
  return Object.freeze({
    policy: articleQueryPolicy,
    async read(documentId: string, requestedSlug: ArticleSlug): Promise<CmsArticleRenderData> {
      id(documentId, 'request.documentId');
      if (!config.documentIds.includes(documentId)) fail('request.documentId', 'CMS_NOT_AUTHORIZED');
      const slug = articleSlug(requestedSlug);
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          (async () => {
            const url = `https://${config.projectId}.api.sanity.io/v${articleQueryPolicy.apiVersion}/data/query/${config.dataset}?perspective=published&returnQuery=false&resultSourceMap=false`;
            const response = await transport(url, { method: 'POST', cache: 'no-store', redirect: 'error', credentials: 'omit', signal: controller.signal,
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.token}` }, body: JSON.stringify({ query: articleQuery, params: { id: documentId, slug } }) });
            if (!response.ok) {
              void response.body?.cancel().catch(() => undefined);
              if (response.status === 401) fail('response', 'CMS_UNAUTHENTICATED');
              if (response.status === 403) fail('response', 'CMS_FORBIDDEN');
              fail('response', 'CMS_HTTP');
            }
            const envelope = record(await responseData(response, controller.signal), 'response');
            const articles = convertCmsArticles(envelope['result'], { projectId: config.projectId, dataset: config.dataset, perspective: 'published', now: (options.now ?? Date.now)() });
            if (articles.length !== 1 || articles[0]!.documentId !== documentId || articles[0]!.slug !== slug) fail('response.result', 'CMS_SCOPE');
            return articles[0]!;
          })(),
          new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new CmsContentError('CMS_TIMEOUT', 'response')); }, timeoutMs); }),
        ]);
      } catch (error) {
        // Fetch/parse errors may contain request headers or a private response. Never retain their cause/stack.
        if (controller.signal.aborted) throw new CmsContentError('CMS_TIMEOUT', 'response');
        if (error instanceof CmsContentError) throw error;
        throw new CmsContentError('CMS_TRANSPORT', 'response');
      } finally { if (timer !== undefined) clearTimeout(timer); controller.abort(); }
    },
  });
}
