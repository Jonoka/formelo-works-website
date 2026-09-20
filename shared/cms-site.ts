import { pageContexts } from '../config/page-context';
import { pageKeys, type Faq, type MoqPolicy, type Seo } from './content';
import { convertCmsApprovedImage, type CmsApprovedImage } from './cms-image';
import { resolveCmsReference, type CmsReadContext } from './cms-article';
import { array, date, fail, id, record, type RecordValue } from './cms-validation';
import { convertCmsHomeContent, sitePlainText as string, type CmsHomeTemplateContent } from './cms-home';

export const cmsPagePaths = {
  home: '/', manufacturing: '/manufacturing/', factory: '/our-factory/',
  contact: '/contact/', blogIndex: '/blog/', privacy: '/privacy/',
} as const;
export const cmsCategoryScopes = {
  't-shirts': pageContexts.tshirts,
  'hoodies': pageContexts.hoodies,
} as const;
export type CmsPageKey = keyof typeof cmsPagePaths;
export type CmsCategorySlug = keyof typeof cmsCategoryScopes;
const businessPageKeys = new Set<CmsPageKey>(['home', 'manufacturing', 'factory', 'contact']);

export interface CmsSiteSettingsData {
  kind: 'cms_site_settings'; source: 'sanity'; documentId: string; revision: string;
  cmsPerspective: 'published'; websitePublication: 'not_verified'; productionAllowed: false;
  brandName: string; factoryName: string; email: string; whatsappDigits: string;
  contactPersonOrTeam: string; businessHours: string; timezone: string; publicAddress: string;
  channelStatus: { emailEnabled: boolean; whatsappEnabled: boolean };
  defaultMoq: MoqPolicy; logo: CmsApprovedImage; defaultOgImage: CmsApprovedImage;
  featuredCategories: string[]; factConfirmedAt: string;
}
export interface CmsPageData {
  kind: 'cms_page'; source: 'sanity'; documentId: string; revision: string;
  cmsPerspective: 'published'; websitePublication: 'not_verified'; productionAllowed: false;
  pageKey: CmsPageKey; path: string; title: string; intro: string; seo: Seo;
  faqItems: Faq[]; heroImage: CmsApprovedImage | null; contentUpdatedAt: string; factConfirmedAt: string | null;
  templateContent: CmsHomeTemplateContent | null;
}
export interface CmsCapabilityRow { name: string; description: string; limitNote: string | null }
export interface CmsSampleData {
  sampleCode: string; name: string; summary: string; images: CmsApprovedImage[];
  fabric: string | null; weightGsm: number | null; fit: string | null; techniqueNotes: string | null;
}
export interface CmsCategoryData {
  kind: 'cms_category'; source: 'sanity'; documentId: string; revision: string;
  cmsPerspective: 'published'; websitePublication: 'not_verified'; productionAllowed: false;
  slug: CmsCategorySlug; path: string; name: string; categoryCode: string; referenceCode: (typeof cmsCategoryScopes)[CmsCategorySlug]['referenceCode'];
  title: string; intro: string; heroImage: CmsApprovedImage; samples: CmsSampleData[];
  capabilityRows: CmsCapabilityRow[]; evidenceImages: CmsApprovedImage[];
  moqMode: 'inherit' | 'override'; effectiveMoq: MoqPolicy;
  customizationNotes: string; samplingNotes: string; faqItems: Faq[];
  relatedArticles: string[]; seo: Seo; contentUpdatedAt: string; factConfirmedAt: string;
}
export interface CmsSiteBundle {
  kind: 'cms_site_bundle'; source: 'sanity'; cmsPerspective: 'published'; websitePublication: 'not_verified'; productionAllowed: false;
  siteSettings: CmsSiteSettingsData; pages: CmsPageData[]; categories: CmsCategoryData[];
}

