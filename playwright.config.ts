import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 20000,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env['CI']),
  reporter: 'list',
  use: { browserName: 'chromium', trace: 'retain-on-failure' },
  projects: [
    { name: 'preview', use: { baseURL: 'http://127.0.0.1:4321' } },
    { name: 'dev', use: { baseURL: 'http://127.0.0.1:4322' } },
  ],
  webServer: [
    { name: 'static-preview', command: 'npm run preview', url: 'http://127.0.0.1:4321', reuseExistingServer: false, timeout: 60000 },
    { name: 'development', command: 'node scripts/run-tool.mjs astro dev --root web --host 127.0.0.1 --port 4322', url: 'http://127.0.0.1:4322', reuseExistingServer: false, timeout: 60000 },
  ],
});
