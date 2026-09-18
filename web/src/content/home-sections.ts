import type { HomeSectionCopy } from '../../../shared/cms-home';
/** Existing concept copy moved out of the template, not inserted into CMS records. */
export const localHomeSections = {
  capabilities: { eyebrow: 'From idea to enquiry', title: 'Capabilities', description: 'Proposed service areas. Availability and scope are not yet factory-confirmed.', lines: ['Capabilities'] },
  categories: { eyebrow: 'Explore the possibilities', title: 'Apparel categories', description: 'Two directions to frame a brief. Demonstrations only.', lines: ['Apparel', 'categories'] },
  factory: { eyebrow: 'Our factory / Profile pending', title: 'Behind the garment.', description: 'Know who makes your clothes. The factory profile, equipment details and original photography still need verification.', lines: ['Behind', 'the garment.'] },
  process: { eyebrow: 'How a project could take shape', title: 'A straightforward process', description: 'Illustrative workflow, not a confirmed factory procedure.', lines: ['A straightforward', 'process'] },
  journal: { eyebrow: 'Journal', title: 'Ideas, process and perspectives', description: 'Good questions come before good garments.', lines: ['Ideas, process', 'and perspectives'] },
  faq: { eyebrow: 'Before the conversation', title: 'A little clarity. A better brief.', description: 'Start with the details that matter to your collection.', lines: ['A little clarity.', 'A better brief.'] },
} satisfies Record<string, HomeSectionCopy & { lines: string[] }>;
