import type { InformationRow, ManufacturingPreview } from '../../../shared/content';
import { pageContexts } from '../../../config/page-context';

/** A short, optional conversation outline, not a form or an eligibility test. */
export const enquiryPreparation: InformationRow[] = [
  { title: 'Garment category', description: 'Describe what you would like to make and who will wear it.' },
  { title: 'Number of styles', description: 'Separate the designs in your collection, even when some details are still open.' },
  { title: 'Quantity by style and colour', description: 'Give an estimate for each style and colour, with a size breakdown where you have one.' },
  { title: 'Delivery country', description: 'Name the intended destination. A target date can be discussed, but is not a confirmed delivery commitment.' },
  { title: 'References, when available', description: 'Use sketches, photographs, measurements or an existing tech pack to explain your idea. Start with what you have.' },
];

export const manufacturingPreview: ManufacturingPreview = {
  kind: 'fixed_page_preview', pageKey: 'manufacturing', status: 'concept_only',
  factsStatus: 'unconfirmed', productionAllowed: false,
  referenceCode: pageContexts.manufacturing.referenceCode,
  title: 'Custom clothing manufacturing.',
  intro: 'A good brief connects the garment you have in mind with the questions that need an answer. Explore what to prepare before discussing your collection with our factory.',
  factNote: 'General planning guidance. Our factory’s services and commercial terms are not yet confirmed.',
  seo: {
    seoTitle: 'Clothing manufacturing & project preparation',
    seoDescription: 'Prepare a clothing manufacturing brief: customisation questions, quantities by style and colour, sampling and a conceptual production sequence. Factory terms are unconfirmed.',
  },
  options: [
    { title: 'An existing starting point', description: 'Explain whether you are looking for an existing garment to adapt. Ask whether a suitable starting style and labelling arrangement are available; neither is assumed here.' },
    { title: 'Changes to a design', description: 'Identify what should stay and what should change: shape, fabric, colour or finishing. Ask which changes are feasible and what would need to be reviewed in a sample.' },
    { title: 'A new garment idea', description: 'Describe the intended silhouette, wearer and details. Ask what design information and development work would be needed, and which parts the factory could undertake.' },
  ],
  moqFactors: [
    { title: 'Style and colour', description: 'A collection total does not explain every design. Ask whether a minimum applies per style, per colour or to another defined grouping.' },
    { title: 'Sizes within a run', description: 'Share the size split you are considering. Ask whether sizes can be combined and whether any size-specific conditions apply.' },
    { title: 'Fabric selection', description: 'Discuss the material, colour and sourcing route together. Ask how fabric availability or supplier minimums would affect the proposed order.' },
    { title: 'Trims and finishing', description: 'Labels, matching rib, closures and artwork can introduce separate requirements. Ask which minimums would apply to the details in your brief.' },
  ],
  preparation: enquiryPreparation,
  sampling: [
    { title: 'Define the review', description: 'List the questions a sample should resolve: fit, measurements, fabric feel, construction and any artwork or trim placement.' },
    { title: 'Agree the sample terms', description: 'Ask about sampling availability, charges, timing and how feedback or changes would be handled before proceeding. No free sample or revision allowance is offered here.' },
    { title: 'Record what is accepted', description: 'Keep a clear record of the specifications and changes agreed with the factory. Ask what approval is needed before a production decision.' },
  ],
  productionSteps: [
    { title: 'Clarify the brief', description: 'Discuss the garment, quantities, destination and open questions. Establish which parts of the project are feasible.' },
    { title: 'Review a sample', description: 'If sampling is agreed, review the defined details and document any changes before accepting a specification.' },
    { title: 'Agree production', description: 'Confirm the specification, quantities, responsibilities and commercial terms before arranging a run.' },
    { title: 'Check and arrange delivery', description: 'Agree review points, how issues are handled, packing requirements and delivery arrangements for the project.' },
  ],
  faqItems: [
    { question: 'Do I need a tech pack to begin a conversation?', answer: 'No. You can begin with a question, an idea or references you already have. A tech pack is useful when available, but the information and development work needed for a specific garment must be discussed separately.' },
    { question: 'Can quantities be combined across styles, colours or sizes?', answer: 'Do not assume that they can. Prepare a separate estimate for each style and colour, then ask how sizes and material requirements are counted. This preview does not quote a minimum quantity.' },
    { question: 'Are labelling, artwork and new-style development available?', answer: 'These are topics to discuss, not confirmed services. Explain the result you want and ask which work, materials and processes the factory could take on.' },
    { question: 'Does this sequence track an order?', answer: 'No. It is an illustrative planning sequence, not the factory’s confirmed procedure or an order-tracking service. Any actual sample, production and delivery arrangements need to be agreed directly with the factory.' },
  ],
};