function publishedIdentity(doc: RecordValue, field: string): string {
  const result = id(doc['_id'], `${field}._id`);
  if (doc['_originalId'] != null) fail(`${field}._originalId`, 'CMS_UNPUBLISHED');
  return result;
}
function seo(value: unknown, field: string): Seo {
  const item = record(value, field, ['_type', 'seoTitle', 'seoDescription']);
  return { seoTitle: string(item['seoTitle'], `${field}.seoTitle`), seoDescription: string(item['seoDescription'], `${field}.seoDescription`) };
}
function faq(value: unknown, field: string, min = 0): Faq[] {
  return array(value ?? [], field, min, 20).map((entry, index) => {
    const item = record(entry, `${field}[${index}]`, ['_type', '_key', 'question', 'answer']);
    return { question: string(item['question'], `${field}[${index}].question`), answer: string(item['answer'], `${field}[${index}].answer`) };
  });
}
function moq(value: unknown, field: string, context: CmsReadContext): MoqPolicy {
  const item = record(value, field, ['_type', 'mode', 'quantity', 'unit', 'basis', 'sizeMixing', 'conditions', 'confirmedAt']);
  const mode = item['mode'];
  if (mode !== 'confirmedQuantity' && mode !== 'projectBased') fail(`${field}.mode`, 'CMS_MOQ');
  let quantity: number | undefined;
  if (mode === 'confirmedQuantity') {
    if (!Number.isSafeInteger(item['quantity']) || Number(item['quantity']) <= 0) fail(`${field}.quantity`, 'CMS_MOQ');
    quantity = Number(item['quantity']);
  } else if (item['quantity'] != null) fail(`${field}.quantity`, 'CMS_MOQ');
  return {
    mode, ...(quantity === undefined ? {} : { quantity }),
    unit: string(item['unit'], `${field}.unit`), basis: string(item['basis'], `${field}.basis`),
    sizeMixing: string(item['sizeMixing'], `${field}.sizeMixing`), conditions: string(item['conditions'], `${field}.conditions`),
    confirmedAt: date(item['confirmedAt'], `${field}.confirmedAt`, context.now),
  };
}
function pageKey(value: unknown, field: string): CmsPageKey {
  if (typeof value !== 'string' || !pageKeys.includes(value as never)) fail(field, 'CMS_ROUTE');
  return value as CmsPageKey;
}
function categorySlug(value: unknown, field: string): CmsCategorySlug {
  if (typeof value !== 'string' || !Object.hasOwn(cmsCategoryScopes, value)) fail(field, 'CMS_ROUTE');
  return value as CmsCategorySlug;
}
function nullableString(value: unknown, field: string): string | null { return value == null ? null : string(value, field); }

