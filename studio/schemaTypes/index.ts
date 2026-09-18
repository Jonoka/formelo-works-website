import { objectTypes } from '../objects';
import { siteSettings } from './siteSettings';
import { page } from './page';
import { category } from './category';
import { article } from './article';
import { homeTemplateContent } from './home-content';

export const documentTypes = [siteSettings, page, category, article];
export const schemaTypes = [...objectTypes, homeTemplateContent, ...documentTypes];
