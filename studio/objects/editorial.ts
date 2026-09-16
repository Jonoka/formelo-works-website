import { defineArrayMember, defineField, defineType } from 'sanity';
import { validateCmsBodyInput } from '../../shared/cms-body';
import { validateEditorialLink } from '../../shared/editorial-policy';
import { reference } from '../../shared/cms-validation';

export const editorialExternalLink = defineType({ name: 'editorialExternalLink', title: 'Reviewed external source', type: 'object', fields: [
  defineField({ name: 'href', type: 'url', validation: rule => rule.required().custom(value => {
    try { return value && validateEditorialLink(value) === 'source' ? true : 'Use an exact reviewed source URL.'; }
    catch { return 'Use an exact HTTPS URL from config/editorial-sources.json; no resource permission is granted.'; }
  }) }),
] });
export const editorialInternalLink = defineType({ name: 'editorialInternalLink', title: 'Internal content link', type: 'object', fields: [
  defineField({ name: 'target', type: 'reference', to: [{ type: 'page' }, { type: 'category' }, { type: 'article' }], validation: rule => rule.required().custom(value => {
    try { reference(value, 'target'); return true; } catch { return 'A strong published-target reference is required; the build also resolves and validates it.'; }
  }) }),
  defineField({ name: 'fragment', type: 'string', description: 'An existing reviewed anchor without #; blank means the document root.', validation: rule => rule.custom(value => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || 'Use a lowercase anchor without #.') }),
] });
export const portableBlock = (full: boolean) => defineArrayMember({
  type: 'block',
  styles: full ? [{ title: 'Paragraph', value: 'normal' }, { title: 'Heading 2', value: 'h2' }, { title: 'Heading 3', value: 'h3' }] : [{ title: 'Paragraph', value: 'normal' }],
  lists: full ? [{ title: 'Bullet', value: 'bullet' }, { title: 'Numbered', value: 'number' }] : [],
  marks: { decorators: [{ title: 'Strong', value: 'strong' }, { title: 'Emphasis', value: 'em' }], annotations: [{ type: 'editorialInternalLink' }, { type: 'editorialExternalLink' }] },
});
export const editorialTableRow = defineType({ name: 'editorialTableRow', title: 'Table row', type: 'object', fields: [
  defineField({ name: 'cells', type: 'array', of: [{ type: 'string' }], validation: rule => rule.required().min(2).max(6) }),
] });
export const editorialTable = defineType({ name: 'editorialTable', title: 'Simple text table', type: 'object', fields: [
  defineField({ name: 'caption', type: 'string', validation: rule => rule.required() }),
  defineField({ name: 'columns', type: 'array', of: [{ type: 'string' }], validation: rule => rule.required().min(2).max(6) }),
  defineField({ name: 'rows', type: 'array', of: [{ type: 'editorialTableRow' }], validation: rule => rule.required().min(1).max(30) }),
], description: 'First cell is a row header. Every row must match the column count. No merged cells or embedded markup.' });
export const editorialCallout = defineType({ name: 'editorialCallout', title: 'Editorial note', type: 'object', fields: [
  defineField({ name: 'title', type: 'string', validation: rule => rule.required() }),
  defineField({ name: 'content', type: 'array', of: [portableBlock(false)], validation: rule => rule.required().length(1) }),
] });
export const editorialTemplate = defineType({ name: 'editorialTemplate', title: 'Plain-text enquiry template', type: 'object', fields: [
  defineField({ name: 'title', type: 'string', validation: rule => rule.required() }),
  defineField({ name: 'text', type: 'text', rows: 12, validation: rule => rule.required(), description: 'Plain text only. Line breaks are preserved; no copy action, upload or send function.' }),
] });
export const editorialBody = defineType({ name: 'editorialBody', title: 'Controlled article body', type: 'array', of: [
  portableBlock(true), defineArrayMember({ type: 'editorialTable' }), defineArrayMember({ type: 'editorialCallout' }), defineArrayMember({ type: 'editorialTemplate' }),
], validation: rule => rule.required().min(1).max(160).custom(validateCmsBodyInput),
  description: 'H2/H3 are plain text; strong/emphasis and links belong in paragraphs/lists. Lists are one level. Unknown formatting fails instead of being dropped.' });
export const editorialObjectTypes = [editorialExternalLink, editorialInternalLink, editorialTableRow, editorialTable, editorialCallout, editorialTemplate, editorialBody];
