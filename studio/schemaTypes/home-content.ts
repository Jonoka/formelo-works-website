import { defineField, defineType } from 'sanity';
import { homeSectionKeys, sitePlainText } from '../../shared/cms-home';

const text = (name: string, type: 'string' | 'text' = 'string') => defineField({ name, type, validation: rule => rule.required().custom(value => {
  try { sitePlainText(value, 'home'); return true; } catch { return 'Use non-empty plain text, without HTML or scripts.'; }
}) });
const items = (name: string, min: number, max: number) => defineField({ name, type: 'array', of: [{ type: 'object', fields: [text('title'), text('description', 'text')] }], validation: rule => rule.required().min(min).max(max) });
/** Registered object name matches the fixed query/converter discriminator. Still only four documents. */
export const homeTemplateContent = defineType({
  name: 'homeTemplateContent', title: 'Home content', type: 'object',
  fields: [
    text('eyebrow'),
    defineField({ name: 'titleLineHints', type: 'array', of: [{ type: 'string' }], validation: rule => rule.max(8), description: 'Optional. Lines are used only when their joined text exactly equals the current page title.' }),
    defineField({ name: 'sections', type: 'object', fields: homeSectionKeys.map(name => defineField({ name, type: 'object', fields: [text('eyebrow'), text('title'), text('description', 'text')], validation: rule => rule.required() })), validation: rule => rule.required() }),
    items('capabilities', 2, 4),
    defineField({ name: 'manufacturingSummary', type: 'object', fields: [text('customization', 'text'), text('sampling', 'text')], validation: rule => rule.required() }),
    text('factorySummary', 'text'),
    defineField({ name: 'factoryImage', type: 'approvedImage', description: 'Optional. Missing means no photograph, not a stock or concept replacement.' }),
    items('processSteps', 3, 5),
  ],
});
