import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { pageKeys } from '../shared/content';
import { requireStudioEnvironment } from './environment';
import { schemaTypes } from './schemaTypes';
import { structure } from './structure';

const singletonIds = new Set(['siteSettings', ...pageKeys.map(key => `page.${key}`)]);
// Direct property access is required so Sanity/Vite can replace the two public Studio variables in the browser bundle.
// The shared validator still accepts explicit objects in offline tests and still rejects Studio-prefixed secret names.
const studioEnvironment = requireStudioEnvironment({
  SANITY_STUDIO_PROJECT_ID: process.env.SANITY_STUDIO_PROJECT_ID,
  SANITY_STUDIO_DATASET: process.env.SANITY_STUDIO_DATASET,
});

export default defineConfig({
  name: 'formelo',
  title: 'FORMELO WORKS — Content',
  ...studioEnvironment,
  plugins: [structureTool({ structure })],
  schema: {
    types: schemaTypes,
    templates: previous => [
      ...previous.filter(template => !['page', 'siteSettings'].includes(template.schemaType)),
      ...pageKeys.map(pageKey => ({ id: `page-${pageKey}`, title: pageKey, schemaType: 'page', value: { pageKey } })),
    ],
  },
  document: {
    newDocumentOptions: previous => previous.filter(option => !option.templateId.startsWith('page-') && option.templateId !== 'siteSettings'),
    actions: (previous, context) => singletonIds.has((context.documentId ?? '').replace(/^drafts\./, ''))
      ? previous.filter(action => action.action !== 'delete' && action.action !== 'duplicate')
      : previous,
  },
});
