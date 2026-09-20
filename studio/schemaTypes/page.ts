import { defineField, defineType } from 'sanity';
import { pageKeys } from '../../shared/content';

export const page = defineType({
  name: 'page', title: 'Fixed page', type: 'document', fields: [
    defineField({ name: 'pageKey', type: 'string', readOnly: true, options: { list: [...pageKeys] }, validation: rule => rule.required() }),
    defineField({ name: 'title', type: 'string', validation: rule => rule.required() }),
    defineField({ name: 'intro', type: 'text', validation: rule => rule.required() }),
    defineField({ name: 'heroImage', type: 'approvedImage', validation: rule => rule.custom((value, context) =>
      (context.parent as { pageKey?: string } | undefined)?.pageKey !== 'home' || value ? true : 'Home requires an approved hero image.') }),
    defineField({ name: 'faqItems', type: 'array', of: [{ type: 'faq' }], validation: rule => rule.custom((value, context) => {
      const key = (context.parent as { pageKey?: string } | undefined)?.pageKey;
      return key !== 'home' && key !== 'manufacturing' || Array.isArray(value) && value.length >= 3 ? true : 'Home and Manufacturing require at least three FAQs.';
    }) }),
    defineField({ name: 'seo', type: 'seo', validation: rule => rule.required() }),
    defineField({ name: 'contentUpdatedAt', type: 'datetime', validation: rule => rule.required() }),
    defineField({ name: 'factConfirmedAt', type: 'date', validation: rule => rule.custom((value, context) => {
      const key = (context.parent as { pageKey?: string } | undefined)?.pageKey;
      return !['home', 'manufacturing', 'factory', 'contact'].includes(key ?? '') || value ? true : 'Business pages require a fact-confirmation date.';
    }) }),
    defineField({ name: 'templateContent', type: 'homeTemplateContent',
      hidden: ({ document }) => document?.['pageKey'] !== 'home',
      validation: rule => rule.custom((value, context) => {
        const isHome = context.document?.['pageKey'] === 'home';
        return isHome ? (value ? true : 'Home requires complete template content.') : (value ? 'Only Home supports this content group in DEV-05E.' : true);
      }),
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'pageKey' } },
});
