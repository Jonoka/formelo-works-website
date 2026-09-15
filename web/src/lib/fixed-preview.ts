import type { ContactPreview, FactoryPreview, FixedPagePreview, InformationRow, ManufacturingPreview } from '../../../shared/content';
import { pageContexts, type CorePageKey } from '../../../config/page-context';
import routes from '../../../config/routes.json';
import manifest from '../../../assets/manifest.json';

export function validateFixedPreview<K extends CorePageKey>(item: FixedPagePreview<K>, key: K): void {
  const context = pageContexts[key];
  const planned = routes.pages.find(page => page.path === context.path);
  if (!planned || item.pageKey !== key || item.referenceCode !== context.referenceCode ||
      planned.referenceCode !== context.referenceCode || item.kind !== 'fixed_page_preview' ||
      item.status !== 'concept_only' || item.factsStatus !== 'unconfirmed' || item.productionAllowed !== false ||
      ![item.title, item.intro, item.factNote, item.seo.seoTitle, item.seo.seoDescription].every(text => typeof text === 'string' && text.trim()) ||
      ['_type', 'asset', 'heroImage', 'factConfirmedAt', 'approvedAt', 'contentUpdatedAt', 'samples'].some(key => key in item)) {
    throw new Error(`Invalid local fixed-page preview: ${key}`);
  }
}
export function validateInformationRows(rows: InformationRow[], minimum: number): void {
  if (!Array.isArray(rows) || rows.length < minimum || rows.some(row =>
    typeof row.title !== 'string' || !row.title.trim() || typeof row.description !== 'string' || !row.description.trim())) {
    throw new Error('Incomplete fixed-page discussion rows.');
  }
}
export function validateManufacturingPreview(item: ManufacturingPreview): void {
  validateFixedPreview(item, 'manufacturing');
  for (const [rows, minimum] of [[item.options, 3], [item.moqFactors, 4], [item.preparation, 5], [item.sampling, 3], [item.productionSteps, 4]] as const) {
    validateInformationRows(rows, minimum);
  }
  if (item.faqItems.length < 3 || item.faqItems.some(faq => !faq.question.trim() || !faq.answer.trim())) {
    throw new Error('Manufacturing preview needs complete, readable FAQ items.');
  }
}
export function validateFactoryPreview(item: FactoryPreview): void {
  validateFixedPreview(item, 'factory');
  validateInformationRows(item.arrangements, 3);
  validateInformationRows(item.qualityDiscussion, 3);
  const photo = manifest.assets.find(asset => asset.id === item.photography.assetId);
  if (!item.overview.trim() || item.photography.assetId !== 'FACTORY-001' ||
      item.photography.status !== 'awaiting_factory' || photo?.status !== 'awaiting_factory' ||
      photo.path !== null || photo.productionAllowed !== false ||
      ['certifications', 'customerLogos', 'caseStudies', 'equipment', 'capacity'].some(key => key in item)) {
    throw new Error('Factory preview must retain an unconfirmed profile and pending original photography.');
  }
}
export function validateContactPreview(item: ContactPreview): void {
  validateFixedPreview(item, 'contact');
  validateInformationRows(item.preparation, 5);
  if (!item.preparationNote.trim() || ['email', 'whatsappDigits', 'contactPersonOrTeam', 'businessHours', 'publicAddress'].some(key => key in item)) {
    throw new Error('Contact preview must use global contact settings, not duplicate channel data.');
  }
}

