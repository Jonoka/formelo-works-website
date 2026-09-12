import { defineArrayMember, defineField, defineType } from 'sanity';
import { validMoq } from '../validation';

export const seo = defineType({
  name: 'seo', title: 'SEO', type: 'object', fields: [
    defineField({ name: 'seoTitle', type: 'string', validation: rule => rule.required() }),
    defineField({ name: 'seoDescription', type: 'text', rows: 3, validation: rule => rule.required() }),
  ],
});
export const approvedImage = defineType({
  name: 'approvedImage', title: 'Approved public image', type: 'image', options: { hotspot: true },
  fields: [
    defineField({ name: 'alt', type: 'string', validation: rule => rule.custom((value, context) =>
      (context.parent as { decorative?: boolean } | undefined)?.decorative || value?.trim() ? true : 'Non-decorative images need alternative text.') }),
    defineField({ name: 'decorative', type: 'boolean', initialValue: false }),
    defineField({ name: 'caption', type: 'string' }),
    defineField({ name: 'publicUseApproved', type: 'boolean', initialValue: false,
      description: 'Confirmation by the rights holder is required; this field does not establish permission by itself.',
      validation: rule => rule.required().custom(value => value === true || 'Public-use approval is required.') }),
  ],
});
export const faq = defineType({ name: 'faq', type: 'object', fields: [
  defineField({ name: 'question', type: 'string', validation: rule => rule.required() }),
  defineField({ name: 'answer', type: 'text', validation: rule => rule.required() }),
] });
export const moqPolicy = defineType({ name: 'moqPolicy', title: 'MOQ policy', type: 'object', validation: rule => rule.custom(validMoq), fields: [
  defineField({ name: 'mode', type: 'string', options: { list: ['confirmedQuantity', 'projectBased'] }, validation: rule => rule.required() }),
  defineField({ name: 'quantity', type: 'number', validation: rule => rule.integer().positive() }),
  ...['unit', 'basis', 'sizeMixing', 'conditions'].map(name => defineField({ name, type: 'string', validation: rule => rule.required() })),
  defineField({ name: 'confirmedAt', type: 'date', validation: rule => rule.required() }),
] });
export const sample = defineType({ name: 'sample', type: 'object', fields: [
  ...['sampleCode', 'name', 'summary'].map(name => defineField({ name, type: 'string', validation: rule => rule.required() })),
  defineField({ name: 'images', type: 'array', of: [defineArrayMember({ type: 'approvedImage' })], validation: rule => rule.required().min(1) }),
  defineField({ name: 'fabric', type: 'string' }),
  defineField({ name: 'weightGsm', type: 'number', validation: rule => rule.positive() }),
  defineField({ name: 'fit', type: 'string' }),
  defineField({ name: 'techniqueNotes', type: 'text' }),
] });

export const objectTypes = [seo, approvedImage, faq, moqPolicy, sample];
