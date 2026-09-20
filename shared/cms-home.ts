import { array, fail, record, string } from './cms-validation';
import { convertCmsApprovedImage, type CmsApprovedImage, type CmsAssetContext } from './cms-image';

export const homeSectionKeys = ['capabilities', 'categories', 'factory', 'process', 'journal', 'faq'] as const;
export interface HomeSectionCopy { eyebrow: string; title: string; description: string }
export interface HomeTextItem { title: string; description: string }
/** One fixed Home content group. Never a general builder, CSS input or preview document. */
export interface CmsHomeTemplateContent {
  eyebrow: string;
  titleLineHints: string[];
  sections: Record<(typeof homeSectionKeys)[number], HomeSectionCopy>;
  capabilities: HomeTextItem[];
  manufacturingSummary: { customization: string; sampling: string };
  factorySummary: string;
  factoryImage: CmsApprovedImage | null;
  processSteps: HomeTextItem[];
}
/** Business copy is plain text. HTML is not an editorial format for these three templates. */
export function sitePlainText(value: unknown, field: string): string {
  const text = string(value, field);
  if (/<\/?[a-z!]|javascript\s*:/i.test(text)) fail(field, 'CMS_UNSAFE_TEXT');
  return text;
}
export function convertCmsHomeContent(value: unknown, field: string, context: CmsAssetContext): CmsHomeTemplateContent {
  const input = record(value, field, ['_type', 'eyebrow', 'titleLineHints', 'sections', 'capabilities', 'manufacturingSummary', 'factorySummary', 'factoryImage', 'processSteps']);
  if (input['_type'] !== 'homeTemplateContent') fail(field, 'CMS_TEMPLATE_SCOPE');
  const sectionsInput = record(input['sections'], `${field}.sections`, ['_type', ...homeSectionKeys]);
  const sections = {} as CmsHomeTemplateContent['sections'];
  for (const key of homeSectionKeys) {
    const path = `${field}.sections.${key}`, copy = record(sectionsInput[key], path, ['_type', 'eyebrow', 'title', 'description']);
    sections[key] = { eyebrow: sitePlainText(copy['eyebrow'], `${path}.eyebrow`), title: sitePlainText(copy['title'], `${path}.title`), description: sitePlainText(copy['description'], `${path}.description`) };
  }
  const items = (name: 'capabilities' | 'processSteps', min: number, max: number): HomeTextItem[] =>
    array(input[name], `${field}.${name}`, min, max).map((value, index) => {
      const path = `${field}.${name}[${index}]`, item = record(value, path, ['_type', '_key', 'title', 'description']);
      return { title: sitePlainText(item['title'], `${path}.title`), description: sitePlainText(item['description'], `${path}.description`) };
    });
  const summary = record(input['manufacturingSummary'], `${field}.manufacturingSummary`, ['_type', 'customization', 'sampling']);
  return {
    eyebrow: sitePlainText(input['eyebrow'], `${field}.eyebrow`),
    titleLineHints: array(input['titleLineHints'] ?? [], `${field}.titleLineHints`, 0, 8).map((line, index) => sitePlainText(line, `${field}.titleLineHints[${index}]`)),
    sections, capabilities: items('capabilities', 2, 4), processSteps: items('processSteps', 3, 5),
    manufacturingSummary: { customization: sitePlainText(summary['customization'], `${field}.manufacturingSummary.customization`), sampling: sitePlainText(summary['sampling'], `${field}.manufacturingSummary.sampling`) },
    factorySummary: sitePlainText(input['factorySummary'], `${field}.factorySummary`),
    factoryImage: input['factoryImage'] == null ? null : convertCmsApprovedImage(input['factoryImage'], `${field}.factoryImage`, context),
  };
}
