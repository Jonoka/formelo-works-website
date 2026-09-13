import example from '../../../config/site.example.json';
import type { ContentSnapshot, LocalPreviewImage } from '../../../shared/content';

/** A UI placeholder, NOT a generated garment photograph or a Sanity asset. */
const pendingImage = (requiredAssetId: string, alt: string): LocalPreviewImage => ({
  source: 'local', kind: 'placeholder', assetId: 'UI-MEDIA-PENDING-001', requiredAssetId,
  src: '/media/image-pending.svg', alt, width: 1200, height: 900,
  renditions: [], productionAllowed: false,
});

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
    _type: 'page', pageKey: 'home', factsStatus: 'unconfirmed',
    eyebrow: 'Custom apparel / A manufacturing concept',
    title: 'Custom apparel manufacturing for brands in motion.',
    intro: 'For independent labels shaping their next collection. Explore a small-MOQ manufacturing concept, with capabilities, quantities and commercial terms still to be confirmed.',
    seo: {
      seoTitle: `${example.brand.displayName} — Custom apparel manufacturing concept`,
      seoDescription: 'An apparel manufacturing concept for independent brands. Provisional branding; factory capabilities, independent imagery and contact details are awaiting confirmation.',
    },
    heroImage: pendingImage('HERO-001', 'Garment image pending: the intended concept is a cream T-shirt with a charcoal hoodie. No product photograph is shown.'),
    capabilities: [
      { title: 'Design support', icon: 'design', description: 'Start with your sketches, fit references and finishing ideas. The scope of development support needs factory confirmation.' },
      { title: 'Sampling', icon: 'sample', description: 'Define the fabric, fit and details to review in a sample. Availability, charges and timing are not yet confirmed.' },
      { title: 'Small-MOQ planning', icon: 'production', description: 'Build your brief around styles, colours and size splits. Minimum quantities will need confirmation for your project.' },
      { title: 'Quality checks', icon: 'quality', description: 'Set out the measurements and finish you expect. Inspection stages and acceptance criteria remain to be agreed.' },
    ],
    demonstrationCategories: [
      { anchor: 't-shirts', name: 'T-shirts', status: 'demonstration_only', description: 'Explore a direction for everyday jersey: silhouette, neckline, hand feel and finishing. This category is a demonstration, not a confirmed factory capability.', image: pendingImage('CAT-TS-001', 'T-shirt concept image pending. No garment or factory sample is shown.') },
      { anchor: 'hoodies', name: 'Hoodies', status: 'demonstration_only', description: 'Consider shape, hood construction and the feel of the fabric. This category is a demonstration, not a confirmed factory capability.', image: pendingImage('CAT-HD-001', 'Hoodie concept image pending. No garment or factory sample is shown.') },
    ],
    processSteps: [
      { title: 'Brief', description: 'Bring together your sketches, references, intended quantities and requirements.' },
      { title: 'Sample', description: 'Agree what to develop and review the proposed fit, fabric and finish.' },
      { title: 'Production', description: 'Confirm the sample, specifications and commercial terms before planning a run.' },
      { title: 'Dispatch', description: 'Agree the packing, shipping method and destination for the project.' },
    ],
    journalTopics: ['What to send for a clothing quote', 'Understanding MOQ per style and colour'],
    faqItems: [
      { question: 'What should I prepare for a clothing enquiry?', answer: 'Gather your sketches or reference images, intended fabrics, quantities by style and colour, size range, destination and target timing. This helps define the questions to confirm with the factory once contact channels are available.' },
      { question: 'Are minimum quantities and sampling times confirmed?', answer: 'Not yet. Minimum quantities, sample charges, lead times, available materials and production capabilities all require factory confirmation. This preview does not promise a quantity, price or delivery date.' },
      { question: 'Are these actual products or factory photographs?', answer: 'No. T-shirts and hoodies are demonstration categories. Independent concept garment imagery is still pending, and the factory image area is an explicit placeholder. Any future AI-generated garment image must be labelled as a concept, not evidence of production.' },
    ],
  },
  // These remain empty: homepage demonstrations and planned topics are not published content.
  categories: [], articles: [],
};
