import type { AstroIntegration } from 'astro';
import { readArticleDeliveryMode } from '../../../../shared/article-delivery';

export const cmsDraftPreviewBuildError = 'CMS_DRAFT_PREVIEW_BUILD_FORBIDDEN: DEV_CMS_DRAFT_PREVIEW is a loopback astro dev feature and cannot be used by astro build.';
export const cmsDraftPreviewDevError = 'CMS_DRAFT_PREVIEW_DEV_ONLY: DEV_CMS_DRAFT_PREVIEW may only read the authorized draft during the actual astro dev command.';
export const cmsDraftPreviewHostError = 'CMS_DRAFT_PREVIEW_LOOPBACK_ONLY: draft preview requires a loopback listener and request host.';

export function assertCmsDraftPreviewLoopback(host: unknown): void {
  if (!['127.0.0.1', '::1', '[::1]', 'localhost'].includes(String(host))) throw new Error(cmsDraftPreviewHostError);
}
/** Actual Astro command, not NODE_ENV, a Vite mode, or an npm script name, is the build fence. */
export function cmsDraftPreviewCommandGuard(env: Record<string, string | undefined> = process.env): AstroIntegration {
  return {
    name: 'formelo-cms-draft-preview-command-guard',
    hooks: {
      'astro:config:setup': ({ command, updateConfig }) => {
        updateConfig({ vite: { define: { 'import.meta.env.FORMELO_ASTRO_COMMAND': JSON.stringify(command) } } });
        // Keep this first: even a conflicting source configuration must never start a draft build.
        if (env['DEV_CMS_DRAFT_PREVIEW'] === '1' && command === 'build') throw new Error(cmsDraftPreviewBuildError);
        const mode = readArticleDeliveryMode(env);
        if (mode === 'draft-preview') {
          assertCmsDraftPreviewDevCommand(command, env);
          if ((env['DEPLOY_ENV'] ?? 'local') !== 'local') throw new Error('CMS_DRAFT_PREVIEW_LOCAL_ONLY');
        }
      },
      'astro:config:done': ({ config }) => {
        if (env['DEV_CMS_DRAFT_PREVIEW'] === '1') assertCmsDraftPreviewLoopback(config.server.host);
      },
      'astro:server:setup': ({ server }) => {
        if (env['DEV_CMS_DRAFT_PREVIEW'] === '1') assertCmsDraftPreviewLoopback(server.config.server.host);
      },
    },
  };
}
export function assertCmsDraftPreviewDevCommand(command: unknown, env: Record<string, string | undefined> = process.env): void {
  if (env['DEV_CMS_DRAFT_PREVIEW'] !== '1') return;
  if (command !== 'dev') throw new Error(cmsDraftPreviewDevError);
}
