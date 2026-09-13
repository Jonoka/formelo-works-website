import type { StructureResolver } from 'sanity/structure';
import { pageKeys } from '../shared/content';

export const structure: StructureResolver = S => S.list().title('Website content').items([
  S.listItem().title('Site settings').child(S.document().schemaType('siteSettings').documentId('siteSettings')),
  ...pageKeys.map(pageKey => S.listItem().id(pageKey).title(pageKey)
    .child(S.document().schemaType('page').documentId(`page.${pageKey}`).initialValueTemplate(`page-${pageKey}`))),
  S.divider(),
  ...S.documentTypeListItems().filter(item => ['category', 'article'].includes(item.getId() ?? '')),
]);
