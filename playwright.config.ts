import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser', timeout: 30000, workers: 1, retries: 0,
  forbidOnly: Boolean(process.env['CI']),
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]],
  use: { browserName: 'chromium', trace: 'retain-on-failure' },
  projects: [
    { name: 'preview', testIgnore: ['**/article-delivery-offline.spec.ts', '**/site-delivery-offline.spec.ts'], use: { baseURL: 'http://127.0.0.1:4321' } },
    { name: 'dev', testIgnore: ['**/article-delivery-offline.spec.ts', '**/site-delivery-offline.spec.ts'], use: { baseURL: 'http://127.0.0.1:4322' } },
    { name: 'cms-offline', testMatch: '**/article-delivery-offline.spec.ts' },
    { name: 'site-offline', testMatch: '**/site-delivery-offline.spec.ts' },
  ],
  webServer: [
    { name: 'static-preview', command: 'npm run preview', url: 'http://127.0.0.1:4321', reuseExistingServer: false, timeout: 60000 },
    { name: 'development', command: 'node scripts/run-tool.mjs astro dev --root web --host 127.0.0.1 --port 4322', url: 'http://127.0.0.1:4322', reuseExistingServer: false, timeout: 60000 },
  ],
});
