import type { ContactPreview } from '../../../shared/content';
import { pageContexts } from '../../../config/page-context';
import { enquiryPreparation } from './manufacturing-preview';

export const contactPreview: ContactPreview = {
  kind: 'fixed_page_preview', pageKey: 'contact', status: 'concept_only',
  factsStatus: 'unconfirmed', productionAllowed: false,
  referenceCode: pageContexts.contact.referenceCode,
  title: 'Contact our factory.',
  intro: 'Tell us what you would like to make. An early idea, a clear reference or a question about your collection can be a starting point for a conversation.',
  factNote: 'Email and WhatsApp are not configured in this preview. The controls are inactive; this website does not send or collect enquiries.',
  seo: {
    seoTitle: 'Contact our factory & prepare your enquiry',
    seoDescription: 'Prepare a clothing enquiry with your category, styles, quantities by style and colour, destination and optional references. Email and WhatsApp are not configured yet.',
  },
  preparation: enquiryPreparation,
  preparationNote: 'You do not need a tech pack, company email or registered brand to begin a conversation. Start with what you know; further design information can be discussed for the project.',
};
