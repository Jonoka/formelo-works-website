import { defineField, defineType } from 'sanity';
import { validSlug } from '../validation';

export const category = defineType({
  name: 'category', title: 'Category', type: 'document', fields: [
    ...['name', 'categoryCode', 'referenceCode', 'title'].map(name => defineField({ name, type: 'string', validation: rule => rule.required() })),
    defineField({ name: 'slug', type: 'slug', options: { source: 'name' }, validation: rule => rule.required().custom(validSlug) }),
    defineField({ name: 'intro', type: 'text', validation: rule => rule.required() }),
    defineField({ name: 'heroImage', type: 'approvedImage', validation: rule => rule.required() }),
    defineField({ name: 'samples', type: 'array', of: [{ type: 'sample' }], validation: rule => rule.required().min(3) }),
    defineField({ name: 'moqMode', type: 'string', options: { list: ['inherit', 'override'] }, initialValue: 'inherit', validation: rule => rule.required() }),
    defineField({ name: 'moqOverride', type: 'moqPolicy', validation: rule => rule.custom((value, context) =>
      (context.parent as { moqMode?: string } | undefined)?.moqMode !== 'override' || value ? true : 'An override needs a complete MOQ policy.') }),
    defineField({ name: 'customizationNotes', type: 'text' }),
    defineField({ name: 'samplingNotes', type: 'text' }),
    defineField({ name: 'faqItems', type: 'array', of: [{ type: 'faq' }] }),
    defineField({ name: 'relatedArticles', type: 'array', of: [{ type: 'reference', to: [{ type: 'article' }] }], validation: rule => rule.max(2).unique() }),
    defineField({ name: 'seo', type: 'seo', validation: rule => rule.required() }),
    defineField({ name: 'contentUpdatedAt', type: 'datetime', validation: rule => rule.required() }),
    defineField({ name: 'factConfirmedAt', type: 'date', validation: rule => rule.required() }),
  ],
});
