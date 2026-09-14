import example from '../../../config/site.example.json';
import type { ContentSnapshot } from '../../../shared/content';
import { localPreviewFromManifest } from './local-media';
import { categoryPreviews } from './category-previews';

/** Proposed customer-facing copy is labelled as a concept; commercial facts remain null. */
export const mockContent: ContentSnapshot = {
  source: 'mock',
  siteSettings: {
    _type: 'siteSettings', brandName: example.brand.displayName,
    factoryName: example.factory.legalName,
    email: example.contact.email, whatsappDigits: example.contact.whatsappDigits,
    channelStatus: { emailEnabled: example.contact.emailEnabled, whatsappEnabled: example.contact.whatsappEnabled },
    defaultMoq: example.factory.defaultMoq, factConfirmedAt: null,
  },
  home: {
    _type: 'page', pageKey: 'home',
    title: 'Custom apparel manufacturing for brands in motion.',
    intro: 'For independent labels shaping their next collection. Start with fabric, fit and finish — and build a clear brief for a direct conversation with the factory.',
    seo: {
      seoTitle: `${example.brand.displayName} — Custom apparel manufacturing concept`,
      seoDescription: 'An apparel manufacturing concept for independent brands. Provisional branding; factory capabilities, independent imagery and contact details are awaiting confirmation.',
    },
    faqItems: [
      { question: 'What should I prepare for a clothing enquiry?', answer: 'Gather your sketches or reference images, intended fabrics, quantities by style and colour, size range, destination and target timing. This helps define the questions to confirm with the factory once contact channels are available.' },
      { question: 'Are minimum quantities and sampling times confirmed?', answer: 'Not yet. Minimum quantities, sample charges, lead times, available materials and production capabilities all require factory confirmation. This preview does not promise a quantity, price or delivery date.' },
      { question: 'Are these actual products or factory photographs?', answer: 'No. T-shirts and hoodies are demonstration categories, not a catalogue of factory products. Each garment image area states whether a concept is shown or imagery is pending. Factory photography is awaiting verified originals. Concepts are not evidence of production.' },
    ],
  },
  // Separate local UI model: never serialized or tested as a Sanity document.
  homepagePreview: {
    heroTitleLines: ['Custom apparel', 'manufacturing', 'for brands in motion.'],
    heroFactNote: 'Small-MOQ service concept. Capabilities, quantities and commercial terms are not yet factory-confirmed.',
    factsStatus: 'unconfirmed',
    eyebrow: 'Custom apparel / For independent brands',
    heroImage: localPreviewFromManifest('HERO-001', 'A cream T-shirt and charcoal hoodie, considered together.'),
    capabilities: [
      { title: 'Design support', icon: 'design', description: 'Bring your sketches, fit references and finishing ideas into one clear starting point.' },
      { title: 'Sampling', icon: 'sample', description: 'Define what a sample needs to resolve: the fabric, the fit and the finer details.' },
      { title: 'Small-MOQ planning', icon: 'production', description: 'Plan styles, colours and size splits before asking which quantities are feasible.' },
      { title: 'Quality checks', icon: 'quality', description: 'Set out the measurements, construction and finish you need to agree and review.' },
    ],
    demonstrationCategories: [
      { anchor: 't-shirts', name: 'T-shirts', status: 'demonstration_only', description: 'Everyday jersey, thoughtfully considered. Start with silhouette, neckline and the feel of the fabric. Factory capability is unconfirmed.', image: localPreviewFromManifest('CAT-TS-001', 'A cream T-shirt with a relaxed silhouette and visible fabric texture.') },
      { anchor: 'hoodies', name: 'Hoodies', status: 'demonstration_only', description: 'Volume, structure and comfort. Consider the hood shape, seams and weight of the fabric. Factory capability is unconfirmed.', image: localPreviewFromManifest('CAT-HD-001', 'A charcoal hoodie with a defined hood, seams and textured fabric.') },
    ],
    processSteps: [
      { title: 'Brief', description: 'Bring together your sketches, references, intended quantities and requirements.' },
      { title: 'Sample', description: 'Agree what to develop and review the proposed fit, fabric and finish.' },
      { title: 'Production', description: 'Confirm the sample, specifications and commercial terms before planning a run.' },
      { title: 'Dispatch', description: 'Agree the packing, shipping method and destination for the project.' },
    ],
    journalTopics: ['What to send for a clothing quote', 'Understanding MOQ per style and colour'],
  },
  // These remain empty: homepage demonstrations and planned topics are not published content.
  categoryPreviews,
  categories: [], articles: [],
};
