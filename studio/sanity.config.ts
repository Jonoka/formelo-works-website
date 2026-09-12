import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { pageKeys } from '../shared/content';
import { requireStudioEnvironment } from './environment';
import { schemaTypes } from './schemaTypes';
import { structure } from './structure';

const singletonIds = new Set(['siteSettings', ...pageKeys.map(key => `page.${key}`)]);

export default defineConfig({
  name: 'formelo',
  title: 'FORMELO WORKS — Content',
  ...requireStudioEnvironment(),
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
