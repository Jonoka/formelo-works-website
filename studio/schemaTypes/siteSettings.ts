import { defineField, defineType } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings', title: 'Site settings', type: 'document',
  fields: [
    ...['brandName', 'factoryName', 'contactPersonOrTeam', 'businessHours', 'timezone', 'publicAddress'].map(name =>
      defineField({ name, type: 'string', validation: rule => rule.required() })),
    defineField({ name: 'email', type: 'string', validation: rule => rule.required().email().custom(value =>
      !value || !/[\r\n,;?]/.test(value) ? true : 'Use one plain email address without headers or recipient lists.') }),
    defineField({ name: 'whatsappDigits', type: 'string', validation: rule => rule.required().regex(/^[1-9][0-9]{6,14}$/),
      description: 'International digits only. Format checks do not verify registration or message delivery.' }),
    defineField({ name: 'channelStatus', type: 'object', fields: [
      defineField({ name: 'emailEnabled', type: 'boolean', initialValue: false }),
      defineField({ name: 'whatsappEnabled', type: 'boolean', initialValue: false }),
    ], validation: rule => rule.required() }),
    defineField({ name: 'defaultMoq', type: 'moqPolicy', validation: rule => rule.required() }),
    defineField({ name: 'logo', type: 'approvedImage' }),
    defineField({ name: 'defaultOgImage', type: 'approvedImage' }),
    defineField({ name: 'featuredCategories', type: 'array', of: [{ type: 'reference', to: [{ type: 'category' }] }], validation: rule => rule.max(2).unique() }),
    defineField({ name: 'factConfirmedAt', type: 'date', validation: rule => rule.required() }),
  ],
});
