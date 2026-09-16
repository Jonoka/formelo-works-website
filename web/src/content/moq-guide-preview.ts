import type { ArticlePreview, EditorialBlock, Inline } from '../../../shared/editorial';
import { pageContexts } from '../../../config/page-context';
import { localPreviewFromManifest } from './local-media';
const t = (text: string): Inline => ({ type: 'text', text });
const link = (text: string, href: string): Inline => ({ type: 'link', text, href });
const p = (text: string): EditorialBlock => ({ type: 'paragraph', content: [t(text)] });
const h2 = (text: string): EditorialBlock => ({ type: 'heading', level: 2, text });
const h3 = (text: string): EditorialBlock => ({ type: 'heading', level: 3, text });

/** Original explanatory example. None of its numbers are factory configuration. */
export const moqGuidePreview: ArticlePreview = {
  kind: 'article_preview', status: 'editorial_draft', productionAllowed: false,
  slug: 'moq-per-style-per-color', referenceCode: pageContexts.moqGuide.referenceCode,
  title: 'Clothing MOQ Explained: Per Style, Per Color and Mixed Sizes',
  excerpt: 'Read the unit behind a minimum quantity. Separate styles, colors and size allocations before adding up a proposed order.',
  seo: { seoTitle: 'Clothing MOQ: per style, per color and mixed sizes', seoDescription: 'An unpublished clothing MOQ guide with a clearly hypothetical quantity example. Understand style, color, mixed sizes and the material questions to confirm before ordering.' },
  draftUpdatedAt: null,
  cover: { image: localPreviewFromManifest('CAT-HD-001', 'Charcoal hoodie detail, reused as an editorial illustration.'), usage: 'registered_concept_reuse', pendingAssetId: 'JOURNAL-MOQ-001' },
  body: [
    p('A minimum quantity is difficult to use until you know what it applies to. Is the figure for one garment design, one color of that design, each size, or the whole order? Before adjusting your collection to meet a number, ask for the counting rule in writing. The total at the bottom of a brief is only the result of the breakdown above it.'),
    { type: 'callout', title: 'No factory minimum is announced here', content: [t('This is an unpublished editorial draft. All factory MOQ rules are unconfirmed. The worked example below is hypothetical, not an offer, an accepted order or evidence of factory capability.')] },
    h2('Read the minimum together with its unit'),
    { type: 'paragraph', content: [t('MOQ means minimum order quantity: the lower quantity a supplier is willing to accept. A supplier can also attach separate conditions to variants or components. For the general definition and distinction between simple and more complex constraints, see '), link('Shopify’s explanation of minimum order quantity', 'https://www.shopify.com/blog/minimum-order-quantity'), t('. That source does not establish the terms of this factory.')] },
    p('For this guide, a style means one identified garment design, a color means one color version of that style, and a size allocation means how the pieces in that style–color combination are divided among sizes. These are working definitions for organizing questions, not a universal contract. Ask what counts as a new style when the fabric, fit, construction or artwork changes.'),
    { type: 'table', caption: 'Four different quantity questions', columns: ['Basis', 'Question to confirm'], rows: [
      ['Per style', 'Does the minimum apply to each design, and which changes create another style?'],
      ['Per color', 'Must each color of each style meet its own minimum?'],
      ['Mixed sizes', 'Can the quantity within one style and color be split among sizes, and are there size-level restrictions?'],
      ['Total order', 'Is there also a collection-wide quantity or value requirement, separate from the variant minimums?'],
    ] },
    h2('Keep styles and colors separate before adding them'),
    p('Suppose your brief contains a T-shirt and a hoodie. Do not combine them into one style just because they share a collection name. Give each design its own line, then create a line for every proposed color within it. If the counting rule is per style per color, every one of those lines must be evaluated separately.'),
    p('A larger overall order does not, by arithmetic alone, resolve a shortfall on one line. Likewise, choosing the same color name for two garments does not establish that their fabrics, dye requirements or production arrangements can be shared. Ask whether any pooling is possible rather than treating it as an entitlement.'),
    { type: 'paragraph', content: [t('The '), link('T-shirt concept page', '/clothing/t-shirts/'), t(' and '), link('hoodie concept page', '/clothing/hoodies/'), t(' can help you list design questions. They are demonstration categories, not confirmation that either garment or a particular quantity is available.')] },
    h2('Mixed sizes are an allocation, not a new total'),
    p('When a supplier permits mixed sizes within one style and color, the size quantities divide that line’s quantity. They are not additional pieces to add a second time. Write each size and its proposed count, then check the sum against the style–color line. “Mixed sizes” on its own does not say which sizes or how many of each you need.'),
    p('Ask whether the size split can be freely chosen, whether particular sizes have separate conditions, and whether any ratio or pack multiple applies. Also ask how a change to the size range affects the specifications that must be prepared. This draft does not assume any size ratio, grading service or extended-size capability is included.'),
    h2('A hypothetical order, line by line'),
    { type: 'callout', title: 'Hypothetical example — not this factory’s MOQ', content: [t('Assume, only for this calculation, a minimum of 60 pieces for each style in each color, with mixed S / M / L sizes permitted within that line and no additional size minimum. These invented conditions are teaching assumptions. They must not be used as factory terms.')] },
    { type: 'table', caption: 'Hypothetical proposal: two styles, three style–color lines, 180 pieces total', columns: ['Style / color', 'S', 'M', 'L', 'Total'], rows: [
      ['Style A T-shirt / cream', '15', '25', '20', '60'],
      ['Style A T-shirt / charcoal', '10', '30', '20', '60'],
      ['Style B hoodie / charcoal', '20', '20', '20', '60'],
    ] },
    p('Under these assumptions, the cream T-shirt line is 15 + 25 + 20 = 60 pieces. The charcoal T-shirt line is also 60, so Style A totals 120. Style B totals 60. The complete order is 120 + 60 = 180 pieces, not 180 pieces per style and not 60 pieces in every size. All three lines satisfy the assumed rule; that conclusion applies only to this example.'),
    h3('Why the same overall total can produce a different result'),
    p('Now imagine 90 cream T-shirts, 30 charcoal T-shirts and 60 charcoal hoodies. The overall total is still 180, but the 30-piece charcoal T-shirt line is below the hypothetical 60-piece threshold. Extra cream T-shirts do not fix that line under the assumed rule. You would need to discuss a different split or a different agreement, not merely point to the total.'),
    p('Changing the rule changes the calculation. A minimum stated only per style could behave differently, and a separate material minimum could add another constraint. The point of the example is to make the question visible—not to predict an answer or tell you to order an unsuitable amount of stock.'),
    h2('Ask about fabric, decoration and small components'),
    p('Do not stop at the garment count. Ask whether the proposed fabric, shade, decoration, label or packing requirement has its own purchasing or preparation condition. A garment-level answer should not be taken as approval for every component in the brief.'),
    { type: 'list', ordered: false, items: [
      [t('Fabric: Is the requested material available for this project, and does its color or finish introduce a separate minimum? What unit is that minimum measured in?')],
      [t('Shared material: Can the same material genuinely be used across the proposed styles, or do their specifications differ? Who needs to confirm that?')],
      [t('Decoration: Do separate artwork versions, placements or techniques need separate quantity or setup discussions?')],
      [t('Trims and labels: Are zippers, drawcords, main labels or care labels subject to separate purchasing conditions?')],
      [t('Packing: Does custom packaging have a different quantity basis from the garments?')],
      [t('Remainders: If more material or components would need to be purchased than the proposed run uses, what happens to the balance, and who would bear any agreed cost?')],
    ] },
    p('Keep units distinct. Pieces of finished garments, lengths or weights of fabric, and numbers of labels cannot be compared as though they were the same quantity. Ask for the relevant assumptions and a project-specific explanation instead of converting a material quantity into garment pieces without a confirmed basis.'),
    h2('Choose what to discuss, rather than guessing what will be accepted'),
    p('If a proposed split appears difficult, first identify the constraint. Is it the number of styles, colors, sizes or a component specification? Then explain which part of your brief is flexible. You might ask whether fewer colors, a different material option or a simpler decoration requirement could be considered. None of these changes guarantees a lower minimum or an acceptable price.'),
    p('Compare a revised proposal as a whole: garments, quantities, size distribution, costs and unresolved details. Do not increase the quantity solely to reach a threshold without reviewing whether that revised order suits your project. Ask whether sampling is a separate discussion and which decisions must be settled before bulk quantities are agreed.'),
    h2('A clear MOQ question for your next brief'),
    { type: 'template', title: 'Quantity clarification — adapt manually', text: 'For each style and color in my proposed breakdown, please clarify the applicable minimum, whether mixed sizes are permitted, and any size ratio or pack requirements. Please also identify separate material, decoration, label or packaging conditions.\n\nMy quantities are a proposal, not an assumption that the project is accepted. Please explain which details need confirmation and whether a different split could be discussed.' },
    { type: 'paragraph', content: [t('Use '), link('Manufacturing: MOQ discussion', '/manufacturing/#moq'), t(' for the shorter overview, or '), link('the clothing quote preparation guide', '/blog/what-to-send-for-a-clothing-quote/'), t(' to assemble the complete enquiry. The '), link('Contact page', '/contact/'), t(' shows the current channel status; this concept site does not submit your proposal.')] },
  ],
};
