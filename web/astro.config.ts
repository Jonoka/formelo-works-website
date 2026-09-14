import { defineConfig } from 'astro/config';
import { loadLocalEnvironment, readRuntime } from '../config/runtime';

loadLocalEnvironment();
readRuntime();

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  server: { host: '127.0.0.1', port: 4321 },
  // Keep processed enhancements external; the static policy rejects inline JavaScript.
  // This also prevents automatic inlining of small CSS/image assets.
  vite: { build: { assetsInlineLimit: 0 } },
  // No fake site origin, sitemap, adapter, analytics or deployment integration.
});
