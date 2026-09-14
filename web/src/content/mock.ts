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
    intro: 'Explore fabric, fit and finish for your next collection.',
    seo: {
      seoTitle: `${example.brand.displayName} — Custom apparel manufacturing concept`,
      seoDescription: 'An apparel manufacturing concept for independent brands. Provisional branding; factory capabilities and contact details are unconfirmed. Images are AI-generated concepts.',
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
    heroFactNote: 'Services and terms are not yet factory-confirmed.',
    factsStatus: 'unconfirmed',
    eyebrow: 'China factory / Small-MOQ concept',
    heroImage: localPreviewFromManifest('HERO-001', 'A cream T-shirt and charcoal hoodie, considered together.'),
    capabilities: [
      { title: 'Design support', icon: 'design', description: 'Gather sketches, fit references and finishing ideas.' },
      { title: 'Sampling', icon: 'sample', description: 'Identify the fabric, fit and details to resolve.' },
      { title: 'Small-MOQ planning', icon: 'production', description: 'Discuss styles, colours and size splits.' },
      { title: 'Quality checks', icon: 'quality', description: 'Agree what to review in construction and finish.' },
    ],
    demonstrationCategories: categoryPreviews.map(category => ({
      anchor: category.slug, name: category.name, status: 'demonstration_only',
      description: category.cardSummary, image: category.image,
    })),
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
