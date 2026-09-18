import { defineField, defineType } from 'sanity';
import { validSlug } from '../validation';

export const category = defineType({
  name: 'category', title: 'Category', type: 'document', fields: [
    ...['name', 'categoryCode', 'referenceCode', 'title'].map(name => defineField({ name, type: 'string', validation: rule => rule.required() })),
    defineField({ name: 'slug', type: 'slug', options: { source: 'name' }, validation: rule => rule.required().custom(validSlug) }),
    defineField({ name: 'intro', type: 'text', validation: rule => rule.required() }),
    defineField({ name: 'heroImage', type: 'approvedImage', validation: rule => rule.required() }),
    defineField({ name: 'samples', type: 'array', of: [{ type: 'sample' }], validation: rule => rule.required().min(3) }),
    defineField({ name: 'capabilityRows', type: 'array', of: [{ type: 'capabilityRow' }], validation: rule => rule.required().min(1) }),
    defineField({ name: 'moqMode', type: 'string', options: { list: ['inherit', 'override'] }, initialValue: 'inherit', validation: rule => rule.required() }),
    defineField({ name: 'moqOverride', type: 'moqPolicy', validation: rule => rule.custom((value, context) => {
      const mode = (context.parent as { moqMode?: string } | undefined)?.moqMode;
      if (mode === 'override') return value ? true : 'An override needs a complete MOQ policy.';
      if (mode === 'inherit' && value) return 'Inherited MOQ must not include an override.';
      return true;
    }) }),
    defineField({ name: 'customizationNotes', type: 'text', validation: rule => rule.required() }),
    defineField({ name: 'samplingNotes', type: 'text', validation: rule => rule.required() }),
    defineField({ name: 'evidenceImages', type: 'array', of: [{ type: 'approvedImage' }], validation: rule => rule.required().min(1) }),
    defineField({ name: 'faqItems', type: 'array', of: [{ type: 'faq' }], validation: rule => rule.required().min(3) }),
    defineField({ name: 'relatedArticles', type: 'array', of: [{ type: 'reference', to: [{ type: 'article' }] }], validation: rule => rule.max(2).unique() }),
    defineField({ name: 'seo', type: 'seo', validation: rule => rule.required() }),
    defineField({ name: 'contentUpdatedAt', type: 'datetime', validation: rule => rule.required() }),
    defineField({ name: 'factConfirmedAt', type: 'date', validation: rule => rule.required() }),
  ],
});
