import type { CategoryPreview } from '../../../shared/content';
import { localPreviewFromManifest } from './local-media';

/** A bounded local concept collection; not CMS documents or physical sample records. */
export const categoryPreviews: CategoryPreview[] = [
  {
    kind: 'category_preview', status: 'concept_only', productionAllowed: false,
    slug: 't-shirts', name: 'T-shirts', referenceCode: 'WEB-TSHIRTS',
    title: 'Custom T-shirt manufacturing.',
    intro: 'For independent brands considering their everyday jersey. Begin with the silhouette, neckline and feel you want to explore.',
    cardSummary: 'Everyday jersey, thoughtfully considered. Start with silhouette, neckline and the feel of the fabric.',
    image: localPreviewFromManifest('CAT-TS-001', 'A cream T-shirt with a relaxed silhouette and visible fabric texture.'),
    concept: {
      title: 'An everyday shape. An open brief.',
      description: 'The single AI image above is a visual starting point, not a physical sample or evidence of factory capability. Its appearance does not establish a fabric specification.',
      observations: [
        { title: 'Silhouette', description: 'Use the relaxed outline to discuss body length, shoulder position and sleeve proportions.' },
        { title: 'Neckline', description: 'Bring references for the opening, rib appearance and the finish you would like to review.' },
        { title: 'Surface', description: 'The matte cream texture is a visual direction only. Fibre, fabric weight and finishing need separate confirmation.' },
      ],
    },
    discussion: [
      { title: 'Fabric & hand feel', description: 'Ask which jersey constructions and fibre compositions the factory can source. Discuss opacity, surface feel and care expectations; do not infer them from the image.' },
      { title: 'Fit & size range', description: 'Share body and sleeve proportions, neckline references and intended sizes. Ask how measurements and tolerances would be agreed.' },
      { title: 'Artwork & placement', description: 'Bring artwork dimensions and placement references. Printing, embroidery and their suitability for the selected fabric must be discussed, not assumed available.' },
      { title: 'Construction & finishing', description: 'Discuss neck rib, shoulder seams, hems and labels. Ask what can be checked in a physical development sample before agreeing specifications.' },
    ],
    moqNotes: 'T-shirt minimum quantities are not confirmed. Ask how style, colour, fabric sourcing and size splits would affect an enquiry. No minimum, price or delivery date is offered in this concept.',
    samplingNotes: 'T-shirt sampling availability, charges, revision scope and timing are awaiting factory confirmation. A useful review brief would identify fit, neckline, fabric feel and artwork placement to resolve.',
    faqItems: [
      { question: 'Is the cream T-shirt an actual factory sample?', answer: 'No. It is one AI-generated concept reused from the homepage. It has no physical sample code or approved fabric specification and is not proof that the factory can make this design.' },
      { question: 'What should I prepare for a T-shirt discussion?', answer: 'Gather silhouette and neckline references, intended sizes, artwork placement and quantities split by style and colour. Fabric references may help frame questions; material availability still needs factory confirmation.' },
      { question: 'Can I specify a fabric weight or printing method?', answer: 'You can include a desired feel, fabric weight or artwork method in your brief. No weight range, print technique, sourcing option or performance requirement has been confirmed for this factory.' },
      { question: 'What are the T-shirt MOQ and sampling terms?', answer: 'They remain unconfirmed. Minimum quantities, sample costs, revisions and timing must be agreed with the factory once the contact channels are configured.' },
    ],
    seo: {
      seoTitle: 'T-shirt manufacturing concept — FORMELO WORKS',
      seoDescription: 'Explore a T-shirt manufacturing concept for independent brands: jersey, fit, neckline and artwork discussion points. Factory capability and terms are unconfirmed.',
    },
  },
];
