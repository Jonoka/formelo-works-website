import { defineField, defineType, type Rule, type ValidationContext } from 'sanity';
import { pageKeys } from '../../shared/content';
import { convertInformationRows, fixedContentFields, fixedSectionKeys, type FixedPageKey } from '../../shared/cms-fixed';
import { homeSectionKeys, sitePlainText } from '../../shared/cms-home';
import { array, record } from '../../shared/cms-validation';
import { homeTemplateContent } from './home-content';
import { validateCmsBodyInput } from '../../shared/cms-body';

const homeFields = ['eyebrow', 'titleLineHints', 'sections', 'capabilities', 'manufacturingSummary', 'factorySummary', 'factoryImage', 'processSteps'];
export function validatePageTemplateInput(value: unknown, key: unknown): true | string {
  try {
    if (typeof key !== 'string' || !pageKeys.includes(key as (typeof pageKeys)[number])) return 'A planned pageKey is required.';
    const fields: readonly string[] = key === 'home' ? homeFields : fixedContentFields[key as FixedPageKey];
    const object = record(value, 'templateContent', ['_type', 'pageKey', ...fields]);
    if (object['_type'] !== 'pageTemplateContent' || object['pageKey'] !== key) return 'The content pageKey must match its owning page.';
    return true;
  } catch { return 'Use only the controlled content fields for this pageKey.'; }
}
const visibleFor = (name: string): readonly string[] => pageKeys.filter(key => key === 'home' ? homeFields.includes(name) : (fixedContentFields[key] as readonly string[]).includes(name));
const hidden = (keys: readonly string[]) => ({ document }: { document?: Record<string, unknown> | undefined }) => !keys.includes(String(document?.['pageKey']));
const presence = (keys: readonly string[], optional = false) => (value: unknown, context: ValidationContext) => {
  const visible = keys.includes(String(context.document?.['pageKey']));
  return visible ? optional || value != null || 'This page requires the field.' : value == null || 'This field belongs to a different pageKey.';
};
function homeField(name: string, value: unknown, context: ValidationContext): true | string {
  const present = presence(['home'], ['titleLineHints', 'factoryImage'].includes(name))(value, context);
  if (present !== true || context.document?.['pageKey'] !== 'home') return present;
  try {
    if (name === 'titleLineHints') array(value ?? [], name, 0, 8).forEach(item => sitePlainText(item, name));
    if (name === 'capabilities') convertInformationRows(value, name, 2, 4);
    if (name === 'processSteps') convertInformationRows(value, name, 3, 5);
    if (name === 'factorySummary') sitePlainText(value, name);
    if (name === 'manufacturingSummary') {
      const summary = record(value, name, ['_type', 'customization', 'sampling']);
      sitePlainText(summary['customization'], name); sitePlainText(summary['sampling'], name);
    }
    return true; // approvedImage keeps its own permission and alternative-text validation.
  } catch { return 'Complete the bounded Home field using plain text and the existing row limits.'; }
}
const plain = (name: string, keys = visibleFor(name), optional = false) => defineField({ name, type: 'text', rows: 3, hidden: hidden(keys), validation: rule => rule.custom((value, context) => {
  if (!keys.includes(String(context.document?.['pageKey']))) return value == null || 'Not supported for this pageKey.';
  if (optional && value == null) return true;
  try { sitePlainText(value, name); return true; } catch { return 'Non-empty bounded plain text is required; no HTML or scripts.'; }
}) });
const rowFields = [defineField({ name: 'title', type: 'string', validation: rule => rule.required() }), defineField({ name: 'description', type: 'text', validation: rule => rule.required() })];
const sectionKeysFor = (key: string): readonly string[] => key === 'home' ? homeSectionKeys : key in fixedSectionKeys ? fixedSectionKeys[key as keyof typeof fixedSectionKeys] : [];
const sectionKeys = [...new Set([...homeSectionKeys, ...Object.values(fixedSectionKeys).flat()])];
const rowLimits = { options: [2, 6], moqFactors: [2, 12], preparation: [3, 12], sampling: [2, 6], productionSteps: [3, 6], arrangements: [2, 12], qualityDiscussion: [2, 6], credentials: [0, 6] } as const;

