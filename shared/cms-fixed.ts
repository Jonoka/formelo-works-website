import type { InformationRow } from './content';
import type { EditorialBlock } from './editorial';
import type { HomeSectionCopy } from './cms-home';
import { sitePlainText } from './cms-home';
import { convertCmsApprovedImage, type CmsApprovedImage } from './cms-image';
import { convertCmsBody } from './cms-body';
import { resolveCmsReference, type CmsReadContext } from './cms-article';
import { validateEditorialLink } from './editorial-policy';
import { array, date, fail, record, type RecordValue } from './cms-validation';

export const fixedPageKeys = ['manufacturing', 'factory', 'contact', 'blogIndex', 'privacy'] as const;
export type FixedPageKey = (typeof fixedPageKeys)[number];
export const manufacturingAnchors = ['options', 'moq', 'prepare', 'sampling', 'production', 'faq'] as const;
export const fixedSectionKeys = {
  manufacturing: [...manufacturingAnchors, 'related'],
  factory: ['overview', 'arrangements', 'quality', 'related'],
  contact: ['prepare', 'related'],
} as const;
export interface FixedContentLink { label: string; href: string }
interface InformationCopy { eyebrow: string; contextNote: string }
export interface ManufacturingContent extends InformationCopy {
  sections: Record<(typeof fixedSectionKeys.manufacturing)[number], HomeSectionCopy>;
  guideTitle: string; preparationLead: string; preparationNote: string;
  options: InformationRow[]; moqFactors: InformationRow[]; preparation: InformationRow[];
  sampling: InformationRow[]; productionSteps: InformationRow[]; relatedLinks: FixedContentLink[];
}
export interface FactoryContent extends InformationCopy {
  sections: Record<(typeof fixedSectionKeys.factory)[number], HomeSectionCopy>;
  overview: string; overviewNote: string; arrangements: InformationRow[]; qualityDiscussion: InformationRow[];
  gallery: CmsApprovedImage[]; credentials: InformationRow[]; relatedLinks: FixedContentLink[];
}
export interface ContactContent extends InformationCopy {
  sections: Record<(typeof fixedSectionKeys.contact)[number], HomeSectionCopy>;
  preparation: InformationRow[]; preparationNote: string; relatedLinks: FixedContentLink[];
}
export interface JournalContent { eyebrow: string; columnNote: string }
export interface PrivacyContent {
  eyebrow: string; body: EditorialBlock[];
  legalReviewStatus: 'pending' | 'reviewed'; legalReviewedAt: string | null;
  policyStatus: 'draft_not_in_effect'; effectiveAt: null; legalEntity: null;
  privacyContact: null; providers: null; retention: null;
}
export interface CmsFixedContentMap {
  manufacturing: ManufacturingContent; factory: FactoryContent; contact: ContactContent;
  blogIndex: JournalContent; privacy: PrivacyContent;
}
/** A bounded union selected by pageKey, not a module array or page builder. */
export const fixedContentFields = {
  manufacturing: ['eyebrow', 'contextNote', 'sections', 'guideTitle', 'preparationLead', 'preparationNote', 'options', 'moqFactors', 'preparation', 'sampling', 'productionSteps', 'relatedLinks'],
  factory: ['eyebrow', 'contextNote', 'sections', 'overview', 'overviewNote', 'arrangements', 'qualityDiscussion', 'gallery', 'credentials', 'relatedLinks'],
  contact: ['eyebrow', 'contextNote', 'sections', 'preparation', 'preparationNote', 'relatedLinks'],
  blogIndex: ['eyebrow', 'columnNote'],
  privacy: ['eyebrow', 'body', 'legalReviewStatus', 'legalReviewedAt', 'policyStatus', 'effectiveAt', 'legalEntity', 'privacyContact', 'providers', 'retention'],
} as const;
const linkTargets = {
  manufacturing: ['/our-factory/', '/contact/'],
  factory: ['/manufacturing/#prepare', '/contact/'],
  contact: ['/manufacturing/#prepare'],
} as const;
export function convertInformationRows(value: unknown, field: string, min = 1, max = 12): InformationRow[] {
  return array(value, field, min, max).map((entry, index) => {
    const path = `${field}[${index}]`, item = record(entry, path, ['_type', '_key', 'title', 'description']);
    return { title: sitePlainText(item['title'], `${path}.title`), description: sitePlainText(item['description'], `${path}.description`) };
  });
}
function sections<K extends keyof typeof fixedSectionKeys>(input: RecordValue, key: K, field: string) {
  const keys = fixedSectionKeys[key], value = record(input['sections'], `${field}.sections`, ['_type', ...keys]);
  const result = {} as Record<(typeof fixedSectionKeys)[K][number], HomeSectionCopy>;
  for (const name of keys) {
    const path = `${field}.sections.${name}`, item = record(value[name], path, ['_type', 'eyebrow', 'title', 'description']);
    result[name as (typeof fixedSectionKeys)[K][number]] = {
      eyebrow: sitePlainText(item['eyebrow'], `${path}.eyebrow`), title: sitePlainText(item['title'], `${path}.title`), description: sitePlainText(item['description'], `${path}.description`),
    };
  }
  return result;
}
function links(input: RecordValue, key: keyof typeof linkTargets, field: string, context: CmsReadContext): FixedContentLink[] {
  const allowed: readonly string[] = linkTargets[key];
  const result = array(input['relatedLinks'], `${field}.relatedLinks`, allowed.length, allowed.length).map((entry, index) => {
    const path = `${field}.relatedLinks[${index}]`, item = record(entry, path, ['_type', '_key', 'label', 'target', 'fragment']);
    const target = resolveCmsReference(item['target'], `${path}.target`, context, 'page');
    const fragment = item['fragment'] == null ? '' : `#${sitePlainText(item['fragment'], `${path}.fragment`)}`;
    const href = target + fragment;
    try { if (validateEditorialLink(href) !== 'internal' || !allowed.includes(href)) fail(path, 'CMS_LINK'); }
    catch { fail(path, 'CMS_LINK'); }
    return { label: sitePlainText(item['label'], `${path}.label`), href };
  });
  if (new Set(result.map(item => item.href)).size !== allowed.length) fail(`${field}.relatedLinks`, 'CMS_REFERENCE');
  return result;
}
export type ConvertedFixedTemplate = { [K in FixedPageKey]: { pageKey: K; templateContent: CmsFixedContentMap[K] } }[FixedPageKey];
export function convertCmsFixedTemplate(key: FixedPageKey, value: unknown, field: string, context: CmsReadContext, updatedAt: string): ConvertedFixedTemplate {
  const input = record(value, field);
  if (input['_type'] !== 'pageTemplateContent' || input['pageKey'] !== key) fail(field, 'CMS_TEMPLATE_SCOPE');
  record(input, field, ['_type', 'pageKey', ...fixedContentFields[key]]);
  const text = (name: string) => sitePlainText(input[name], `${field}.${name}`);
  const rows = (name: string, min = 1, max = 12) => convertInformationRows(input[name], `${field}.${name}`, min, max);
  const eyebrow = text('eyebrow');
  if (key === 'manufacturing') return { pageKey: key, templateContent: {
    eyebrow, contextNote: text('contextNote'), sections: sections(input, key, field), guideTitle: text('guideTitle'),
    preparationLead: text('preparationLead'), preparationNote: text('preparationNote'),
    options: rows('options', 2, 6), moqFactors: rows('moqFactors', 2), preparation: rows('preparation', 3),
    sampling: rows('sampling', 2, 6), productionSteps: rows('productionSteps', 3, 6), relatedLinks: links(input, key, field, context),
  } };
  if (key === 'factory') return { pageKey: key, templateContent: {
    eyebrow, contextNote: text('contextNote'), sections: sections(input, key, field), overview: text('overview'), overviewNote: text('overviewNote'),
    arrangements: rows('arrangements', 2), qualityDiscussion: rows('qualityDiscussion', 2, 6),
    gallery: array(input['gallery'] ?? [], `${field}.gallery`, 0, 4).map((image, index) => convertCmsApprovedImage(image, `${field}.gallery[${index}]`, context)),
    credentials: input['credentials'] == null ? [] : rows('credentials', 0, 6), relatedLinks: links(input, key, field, context),
  } };
  if (key === 'contact') return { pageKey: key, templateContent: {
    eyebrow, contextNote: text('contextNote'), sections: sections(input, key, field), preparation: rows('preparation', 3),
    preparationNote: text('preparationNote'), relatedLinks: links(input, key, field, context),
  } };
  if (key === 'blogIndex') return { pageKey: key, templateContent: { eyebrow, columnNote: text('columnNote') } };
  // CMS publication, recorded legal review and effective policy are deliberately separate.
  if (input['policyStatus'] !== 'draft_not_in_effect') fail(`${field}.policyStatus`, 'CMS_POLICY_NOT_EFFECTIVE');
  const legalReviewStatus = input['legalReviewStatus'];
  if (legalReviewStatus !== 'pending' && legalReviewStatus !== 'reviewed') fail(`${field}.legalReviewStatus`, 'CMS_LEGAL_REVIEW');
  const legalReviewedAt = legalReviewStatus === 'reviewed' ? date(input['legalReviewedAt'], `${field}.legalReviewedAt`, context.now) : null;
  if (legalReviewStatus === 'pending' && input['legalReviewedAt'] != null || legalReviewedAt && legalReviewedAt < updatedAt.slice(0, 10)) fail(`${field}.legalReviewedAt`, 'CMS_LEGAL_REVIEW');
  for (const name of ['effectiveAt', 'legalEntity', 'privacyContact', 'providers', 'retention']) if (input[name] != null) fail(`${field}.${name}`, 'CMS_POLICY_NOT_EFFECTIVE');
  const body = convertCmsBody(input['body'], (ref, path) => resolveCmsReference(ref, `${field}.${path}`, context));
  if (!body.some(block => block.type === 'paragraph') || body.filter(block => block.type === 'heading' && block.level === 2).length < 3 || body.some(block => block.type === 'template')) fail(`${field}.body`, 'CMS_INCOMPLETE_POLICY');
  // Plain escaped content is not an escape hatch for HTML/script-looking policy text.
  for (const block of body) {
    const texts = block.type === 'heading' ? [block.text] : block.type === 'table' ? [block.caption, ...block.columns, ...block.rows.flat()] : block.type === 'list' ? block.items.flat().map(item => item.text) : block.type === 'template' ? [block.title, block.text] : [...('title' in block ? [block.title] : []), ...block.content.map(item => item.text)];
    for (const textValue of texts) if (textValue.trim()) sitePlainText(textValue, `${field}.body`);
  }
  return { pageKey: key, templateContent: { eyebrow, body, legalReviewStatus, legalReviewedAt, policyStatus: 'draft_not_in_effect', effectiveAt: null, legalEntity: null, privacyContact: null, providers: null, retention: null } };
}
