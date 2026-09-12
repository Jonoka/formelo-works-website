import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { readRuntime } from '../config/runtime';
import routes from '../config/routes.json';
import { loadContent } from '../web/src/lib/content';

const root = fileURLToPath(new URL('../', import.meta.url));

test('local mode has safe defaults without a CMS account', () => {
  assert.deepEqual(readRuntime({}), { deployEnv: 'local', contentMode: 'mock', conceptMode: true, analyticsMode: 'off' });
});
for (const [name, env, message] of [
  ['production', { DEPLOY_ENV: 'production' }, /PRODUCTION_BLOCKED/],
  ['unknown environment', { DEPLOY_ENV: 'prod' }, /DEPLOY_ENV/],
  ['unimplemented CMS', { CONTENT_MODE: 'sanity' }, /No fallback/],
  ['disabled concept mode', { CONCEPT_MODE: 'false' }, /CONCEPT_MODE/],
  ['unapproved analytics', { ANALYTICS_MODE: 'approved' }, /ANALYTICS_MODE/],
] as const) {
  test(`configuration rejects ${name}`, () => assert.throws(() => readRuntime(env), message));
}

test('mock content has no contacts, invented factory facts, categories or articles', async () => {
  const content = await loadContent('mock');
  const settings = content.siteSettings;
  assert.equal(settings.email, null);
  assert.equal(settings.whatsappDigits, null);
  assert.deepEqual(settings.channelStatus, { emailEnabled: false, whatsappEnabled: false });
  assert.equal(settings.factoryName, null);
  assert.equal(settings.defaultMoq, null);
  assert.equal(settings.factConfirmedAt, null);
  assert.deepEqual(content.categories, []);
  assert.deepEqual(content.articles, []);
  assert.equal(content.home.pageKey, 'home');
});

test('mock snapshots are independent and an unknown provider cannot silently fall back', async () => {
  const first = await loadContent('mock');
  first.home.title = 'Changed only in this test';
  assert.notEqual((await loadContent('mock')).home.title, first.home.title);
  await assert.rejects(loadContent('sanity'), /refusing to fall back/);
});

test('planned ten-URL scope and process anchor are preserved', () => {
  assert.equal(routes.pages.length, 10);
  assert.equal(new Set(routes.pages.map(page => page.path)).size, 10);
  assert.equal(new Set(routes.pages.map(page => page.template)).size, 8);
  assert.equal(routes.processLink, '/manufacturing/#production');
});

test('Studio dev and build fail before loading the CLI when configuration is missing', { timeout: 15000 }, () => {
  for (const command of ['dev', 'build']) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/run-tool.mjs', import.meta.url)), 'sanity', command], {
      cwd: `${root}/studio`,
      // Empty existing values prevent a local .env from activating a real account in this negative test.
      env: { ...process.env, SANITY_STUDIO_PROJECT_ID: '', SANITY_STUDIO_DATASET: '', CI: 'true' },
      encoding: 'utf8', timeout: 5000,
    });
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout + result.stderr, /STUDIO_NOT_CONFIGURED/);
  }
});

test('the real Astro build command rejects a production attempt', { timeout: 30000 }, () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/run-tool.mjs', import.meta.url)), 'astro', 'build'], {
    cwd: `${root}/web`,
    env: { ...process.env, DEPLOY_ENV: 'production', CONTENT_MODE: 'mock', CONCEPT_MODE: 'true', ANALYTICS_MODE: 'off', CI: 'true' },
    encoding: 'utf8', timeout: 25000,
  });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /PRODUCTION_BLOCKED/);
});
