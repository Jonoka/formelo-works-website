import { defineConfig } from 'astro/config';
import { loadLocalEnvironment, readRuntime } from '../config/runtime';
import { cmsDraftPreviewCommandGuard } from './src/lib/server/cms-draft-preview-mode';

loadLocalEnvironment();
readRuntime();

export default defineConfig({
  integrations: [cmsDraftPreviewCommandGuard()],
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  server: { host: '127.0.0.1', port: 4321 },
  // Keep processed enhancements external; the static policy rejects inline JavaScript.
  // This also prevents automatic inlining of small CSS/image assets.
  vite: { ...(process.env['FORMELO_ENV_FILES'] === 'ignore' ? { envDir: false as const } : {}), build: { assetsInlineLimit: 0 } },
  // No fake site origin, sitemap, adapter, analytics or deployment integration.
});
