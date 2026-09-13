export const pageKeys = ['home', 'manufacturing', 'factory', 'contact', 'blogIndex', 'privacy'] as const;
export type PageKey = (typeof pageKeys)[number];

export interface Seo {
  seoTitle: string;
  seoDescription: string;
}
export interface Faq { question: string; answer: string }
export interface ApprovedImage {
  asset: { _type: 'reference'; _ref: string };
  alt: string;
  publicUseApproved: boolean;
  decorative: boolean;
  caption?: string;
}
export interface MoqPolicy {
  mode: 'confirmedQuantity' | 'projectBased';
  quantity?: number;
  unit: string;
  basis: string;
  sizeMixing: string;
  conditions: string;
  confirmedAt: string;
}
export interface Sample {
  sampleCode: string;
  name: string;
  summary: string;
  images: ApprovedImage[];
}
export interface SiteSettings {
  _type: 'siteSettings';
  brandName: string;
  factoryName: string | null;
  email: string | null;
  whatsappDigits: string | null;
  channelStatus: { emailEnabled: boolean; whatsappEnabled: boolean };
  defaultMoq: MoqPolicy | null;
  factConfirmedAt: string | null;
}
export interface Page {
  _type: 'page';
  pageKey: PageKey;
  title: string;
  intro: string;
  seo: Seo;
  faqItems: Faq[];
  heroImage?: ApprovedImage;
}
/** These are starter contracts, not a declaration of production content completeness. */
export interface Category {
  _type: 'category';
  name: string;
  slug: { current: string };
  categoryCode: string;
  referenceCode: string;
  title: string;
  intro: string;
  samples: Sample[];
  moqMode: 'inherit' | 'override';
  moqOverride?: MoqPolicy;
  seo: Seo;
}
export interface Article {
  _type: 'article';
  title: string;
  slug: { current: string };
  excerpt: string;
  referenceCode: string;
  seo: Seo;
}
/** Local preview media never impersonates the Sanity reference contract above. */
export interface LocalPreviewImage {
  source: 'local';
  kind: 'concept' | 'placeholder';
  assetId: string;
  requiredAssetId: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  renditions: { src: string; width: number; height: number; format: 'image/avif' | 'image/webp' }[];
  productionAllowed: false;
}
export interface HomeCapability {
  title: string;
  description: string;
  icon: 'design' | 'sample' | 'production' | 'quality';
}
export interface HomeDemoCategory {
  anchor: 't-shirts' | 'hoodies';
  name: string;
  description: string;
  status: 'demonstration_only';
  image: LocalPreviewImage;
}
// Local presentation data is not a persisted Sanity Page document.
export interface HomePreview {
  eyebrow: string;
  heroImage: LocalPreviewImage;
  capabilities: HomeCapability[];
  demonstrationCategories: HomeDemoCategory[];
  processSteps: { title: string; description: string }[];
  journalTopics: string[];
  factsStatus: 'unconfirmed';
}
export interface ContentSnapshot {
  source: 'mock';
  siteSettings: SiteSettings;
  home: Page;
  homepagePreview: HomePreview;
  categories: Category[];
  articles: Article[];
}
