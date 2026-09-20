// Private DEV-05F evidence only. Collection is neither human approval nor remote retention.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const targets = ['manufacturing', 'factory', 'contact', 'blogIndex', 'privacy'];
const widths = [1440, 390];
export function fixedReviewBrowser(stats) {
  if (!stats || stats.expected !== 461 || stats.unexpected !== 0 || stats.skipped !== 0 || stats.flaky !== 0 || !Number.isFinite(Date.parse(stats.startTime))) throw new Error('FIXED_EVIDENCE_BROWSER');
}
export function fixedReviewPng(bytes, width, expectedHash) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 24 || !bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || bytes.readUInt32BE(8) !== 13 || bytes.toString('ascii', 12, 16) !== 'IHDR' || bytes.readUInt32BE(16) !== width || bytes.readUInt32BE(20) < 1) throw new Error('FIXED_EVIDENCE_PNG');
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (expectedHash !== sha256) throw new Error('FIXED_EVIDENCE_HASH');
  return { width, height: bytes.readUInt32BE(20), sha256 };
}
export function fixedReviewOffline(value, head, tree, startedAt) {
  if (value?.head !== head || value.tree !== tree || value.workingTreeClean !== true || value.actualCloudRequests !== 0 || value.source !== 'OFFLINE SYNTHETIC RESPONSE; NOT REAL SANITY CONTENT' || value.scope !== 'DEV-05F five fixed routes' || !widths.includes(value.viewport) || !Number.isFinite(Date.parse(value.capturedAt)) || Date.parse(value.capturedAt) < Date.parse(startedAt) || !Array.isArray(value.screenshots) || value.screenshots.length !== 5) throw new Error('FIXED_EVIDENCE_OFFLINE_SOURCE');
  const names = value.screenshots.map(item => item.file);
  if (new Set(names).size !== 5 || targets.some(key => !names.includes(`${key}-${value.viewport}.png`))) throw new Error('FIXED_EVIDENCE_OFFLINE_SELECTION');
}
function manifests(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true }).flatMap(item => item.isDirectory() ? manifests(join(path, item.name)) : item.name === 'evidence.json' ? [join(path, item.name)] : []);
}
export function collectFixedReview(root = process.cwd()) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  const head = git('rev-parse', 'HEAD'), tree = git('rev-parse', 'HEAD^{tree}');
  if (git('status', '--porcelain=v1', '--untracked-files=all')) throw new Error('FIXED_EVIDENCE_DIRTY');
  const read = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
  const source = read('review/source.json'), report = read('test-results/results.json');
  fixedReviewBrowser(report.stats);
  if (source.headSha !== head || source.checkoutSha !== head || source.checkoutTree !== tree || !/^[a-f0-9]{40}$/.test(source.baseSha) || source.comparisonSha !== source.baseSha) throw new Error('FIXED_EVIDENCE_SOURCE');
  const before = read('review/before/capture.json'), current = read('review/current-fixed/capture.json');
  if (before.sha !== source.baseSha || before.workingTreeClean !== true || before.source !== 'Actual PR base default mock') throw new Error('FIXED_EVIDENCE_BASE');
  if (current.sha !== head || current.tree !== tree || current.workingTreeClean !== true || current.source !== 'Current-head default mock' || !Number.isFinite(Date.parse(current.capturedAt)) || Date.parse(current.capturedAt) < Date.parse(report.stats.startTime)) throw new Error('FIXED_EVIDENCE_CURRENT');
  const offline = new Map();
  for (const file of manifests(resolve(root, 'review/fixed-delivery'))) {
    const value = JSON.parse(readFileSync(file, 'utf8'));
    if (value.head !== head || !widths.includes(value.viewport) || Date.parse(value.capturedAt) < Date.parse(report.stats.startTime)) continue;
    fixedReviewOffline(value, head, tree, report.stats.startTime);
    if (offline.has(value.viewport)) throw new Error('FIXED_EVIDENCE_DUPLICATE');
    offline.set(value.viewport, { file, value });
  }
  const allowed = realpathSync(resolve(root, 'review')), pending = [];
  function select(directory, manifest, name, width, group, key) {
    const matching = manifest.screenshots.filter(item => item.file === `${name}-${width}.png`);
    if (matching.length !== 1) throw new Error('FIXED_EVIDENCE_MISSING');
    const item = matching[0], file = realpathSync(join(directory, item.file)), inside = relative(allowed, file);
    if (!inside || inside === '..' || inside.startsWith('..' + sep) || isAbsolute(inside)) throw new Error('FIXED_EVIDENCE_PATH');
    const bytes = readFileSync(file), dimensions = fixedReviewPng(bytes, width, item.sha256);
    pending.push({ file, path: `${group}/${key}-${width}.png`, source: group === 'offline' ? 'OFFLINE SYNTHETIC RESPONSE; NOT REAL SANITY CONTENT' : group === 'before' ? `Actual PR base ${source.baseSha}` : `Default mock ${head}`, ...dimensions });
  }
  for (const width of widths) for (const key of targets) {
    const name = key === 'blogIndex' ? 'journal' : key;
    select(resolve(root, 'review/before'), before, name, width, 'before', key);
    select(resolve(root, 'review/current-fixed'), current, name, width, 'mock', key);
    const entry = offline.get(width); if (!entry) throw new Error('FIXED_EVIDENCE_OFFLINE_MISSING');
    select(dirname(entry.file), entry.value, key, width, 'offline', key);
  }
  const directory = resolve(root, 'review/fixed-integration');
  // Every identity, selection and byte hash is checked before any finished-pack output.
  for (const item of pending) { const out = join(directory, item.path); mkdirSync(dirname(out), { recursive: true }); copyFileSync(item.file, out); }
  const evidence = { head, tree, base: source.baseSha, scope: 'DEV-05F five fixed pages, actual-base/current-mock/offline-synthetic comparison', platform: process.platform, node: process.version, browser: report.stats, actualCloudRequests: 0, collectedAt: new Date().toISOString(), screenshotGeneration: 'passed', humanVisualReview: 'not claimed; inspect separately', remoteRetention: 'not claimed; check upload outcome', files: pending.map(({ file, ...item }) => item) };
  writeFileSync(join(directory, 'evidence.json'), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ head, base: source.baseSha, screenshots: pending.length, evidence: 'review/fixed-integration/evidence.json' }));
  return evidence;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) collectFixedReview();
