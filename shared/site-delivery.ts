import type { ArticleCollection, ArticleDelivery } from './article-delivery';
import { articleCardData } from './article-delivery';
import type { CmsSiteBundle, CmsCategoryData } from './cms-site';
import type { CmsApprovedImage } from './cms-image';
import type { CategoryPreview, ContentSnapshot, Faq, HomeCapability, LocalPreviewImage, MoqPolicy, Seo, SiteSettings } from './content';
import { homeSectionKeys, type HomeSectionCopy } from './cms-home';
import { CmsContentError } from './cms-validation';
import { deliverLocalFixedPages, type FixedPageDeliveries } from './fixed-delivery';

export type HomeCategoryMode = 'mock' | 'published';
export type PageImage = LocalPreviewImage | CmsApprovedImage;
export type CategoryDelivery = CategoryPreview | CmsCategoryData;
export interface CategoryCard {
  slug: 't-shirts' | 'hoodies'; path: string; name: string; summary: string; image: PageImage;
  source: 'local' | 'sanity'; revision: string | null;
}
export interface HomeDelivery {
  source: 'local' | 'sanity'; status: 'concept_only' | 'cms_published'; revision: string | null;
  websitePublication: 'not_published' | 'not_verified'; productionAllowed: false;
  title: string; titleLines: string[]; intro: string; seo: Seo; eyebrow: string; factNote: string;
  heroImage: PageImage; sections: Record<(typeof homeSectionKeys)[number], HomeSectionCopy & { lines: string[] }>;
  capabilities: HomeCapability[]; processSteps: { title: string; description: string }[]; faqItems: Faq[];
  manufacturingSummary: { customization: string; sampling: string } | null;
  defaultMoq: MoqPolicy | null; factorySummary: string | null; factoryImage: CmsApprovedImage | null;
}
/** This site-stage policy is independent of CMS channel configuration or technical publish state. */
export const contactReleasePolicy = Object.freeze({ phase: 'DEV-05F', activationAllowed: false, copyingAllowed: false } as const);
export function contactPresentation(settings: Pick<SiteSettings, 'email' | 'whatsappDigits' | 'channelStatus'>) {
  return {
    state: 'disabled_by_website_stage' as const,
    enabled: false as const, copyingAllowed: false as const,
    note: settings.email || settings.whatsappDigits
      ? 'Contact channels inactive — website activation is not approved.'
      : 'Contact details pending — channels inactive.',
  };
}
export interface SiteDelivery {
  mode: HomeCategoryMode; fixedMode: HomeCategoryMode; fixedPages: FixedPageDeliveries;
  home: HomeDelivery; categories: CategoryDelivery[]; cards: CategoryCard[];
  shell: { brandName: string; source: 'local' | 'sanity'; offlineTest: boolean; contact: ReturnType<typeof contactPresentation> };
  /** Server-only original validated bundle, never serialized wholesale to a browser. */
  cms: CmsSiteBundle | null;
}
export function readHomeCategoryMode(env: Record<string, string | undefined>): HomeCategoryMode {
  const mode = env['HOME_CATEGORY_CONTENT_MODE'] ?? 'mock';
  if (mode !== 'mock' && mode !== 'published') throw new CmsContentError('SITE_SOURCE_CONFIG', 'HOME_CATEGORY_CONTENT_MODE');
  return mode;
}
export function readSiteModes(env: Record<string, string | undefined>): { homeCategory: HomeCategoryMode; fixed: HomeCategoryMode } {
  const homeCategory = readHomeCategoryMode(env), fixed = env['FIXED_PAGE_CONTENT_MODE'] ?? 'mock';
  if (fixed !== 'mock' && fixed !== 'published') throw new CmsContentError('SITE_SOURCE_CONFIG', 'FIXED_PAGE_CONTENT_MODE');
  // A CMS fixed-page body must not link into a parallel local category/settings snapshot.
  if (fixed === 'published' && homeCategory !== 'published') throw new CmsContentError('SITE_SOURCE_CONFLICT', 'FIXED_PAGE_CONTENT_MODE');
  return { homeCategory, fixed };
}
export function categoryCardData(category: CategoryDelivery): CategoryCard {
  return category.kind === 'category_preview'
    ? { slug: category.slug, path: `/clothing/${category.slug}/`, name: category.name, summary: category.cardSummary, image: category.image, source: 'local', revision: null }
    : { slug: category.slug, path: category.path, name: category.name, summary: category.intro, image: category.heroImage, source: 'sanity', revision: category.revision };
}
export function deliverLocalSite(content: ContentSnapshot): SiteDelivery {
  const { home, homepagePreview: preview } = content;
  return {
    mode: 'mock', fixedMode: 'mock', fixedPages: deliverLocalFixedPages(content), cms: null, categories: content.categoryPreviews, cards: content.categoryPreviews.map(categoryCardData),
    shell: { brandName: content.siteSettings.brandName, source: 'local', offlineTest: false, contact: contactPresentation(content.siteSettings) },
    home: {
      source: 'local', status: 'concept_only', revision: null, websitePublication: 'not_published', productionAllowed: false,
      title: home.title, titleLines: preview.heroTitleLines.join(' ') === home.title ? preview.heroTitleLines : [home.title],
      intro: home.intro, seo: home.seo, eyebrow: preview.eyebrow, factNote: preview.heroFactNote, heroImage: preview.heroImage,
      sections: preview.sectionCopy, capabilities: preview.capabilities, processSteps: preview.processSteps, faqItems: home.faqItems,
      manufacturingSummary: null, defaultMoq: null, factorySummary: null, factoryImage: null,
    },
  };
}
export function deliverPublishedSite(bundle: CmsSiteBundle, fixedPages: FixedPageDeliveries, fixedMode: HomeCategoryMode, offlineTest = false): SiteDelivery {
  const home = bundle.pages.find(page => page.pageKey === 'home');
  if (!home?.heroImage || !home.templateContent) throw new CmsContentError('CMS_INCOMPLETE_PAGE', 'home.templateContent');
  const content = home.templateContent;
  const cards = bundle.siteSettings.featuredCategories.map(path => {
    const category = bundle.categories.find(item => item.path === path);
    if (!category) throw new CmsContentError('CMS_REFERENCE', 'siteSettings.featuredCategories');
    return categoryCardData(category);
  });
  const icons = ['design', 'sample', 'production', 'quality'] as const;
  const sections = {} as HomeDelivery['sections'];
  for (const key of homeSectionKeys) sections[key] = { ...content.sections[key], lines: [content.sections[key].title] };
  return {
    mode: 'published', fixedMode, fixedPages, cms: bundle, categories: bundle.categories, cards,
    shell: { brandName: bundle.siteSettings.brandName, source: 'sanity', offlineTest, contact: contactPresentation(bundle.siteSettings) },
    home: {
      source: 'sanity', status: 'cms_published', revision: home.revision, websitePublication: home.websitePublication, productionAllowed: false,
      title: home.title, titleLines: content.titleLineHints.join(' ') === home.title ? content.titleLineHints : [home.title],
      intro: home.intro, seo: home.seo, eyebrow: content.eyebrow,
      factNote: `Published CMS record. Fact-confirmation date recorded: ${home.factConfirmedAt}. Website release is not verified.`,
      heroImage: home.heroImage, sections,
      capabilities: content.capabilities.map((item, index) => ({ ...item, icon: icons[index]! })),
      processSteps: content.processSteps, faqItems: home.faqItems, manufacturingSummary: content.manufacturingSummary,
      defaultMoq: bundle.siteSettings.defaultMoq, factorySummary: content.factorySummary, factoryImage: content.factoryImage,
    },
  };
}
/** Resolve to the existing delivery records, never manufacture cards or substitute local drafts. */
export function relatedCategoryArticles(category: CmsCategoryData, collection: ArticleCollection): ArticleDelivery[] {
  return category.relatedArticles.map(path => {
    const article = collection.articles.find(item => articleCardData(item).href === path);
    if (!article) throw new CmsContentError('SITE_RELATED_ARTICLE_MISSING', 'category.relatedArticles');
    if (article.kind !== 'cms_article' || collection.mode !== 'published') throw new CmsContentError('SITE_RELATED_ARTICLE_SOURCE', 'category.relatedArticles');
    return article;
  });
}
