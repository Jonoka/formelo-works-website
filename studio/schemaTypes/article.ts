import { defineField, defineType } from 'sanity';
import { articleScopes, articleSlug } from '../../shared/cms-article';
import { validateCmsBodyInput } from '../../shared/cms-body';
import { date } from '../../shared/cms-validation';

export const article = defineType({
  name: 'article', title: 'Article', type: 'document', fields: [
    ...['title', 'authorDisplay'].map(name => defineField({ name, type: 'string', validation: rule => rule.required().custom(value => !!value?.trim() || 'Supply the actual public text; no generated author.') })),
    defineField({ name: 'referenceCode', type: 'string', options: { list: ['WEB-QUOTE-GUIDE', 'WEB-MOQ-GUIDE'] }, validation: rule => rule.required().custom((value, context) => {
      const slug = (context.document as { slug?: { current?: string } } | undefined)?.slug?.current;
      try { return value === articleScopes[articleSlug(slug)].referenceCode || 'The stable source code must match the approved route.'; } catch { return 'Select one of the two existing article routes.'; }
    }) }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: rule => rule.required().custom(value => {
      try { articleSlug(value?.current); return true; } catch { return 'DEV-05A is limited to the two existing article slugs.'; }
    }) }),
    defineField({ name: 'excerpt', type: 'text', validation: rule => rule.required() }),
    defineField({ name: 'coverImage', type: 'approvedImage', validation: rule => rule.required() }),
    defineField({ name: 'body', type: 'editorialBody', validation: rule => rule.required().custom(validateCmsBodyInput) }),
    defineField({ name: 'publishedAt', type: 'datetime', description: 'Actual first public publication date, not Sanity _createdAt/_updatedAt or a build time.', validation: rule => rule.required().custom(value => {
      try { date(value, 'publishedAt', Date.now(), true); return true; } catch { return 'Supply a real non-future UTC publication date; scheduling is not implemented.'; }
    }) }),
    defineField({ name: 'contentUpdatedAt', type: 'datetime', validation: rule => rule.required().custom((value, context) => {
      const publishedAt = (context.document as { publishedAt?: string } | undefined)?.publishedAt;
      try { date(value, 'contentUpdatedAt', Date.now(), true); return !!publishedAt && Date.parse(value!) >= Date.parse(publishedAt) || 'Content updates cannot precede publication.'; } catch { return 'Supply the actual non-future content update time.'; }
    }) }),
    defineField({ name: 'factReviewStatus', type: 'string', initialValue: 'pending', options: { list: ['pending', 'confirmed'] }, description: 'Manual factory confirmation only. Sanity publishing never changes this field and is not website deployment.', validation: rule => rule.required().custom(value => value === 'confirmed' || 'Factory confirmation is still required before technical publication.') }),
    defineField({ name: 'factConfirmedAt', type: 'date', validation: rule => rule.required().custom((value, context) => {
      const updated = (context.document as { contentUpdatedAt?: string } | undefined)?.contentUpdatedAt;
      try { date(value, 'factConfirmedAt', Date.now()); return !!updated && value! >= updated.slice(0, 10) || 'Reconfirm the facts after substantive edits.'; } catch { return 'Supply the actual non-future factory confirmation date.'; }
    }) }),
    defineField({ name: 'relatedCategories', type: 'array', of: [{ type: 'reference', to: [{ type: 'category' }] }], validation: rule => rule.max(2).unique() }),
    defineField({ name: 'relatedArticles', type: 'array', of: [{ type: 'reference', to: [{ type: 'article' }] }], validation: rule => rule.max(2).unique().custom((value, context) => {
      const ownId = context.document?._id.replace(/^drafts\./, '');
      return !value?.some(item => (item as { _ref?: string })._ref === ownId) || 'An article cannot recommend itself.';
    }) }),
    defineField({ name: 'linkToManufacturing', type: 'boolean' }),
    defineField({ name: 'seo', type: 'seo', validation: rule => rule.required() }),
  ],
});
