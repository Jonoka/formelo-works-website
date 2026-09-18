// OFFLINE FIXTURE ONLY. Never imported by the website or written to Sanity.
import type { EditorialBlock, Inline } from '../../shared/editorial';
import { dev05bDraftScope } from '../../shared/cms-draft-preview';
import { fixtureBody, previews } from './cms-articles';

function textOnly(item: Inline): Inline {
  return { type: 'text', text: item.text, ...(item.marks ? { marks: [...item.marks] } : {}) };
}
export function draftDeliveryFixture(revision = 'one') {
  // The one-document draft authorization does not grant arbitrary internal-reference reads.
  const body: EditorialBlock[] = structuredClone(previews[0]!.body).map(block => {
    if (block.type === 'paragraph' || block.type === 'callout') return { ...block, content: block.content.map(textOnly) };
    if (block.type === 'list') return { ...block, items: block.items.map(items => items.map(textOnly)) };
    return block;
  });
  return {
    _type: 'article', _id: dev05bDraftScope.documentId, _originalId: `drafts.${dev05bDraftScope.documentId}`,
    _rev: `offline-draft-${revision}`, _updatedAt: '2026-09-17T06:12:50Z',
    title: `OFFLINE FIXTURE: quote preparation ${revision}`, excerpt: `OFFLINE FIXTURE: saved revision ${revision}; not live CMS content.`,
    slug: { current: dev05bDraftScope.slug }, referenceCode: dev05bDraftScope.referenceCode,
    seo: { seoTitle: `Offline quotation SEO ${revision}`, seoDescription: `Independent offline SEO description for revision ${revision}.` },
    factReviewStatus: 'pending', body: fixtureBody(body),
  };
}
