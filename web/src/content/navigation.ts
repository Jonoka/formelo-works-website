import { pageContexts } from '../../../config/page-context';
import routes from '../../../config/routes.json';
/** Ten implemented content routes; the original home #journal anchor is also preserved. */
export const homepageNavigation = [
  { label: pageContexts.manufacturing.label, href: pageContexts.manufacturing.path },
  { label: pageContexts.factory.label, href: pageContexts.factory.path },
  { label: pageContexts.blog.label, href: pageContexts.blog.path },
  { label: pageContexts.contact.label, href: pageContexts.contact.path },
] as const;
export const demonstrationNavigation = [
  { label: pageContexts.tshirts.label, href: pageContexts.tshirts.path },
  { label: pageContexts.hoodies.label, href: pageContexts.hoodies.path },
] as const;
export const footerNavigation = [
  homepageNavigation[0], homepageNavigation[1],
  { label: 'Process', href: routes.processLink }, homepageNavigation[2], homepageNavigation[3],
  { label: 'Privacy', href: '/privacy/' },
] as const;
