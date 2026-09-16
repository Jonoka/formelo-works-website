import type { LocalPreviewImage, Seo } from './content';
import type { PageReference } from '../config/page-context';

/** Bounded local editorial model. Not Portable Text, a Sanity Article or an approval record. */
export type Inline = { type: 'text'; text: string } | { type: 'link'; text: string; href: string };
export type EditorialBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; content: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] }
  | { type: 'table'; caption: string; columns: string[]; rows: string[][] }
  | { type: 'callout'; title: string; content: Inline[] }
  | { type: 'template'; title: string; text: string };
export interface ArticlePreview {
  kind: 'article_preview';
  status: 'editorial_draft';
  productionAllowed: false;
  slug: 'what-to-send-for-a-clothing-quote' | 'moq-per-style-per-color';
  referenceCode: PageReference<'quoteGuide' | 'moqGuide'>;
  title: string;
  excerpt: string;
  seo: Seo;
  // Source-controlled editorial timestamp, never a public publication/review date.
  draftUpdatedAt: string | null;
  cover: { image: LocalPreviewImage; usage: 'registered_concept_reuse'; pendingAssetId: 'JOURNAL-QUOTE-001' | 'JOURNAL-MOQ-001' };
  body: EditorialBlock[];
}
export interface PrivacyPreview {
  kind: 'legal_preview';
  status: 'draft_not_in_effect';
  productionAllowed: false;
  referenceCode: null;
  title: string;
  seo: Seo;
  legalEntity: null;
  privacyContact: null;
  providers: null;
  retention: null;
  effectiveAt: null;
  body: EditorialBlock[];
}
