import type { ArticlePreview, EditorialBlock, Inline } from '../../../shared/editorial';
import { pageContexts } from '../../../config/page-context';
import { localPreviewFromManifest } from './local-media';

const t = (text: string): Inline => ({ type: 'text', text });
const link = (text: string, href: string): Inline => ({ type: 'link', text, href });
const p = (text: string): EditorialBlock => ({ type: 'paragraph', content: [t(text)] });
const h2 = (text: string): EditorialBlock => ({ type: 'heading', level: 2, text });
const h3 = (text: string): EditorialBlock => ({ type: 'heading', level: 3, text });

/** Original buyer-planning draft: questions and suggestions, not verified factory procedures. */
export const quoteGuidePreview: ArticlePreview = {
  kind: 'article_preview', status: 'editorial_draft', productionAllowed: false,
  slug: 'what-to-send-for-a-clothing-quote', referenceCode: pageContexts.quoteGuide.referenceCode,
  title: 'What to Send Before Requesting a Custom Clothing Quote',
  excerpt: 'Turn your garment idea into a clear first enquiry: describe the styles, split the quantities and separate decisions from open questions.',
  seo: {
    seoTitle: 'What to send before requesting a custom clothing quote',
    seoDescription: 'An editorial draft with a practical clothing enquiry checklist and a manually copyable brief. Plan style and color quantities, size splits, references and budget questions.',
  },
  draftUpdatedAt: null,
  cover: {
    image: localPreviewFromManifest('CAT-TS-001', 'Cream T-shirt detail, reused as an editorial illustration.'),
    usage: 'registered_concept_reuse', pendingAssetId: 'JOURNAL-QUOTE-001',
  },
  body: [
    p('A useful first enquiry does not need to pretend that every design decision is final. It needs to show what you are trying to make, how much you are considering and which decisions still need a conversation. Treat the first brief as a shared starting point, rather than a promise that a price or production slot can already be confirmed.'),
    { type: 'callout', title: 'A planning guide, not factory terms', content: [t('This is an unpublished editorial draft. The categories shown on this site are demonstrations; factory services, minimum quantities, pricing and delivery terms remain unconfirmed. The suggestions below do not guarantee that a project can be accepted.')] },
    h2('Start with the garment and the number of styles'),
    p('Name the garment category and describe each distinct design separately. “A clothing collection” leaves too much open; “one short-sleeve T-shirt design and one pullover hoodie design” gives the discussion a clearer shape. Give each style a simple working name so that references, quantities and later questions stay attached to the right item. You do not need a registered brand name to label a brief.'),
    p('For each style, explain the intended fit, fabric feel, construction and visible details in ordinary language. Separate details that must stay from those you are willing to discuss. A reference photo can communicate a silhouette, but it does not automatically specify measurements, material composition, fabric weight or the way a garment should be made.'),
    { type: 'paragraph', content: [t('Use the '), link('T-shirt concept', '/clothing/t-shirts/'), t(' and '), link('hoodie concept', '/clothing/hoodies/'), t(' pages as prompts for questions, not as a catalogue of confirmed products. Include only images and design material that you are entitled to share.')] },
    h2('Split the quantity by style, color and size'),
    p('Write the intended quantity for every style–color combination before giving a collection total. Then show the size allocation inside each combination. A total alone does not explain whether you want one design in one color or several designs spread across many colors. Ask the factory which minimum applies to each combination and whether the proposed size mix is possible.'),
    h3('A simple way to organize the brief'),
    { type: 'table', caption: 'Quantity-planning fields — fill in your own proposal, not a factory minimum', columns: ['Field', 'What to write'], rows: [
      ['Style / working name', 'Identify one design and its category.'],
      ['Color', 'Name the intended color; mark an exact shade as undecided when necessary.'],
      ['Proposed quantity', 'State pieces for this style in this color.'],
      ['Size allocation', 'List the pieces for each size; check that they add up to the color quantity.'],
      ['Status', 'Distinguish an initial estimate from a decided purchase quantity.'],
    ] },
    p('Repeat those fields for every color and style. Check the arithmetic twice: size quantities should add up to the relevant color quantity, and all style–color quantities should add up to the order total. Do not assume that mixed sizes, colors or designs can be pooled to satisfy a minimum. Where your split is flexible, say exactly which part can change.'),
    h2('Share the design information you actually have'),
    p('Send a short inventory of the information available now: sketches, reference photographs, a measurement sheet, material notes, artwork or a tech pack. Explain what each item is meant to communicate. A picture chosen for its neckline should not be mistaken for approval of its fabric, branding or every other detail.'),
    h3('Starting without a tech pack'),
    p('You can begin a discussion without a tech pack. Describe the idea, show the references you can lawfully share and list the missing decisions. Ask what additional specifications are needed, who would prepare them and whether development support is available for your project. Do not assume that the factory will provide every design, pattern, artwork or technical service, or that any such work is included in an initial quotation.'),
    p('Keep uncertain items visible. For example, write “fabric composition undecided; please explain what information you need” rather than selecting a material only to make the brief look complete. If two options are still under consideration, label them as alternatives and ask whether they would need separate quotations.'),
    h2('State the destination and the timing question'),
    p('Include the delivery country and, when relevant to the discussion, the destination city or postal area. An exact private delivery address is not needed simply to introduce a project. State whether your target date refers to sample receipt, dispatch or arrival at destination; those are different milestones.'),
    p('Describe a desired date as a target to be checked, not as a lead time promised by the factory. Ask which steps must be confirmed before a schedule can be assessed, and what delivery scope a proposed price covers. Keep shipping, duties, taxes and any other exclusions as explicit questions rather than assuming that they are included.'),
    h2('Separate a target unit price from the total budget'),
    p('A target unit price is the amount you hope to pay for one garment under a stated scope. A total project budget is the overall amount you can allocate to the project. They are not interchangeable. A garment target alone does not explain how you intend to handle development, samples, decoration, labels, packing or delivery if those items are quoted separately.'),
    p('State the currency and what you intend each amount to cover. If you only know an overall budget, say so. Ask for the quotation to distinguish included items, separately charged items and costs that cannot yet be assessed. Avoid turning a hoped-for price into a claim that the factory has agreed to it.'),
    p('You can also explain the priority behind the target: a particular fabric feel, a fit detail or a spending ceiling. Ask which changes could be discussed while keeping that priority intact. Do not silently compare prices based on different quantities, materials or delivery scopes.'),
    h2('A first-enquiry template you can adapt'),
    p('Manually select and copy the text below into your own document or email draft. Replace the bracketed prompts, remove sections that do not apply and leave unresolved items clearly marked. There is no copy button, file upload or message-sending function on this concept site. Contact channels are not configured.'),
    { type: 'template', title: 'Custom clothing enquiry — editable text', text: `Subject: Custom clothing enquiry — [garment category / working project name]

Hello,

I am planning [brief description of the garments and intended use]. I would like to discuss whether this project is suitable for your factory and what you would need before preparing a quotation.

Styles and details
- Style / working name: [name and category; repeat for each style]
- Fit, fabric and construction ideas: [known requirements]
- Decoration, labels and packing: [requirements or undecided items]
- Details that must stay: [priorities]
- Details open to discussion: [alternatives]

Proposed quantities
- Style: [working name]
- Color: [color or shade to be confirmed]
- Pieces for this style and color: [quantity]
- Size allocation: [size and quantity for each size]
- Overall order total: [sum across all styles and colors]
- Quantity status / flexibility: [initial estimate or decided proposal]

Design information available
- [Sketches, references, measurements, artwork or tech pack available]
- [What each reference is intended to show]
- [Specifications still missing and support I would like to ask about]

Destination and timing
- Delivery country: [country]
- Destination city / postal area, if relevant: [area]
- Target milestone and date: [sample receipt, dispatch or arrival; desired date]

Budget discussion
- Currency: [currency]
- Target garment unit price, if known: [amount and intended scope]
- Total project budget, if known: [amount and intended scope]
- Please clarify included, excluded and separately quoted costs.

Could you confirm the minimum quantity basis for each style and color, whether the size split can be accommodated, what further specifications you need and whether any requested development support is available?

Please identify any assumptions in a proposed quotation and any details that must be confirmed before a price or schedule can be agreed.

Thank you,
[Your name / brand or project name, if applicable]` },
    h2('Check the brief before starting the conversation'),
    { type: 'list', ordered: false, items: [
      [t('Every style has a working name, category and a clear link to its own references.')],
      [t('Quantities are split by style and color, with size allocations and a checked total.')],
      [t('Known specifications, alternative options and unresolved questions are clearly separated.')],
      [t('The delivery country is stated and each desired date names its milestone.')],
      [t('Currency, target unit price and total budget are distinguished, with their intended scope.')],
      [t('You have permission to share the design material and have removed unrelated confidential information.')],
      [t('You have asked what remains to be confirmed rather than assuming a minimum, service, price or delivery commitment.')],
    ] },
    { type: 'paragraph', content: [t('For the shorter preparation overview, return to '), link('Manufacturing: prepare your brief', '/manufacturing/#prepare'), t('. The '), link('Contact page', '/contact/'), t(' explains the current channel status. Once real contact details are configured and verified, use the approved channel to begin the discussion; this preview itself does not receive an enquiry.')] },
  ],
};
