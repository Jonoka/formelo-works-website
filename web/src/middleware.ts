import { defineMiddleware } from 'astro:middleware';
import { loadSiteDelivery, safeSiteErrorCode } from './lib/server/site-delivery';

/** Shared shell for all ten pages; Home/Category and the five fixed bodies use explicit source groups; articles keep their existing delivery. */
export const onRequest = defineMiddleware(async (context, next) => {
  const command = import.meta.env['FORMELO_ASTRO_COMMAND'];
  try {
    context.locals.siteDelivery = await loadSiteDelivery({ command, buildId: import.meta.env['FORMELO_BUILD_ID'] });
  } catch (error) {
    if (command !== 'dev') throw error;
    const code = safeSiteErrorCode(error);
    // Do not run route loaders after an unavailable shared source or disclose a raw error/cause.
    return new Response(`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>Content unavailable</title></head><body><main data-site-delivery-error="${code}"><h1>Content unavailable</h1><p>The selected source could not be read. No previous or local substitute is shown.</p><p>${code}</p></main></body></html>`, {
      status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  const response = await next();
  if (command === 'dev') response.headers.set('Cache-Control', 'no-store');
  return response;
});
