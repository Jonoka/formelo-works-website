import example from '../../../config/site.example.json';
import type { ContentSnapshot } from '../../../shared/content';

/** No sample capability, numerical promise, contact account or factory evidence is invented. */
export const mockContent: ContentSnapshot = {
  source: 'mock',
  siteSettings: {
    _type: 'siteSettings',
    brandName: example.brand.displayName,
    factoryName: example.factory.legalName,
    email: example.contact.email,
    whatsappDigits: example.contact.whatsappDigits,
    channelStatus: {
      emailEnabled: example.contact.emailEnabled,
      whatsappEnabled: example.contact.whatsappEnabled,
    },
    defaultMoq: example.factory.defaultMoq,
    factConfirmedAt: null,
  },
  home: {
    _type: 'page',
    pageKey: 'home',
    title: 'Clothing, considered.',
    intro: 'A considered beginning for an independent apparel website. This local foundation preview establishes the visual language; manufacturing details are awaiting confirmation.',
    seo: {
      seoTitle: `${example.brand.displayName} — Local foundation preview`,
      seoDescription: 'A local concept preview with provisional branding. Factory capabilities, imagery and contact details are not yet confirmed.',
    },
    faqItems: [
      { question: 'What is available in this preview?', answer: 'A minimal static page, local mock content and the initial content-model structure. This is not the completed factory website.' },
      { question: 'Where are the manufacturing details?', answer: 'Factory identity, capabilities, minimum quantities and sampling terms require factory confirmation. They have not been filled with demonstration claims.' },
    ],
  },
  categories: [],
  articles: [],
};