export function convertCmsSiteBundle(value: unknown, context: CmsReadContext): CmsSiteBundle {
  if (context.perspective !== 'published' || !Number.isFinite(context.now) || !/^[a-z0-9]+$/.test(context.projectId) ||
      !/^[a-z0-9][a-z0-9_-]*$/.test(context.dataset)) fail('context', 'CMS_CONFIG');
  const bundle = record(value, 'site', ['settings', 'pages', 'categories']);
  const settingsDocs = array(bundle['settings'], 'site.settings', 1, 1);
  const settings = record(settingsDocs[0], 'site.settings[0]', [
    '_type', '_id', '_rev', '_originalId', 'singletonCount', 'brandName', 'factoryName', 'email', 'whatsappDigits',
    'contactPersonOrTeam', 'businessHours', 'timezone', 'publicAddress', 'channelStatus', 'defaultMoq', 'logo',
    'defaultOgImage', 'featuredCategories', 'factConfirmedAt',
  ]);
  if (settings['_type'] !== 'siteSettings' || settings['singletonCount'] !== 1) fail('site.settings[0]', 'CMS_SINGLETON');
  const settingsId = publishedIdentity(settings, 'site.settings[0]');
  const email = string(settings['email'], 'site.settings[0].email');
  if (email !== email.trim() || email.length > 320 || /[\r\n,;?]/.test(email) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail('site.settings[0].email', 'CMS_CONTACT');
  const whatsappDigits = string(settings['whatsappDigits'], 'site.settings[0].whatsappDigits');
  if (!/^[1-9][0-9]{6,14}$/.test(whatsappDigits)) fail('site.settings[0].whatsappDigits', 'CMS_CONTACT');
  const channel = record(settings['channelStatus'], 'site.settings[0].channelStatus', ['_type', 'emailEnabled', 'whatsappEnabled']);
  if (typeof channel['emailEnabled'] !== 'boolean' || typeof channel['whatsappEnabled'] !== 'boolean') fail('site.settings[0].channelStatus', 'CMS_CONTACT');
  const defaultMoq = moq(settings['defaultMoq'], 'site.settings[0].defaultMoq', context);
  const settingsFact = date(settings['factConfirmedAt'], 'site.settings[0].factConfirmedAt', context.now);

  const pagesInput = array(bundle['pages'], 'site.pages', pageKeys.length, pageKeys.length);
  const seenPages = new Set<CmsPageKey>(), seoTitles = new Set<string>();
  const pages = pagesInput.map((value, index): CmsPageData => {
    const field = `site.pages[${index}]`, doc = record(value, field, [
      '_type', '_id', '_rev', '_originalId', 'pageKey', 'pageKeyCount', 'title', 'intro', 'heroImage',
      'faqItems', 'seo', 'contentUpdatedAt', 'factConfirmedAt', 'templateContent',
    ]);
    if (doc['_type'] !== 'page') fail(field, 'CMS_DOCUMENT_TYPE');
    const key = pageKey(doc['pageKey'], `${field}.pageKey`);
    if (doc['pageKeyCount'] !== 1 || seenPages.has(key)) fail(field, 'CMS_DUPLICATE_ROUTE');
    seenPages.add(key);
    const contentUpdatedAt = date(doc['contentUpdatedAt'], `${field}.contentUpdatedAt`, context.now, true);
    const factConfirmedAt = doc['factConfirmedAt'] == null ? null : date(doc['factConfirmedAt'], `${field}.factConfirmedAt`, context.now);
    if (businessPageKeys.has(key) && !factConfirmedAt) fail(`${field}.factConfirmedAt`, 'CMS_REVIEW');
    if (factConfirmedAt && factConfirmedAt < contentUpdatedAt.slice(0, 10)) fail(field, 'CMS_DATE');
    const pageSeo = seo(doc['seo'], `${field}.seo`);
    if (seoTitles.has(pageSeo.seoTitle)) fail(`${field}.seo.seoTitle`, 'CMS_DUPLICATE_SEO');
    seoTitles.add(pageSeo.seoTitle);
    const faqItems = faq(doc['faqItems'], `${field}.faqItems`, key === 'home' || key === 'manufacturing' ? 3 : 0);
    const heroImage = doc['heroImage'] == null ? null : convertCmsApprovedImage(doc['heroImage'], `${field}.heroImage`, context);
    if (key === 'home' && !heroImage) fail(`${field}.heroImage`, 'CMS_INCOMPLETE_PAGE');
    if (key !== 'home' && doc['templateContent'] != null) fail(`${field}.templateContent`, 'CMS_TEMPLATE_SCOPE');
    const templateContent = key === 'home' ? convertCmsHomeContent(doc['templateContent'], `${field}.templateContent`, context) : null;
    return {
      kind: 'cms_page', source: 'sanity', documentId: publishedIdentity(doc, field), revision: id(doc['_rev'], `${field}._rev`),
      cmsPerspective: 'published', websitePublication: 'not_verified', productionAllowed: false,
      pageKey: key, path: cmsPagePaths[key], title: string(doc['title'], `${field}.title`), intro: string(doc['intro'], `${field}.intro`),
      seo: pageSeo, faqItems, heroImage, contentUpdatedAt, factConfirmedAt, templateContent,
    };
  });
  for (const key of pageKeys) if (!seenPages.has(key)) fail('site.pages', 'CMS_INCOMPLETE_COLLECTION');

  const sampleCodes = new Set<string>(), seenCategories = new Set<CmsCategorySlug>();
  const categoriesInput = array(bundle['categories'], 'site.categories', 2, 2);
  const categories = categoriesInput.map((value, index): CmsCategoryData => {
    const field = `site.categories[${index}]`, doc = record(value, field, [
      '_type', '_id', '_rev', '_originalId', 'name', 'slug', 'slugCount', 'categoryCode', 'referenceCode', 'title', 'intro',
      'heroImage', 'samples', 'capabilityRows', 'moqMode', 'moqOverride', 'customizationNotes', 'samplingNotes', 'evidenceImages',
      'faqItems', 'relatedArticles', 'seo', 'contentUpdatedAt', 'factConfirmedAt',
    ]);
    if (doc['_type'] !== 'category') fail(field, 'CMS_DOCUMENT_TYPE');
    const slug = categorySlug(record(doc['slug'], `${field}.slug`, ['_type', 'current'])['current'], `${field}.slug.current`);
    if (doc['slugCount'] !== 1 || seenCategories.has(slug)) fail(field, 'CMS_DUPLICATE_ROUTE');
    seenCategories.add(slug);
    if (doc['categoryCode'] !== slug) fail(`${field}.categoryCode`, 'CMS_SOURCE_CODE');
    if (doc['referenceCode'] !== cmsCategoryScopes[slug].referenceCode) fail(`${field}.referenceCode`, 'CMS_SOURCE_CODE');
    const contentUpdatedAt = date(doc['contentUpdatedAt'], `${field}.contentUpdatedAt`, context.now, true);
    const factConfirmedAt = date(doc['factConfirmedAt'], `${field}.factConfirmedAt`, context.now);
    if (factConfirmedAt < contentUpdatedAt.slice(0, 10)) fail(field, 'CMS_DATE');
    const categorySeo = seo(doc['seo'], `${field}.seo`);
    if (seoTitles.has(categorySeo.seoTitle)) fail(`${field}.seo.seoTitle`, 'CMS_DUPLICATE_SEO');
    seoTitles.add(categorySeo.seoTitle);
    const samples = array(doc['samples'], `${field}.samples`, 3, 24).map((entry, sampleIndex): CmsSampleData => {
      const sampleField = `${field}.samples[${sampleIndex}]`, sample = record(entry, sampleField, ['_type', '_key', 'sampleCode', 'name', 'summary', 'images', 'fabric', 'weightGsm', 'fit', 'techniqueNotes']);
      const sampleCode = string(sample['sampleCode'], `${sampleField}.sampleCode`);
      if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(sampleCode) || sampleCodes.has(sampleCode)) fail(`${sampleField}.sampleCode`, 'CMS_DUPLICATE_SAMPLE');
      sampleCodes.add(sampleCode);
      const weight = sample['weightGsm'];
      if (weight != null && (typeof weight !== 'number' || !Number.isFinite(weight) || weight <= 0 || weight > 5000)) fail(`${sampleField}.weightGsm`);
      return {
        sampleCode, name: string(sample['name'], `${sampleField}.name`), summary: string(sample['summary'], `${sampleField}.summary`),
        images: array(sample['images'], `${sampleField}.images`, 1, 12).map((image, imageIndex) => convertCmsApprovedImage(image, `${sampleField}.images[${imageIndex}]`, context)),
        fabric: nullableString(sample['fabric'], `${sampleField}.fabric`), weightGsm: weight == null ? null : weight,
        fit: nullableString(sample['fit'], `${sampleField}.fit`), techniqueNotes: nullableString(sample['techniqueNotes'], `${sampleField}.techniqueNotes`),
      };
    });
    const capabilityRows = array(doc['capabilityRows'], `${field}.capabilityRows`, 1, 24).map((entry, rowIndex): CmsCapabilityRow => {
      const rowField = `${field}.capabilityRows[${rowIndex}]`, row = record(entry, rowField, ['_type', '_key', 'name', 'description', 'limitNote']);
      return { name: string(row['name'], `${rowField}.name`), description: string(row['description'], `${rowField}.description`), limitNote: nullableString(row['limitNote'], `${rowField}.limitNote`) };
    });
    const evidenceImages = array(doc['evidenceImages'], `${field}.evidenceImages`, 1, 24).map((image, imageIndex) =>
      convertCmsApprovedImage(image, `${field}.evidenceImages[${imageIndex}]`, context));
    const mode = doc['moqMode'];
    if (mode !== 'inherit' && mode !== 'override') fail(`${field}.moqMode`, 'CMS_MOQ');
    if (mode === 'inherit' && doc['moqOverride'] != null) fail(`${field}.moqOverride`, 'CMS_MOQ');
    if (mode === 'override' && doc['moqOverride'] == null) fail(`${field}.moqOverride`, 'CMS_MOQ');
    const effectiveMoq = mode === 'override' ? moq(doc['moqOverride'], `${field}.moqOverride`, context) : defaultMoq;
    if (effectiveMoq.confirmedAt > factConfirmedAt) fail(`${field}.moqOverride`, 'CMS_DATE');
    const relatedArticles = array(doc['relatedArticles'] ?? [], `${field}.relatedArticles`, 0, 2).map((entry, i) =>
      resolveCmsReference(entry, `${field}.relatedArticles[${i}]`, context, 'article'));
    if (new Set(relatedArticles).size !== relatedArticles.length) fail(`${field}.relatedArticles`, 'CMS_REFERENCE');
    return {
      kind: 'cms_category', source: 'sanity', documentId: publishedIdentity(doc, field), revision: id(doc['_rev'], `${field}._rev`),
      cmsPerspective: 'published', websitePublication: 'not_verified', productionAllowed: false,
      slug, path: cmsCategoryScopes[slug].path, name: string(doc['name'], `${field}.name`), categoryCode: slug,
      referenceCode: cmsCategoryScopes[slug].referenceCode, title: string(doc['title'], `${field}.title`), intro: string(doc['intro'], `${field}.intro`),
      heroImage: convertCmsApprovedImage(doc['heroImage'], `${field}.heroImage`, context), samples, capabilityRows, evidenceImages, moqMode: mode, effectiveMoq,
      customizationNotes: string(doc['customizationNotes'], `${field}.customizationNotes`),
      samplingNotes: string(doc['samplingNotes'], `${field}.samplingNotes`), faqItems: faq(doc['faqItems'], `${field}.faqItems`, 3),
      relatedArticles, seo: categorySeo, contentUpdatedAt, factConfirmedAt,
    };
  });
  for (const slug of Object.keys(cmsCategoryScopes) as CmsCategorySlug[]) if (!seenCategories.has(slug)) fail('site.categories', 'CMS_INCOMPLETE_COLLECTION');

  const featured = array(settings['featuredCategories'], 'site.settings[0].featuredCategories', 2, 2).map((entry, i) =>
    resolveCmsReference(entry, `site.settings[0].featuredCategories[${i}]`, context, 'category'));
  const requiredFeatured = new Set(Object.values(cmsCategoryScopes).map(scope => scope.path));
  if (new Set(featured).size !== 2 || featured.some(path => !requiredFeatured.has(path as never))) fail('site.settings[0].featuredCategories', 'CMS_REFERENCE');
  if (defaultMoq.confirmedAt > settingsFact) fail('site.settings[0].defaultMoq', 'CMS_DATE');

  const siteSettings: CmsSiteSettingsData = {
    kind: 'cms_site_settings', source: 'sanity', documentId: settingsId, revision: id(settings['_rev'], 'site.settings[0]._rev'),
    cmsPerspective: 'published', websitePublication: 'not_verified', productionAllowed: false,
    brandName: string(settings['brandName'], 'site.settings[0].brandName'), factoryName: string(settings['factoryName'], 'site.settings[0].factoryName'),
    email, whatsappDigits, contactPersonOrTeam: string(settings['contactPersonOrTeam'], 'site.settings[0].contactPersonOrTeam'),
    businessHours: string(settings['businessHours'], 'site.settings[0].businessHours'), timezone: string(settings['timezone'], 'site.settings[0].timezone'),
    publicAddress: string(settings['publicAddress'], 'site.settings[0].publicAddress'),
    channelStatus: { emailEnabled: channel['emailEnabled'] as boolean, whatsappEnabled: channel['whatsappEnabled'] as boolean },
    defaultMoq, logo: convertCmsApprovedImage(settings['logo'], 'site.settings[0].logo', context),
    defaultOgImage: convertCmsApprovedImage(settings['defaultOgImage'], 'site.settings[0].defaultOgImage', context),
    featuredCategories: featured, factConfirmedAt: settingsFact,
  };
  return { kind: 'cms_site_bundle', source: 'sanity', cmsPerspective: 'published', websitePublication: 'not_verified', productionAllowed: false, siteSettings, pages, categories };
}
