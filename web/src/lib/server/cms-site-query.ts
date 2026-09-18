// Node/server-only published reader reused by DEV-05E. Default mock delivery never invokes it.
import { release } from 'node:process';
import { pageKeys } from '../../../../shared/content';
import { cmsCategoryScopes, convertCmsSiteBundle, type CmsSiteBundle } from '../../../../shared/cms-site';
import { CmsContentError, fail, record, string } from '../../../../shared/cms-validation';

export const siteQueryPolicy = Object.freeze({ apiVersion: '2025-02-19', perspective: 'published', useCdn: false, cache: 'no-store', maxResponseBytes: 2097152 } as const);
const publishedFilter = '!(_id in path("drafts.**")) && !(_id in path("versions.**"))';
const target = `_id, _type, _originalId, pageKey, slug{current}, referenceCode, factConfirmedAt, factReviewStatus, publishedAt,
  "routeCount": count(*[_type == ^._type && ${publishedFilter} && ((^._type == "page" && pageKey == ^.pageKey) || (^._type != "page" && slug.current == ^.slug.current))])`;
const ref = `_type, _key, _ref, _weak, "document": @->{${target}}`;
const image = `_type, alt, caption, publicUseApproved, decorative, crop{top, bottom, left, right}, hotspot{x, y, width, height},
  asset{_type, _ref, _weak, "document": @->{_id, _type, _originalId, url, metadata{dimensions{width, height}}}}`;
const faq = `_type, _key, question, answer`;
const moq = `_type, mode, quantity, unit, basis, sizeMixing, conditions, confirmedAt`;
const sample = `_type, _key, sampleCode, name, summary, images[]{${image}}, fabric, weightGsm, fit, techniqueNotes`;
const capability = `_type, _key, name, description, limitNote`;
const homeSection = `_type, eyebrow, title, description`;
const homeTemplate = `_type, eyebrow, titleLineHints, sections{_type,
  capabilities{${homeSection}}, categories{${homeSection}}, factory{${homeSection}},
  process{${homeSection}}, journal{${homeSection}}, faq{${homeSection}}},
  capabilities[]{_type, _key, title, description}, manufacturingSummary{_type, customization, sampling},
  factorySummary, factoryImage{${image}}, processSteps[]{_type, _key, title, description}`;

export const siteBundleQuery = `{
  "settings": *[_type == "siteSettings" && ${publishedFilter}]{
    _type, _id, _rev, _originalId,
    "singletonCount": count(*[_type == "siteSettings" && ${publishedFilter}]),
    brandName, factoryName, email, whatsappDigits, contactPersonOrTeam, businessHours, timezone, publicAddress,
    channelStatus{_type, emailEnabled, whatsappEnabled}, defaultMoq{${moq}}, logo{${image}}, defaultOgImage{${image}},
    featuredCategories[]{${ref}}, factConfirmedAt
  },
  "pages": *[_type == "page" && pageKey in $pageKeys && ${publishedFilter}]{
    _type, _id, _rev, _originalId, pageKey,
    "pageKeyCount": count(*[_type == "page" && pageKey == ^.pageKey && ${publishedFilter}]),
    title, intro, heroImage{${image}}, faqItems[]{${faq}}, templateContent{${homeTemplate}}, seo{_type, seoTitle, seoDescription}, contentUpdatedAt, factConfirmedAt
  },
  "categories": *[_type == "category" && slug.current in $categorySlugs && ${publishedFilter}]{
    _type, _id, _rev, _originalId, name, slug{_type, current},
    "slugCount": count(*[_type == "category" && slug.current == ^.slug.current && ${publishedFilter}]),
    categoryCode, referenceCode, title, intro, heroImage{${image}}, samples[]{${sample}}, capabilityRows[]{${capability}},
    moqMode, moqOverride{${moq}}, customizationNotes, samplingNotes, evidenceImages[]{${image}}, faqItems[]{${faq}}, relatedArticles[]{${ref}},
    seo{_type, seoTitle, seoDescription}, contentUpdatedAt, factConfirmedAt
  }
}`;

export interface SiteReaderConfig { projectId: string; dataset: string; token: string }
export type SiteTransport = (url: string, init: RequestInit) => Promise<Response>;
export interface SiteReaderOptions { transport?: SiteTransport; timeoutMs?: number; now?: () => number }

