import type { CategoryPreview } from '../../../shared/content';
import { localPreviewFromManifest } from './local-media';
import { pageContexts } from '../../../config/page-context';

/** A bounded local concept collection; not CMS documents or physical sample records. */
export const categoryPreviews: CategoryPreview[] = [
  {
    kind: 'category_preview', status: 'concept_only', productionAllowed: false,
    slug: 't-shirts', name: 'T-shirts', referenceCode: pageContexts.tshirts.referenceCode,
    title: 'Custom T-shirt manufacturing.',
    intro: 'For independent brands considering their everyday jersey. Begin with the silhouette, neckline and feel you want to explore.',
    cardSummary: 'Everyday jersey, thoughtfully considered. Start with silhouette, neckline and the feel of the fabric.',
    image: localPreviewFromManifest('CAT-TS-001', 'A folded cream T-shirt with a rib neckline and matte fabric texture.'),
    concept: {
      title: 'An everyday shape. An open brief.',
      description: 'The single AI image above is a visual starting point, not a physical sample or evidence of factory capability. Its appearance does not establish a fabric specification.',
      observations: [
        { title: 'Silhouette', description: 'A folded study cannot establish fit. Bring full-length references for body length, shoulder position and sleeve proportions.' },
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
      seoTitle: 'T-shirt manufacturing concept',
      seoDescription: 'Explore a T-shirt manufacturing concept for independent brands: jersey, fit, neckline and artwork discussion points. Factory capability and terms are unconfirmed.',
    },
  },
  {
    kind: 'category_preview', status: 'concept_only', productionAllowed: false,
    slug: 'hoodies', name: 'Hoodies', referenceCode: pageContexts.hoodies.referenceCode,
    title: 'Custom hoodie manufacturing.',
    intro: 'For independent brands exploring volume and structure. Consider the hood, layered fabric and finishing details that shape a hoodie brief.',
    cardSummary: 'Volume, structure and comfort. Explore hood shape, rib proportions and the feel of a layered garment.',
    image: localPreviewFromManifest('CAT-HD-001', 'A folded charcoal hoodie with a sculpted hood, drawcords and matte fabric texture.'),
    concept: {
      title: 'Structure in the details.',
      description: 'The single AI image above explores a charcoal hoodie direction. It is not a physical sample, a second view of the T-shirt or proof of any factory process.',
      observations: [
        { title: 'Hood shape', description: 'The raised hood is a visual cue for a discussion about depth, opening and lining. Its construction still needs a physical reference.' },
        { title: 'Layer & feel', description: 'The dense-looking matte surface does not establish fabric weight or composition. Bring references for structure, softness and the inside finish.' },
        { title: 'Drawcord details', description: 'Discuss whether a drawcord suits your design, intended wearer and requirements. Cord, eyelet and tip options have not been confirmed.' },
      ],
    },
    discussion: [
      { title: 'Fabric & inside finish', description: 'Ask about suitable knit structures, fibre composition and brushed or loopback interiors. Availability, shrinkage expectations and care requirements need factory review.' },
      { title: 'Volume & layering', description: 'Share body length, shoulder shape and the room needed over other garments. Discuss sleeve volume, cuff and hem proportions, and the intended size range.' },
      { title: 'Hood, pocket & closure', description: 'Bring references for hood depth and lining, pocket placement and pullover or zip-front construction. Do not assume the pictured design or any closure is available.' },
      { title: 'Trims & artwork', description: 'Discuss rib matching, drawcords, labels and artwork near seams or pockets. Ask which materials and processes are feasible for the design before agreeing a sample.' },
    ],
    moqNotes: 'Hoodie minimum quantities are awaiting confirmation. Discuss style and colour splits, main fabric, matching rib and trim sourcing together. The concept does not offer a minimum, price or lead time.',
    samplingNotes: 'Hoodie sampling availability, cost, revisions and timing are unconfirmed. A development brief should identify hood shape, fit over layers, pocket placement and trim details to review physically.',
    faqItems: [
      { question: 'Is the charcoal hoodie a factory-made sample?', answer: 'No. This is the existing AI-generated hoodie concept from the homepage, not an approved product or production record. It has no physical sample code or confirmed fabric specification.' },
      { question: 'Should my brief specify brushed fleece or loopback fabric?', answer: 'Include the inside feel and structure you prefer, with references where available. The factory must confirm suitable materials and sourcing; neither fabric option is a promised service here.' },
      { question: 'Can I discuss a zip-front hoodie instead of a pullover?', answer: 'Yes, a brief can describe either direction, together with hood, pocket and trim requirements. Feasibility and any effect on sampling or minimum quantities must be confirmed; the image does not demonstrate a zip-front capability.' },
      { question: 'What should be reviewed in a hoodie development sample?', answer: 'Proposed review points include layering room, hood shape, cuff and hem proportions, pocket placement and trims. The actual review scope, sample charges, revisions and timing are not yet agreed with the factory.' },
    ],
    seo: {
      seoTitle: 'Hoodie manufacturing concept',
      seoDescription: 'Explore a hoodie manufacturing concept for independent brands: hood shape, layering, inside finish and trims. Factory capability, MOQ and sampling are unconfirmed.',
    },
  },
];
