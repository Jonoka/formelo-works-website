import { defineField, defineType } from 'sanity';
import { pageKeys } from '../../shared/content';

export const page = defineType({
  name: 'page', title: 'Fixed page', type: 'document', fields: [
    defineField({ name: 'pageKey', type: 'string', readOnly: true, options: { list: [...pageKeys] }, validation: rule => rule.required() }),
    defineField({ name: 'title', type: 'string', validation: rule => rule.required() }),
    defineField({ name: 'intro', type: 'text', validation: rule => rule.required() }),
    defineField({ name: 'heroImage', type: 'approvedImage' }),
    defineField({ name: 'faqItems', type: 'array', of: [{ type: 'faq' }] }),
    defineField({ name: 'seo', type: 'seo', validation: rule => rule.required() }),
    defineField({ name: 'contentUpdatedAt', type: 'datetime', validation: rule => rule.required() }),
    defineField({ name: 'factConfirmedAt', type: 'date' }),
    // Fixed templateContent field groups are deliberately deferred to DEV-05.
  ],
  preview: { select: { title: 'title', subtitle: 'pageKey' } },
});
