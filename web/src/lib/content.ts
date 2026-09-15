import type { ContentSnapshot } from '../../../shared/content';
import { mockContent } from '../content/mock';
import { validateCategoryPreviews } from './category-preview';
import { validateManufacturingPreview, validateFactoryPreview, validateContactPreview } from './fixed-preview';

export async function loadContent(mode: string): Promise<ContentSnapshot> {
  if (mode !== 'mock') throw new Error('Sanity provider is pending DEV-05; refusing to fall back to mock.');
  const content = structuredClone(mockContent);
  const settings = content.siteSettings;
  if (settings.email !== null || settings.whatsappDigits !== null ||
      settings.channelStatus.emailEnabled || settings.channelStatus.whatsappEnabled) {
    throw new Error('Mock contact channels must be null and disabled.');
  }
  if (settings.factoryName !== null || settings.defaultMoq !== null || settings.factConfirmedAt !== null ||
      settings.contactPersonOrTeam !== null || settings.businessHours !== null ||
      settings.timezone !== null || settings.publicAddress !== null) {
    throw new Error('Mock content must not assert confirmed factory facts.');
  }
  validateCategoryPreviews(content.categoryPreviews);
  validateManufacturingPreview(content.manufacturingPreview);
  validateFactoryPreview(content.factoryPreview);
  validateContactPreview(content.contactPreview);
  return content;
}
