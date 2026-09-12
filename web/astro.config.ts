import { defineConfig } from 'astro/config';
import { loadLocalEnvironment, readRuntime } from '../config/runtime';

loadLocalEnvironment();
readRuntime();

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  server: { host: '127.0.0.1', port: 4321 },
  // No fake site origin, sitemap, adapter, analytics or deployment integration.
});