/** Fixed schema union. Visibility is editorial assistance, not a security gate; strict conversion is mandatory. */
export const pageTemplateContent = defineType({
  name: 'pageTemplateContent', title: 'Controlled page content', type: 'object',
  description: 'Choose the owning pageKey, not a layout or arbitrary module. Existing DEV-05E Home objects remain readable; changing stored objects requires separate content authorization.',
  validation: rule => rule.required().custom((value, context) => validatePageTemplateInput(value, context.document?.['pageKey'])),
  fields: [
    defineField({ name: 'pageKey', title: 'Content type / owning page', type: 'string', options: { list: [...pageKeys] },
      description: 'Must exactly match the read-only pageKey of this document. A mismatch fails the build.',
      validation: rule => rule.required().custom((value, context) => value === context.document?.['pageKey'] || 'Must match the owning pageKey.') }),
    plain('eyebrow'),
    ...homeTemplateContent.fields.filter(field => !['eyebrow', 'sections'].includes(field.name)).map(field => ({ ...field, hidden: hidden(['home']), validation: (rule: Rule) => rule.custom((value, context) => homeField(field.name, value, context)) })),
    defineField({ name: 'sections', type: 'object', hidden: hidden(['home', 'manufacturing', 'factory', 'contact']), validation: rule => rule.custom(presence(['home', 'manufacturing', 'factory', 'contact'])),
      fields: sectionKeys.map(name => {
        const keys = pageKeys.filter(key => sectionKeysFor(key).includes(name));
        return defineField({ name, type: 'object', hidden: hidden(keys), validation: rule => rule.custom(presence(keys)), fields: [
          defineField({ name: 'eyebrow', type: 'string', validation: rule => rule.required() }), ...rowFields.filter(field => field.name === 'title'),
          defineField({ name: 'description', type: 'text', validation: rule => rule.required() }),
        ] });
      }) }),
    ...['contextNote', 'guideTitle', 'preparationLead', 'preparationNote', 'overview', 'overviewNote', 'columnNote'].map(name => plain(name)),
    ...Object.entries(rowLimits).map(([name, [min, max]]) => defineField({ name, type: 'array', of: [{ type: 'object', fields: rowFields }], hidden: hidden(visibleFor(name)),
      validation: rule => rule.custom((value, context) => {
        if (!visibleFor(name).includes(String(context.document?.['pageKey']))) return value == null || 'Not supported for this pageKey.';
        return min === 0 && value == null || Array.isArray(value) && value.length >= min && value.length <= max || `Use ${min}–${max} complete rows.`;
      }) })),
    defineField({ name: 'relatedLinks', type: 'array', hidden: hidden(['manufacturing', 'factory', 'contact']), validation: rule => rule.custom(presence(['manufacturing', 'factory', 'contact'])), of: [{ type: 'object', fields: [
      defineField({ name: 'label', type: 'string', validation: rule => rule.required() }),
      defineField({ name: 'target', type: 'reference', to: [{ type: 'page' }], validation: rule => rule.required() }),
      defineField({ name: 'fragment', type: 'string' }),
    ] }], description: 'Preserve the existing two next links (Contact: the one Manufacturing #prepare link). The reader resolves strong references and rejects changed targets or unsafe fragments.' }),
    defineField({ name: 'gallery', type: 'array', of: [{ type: 'approvedImage' }], hidden: hidden(['factory']), validation: rule => rule.max(4), description: 'Optional real, licensed factory material only. No image means no image, not a generated substitute.' }),
    defineField({ name: 'body', type: 'editorialBody', hidden: hidden(['privacy']), validation: rule => rule.custom((value, context) => context.document?.['pageKey'] === 'privacy' ? validateCmsBodyInput(value) : value == null || 'Only Privacy uses this policy body.') }),
    defineField({ name: 'legalReviewStatus', type: 'string', options: { list: ['pending', 'reviewed'] }, hidden: hidden(['privacy']), validation: rule => rule.custom(presence(['privacy'])), description: 'A recorded review is neither policy activation nor website publication.' }),
    defineField({ name: 'legalReviewedAt', type: 'date', hidden: hidden(['privacy']), validation: rule => rule.custom((value, context) => {
      const status = (context.parent as { legalReviewStatus?: string } | undefined)?.legalReviewStatus;
      return status === 'reviewed' ? !!value || 'A reviewed date is required.' : value == null || 'A pending review cannot have a review date.';
    }) }),
    defineField({ name: 'policyStatus', type: 'string', options: { list: ['draft_not_in_effect'] }, hidden: hidden(['privacy']), validation: rule => rule.custom((value, context) => context.document?.['pageKey'] !== 'privacy' ? value == null || 'Privacy only.' : value === 'draft_not_in_effect' || 'The policy is not in effect in this phase.') }),
    ...['effectiveAt', 'legalEntity', 'privacyContact', 'providers', 'retention'].map(name => defineField({ name, type: 'string', readOnly: true, hidden: hidden(['privacy']), validation: rule => rule.custom(value => value == null || 'Not authorized or established in this phase; keep unset.') })),
  ],
});
