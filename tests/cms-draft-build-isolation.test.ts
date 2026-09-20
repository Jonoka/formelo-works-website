import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { cmsDraftPreviewBuildError, cmsDraftPreviewDevError, assertCmsDraftPreviewDevCommand } from '../web/src/lib/server/cms-draft-preview-mode';
import { dev05bDraftScope } from '../shared/cms-draft-preview';

function treeHash(root: string): string {
  if (!existsSync(root)) return 'absent';
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else files.push(path);
    }
  };
  visit(root);
  const hash = createHash('sha256');
  for (const path of files.sort()) {
    hash.update(relative(root, path).replaceAll('\\', '/')); hash.update('\0'); hash.update(readFileSync(path)); hash.update('\0');
  }
  return hash.digest('hex');
}

function htmlFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.name.endsWith('.html')) files.push(path);
    }
  };
  visit(root); return files;
}

test('draft preview route defense requires the actual astro dev command when enabled', () => {
  assert.doesNotThrow(() => assertCmsDraftPreviewDevCommand(undefined, {}));
  assert.doesNotThrow(() => assertCmsDraftPreviewDevCommand('dev', { DEV_CMS_DRAFT_PREVIEW: '1' }));
  for (const command of [undefined, 'build', 'preview', 'sync', 'development']) {
    assert.throws(() => assertCmsDraftPreviewDevCommand(command, { DEV_CMS_DRAFT_PREVIEW: '1' }), error => error instanceof Error && error.message === cmsDraftPreviewDevError);
  }
});

test('all real Astro build entries reject draft preview before any draft fetch or output, including --mode development', { timeout: 120000 }, () => {
  const root = resolve('.'), local = resolve('.local'); mkdirSync(local, { recursive: true });
  const temporary = mkdtempSync(join(local, 'cms-draft-build-isolation-'));
  const preload = join(temporary, 'no-network.cjs'), countFile = join(temporary, 'fetch-count.txt');
  const npmCli = process.env['npm_execpath'] ?? join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  assert.ok(existsSync(npmCli), 'The current Node runtime must provide npm-cli.js to exercise the real root/workspace build entries.');
  writeFileSync(preload, `const fs=require('node:fs'); globalThis.fetch=async()=>{fs.appendFileSync(process.env.DRAFT_FETCH_COUNT,'1\\n'); throw new Error('OFFLINE_DRAFT_NETWORK_CANARY');};\n`);
  const canary = `OFFLINE_DRAFT_${randomUUID()}`;
  const baseEnv = { ...process.env, FORMELO_ENV_FILES: 'ignore', HOME_CATEGORY_CONTENT_MODE: 'mock', DEV_CMS_DRAFT_PREVIEW: '1', DEPLOY_ENV: 'local', CONTENT_MODE: 'mock', CONCEPT_MODE: 'true', ANALYTICS_MODE: 'off',
    SANITY_PROJECT_ID: dev05bDraftScope.projectId, SANITY_DATASET: dev05bDraftScope.dataset, SANITY_READ_TOKEN: canary,
    SANITY_ARTICLE_READ_IDS: dev05bDraftScope.documentId, SANITY_API_VERSION: '2025-02-19', DRAFT_FETCH_COUNT: countFile,
    NODE_OPTIONS: `${process.env['NODE_OPTIONS'] ? process.env['NODE_OPTIONS'] + ' ' : ''}--require=${preload}` };
  const normalDist = resolve('web/dist'), before = treeHash(normalDist);
  const cases = [
    ['root build', [npmCli, 'run', 'build']],
    ['workspace build', [npmCli, 'run', 'build', '--workspace', '@formelo/web', '--', '--outDir', join(temporary, 'workspace-dist')]],
    ['direct Astro build', ['scripts/run-tool.mjs', 'astro', 'build', '--root', 'web', '--outDir', join(temporary, 'direct-dist')]],
    ['direct Astro build --mode development', ['scripts/run-tool.mjs', 'astro', 'build', '--root', 'web', '--mode', 'development', '--outDir', join(temporary, 'mode-development-dist')]],
  ] as const;
  try {
    for (const [name, args] of cases) {
      rmSync(countFile, { force: true });
      const result = spawnSync(process.execPath, args, { cwd: root, env: baseEnv, encoding: 'utf8', timeout: 30000 });
      const output = (result.stdout ?? '') + (result.stderr ?? '');
      assert.notEqual(result.status, 0, `${name} unexpectedly succeeded with draft preview enabled.`);
      assert.match(output, /CMS_DRAFT_PREVIEW_BUILD_FORBIDDEN/, `${name} did not fail with the explicit build isolation error.`);
      assert.doesNotMatch(output, /OFFLINE_DRAFT_NETWORK_CANARY/);
      assert.equal(existsSync(countFile) ? readFileSync(countFile, 'utf8').trim().split(/\r?\n/).filter(Boolean).length : 0, 0, `${name} attempted a draft/network read before the build guard.`);
      assert.equal(treeHash(normalDist), before, `${name} modified the normal web/dist before being rejected.`);
    }

    const mockOut = join(temporary, 'mock-dist');
    const mockEnv: Record<string, string | undefined> = { ...baseEnv }; delete mockEnv['DEV_CMS_DRAFT_PREVIEW']; rmSync(countFile, { force: true });
    const mock = spawnSync(process.execPath, ['scripts/run-tool.mjs', 'astro', 'build', '--root', 'web', '--outDir', mockOut], { cwd: root, env: mockEnv, encoding: 'utf8', timeout: 60000 });
    assert.equal(mock.status, 0, (mock.stdout ?? '') + (mock.stderr ?? ''));
    assert.equal(existsSync(countFile) ? readFileSync(countFile, 'utf8').trim().split(/\r?\n/).filter(Boolean).length : 0, 0, 'Normal mock build unexpectedly attempted a network read.');
    const html = htmlFiles(mockOut); assert.equal(html.length, 11, 'Normal isolated mock build must remain ten content URLs plus 404.');
    const rendered = html.map(path => readFileSync(path, 'utf8')).join('\n');
    assert.doesNotMatch(rendered, /cms_article_draft_preview|CMS draft preview \/ Not published|DEV-05B integration draft|DRAFT_TEST_/);
    const boundary = spawnSync(process.execPath, ['scripts/check-cms-boundary.mjs', mockOut], { cwd: root, env: mockEnv, encoding: 'utf8', timeout: 10000 });
    assert.equal(boundary.status, 0, (boundary.stdout ?? '') + (boundary.stderr ?? ''));
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
