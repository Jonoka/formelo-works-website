// OFFLINE-ONLY synthetic site-provider fixtures. Never upload or publish these values.
import { pageKeys, type PageKey } from '../../shared/content';
import { cmsCategoryScopes, type CmsCategorySlug } from '../../shared/cms-site';
import type { CmsReadContext } from '../../shared/cms-article';
import { record, type RecordValue } from '../../shared/cms-validation';
import { fixtureReference } from './cms-articles';
import { homeSectionKeys } from '../../shared/cms-home';

export const fixtureSiteContext: CmsReadContext = { projectId: 'offline1', dataset: 'offline-fixture', perspective: 'published', now: Date.parse('2026-09-18T12:00:00Z') };
const confirmation = '2026-09-17', update = '2026-09-17T00:00:00Z';

export function fixtureApprovedImage(seed = 'b'): RecordValue {
  const hash = seed.repeat(40).slice(0, 40), assetId = `image-${hash}-1200x800-webp`;
  return { _type: 'approvedImage', alt: 'OFFLINE FIXTURE — NOT A REAL ASSET', publicUseApproved: true, decorative: false, caption: null, crop: null, hotspot: null,
    asset: { _type: 'reference', _ref: assetId, _weak: false, document: { _id: assetId, _type: 'sanity.imageAsset', _originalId: null,
      url: `https://cdn.sanity.io/images/${fixtureSiteContext.projectId}/${fixtureSiteContext.dataset}/${hash}-1200x800.webp`, metadata: { dimensions: { width: 1200, height: 800 } } } } };
}
export function fixtureMoq(): RecordValue {
  return { _type: 'moqPolicy', mode: 'projectBased', quantity: null, unit: 'pieces', basis: 'per project', sizeMixing: 'OFFLINE FIXTURE', conditions: 'OFFLINE FIXTURE', confirmedAt: confirmation };
}
const faqs = (prefix: string) => Array.from({ length: 3 }, (_, index) => ({ _type: 'faq', _key: `${prefix}-${index}`, question: `OFFLINE ${prefix} question ${index + 1}`, answer: `OFFLINE ${prefix} answer ${index + 1}` }));

