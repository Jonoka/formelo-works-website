// Node/build-only DEV-05B boundary. Never import from loadContent or browser scripts.
import { release } from 'node:process';
import { articleSlug, type ArticleSlug } from '../../../../shared/cms-article';
import { convertCmsDraftPreviewArticle, dev05bDraftScope, type CmsArticleDraftPreviewData } from '../../../../shared/cms-draft-preview';
import { array, CmsContentError, fail, id, record, string } from '../../../../shared/cms-validation';

export const draftPreviewQueryPolicy = Object.freeze({ apiVersion: '2025-02-19', perspective: 'drafts', useCdn: false, cache: 'no-store', maxResponseBytes: 1048576 } as const);
const annotations = `_type, _key,
  _type == "editorialExternalLink" => {href},
  _type == "editorialInternalLink" => {fragment, target{_type, _key, _ref, _weak}}`;
const block = `_type, _key, style, listItem, level, children[]{_type, _key, text, marks}, markDefs[]{${annotations}}`;
/** Exact ID + slug only; no enumeration, fallback, publication fields, assets or unrelated references. */
export const draftPreviewQuery = `*[_type == "article" && _id == $id && slug.current == $slug]{
  _type, _id, _rev, _originalId, _updatedAt, title, slug{current}, excerpt, referenceCode, factReviewStatus,
  seo{_type, seoTitle, seoDescription},
  body[]{_type, _key,
    _type == "block" => {style, listItem, level, children[]{_type, _key, text, marks}, markDefs[]{${annotations}}},
    _type == "editorialTable" => {caption, columns, rows[]{_type, _key, cells}},
    _type == "editorialCallout" => {title, content[]{${block}}},
    _type == "editorialTemplate" => {title, text}
  }
}`;

export interface DraftPreviewReaderConfig { projectId: string; dataset: string; token: string; documentIds: string[] }
export type DraftPreviewTransport = (url: string, init: RequestInit) => Promise<Response>;
export interface DraftPreviewReaderOptions { transport?: DraftPreviewTransport; timeoutMs?: number; now?: () => number }

/** Explicit opt-in only. Values are copied privately and never returned or logged. */
export function draftPreviewConfigFromEnvironment(env: Record<string, string | undefined>): DraftPreviewReaderConfig {
  for (const key of ['SANITY_PROJECT_ID', 'SANITY_DATASET', 'SANITY_READ_TOKEN', 'SANITY_ARTICLE_READ_IDS']) {
    if (!env[key]?.trim()) fail('configuration', 'CMS_NOT_CONFIGURED');
  }
  if (env['SANITY_API_VERSION'] !== draftPreviewQueryPolicy.apiVersion) fail('SANITY_API_VERSION', 'CMS_CONFIG');
  return validateConfig({ projectId: env['SANITY_PROJECT_ID'], dataset: env['SANITY_DATASET'], token: env['SANITY_READ_TOKEN'], documentIds: env['SANITY_ARTICLE_READ_IDS']!.split(',').map(value => value.trim()) });
}

function validateConfig(value: unknown): DraftPreviewReaderConfig {
  const config = record(value, 'configuration', ['projectId', 'dataset', 'token', 'documentIds']);
  const projectId = string(config['projectId'], 'configuration.projectId');
  const dataset = string(config['dataset'], 'configuration.dataset');
  const token = string(config['token'], 'configuration.token');
  if (projectId !== dev05bDraftScope.projectId || dataset !== dev05bDraftScope.dataset || /\s/.test(token) || token.length > 4096) fail('configuration', 'CMS_CONFIG');
  const documentIds = array(config['documentIds'], 'configuration.documentIds', 1, 1).map(value => id(value, 'configuration.documentIds'));
  if (documentIds[0] !== dev05bDraftScope.documentId) fail('configuration.documentIds', 'CMS_NOT_AUTHORIZED');
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
      if (size > draftPreviewQueryPolicy.maxResponseBytes) fail('response', 'CMS_RESPONSE_LIMIT');
      parts.push(next.value);
    }
  } finally { signal.removeEventListener('abort', cancel); await reader.cancel().catch(() => undefined); }
  if (signal.aborted) fail('response', 'CMS_TIMEOUT');
  if (!size) fail('response', 'CMS_EMPTY');
  const bytes = new Uint8Array(size); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown; }
  catch { return fail('response', 'CMS_INVALID_JSON'); }
}

/** Server-only read path for the single authorized DEV-05B draft. It exposes no mutation, list, retry or fallback operation. */
export function createDraftPreviewReader(input: unknown, options: DraftPreviewReaderOptions = {}) {
  if (release.name !== 'node' || typeof window !== 'undefined') fail('runtime', 'CMS_SERVER_ONLY');
  if (input == null) fail('configuration', 'CMS_NOT_CONFIGURED');
  const config = validateConfig(input);
  const transport = options.transport ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? 8000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) fail('timeoutMs', 'CMS_CONFIG');
  return Object.freeze({
    policy: draftPreviewQueryPolicy,
    async read(documentId: string, requestedSlug: ArticleSlug): Promise<CmsArticleDraftPreviewData> {
      id(documentId, 'request.documentId');
      if (documentId !== dev05bDraftScope.documentId || !config.documentIds.includes(documentId)) fail('request.documentId', 'CMS_NOT_AUTHORIZED');
      const slug = articleSlug(requestedSlug);
      if (slug !== dev05bDraftScope.slug) fail('request.slug', 'CMS_NOT_AUTHORIZED');
      const controller = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          (async () => {
            const url = `https://${config.projectId}.api.sanity.io/v${draftPreviewQueryPolicy.apiVersion}/data/query/${config.dataset}?perspective=drafts&returnQuery=false&resultSourceMap=false`;
            const response = await transport(url, { method: 'POST', cache: 'no-store', redirect: 'error', credentials: 'omit', signal: controller.signal,
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.token}` }, body: JSON.stringify({ query: draftPreviewQuery, params: { id: documentId, slug } }) });
            if (!response.ok) {
              void response.body?.cancel().catch(() => undefined);
              if (response.status === 401) fail('response', 'CMS_UNAUTHENTICATED');
              if (response.status === 403) fail('response', 'CMS_FORBIDDEN');
              fail('response', 'CMS_HTTP');
            }
            const envelope = record(await responseData(response, controller.signal), 'response');
            return convertCmsDraftPreviewArticle(envelope['result'], { projectId: config.projectId, dataset: config.dataset, perspective: 'drafts', now: (options.now ?? Date.now)() });
          })(),
          new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new CmsContentError('CMS_TIMEOUT', 'response')); }, timeoutMs); }),
        ]);
      } catch (error) {
        if (controller.signal.aborted) throw new CmsContentError('CMS_TIMEOUT', 'response');
        if (error instanceof CmsContentError) throw error;
        throw new CmsContentError('CMS_TRANSPORT', 'response');
      } finally { if (timer !== undefined) clearTimeout(timer); controller.abort(); }
    },
  });
}
