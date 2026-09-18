import { readRuntime, type Environment } from '../../../../config/runtime';
import { deliverLocalSite, deliverPublishedSite, readHomeCategoryMode, type SiteDelivery } from '../../../../shared/site-delivery';
import { CmsContentError } from '../../../../shared/cms-validation';
import { loadContent } from '../content';
import { createSiteReader, siteReaderConfigFromEnvironment, type SiteReaderOptions } from './cms-site-query';

export interface SiteDeliveryContext { env?: Environment; command?: unknown; buildId?: string }
/** One immutable snapshot per actual build ID. Dev requests never retain a successful or failed read. */
export function createSiteDeliveryLoader(options: SiteReaderOptions = {}) {
  let snapshot: { buildId: string; key: string; value: Promise<SiteDelivery> } | undefined;
  async function read(env: Environment): Promise<SiteDelivery> {
    if (readHomeCategoryMode(env) === 'mock') return deliverLocalSite(await loadContent('mock'));
    const config = siteReaderConfigFromEnvironment(env);
    const offlineTest = env['FORMELO_OFFLINE_SITE_TEST'] === '1';
    if (offlineTest && (config.projectId !== 'offline1' || config.dataset !== 'offline-fixture' || env['FORMELO_ENV_FILES'] !== 'ignore')) {
      throw new CmsContentError('SITE_OFFLINE_SCOPE', 'configuration');
    }
    const bundle = await createSiteReader(config, options).read();
    if (JSON.stringify(bundle).includes(config.token)) throw new CmsContentError('CMS_SECRET_IN_CONTENT', 'site');
    return deliverPublishedSite(bundle, offlineTest);
  }
  return async (context: SiteDeliveryContext = {}): Promise<SiteDelivery> => {
    const env = context.env ?? process.env;
    readRuntime(env); readHomeCategoryMode(env);
    if (context.command !== 'build') return read(env);
    if (!context.buildId) throw new CmsContentError('SITE_BUILD_CONTEXT', 'buildId');
    // This private key includes credentials only to detect changes. It is never logged or returned.
    const key = JSON.stringify(['HOME_CATEGORY_CONTENT_MODE', 'ARTICLE_CONTENT_MODE', 'DEV_CMS_DRAFT_PREVIEW', 'SANITY_PROJECT_ID', 'SANITY_DATASET', 'SANITY_API_VERSION', 'SANITY_SITE_READ_ENABLED', 'SANITY_READ_TOKEN', 'FORMELO_OFFLINE_SITE_TEST'].map(name => env[name]));
    if (snapshot?.buildId === context.buildId && snapshot.key !== key) throw new CmsContentError('SITE_BUILD_SOURCE_CHANGED', 'configuration');
    if (snapshot?.buildId !== context.buildId) snapshot = { buildId: context.buildId, key, value: read(env) };
    // A template cannot mutate the shared source and change a later page in the same build.
    return structuredClone(await snapshot!.value);
  };
}
export const loadSiteDelivery = createSiteDeliveryLoader();
export function safeSiteErrorCode(error: unknown): string {
  return error instanceof CmsContentError && /^(?:CMS|SITE|ARTICLE)_[A-Z_]+$/.test(error.code) ? error.code : 'SITE_CONTENT_UNAVAILABLE';
}