export function siteReaderConfigFromEnvironment(env: Record<string, string | undefined>): SiteReaderConfig {
  if (env['SANITY_SITE_READ_ENABLED'] !== '1') fail('SANITY_SITE_READ_ENABLED', 'CMS_SITE_READ_NOT_AUTHORIZED');
  for (const key of ['SANITY_PROJECT_ID', 'SANITY_DATASET', 'SANITY_READ_TOKEN']) if (!env[key]?.trim()) fail('configuration', 'CMS_NOT_CONFIGURED');
  if (env['SANITY_API_VERSION'] !== siteQueryPolicy.apiVersion) fail('SANITY_API_VERSION', 'CMS_CONFIG');
  return { projectId: env['SANITY_PROJECT_ID']!, dataset: env['SANITY_DATASET']!, token: env['SANITY_READ_TOKEN']! };
}
function validateConfig(value: unknown): SiteReaderConfig {
  const config = record(value, 'configuration', ['projectId', 'dataset', 'token']);
  const projectId = string(config['projectId'], 'configuration.projectId'), dataset = string(config['dataset'], 'configuration.dataset');
  if (!/^[a-z0-9]{1,64}$/.test(projectId) || /^(example|placeholder|yourprojectid|changeme)$/.test(projectId) ||
      !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(dataset)) fail('configuration', 'CMS_CONFIG');
  const token = string(config['token'], 'configuration.token');
  if (/\s/.test(token) || token.length > 4096) fail('configuration.token', 'CMS_CONFIG');
  return { projectId, dataset, token };
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
      const next = await reader.read(); if (next.done) break;
      size += next.value.byteLength;
      if (size > siteQueryPolicy.maxResponseBytes) fail('response', 'CMS_RESPONSE_LIMIT');
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
/** Query HTTP protocol metadata is validated here and never forwarded to site/page rendering. */
function queryResult(value: unknown): unknown {
  const envelope = record(value, 'response', ['ms', 'query', 'result', 'syncTags']);
  if (!Object.hasOwn(envelope, 'result')) fail('response.result', 'CMS_EMPTY');
  if (envelope['ms'] != null && (typeof envelope['ms'] !== 'number' || !Number.isFinite(envelope['ms']) || envelope['ms'] < 0)) fail('response.ms');
  if (envelope['query'] != null) string(envelope['query'], 'response.query', true);
  if (envelope['syncTags'] != null) {
    if (!Array.isArray(envelope['syncTags']) || envelope['syncTags'].length > 10000) fail('response.syncTags');
    for (let index = 0; index < envelope['syncTags'].length; index++) string(envelope['syncTags'][index], `response.syncTags[${index}]`, true);
  }
  return envelope['result'];
}

export function createSiteReader(input: unknown, options: SiteReaderOptions = {}) {
  if (release.name !== 'node' || typeof window !== 'undefined') fail('runtime', 'CMS_SERVER_ONLY');
  if (input == null) fail('configuration', 'CMS_NOT_CONFIGURED');
  const config = validateConfig(input), transport = options.transport ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? 8000, now = options.now ?? Date.now;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) fail('timeoutMs', 'CMS_CONFIG');
  async function read(): Promise<CmsSiteBundle> {
    const controller = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        (async () => {
          const url = `https://${config.projectId}.api.sanity.io/v${siteQueryPolicy.apiVersion}/data/query/${config.dataset}?perspective=published&returnQuery=false&resultSourceMap=false`;
          let response: Response;
          try {
            response = await transport(url, {
              method: 'POST', cache: 'no-store', redirect: 'error', credentials: 'omit', signal: controller.signal,
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.token}` },
              body: JSON.stringify({ query: siteBundleQuery, params: { pageKeys: [...pageKeys], categorySlugs: Object.keys(cmsCategoryScopes) } }),
            });
          } catch {
            if (controller.signal.aborted) fail('response', 'CMS_TIMEOUT');
            return fail('response', 'CMS_TRANSPORT');
          }
          if (response.status === 401) fail('response', 'CMS_UNAUTHENTICATED');
          if (response.status === 403) fail('response', 'CMS_FORBIDDEN');
          if (!response.ok) fail('response', 'CMS_HTTP');
          const result = queryResult(await responseData(response, controller.signal));
          return convertCmsSiteBundle(result, { projectId: config.projectId, dataset: config.dataset, perspective: 'published', now: now() });
        })(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => { controller.abort(); reject(new CmsContentError('CMS_TIMEOUT', 'response')); }, timeoutMs);
        }),
      ]);
    } finally { if (timer) clearTimeout(timer); controller.abort(); }
  }
  return Object.freeze({ read, policy: siteQueryPolicy });
}
