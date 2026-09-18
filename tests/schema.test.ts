import assert from 'node:assert/strict';
import test from 'node:test';
import { Schema } from '@sanity/schema';
import { schemaTypes, documentTypes } from '../studio/schemaTypes';
import { pageKeys } from '../shared/content';
import { requireStudioEnvironment } from '../studio/environment';
import { validMoq, validSlug } from '../studio/validation';
import { mockContent } from '../web/src/content/mock';

test('all four document types and fourteen shared object types compile without a Sanity account', () => {
  assert.deepEqual(documentTypes.map(type => type.name), ['siteSettings', 'page', 'category', 'article']);
  assert.equal(schemaTypes.length, 18);
  const schema = Schema.compile({ name: 'formelo-offline-schema', types: schemaTypes });
  for (const type of schemaTypes) assert.ok(schema.get(type.name), `Missing compiled type: ${type.name}`);
});

test('mock settings and home fields align with the starter Sanity models', () => {
  for (const [model, document] of [['siteSettings', mockContent.siteSettings], ['page', mockContent.home]] as const) {
    const type = documentTypes.find(type => type.name === model);
    assert.ok(type);
    const fields = new Set(type.fields.map(field => field.name));
    for (const key of Object.keys(document).filter(key => key !== '_type')) assert.ok(fields.has(key), `${model}.${key}`);
  }
  assert.deepEqual(pageKeys, ['home', 'manufacturing', 'factory', 'contact', 'blogIndex', 'privacy']);
});

test('Studio requires explicit account configuration instead of a fake project', () => {
  assert.throws(() => requireStudioEnvironment({}), /STUDIO_NOT_CONFIGURED/);
  assert.throws(() => requireStudioEnvironment({ SANITY_STUDIO_PROJECT_ID: 'placeholder', SANITY_STUDIO_DATASET: 'test' }), /Invalid Sanity project/);
});

test('slug validation rejects paths, reserved punctuation and empty values', () => {
  assert.equal(validSlug({ current: 'cotton-jersey' }), true);
  for (const current of ['', '../secret', '/clothing/', 'Uppercase', 'a?b', 'a#b', 'a--b']) {
    assert.notEqual(validSlug({ current }), true, current);
  }
});

test('MOQ quantities cannot masquerade as project-based conditions', () => {
  assert.equal(validMoq({ mode: 'projectBased' }), true);
  assert.equal(validMoq({ mode: 'confirmedQuantity', quantity: 1 }), true);
  for (const value of [null, { mode: 'unknown' }, { mode: 'confirmedQuantity' }, { mode: 'confirmedQuantity', quantity: 0 }, { mode: 'confirmedQuantity', quantity: 1.5 }, { mode: 'projectBased', quantity: 1 }]) {
    assert.notEqual(validMoq(value), true);
  }
});

// Keep the original all-fields CMS assertion above; do not replace it with a whitelist.
test('homepage presentation is separate from persisted CMS fields and images', () => {
  const { home, homepagePreview } = mockContent;
  assert.equal(home._type, 'page');
  assert.equal('_type' in homepagePreview, false);
  assert.equal('pageKey' in homepagePreview, false);
  assert.equal(home.heroImage, undefined, 'No fabricated CMS image reference');
  for (const key of Object.keys(homepagePreview)) {
    assert.equal(Object.hasOwn(home, key), false, `Preview field leaked into Page: ${key}`);
  }
  assert.equal(homepagePreview.factsStatus, 'unconfirmed');
  assert.equal(homepagePreview.heroImage.source, 'local');
  assert.equal('asset' in homepagePreview.heroImage, false);
  assert.equal('_ref' in homepagePreview.heroImage, false);
});
