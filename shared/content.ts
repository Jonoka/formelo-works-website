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
export interface ContentSnapshot {
  source: 'mock';
  siteSettings: SiteSettings;
  home: Page;
  categories: Category[];
  articles: Article[];
}
