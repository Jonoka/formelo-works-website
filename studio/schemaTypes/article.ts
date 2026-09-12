import { defineField, defineType } from 'sanity';
import { validSlug } from '../validation';

export const article = defineType({
  name: 'article', title: 'Article', type: 'document', fields: [
    ...['title', 'referenceCode', 'authorDisplay'].map(name => defineField({ name, type: 'string', validation: rule => rule.required() })),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: rule => rule.required().custom(validSlug) }),
    defineField({ name: 'excerpt', type: 'text', validation: rule => rule.required() }),
    defineField({ name: 'coverImage', type: 'approvedImage', validation: rule => rule.required() }),
    defineField({ name: 'body', type: 'array', of: [{
      type: 'block', styles: [{ title: 'Normal', value: 'normal' }, { title: 'Heading 2', value: 'h2' }, { title: 'Heading 3', value: 'h3' }],
      lists: [{ title: 'Bullet', value: 'bullet' }, { title: 'Numbered', value: 'number' }],
      marks: { decorators: [{ title: 'Strong', value: 'strong' }, { title: 'Emphasis', value: 'em' }], annotations: [] },
    }], validation: rule => rule.required().min(1) }),
    defineField({ name: 'publishedAt', type: 'datetime', validation: rule => rule.required().custom(value =>
      !value || Date.parse(value) <= Date.now() ? true : 'Scheduled publishing is outside the initial scope.') }),
    defineField({ name: 'contentUpdatedAt', type: 'datetime', validation: rule => rule.required().custom((value, context) => {
      const publishedAt = (context.document as { publishedAt?: string } | undefined)?.publishedAt;
      return !value || !publishedAt || Date.parse(value) >= Date.parse(publishedAt) ? true : 'Content updates cannot precede publication.';
    }) }),
    defineField({ name: 'factConfirmedAt', type: 'date', validation: rule => rule.required() }),
    defineField({ name: 'relatedCategories', type: 'array', of: [{ type: 'reference', to: [{ type: 'category' }] }], validation: rule => rule.max(2).unique() }),
    defineField({ name: 'linkToManufacturing', type: 'boolean' }),
    defineField({ name: 'seo', type: 'seo', validation: rule => rule.required() }),
  ],
});
