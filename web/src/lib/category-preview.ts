import type { CategoryPreview } from '../../../shared/content';
import routes from '../../../config/routes.json';
import { validateLocalImage } from './images';

export function categoryPath(slug: CategoryPreview['slug']): string {
  return `/clothing/${slug}/`;
}
/** Guard the local-to-template mapping without weakening formal CMS contracts. */
export function validateCategoryPreviews(items: CategoryPreview[]): void {
  const planned = routes.pages.filter(page => page.template === 'Category');
  const expected = routes.previewPages.filter(page => planned.some(item => item.path === page.path));
  if (items.length !== expected.length) throw new Error('Category preview route count mismatch.');
  const seen = new Set<string>();
  for (const item of items) {
    const path = categoryPath(item.slug);
    const plan = planned.find(page => page.path === path);
    const preview = expected.find(page => page.path === path);
    if (!plan || !preview || seen.has(path) || item.referenceCode !== plan.referenceCode ||
        item.kind !== 'category_preview' || item.status !== 'concept_only' || item.productionAllowed !== false ||
        ![item.name, item.title, item.intro, item.cardSummary, item.moqNotes, item.samplingNotes,
          item.seo.seoTitle, item.seo.seoDescription, item.concept.title, item.concept.description].every(text => typeof text === 'string' && text.trim()) ||
        item.discussion.length < 3 || item.concept.observations.length < 1 || item.faqItems.length < 3 ||
        [...item.discussion, ...item.concept.observations].some(row => !row.title.trim() || !row.description.trim()) ||
        item.faqItems.some(faq => !faq.question.trim() || !faq.answer.trim()) ||
        ['samples', 'asset', '_type', 'factConfirmedAt', 'approvedAt'].some(key => key in item)) {
      throw new Error(`Invalid category preview: ${item.slug}`);
    }
    validateLocalImage(item.image);
    if (preview.assetIds.length !== 1 || preview.assetIds[0] !== item.image.requiredAssetId || item.image.kind !== 'concept') {
      throw new Error(`Unregistered category preview image: ${item.slug}`);
    }
    seen.add(path);
  }
}
