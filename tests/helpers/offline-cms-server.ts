// Test-only process harness. It intercepts the real server reader's fetch before Astro loads.
// Every credential and response here is synthetic; no Sanity connection is made.
import { spawn, execFileSync, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer, type AddressInfo } from 'node:net';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { dev05bDraftScope } from '../../shared/cms-draft-preview';
import { fixtureContext, fixtureArticle, previews } from '../fixtures/cms-articles';
import { draftDeliveryFixture } from '../fixtures/cms-delivery';

export type OfflineMode = 'draft-preview' | 'published';
export function publishedDeliveryFixtures(revision = 'one') {
  return previews.map(preview => {
    const article = fixtureArticle(preview);
    return { ...article, _id: String(article['_id']), _rev: `offline-published-${revision}`,
      title: `OFFLINE FIXTURE: ${preview.title} ${revision}`, excerpt: `OFFLINE FIXTURE: published ${preview.slug}, revision ${revision}.`,
      seo: { seoTitle: `Offline published SEO: ${preview.slug} ${revision}`, seoDescription: `Independent offline published description: ${preview.slug}, revision ${revision}.` },
    };
  });
}
export function sourceIdentity() {
  const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();
  const status = git('status', '--porcelain=v1', '--untracked-files=all');
  return { head: git('rev-parse', 'HEAD'), tree: git('rev-parse', 'HEAD^{tree}'), branch: git('branch', '--show-current'),
    workingTreeClean: status === '', workingTreeStatusSha256: createHash('sha256').update(status).digest('hex'), platform: process.platform, node: process.version };
}
export function createOfflineCmsHarness(mode: OfflineMode) {
  mkdirSync('.local', { recursive: true });
  const directory = mkdtempSync(resolve('.local', 'cms-delivery-offline-'));
  const statePath = join(directory, 'response.json'), callsPath = join(directory, 'calls.jsonl'), preload = join(directory, 'preload.mjs');
  const token = `OFFLINE_TEST_${randomUUID()}`;
  const initial = mode === 'draft-preview' ? [draftDeliveryFixture()] : publishedDeliveryFixtures();
  const projectId = mode === 'draft-preview' ? dev05bDraftScope.projectId : fixtureContext.projectId;
  const dataset = mode === 'draft-preview' ? dev05bDraftScope.dataset : fixtureContext.dataset;
  const documentIds = initial.map(doc => doc._id);
  const expectedHost = `${projectId}.api.sanity.io`;
  const perspective = mode === 'draft-preview' ? 'drafts' : 'published';
  writeFileSync(callsPath, '');
  function setResponse(result: unknown = initial, status = 200, body?: string) {
    writeFileSync(statePath, JSON.stringify({ status, body: body ?? JSON.stringify({ result }) }));
  }
  setResponse();
  writeFileSync(preload, `import { readFileSync, appendFileSync } from 'node:fs';
const allowedIds = ${JSON.stringify(documentIds)};
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input));
  const params = JSON.parse(String(init.body || '{}')).params || {};
  const ids = params.ids || (params.id ? [params.id] : []);
  const allowed = init.method === 'POST' && url.protocol === 'https:' && url.hostname === ${JSON.stringify(expectedHost)} &&
    url.pathname === ${JSON.stringify(`/v2025-02-19/data/query/${dataset}`)} && url.searchParams.get('perspective') === ${JSON.stringify(perspective)} &&
    ids.length > 0 && ids.every(id => allowedIds.includes(id));
  appendFileSync(${JSON.stringify(callsPath)}, JSON.stringify({ allowed, perspective: url.searchParams.get('perspective'), method: init.method, ids }) + '\\n');
  if (!allowed) throw new Error('OFFLINE_NETWORK_SCOPE_REJECTED');
  const state = JSON.parse(readFileSync(${JSON.stringify(statePath)}, 'utf8'));
  return new Response(state.body, { status: state.status, headers: { 'Content-Type': 'application/json' } });
};
`);
  const require = createRequire(resolve('web/package.json'));
  const manifestPath = require.resolve('astro/package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const cli = resolve(dirname(manifestPath), typeof manifest.bin === 'string' ? manifest.bin : manifest.bin.astro);
  const env = { ...process.env, DEPLOY_ENV: 'local', CONTENT_MODE: 'mock', CONCEPT_MODE: 'true', ANALYTICS_MODE: 'off',
    ARTICLE_CONTENT_MODE: mode, DEV_CMS_DRAFT_PREVIEW: mode === 'draft-preview' ? '1' : '0',
    SANITY_PROJECT_ID: projectId, SANITY_DATASET: dataset, SANITY_API_VERSION: '2025-02-19', SANITY_READ_TOKEN: token,
    SANITY_ARTICLE_READ_IDS: documentIds.join(','), ASTRO_TELEMETRY_DISABLED: '1', DO_NOT_TRACK: '1',
    NODE_OPTIONS: `${process.env['NODE_OPTIONS'] ?? ''} --import=${pathToFileURL(preload).href}`.trim() };
  const calls = () => readFileSync(callsPath, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line) as { allowed: boolean; perspective: string; method: string; ids: string[] });
  return { directory, cli, env, token, initial, setResponse, calls, dispose: () => rmSync(directory, { recursive: true, force: true }) };
}
async function freePort(): Promise<number> {
  const probe = createServer();
  await new Promise<void>((done, fail) => { probe.once('error', fail); probe.listen(0, '127.0.0.1', done); });
  const port = (probe.address() as AddressInfo).port;
  await new Promise<void>((done, fail) => probe.close(error => error ? fail(error) : done()));
  return port;
}
async function stopOwnedChild(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise<void>((done, fail) => {
    const timeout = setTimeout(() => fail(new Error('Owned offline Astro process did not stop; its temporary files are preserved.')), 10000);
    child.once('exit', () => { clearTimeout(timeout); done(); });
    child.kill('SIGTERM');
  });
}
export async function startOfflineCmsServer(mode: OfflineMode) {
  const harness = createOfflineCmsHarness(mode), port = await freePort(), origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [harness.cli, 'dev', '--root', 'web', '--host', '127.0.0.1', '--port', String(port)], { env: harness.env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  const capture = (chunk: Buffer) => { log = (log + chunk.toString()).slice(-16384); };
  child.stdout?.on('data', capture); child.stderr?.on('data', capture);
  try {
    const deadline = Date.now() + 45000; let ready = false;
    while (Date.now() < deadline && child.exitCode === null) {
      try { const page = await fetch(origin, { signal: AbortSignal.timeout(1500) }); const html = await page.text(); if (page.ok && html.includes(harness.initial[0]!.title)) { ready = true; break; } } catch { /* bounded loopback readiness poll */ }
      await new Promise(done => setTimeout(done, 150));
    }
    if (!ready) throw new Error(`Offline Astro startup failed: ${log.replaceAll(harness.token, '[REDACTED_OFFLINE_TOKEN]')}`);
  } catch (error) { await stopOwnedChild(child); harness.dispose(); throw error; }
  return { ...harness, origin, pid: child.pid, async stop() { await stopOwnedChild(child); harness.dispose(); } };
}
export function newEvidenceDirectory(scope: string): string {
  const directory = resolve('review/cms-delivery', scope, `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`);
  mkdirSync(directory, { recursive: true }); return directory;
}
export function pngEvidence(path: string) {
  if (!existsSync(path)) throw new Error('Expected screenshot was not written.');
  const bytes = readFileSync(path);
  return { file: path.split(/[\\/]/).at(-1), width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}