export function fixtureSiteSettings(): RecordValue {
  return { _type: 'siteSettings', _id: 'offline.site-settings', _rev: 'offline-revision-settings', _originalId: null, singletonCount: 1,
    brandName: 'OFFLINE FIXTURE BRAND', factoryName: 'OFFLINE FIXTURE FACTORY', email: 'factory@example.invalid', whatsappDigits: '8613800138000',
    contactPersonOrTeam: 'OFFLINE FIXTURE TEAM', businessHours: 'OFFLINE FIXTURE HOURS', timezone: 'UTC+8', publicAddress: 'OFFLINE FIXTURE ADDRESS',
    channelStatus: { _type: 'object', emailEnabled: true, whatsappEnabled: true }, defaultMoq: fixtureMoq(), logo: fixtureApprovedImage('b'), defaultOgImage: fixtureApprovedImage('c'),
    featuredCategories: [fixtureReference('/clothing/t-shirts/'), fixtureReference('/clothing/hoodies/')], factConfirmedAt: confirmation };
}
export function fixtureHomeContent(): RecordValue {
  return { _type: 'homeTemplateContent', eyebrow: 'Offline manufacturing study', titleLineHints: ['An obsolete title hint'],
    sections: Object.fromEntries(homeSectionKeys.map(key => [key, { _type: 'object', eyebrow: `Offline ${key}`, title: `${key[0]!.toUpperCase()}${key.slice(1)}`, description: `OFFLINE ${key} section description` }])),
    capabilities: ['Development', 'Sampling', 'Production', 'Quality'].map((title, i) => ({ _key: `cap-${i}`, title, description: `OFFLINE capability ${i + 1} business description` })),
    manufacturingSummary: { customization: 'OFFLINE customization overview', sampling: 'OFFLINE sampling overview' },
    factorySummary: 'OFFLINE factory summary. Synthetic content for template verification, not a claim about a real factory.', factoryImage: null,
    processSteps: ['Brief', 'Sample', 'Production', 'Dispatch'].map((title, i) => ({ _key: `step-${i}`, title, description: `OFFLINE process ${i + 1} business description` })),
  };
}
export function fixturePages(): RecordValue[] {
  return pageKeys.map((key, index) => ({ _type: 'page', _id: `offline.page.${key}`, _rev: `offline-page-revision-${index}`, _originalId: null, pageKey: key, pageKeyCount: 1,
    title: `OFFLINE ${key} title`, intro: `OFFLINE ${key} intro`, heroImage: key === 'home' ? fixtureApprovedImage('d') : null,
    templateContent: key === 'home' ? fixtureHomeContent() : null,
    faqItems: key === 'home' || key === 'manufacturing' ? faqs(key) : [], seo: { _type: 'seo', seoTitle: `OFFLINE ${key} SEO`, seoDescription: `OFFLINE ${key} SEO description` },
    contentUpdatedAt: update, factConfirmedAt: key === 'blogIndex' || key === 'privacy' ? null : confirmation }));
}
function sample(slug: CmsCategorySlug, index: number): RecordValue {
  const prefix = slug === 't-shirts' ? 'TS' : 'HD';
  return { _type: 'sample', _key: `${slug}-${index}`, sampleCode: `${prefix}-00${index + 1}`, name: `OFFLINE ${slug} sample ${index + 1}`,
    summary: `OFFLINE ${slug} sample summary ${index + 1}`, images: [fixtureApprovedImage(index % 2 ? 'e' : 'f')], fabric: null, weightGsm: null, fit: null, techniqueNotes: null };
}
export function fixtureCategories(): RecordValue[] {
  return (Object.keys(cmsCategoryScopes) as CmsCategorySlug[]).map((slug, index) => ({
    _type: 'category', _id: `offline.category.${slug}`, _rev: `offline-category-revision-${index}`, _originalId: null, name: slug === 't-shirts' ? 'T-shirts' : 'Hoodies',
    slug: { _type: 'slug', current: slug }, slugCount: 1, categoryCode: slug, referenceCode: cmsCategoryScopes[slug].referenceCode,
    title: `OFFLINE ${slug} title`, intro: `OFFLINE ${slug} intro`, heroImage: fixtureApprovedImage(index ? 'g' : 'h'), samples: [0, 1, 2].map(i => sample(slug, i)),
    capabilityRows: [{ _type: 'capabilityRow', _key: `${slug}-capability`, name: 'OFFLINE capability', description: 'OFFLINE capability description', limitNote: null }],
    moqMode: 'inherit', moqOverride: null, customizationNotes: 'OFFLINE customization notes', samplingNotes: 'OFFLINE sampling notes', evidenceImages: [fixtureApprovedImage(index ? 'i' : 'j')], faqItems: faqs(slug),
    relatedArticles: [fixtureReference('/blog/what-to-send-for-a-clothing-quote/')],
    seo: { _type: 'seo', seoTitle: `OFFLINE ${slug} SEO`, seoDescription: `OFFLINE ${slug} SEO description` }, contentUpdatedAt: update, factConfirmedAt: confirmation,
  }));
}
export function fixtureSiteBundle(): RecordValue { return { settings: [fixtureSiteSettings()], pages: fixturePages(), categories: fixtureCategories() }; }

/** Convert projected fixtures into a raw in-memory GROQ dataset. Computed counts/document projections are removed. */
export function fixtureSiteDataset(projected: RecordValue = fixtureSiteBundle()): RecordValue[] {
  const targets = new Map<string, RecordValue>();
  function strip(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(strip);
    if (!value || typeof value !== 'object') return value;
    const obj = record(value, 'fixture');
    if (obj['_type'] === 'reference' && obj['document']) {
      const doc = strip(obj['document']) as RecordValue; targets.set(String(doc['_id']), doc);
    }
    return Object.fromEntries(Object.entries(obj).filter(([key, item]) => !['document', 'singletonCount', 'pageKeyCount', 'slugCount', 'routeCount'].includes(key) && item !== undefined).map(([key, item]) => [key, strip(item)]));
  }
  const roots = [...(projected['settings'] as RecordValue[]), ...(projected['pages'] as RecordValue[]), ...(projected['categories'] as RecordValue[])].map(doc => strip(doc) as RecordValue);
  for (const doc of roots) targets.set(String(doc['_id']), doc);
  return [...targets.values()];
}

export function mutateSite(root: unknown, path: (string | number)[], value: unknown): void {
  let current = root as Record<string | number, unknown>;
  for (const key of path.slice(0, -1)) current = current[key] as Record<string | number, unknown>;
  current[path.at(-1)!] = value;
}
