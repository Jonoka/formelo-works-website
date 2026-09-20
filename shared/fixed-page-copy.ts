import type { HomeSectionCopy } from './cms-home';

// Source-controlled copy for the default local preview ONLY. Published delivery never fills from it.
const section = (eyebrow: string, title: string, description = ''): HomeSectionCopy => ({ eyebrow, title, description });
export const localFixedPageCopy = {
  manufacturing: {
    eyebrow: 'Manufacturing / Before the conversation', guideTitle: 'A clearer starting point',
    preparationLead: 'No tech pack yet?', preparationNote: 'An idea or a question is enough to begin a conversation. A tech pack, company email or registered brand is not a prerequisite.',
    sections: {
      options: section('01 / Customisation questions', 'Choose a starting point.', 'Explain how far your idea has developed. These are discussion routes, not a confirmed list of services.'),
      moq: section('02 / Minimum order quantities', 'Look beyond the total.', 'Prepare a breakdown so the factory can explain which minimums would apply, and on what basis. No quantities are quoted in this preview.'),
      prepare: section('03 / Your project brief', 'Start with what you know.', 'A few useful details can frame the conversation. This is a guide to keep with your own notes, not a form or an upload request.'),
      sampling: section('04 / Sampling & confirmation', 'Make the review specific.', 'Identify what a physical sample would need to resolve before discussing a production commitment.'),
      production: section('05 / Conceptual sequence', 'From brief to delivery.', 'An illustrative sequence for discussion, not a confirmed factory procedure or an order tracker.'),
      faq: section('06 / Common questions', 'Before moving forward.'),
      related: section('Put the brief in context', 'Consider the garment.', 'Two demonstration categories, each with its own design questions. Neither is a confirmed factory catalogue.'),
    },
    relatedLinks: [{ label: 'Explore our factory profile', href: '/our-factory/' }, { label: 'View contact options', href: '/contact/' }],
  },
  factory: {
    eyebrow: 'Our factory / Behind the garment',
    overviewNote: 'The factory name and public location have not yet been confirmed for this profile. Original photographs and details of the actual work will be added only after factory review.',
    sections: {
      overview: section('A direct conversation', 'Know the arrangements.'),
      arrangements: section('Manufacturing responsibilities', 'Ask how the work is organised.', 'Discussion points for your project, not a declaration that all processes are available or carried out on site.'),
      quality: section('Quality / A discussion framework', 'Agree what to check.', 'Quality expectations need a shared reference. These are questions to discuss with our factory, not a confirmed inspection procedure, certification or guarantee.'),
      related: section('Bring the questions to your brief', 'Start with the garment.', 'The two garment concepts frame different questions. They are not physical factory samples.'),
    },
    relatedLinks: [{ label: 'Prepare a manufacturing brief', href: '/manufacturing/#prepare' }, { label: 'View contact options', href: '/contact/' }],
  },
  contact: {
    eyebrow: 'Contact / A conversation about your collection',
    sections: {
      prepare: section('A useful starting point', 'A few details. Your own words.', 'Keep these notes for a future email or WhatsApp conversation. There is no form or upload on this website.'),
      related: section('Still shaping the idea?', 'Return to the garment.', 'Explore the demonstration categories and the questions each one raises.'),
    },
    relatedLinks: [{ label: 'Read the preparation guide', href: '/manufacturing/#prepare' }],
  },
  blogIndex: {
    title: 'Journal', intro: 'A clearer brief. A more useful conversation.', eyebrow: 'Journal / Notes for your next collection', columnNote: '',
    seo: { seoTitle: 'Journal — clothing project preparation', seoDescription: 'Editorial notes on quotation briefs and clothing quantities. Each article identifies its content source and publication status; factory terms remain unconfirmed.' },
  },
  privacy: { eyebrow: 'Website information' },
};
