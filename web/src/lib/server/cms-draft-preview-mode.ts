import type { AstroIntegration } from 'astro';

export const cmsDraftPreviewBuildError = 'CMS_DRAFT_PREVIEW_BUILD_FORBIDDEN: DEV_CMS_DRAFT_PREVIEW is a loopback astro dev feature and cannot be used by astro build.';
export const cmsDraftPreviewDevError = 'CMS_DRAFT_PREVIEW_DEV_ONLY: DEV_CMS_DRAFT_PREVIEW may only read the authorized draft during the actual astro dev command.';

/**
 * Astro's command value is authoritative for dev/build separation and is not derived from
 * DEPLOY_ENV, npm script names, NODE_ENV, or Vite mode. The define is a second route-level
 * fence; the build error itself is thrown during astro:config:setup before routes execute.
 */
export function cmsDraftPreviewCommandGuard(env: Record<string, string | undefined> = process.env): AstroIntegration {
  return {
    name: 'formelo-cms-draft-preview-command-guard',
    hooks: {
      'astro:config:setup': ({ command, updateConfig }) => {
        updateConfig({ vite: { define: { 'import.meta.env.FORMELO_ASTRO_COMMAND': JSON.stringify(command) } } });
        if (env['DEV_CMS_DRAFT_PREVIEW'] === '1' && command === 'build') throw new Error(cmsDraftPreviewBuildError);
      },
    },
  };
}

export function assertCmsDraftPreviewDevCommand(command: unknown, env: Record<string, string | undefined> = process.env): void {
  if (env['DEV_CMS_DRAFT_PREVIEW'] !== '1') return;
  if (command !== 'dev') throw new Error(cmsDraftPreviewDevError);
}
