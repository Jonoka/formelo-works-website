// Isolated test transport, never imported by web/studio. All responses use the real posted GROQ.
import { spawn, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer, type AddressInfo } from 'node:net';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { siteBundleQuery } from '../../web/src/lib/server/cms-site-query';
import { articleCollectionQuery } from '../../web/src/lib/server/cms-article-query';
import { siteDeliveryFixture } from '../fixtures/site-delivery';
import { fixtureSiteDataset } from '../fixtures/cms-site';
import { fixtureDataset } from '../fixtures/cms-articles';
import { publishedDeliveryFixtures } from './offline-cms-server';
import type { RecordValue } from '../../shared/cms-validation';

export interface OfflineSiteState {
  bundle?: RecordValue; status?: number; delayMs?: number;
  resultPatch?: { path: (string | number)[]; value: unknown };
}
export function createOfflineSiteHarness(articleMode: 'mock' | 'published' = 'published', siteMode: 'mock' | 'published' = 'published', fixedMode: 'mock' | 'published' = 'mock') {
  mkdirSync('.local', { recursive: true });
  const directory = mkdtempSync(resolve('.local', 'site-delivery-offline-'));
  const statePath = join(directory, 'state.json'), callsPath = join(directory, 'calls.jsonl'), preload = join(directory, 'transport.mjs');
  const token = `OFFLINE_TEST_${randomUUID()}`, initial = siteDeliveryFixture('one', articleMode === 'published');
  const articles = publishedDeliveryFixtures(), ids = articles.map(article => article._id);
  function setState(state: OfflineSiteState = {}) {
    const siteDataset = fixtureSiteDataset(state.bundle ?? initial);
    // Full root documents win over the minimal strong-reference target projections.
    const dataset = new Map(fixtureDataset(articles).map(doc => [String(doc['_id']), doc]));
    for (const doc of siteDataset) if (doc['_type'] !== 'article' || !dataset.has(String(doc['_id']))) dataset.set(String(doc['_id']), doc);
    writeFileSync(statePath, JSON.stringify({ dataset: [...dataset.values()], status: state.status ?? 200, delayMs: state.delayMs ?? 0, resultPatch: state.resultPatch ?? null }));
  }
  setState(); writeFileSync(callsPath, '');
  const require = createRequire(resolve('package.json'));
  const groqUrl = pathToFileURL(require.resolve('groq-js')).href;
  writeFileSync(preload, `import { readFileSync, appendFileSync } from 'node:fs';
import { parse, evaluate } from ${JSON.stringify(groqUrl)};
const queries = {site: ${JSON.stringify(siteBundleQuery)}, article: ${JSON.stringify(articleCollectionQuery)}};
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input)), body = JSON.parse(String(init.body || '{}'));
  const kind = body.query === queries.site ? 'site' : body.query === queries.article ? 'article' : 'invalid';
  const allowed = kind !== 'invalid' && init.method === 'POST' && init.cache === 'no-store' && init.redirect === 'error' && url.origin === 'https://offline1.api.sanity.io' && url.pathname === '/v2025-02-19/data/query/offline-fixture' && url.searchParams.get('perspective') === 'published';
  appendFileSync(${JSON.stringify(callsPath)}, JSON.stringify({ kind, allowed }) + '\\n');
  if (!allowed) throw new Error('OFFLINE_NETWORK_SCOPE_REJECTED');
  const state = JSON.parse(readFileSync(${JSON.stringify(statePath)}, 'utf8'));
  if (kind === 'site' && state.delayMs) await new Promise((done, reject) => {
    const timer = setTimeout(done, state.delayMs);
    init.signal?.addEventListener('abort', () => { clearTimeout(timer); reject(new Error('OFFLINE_ABORTED')); }, { once: true });
  });
  if (kind === 'site' && state.status !== 200) return new Response('WITHHELD_OFFLINE_BODY', { status: state.status });
  const result = await (await evaluate(parse(body.query), { dataset: state.dataset, params: body.params })).get();
  if (kind === 'site' && state.resultPatch) {
    let item = result; const keys = state.resultPatch.path;
    for (const key of keys.slice(0, -1)) item = item[key];
    item[keys.at(-1)] = state.resultPatch.value;
  }
  return new Response(JSON.stringify({ ms: 4, syncTags: ['offline-protocol-metadata'], result }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
`);
  const astroRequire = createRequire(resolve('web/package.json'));
  const manifestPath = astroRequire.resolve('astro/package.json'), manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const cli = resolve(dirname(manifestPath), typeof manifest.bin === 'string' ? manifest.bin : manifest.bin.astro);
  // Only OS/process basics are inherited. No real Sanity settings, tokens, dotenv files or user preloads.
  const safeProcess = Object.fromEntries(['PATH', 'Path', 'SystemRoot', 'ComSpec', 'TMP', 'TEMP', 'HOME', 'USERPROFILE', 'LOCALAPPDATA', 'APPDATA', 'CI'].flatMap(key => process.env[key] === undefined ? [] : [[key, process.env[key]!]]));
  const env = { ...safeProcess, FORMELO_ENV_FILES: 'ignore', FORMELO_OFFLINE_SITE_TEST: siteMode === 'published' ? '1' : '0',
    DEPLOY_ENV: 'local', CONTENT_MODE: 'mock', HOME_CATEGORY_CONTENT_MODE: siteMode, FIXED_PAGE_CONTENT_MODE: fixedMode, ARTICLE_CONTENT_MODE: articleMode, DEV_CMS_DRAFT_PREVIEW: '0',
    CONCEPT_MODE: 'true', ANALYTICS_MODE: 'off', ASTRO_TELEMETRY_DISABLED: '1', DO_NOT_TRACK: '1',
    SANITY_SITE_READ_ENABLED: '1', SANITY_PROJECT_ID: 'offline1', SANITY_DATASET: 'offline-fixture', SANITY_READ_TOKEN: token, SANITY_API_VERSION: '2025-02-19',
    SANITY_ARTICLE_READ_IDS: ids.join(','), NODE_OPTIONS: `--import=${pathToFileURL(preload).href}` };
  const calls = () => readFileSync(callsPath, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line) as { kind: string; allowed: boolean });
  return { directory, cli, env, token, initial, setState, calls, dispose: () => rmSync(directory, { recursive: true, force: true }) };
}
async function stopChild(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise<void>((done, fail) => {
    const timer = setTimeout(() => fail(new Error('Owned offline site process did not stop; evidence preserved.')), 10000);
    child.once('exit', () => { clearTimeout(timer); done(); }); child.kill('SIGTERM');
  });
}
export async function startOfflineSiteServer(articleMode: 'mock' | 'published' = 'published', fixedMode: 'mock' | 'published' = 'mock') {
  const harness = createOfflineSiteHarness(articleMode, 'published', fixedMode), probe = createServer();
  await new Promise<void>((done, fail) => { probe.once('error', fail); probe.listen(0, '127.0.0.1', done); });
  const port = (probe.address() as AddressInfo).port;
  await new Promise<void>((done, fail) => probe.close(error => error ? fail(error) : done()));
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [harness.cli, 'dev', '--ignore-lock', '--root', 'web', '--host', '127.0.0.1', '--port', String(port)], { env: harness.env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; const capture = (chunk: Buffer) => { log = (log + chunk.toString()).slice(-16384); };
  child.stdout?.on('data', capture); child.stderr?.on('data', capture);
  try {
    const deadline = Date.now() + 45000; let ready = false;
    while (Date.now() < deadline && child.exitCode === null) {
      try { const result = await fetch(origin, { signal: AbortSignal.timeout(1500) }); if (result.ok && (await result.text()).includes('OFFLINE SYNTHETIC RESPONSE')) { ready = true; break; } } catch { /* loopback only */ }
      await new Promise(done => setTimeout(done, 150));
    }
    if (!ready) throw new Error(`Offline site startup failed: ${log.replaceAll(harness.token, '[REDACTED]')}`);
  } catch (error) { await stopChild(child); harness.dispose(); throw error; }
  return { ...harness, origin, async stop() { await stopChild(child); harness.dispose(); } };
}
