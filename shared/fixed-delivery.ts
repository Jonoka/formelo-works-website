import type { ContentSnapshot, Faq, MoqPolicy, Seo } from './content';
import type { CmsPageData, CmsSiteBundle } from './cms-site';
import type { CmsApprovedImage } from './cms-image';
import type { CmsFixedContentMap, FixedPageKey } from './cms-fixed';
import { localFixedPageCopy } from './fixed-page-copy';
import { pageContexts, type ReferenceCode } from '../config/page-context';
import { CmsContentError } from './cms-validation';

interface FixedDeliveryMeta<K extends FixedPageKey> {
  kind: 'fixed_page_delivery'; pageKey: K; source: 'local' | 'sanity'; status: 'concept_only' | 'cms_published';
  revision: string | null; factsStatus: 'unconfirmed' | 'recorded_not_verified'; factConfirmedAt: string | null;
  websitePublication: 'not_published' | 'not_verified'; productionAllowed: false;
  referenceCode: K extends 'privacy' ? null : ReferenceCode;
  title: string; intro: string; seo: Seo; factNote: string;
}
export type FixedPageDeliveries = { [K in FixedPageKey]: FixedDeliveryMeta<K> & CmsFixedContentMap[K] } & {
  manufacturing: { faqItems: Faq[]; defaultMoq: MoqPolicy | null };
  factory: { heroImage: CmsApprovedImage | null };
};
export type InformationPageDelivery = FixedPageDeliveries['manufacturing' | 'factory' | 'contact'];
const references = { manufacturing: pageContexts.manufacturing.referenceCode, factory: pageContexts.factory.referenceCode, contact: pageContexts.contact.referenceCode, blogIndex: pageContexts.blog.referenceCode, privacy: null } as const;
function localMeta<K extends FixedPageKey>(key: K, value: { title: string; intro?: string; seo: Seo; factNote?: string }): FixedDeliveryMeta<K> {
  return { kind: 'fixed_page_delivery', pageKey: key, source: 'local', status: 'concept_only', revision: null,
    factsStatus: 'unconfirmed', factConfirmedAt: null, websitePublication: 'not_published', productionAllowed: false,
    referenceCode: references[key] as FixedDeliveryMeta<K>['referenceCode'], title: value.title, intro: value.intro ?? '', seo: value.seo, factNote: value.factNote ?? '' };
}
export function deliverLocalFixedPages(content: ContentSnapshot): FixedPageDeliveries {
  const m = content.manufacturingPreview, f = content.factoryPreview, c = content.contactPreview, p = content.privacyPreview;
  return {
    manufacturing: { ...localMeta('manufacturing', m), ...localFixedPageCopy.manufacturing, contextNote: m.factNote,
      options: m.options, moqFactors: m.moqFactors, preparation: m.preparation, sampling: m.sampling, productionSteps: m.productionSteps, faqItems: m.faqItems, defaultMoq: null },
    factory: { ...localMeta('factory', f), ...localFixedPageCopy.factory, contextNote: f.factNote,
      overview: f.overview, arrangements: f.arrangements, qualityDiscussion: f.qualityDiscussion, gallery: [], credentials: [], heroImage: null },
    contact: { ...localMeta('contact', c), ...localFixedPageCopy.contact, contextNote: c.factNote, preparation: c.preparation, preparationNote: c.preparationNote },
    blogIndex: { ...localMeta('blogIndex', localFixedPageCopy.blogIndex), eyebrow: localFixedPageCopy.blogIndex.eyebrow, columnNote: localFixedPageCopy.blogIndex.columnNote },
    privacy: { ...localMeta('privacy', p), ...localFixedPageCopy.privacy, body: p.body, policyStatus: p.status,
      legalReviewStatus: 'pending', legalReviewedAt: null, legalEntity: p.legalEntity, privacyContact: p.privacyContact, providers: p.providers, retention: p.retention, effectiveAt: p.effectiveAt },
  };
}
function pageFor<K extends FixedPageKey>(bundle: CmsSiteBundle, key: K) {
  const page = bundle.pages.find((page): page is Extract<CmsPageData, { pageKey: K }> => page.pageKey === key);
  if (!page) throw new CmsContentError('CMS_INCOMPLETE_PAGE', key);
  return page;
}
function cmsMeta<K extends FixedPageKey>(key: K, page: CmsPageData): FixedDeliveryMeta<K> {
  return { kind: 'fixed_page_delivery', pageKey: key, source: 'sanity', status: 'cms_published', revision: page.revision,
    factsStatus: page.factConfirmedAt ? 'recorded_not_verified' : 'unconfirmed', factConfirmedAt: page.factConfirmedAt,
    websitePublication: page.websitePublication, productionAllowed: false, referenceCode: references[key] as FixedDeliveryMeta<K>['referenceCode'],
    title: page.title, intro: page.intro, seo: page.seo, factNote: 'contextNote' in page.templateContent ? page.templateContent.contextNote : '' };
}
export function deliverPublishedFixedPages(bundle: CmsSiteBundle): FixedPageDeliveries {
  const m = pageFor(bundle, 'manufacturing'), f = pageFor(bundle, 'factory'), c = pageFor(bundle, 'contact'), j = pageFor(bundle, 'blogIndex'), p = pageFor(bundle, 'privacy');
  return {
    manufacturing: { ...cmsMeta('manufacturing', m), ...m.templateContent, faqItems: m.faqItems, defaultMoq: bundle.siteSettings.defaultMoq },
    factory: { ...cmsMeta('factory', f), ...f.templateContent, heroImage: f.heroImage },
    contact: { ...cmsMeta('contact', c), ...c.templateContent },
    blogIndex: { ...cmsMeta('blogIndex', j), ...j.templateContent },
    privacy: { ...cmsMeta('privacy', p), ...p.templateContent },
  };
}
