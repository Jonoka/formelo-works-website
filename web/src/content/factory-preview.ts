import type { FactoryPreview } from '../../../shared/content';
import { pageContexts } from '../../../config/page-context';

export const factoryPreview: FactoryPreview = {
  kind: 'fixed_page_preview', pageKey: 'factory', status: 'concept_only',
  factsStatus: 'unconfirmed', productionAllowed: false,
  referenceCode: pageContexts.factory.referenceCode,
  title: 'Our factory.',
  intro: 'Look beyond the finished garment. A clear conversation with our factory should explain who is responsible for the work, where it takes place and how details are agreed.',
  factNote: 'Our public factory profile and production arrangements await confirmation. No factory photograph or operational evidence is shown here.',
  seo: {
    seoTitle: 'Our factory & manufacturing arrangements',
    seoDescription: 'Questions to discuss directly with our factory about manufacturing responsibilities and quality checks. The factory profile and original photography await confirmation.',
  },
  overview: 'Your collection starts with a garment brief, but a working relationship also needs a clear understanding of responsibilities. Ask our factory to explain the proposed arrangements for your design before you commit to sampling or production.',
  arrangements: [
    { title: 'Where the work happens', description: 'Ask which stages would take place within the factory and which, if any, would involve specialist partners. Do not assume that every process is performed in-house.' },
    { title: 'Who handles each stage', description: 'Clarify responsibility for materials, development, manufacturing and finishing. Discuss how information would move between the people involved in your project.' },
    { title: 'How decisions are recorded', description: 'Agree how specifications, sample feedback and changes would be confirmed. Ask who should clarify an unresolved point before the next stage begins.' },
  ],
  qualityDiscussion: [
    { title: 'Before a production decision', description: 'Discuss which material, fit, measurement and construction points should be reviewed, and what an agreed reference or specification would include.' },
    { title: 'During the proposed run', description: 'Ask whether interim checks can be arranged, what they would cover and how a difference from the agreed specification would be communicated.' },
    { title: 'Before delivery', description: 'Agree the final review scope, packing requirements and the way any issues would be resolved. Inspection methods, tolerances and acceptance criteria need specific agreement.' },
  ],
  photography: { assetId: 'FACTORY-001', status: 'awaiting_factory' },
};
