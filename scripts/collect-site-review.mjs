// Focused private evidence: actual PR base, current default mock, current isolated CMS templates.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const source = JSON.parse(readFileSync('review/source.json', 'utf8'));
if (source.headSha !== head || source.checkoutSha !== head) throw new Error('SITE_EVIDENCE_SOURCE');
const report = JSON.parse(readFileSync('test-results/results.json', 'utf8'));
if (report.stats.expected !== 461 || report.stats.unexpected || report.stats.skipped || report.stats.flaky) throw new Error('SITE_EVIDENCE_BROWSER');
const attachments = new Map();
function visit(value) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value.attachments)) for (const item of value.attachments) {
    if (/^(homepage|t-shirts|hoodies)-(1440|390)$/.test(item.name ?? '')) {
      if (attachments.has(item.name)) throw new Error('SITE_EVIDENCE_DUPLICATE'); attachments.set(item.name, item.path);
    }
  }
  for (const child of Object.values(value)) if (Array.isArray(child)) child.forEach(visit); else if (child && typeof child === 'object') visit(child);
}
visit(report);
function manifests(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(item => item.isDirectory() ? manifests(join(directory, item.name)) : item.name === 'evidence.json' ? [join(directory, item.name)] : []);
}
const offline = new Map();
for (const file of manifests('review/site-delivery')) {
  const value = JSON.parse(readFileSync(file, 'utf8'));
  if (value.head !== head || ![1440, 390].includes(value.viewport) || !value.screenshots?.length || Date.parse(value.capturedAt) < Date.parse(report.stats.startTime)) continue;
  if (offline.has(value.viewport)) throw new Error('SITE_EVIDENCE_DUPLICATE_OFFLINE'); offline.set(value.viewport, { file, value });
}
const beforeSha = readFileSync('review/before/source.txt', 'utf8').split(/\r?\n/)[0].trim();
if (beforeSha !== source.baseSha || source.comparisonSha !== source.baseSha) throw new Error('SITE_EVIDENCE_BASE');
const directory = resolve('review/site-integration'); mkdirSync(directory, { recursive: true });
const files = [];
function copy(file, target, width, origin) {
  const path = realpathSync(file), allowed = [realpathSync('review'), realpathSync('test-results')];
  if (!allowed.some(root => { const inside = relative(root, path); return inside && !inside.startsWith('..') && !inside.startsWith('/'); })) throw new Error('SITE_EVIDENCE_PATH');
  const bytes = readFileSync(path);
  if (bytes.length < 24 || bytes.toString('ascii', 12, 16) !== 'IHDR' || bytes.readUInt32BE(16) !== width || bytes.readUInt32BE(20) < 1) throw new Error('SITE_EVIDENCE_PNG');
  const out = join(directory, target); mkdirSync(resolve(out, '..'), { recursive: true }); copyFileSync(path, out);
  files.push({ path: target, source: origin, width, height: bytes.readUInt32BE(20), sha256: createHash('sha256').update(bytes).digest('hex') });
}
for (const width of [1440, 390]) for (const name of ['homepage', 't-shirts', 'hoodies']) {
  const offlineName = name === 'homepage' ? 'home' : name;
  const attachment = attachments.get(`${name}-${width}`); if (!attachment) throw new Error('SITE_EVIDENCE_MOCK_MISSING');
  copy(attachment, `mock/${offlineName}-${width}.png`, width, 'Current-head default mock');
  copy(`review/before/${name}-${width}.png`, `before/${offlineName}-${width}.png`, width, `Actual PR base ${beforeSha}`);
  const selection = offline.get(width); if (!selection) throw new Error('SITE_EVIDENCE_OFFLINE_MISSING');
  const image = selection.value.screenshots.find(item => item.file === `${offlineName}-${width}.png`); if (!image) throw new Error('SITE_EVIDENCE_OFFLINE_IMAGE');
  copy(join(selection.file, '..', image.file), `offline/${image.file}`, width, 'OFFLINE SYNTHETIC RESPONSE; NOT REAL SANITY CONTENT');
}
writeFileSync(join(directory, 'evidence.json'), JSON.stringify({ head, tree: source.checkoutTree, base: beforeSha, scope: 'DEV-05E Home and two Category templates only; no live CMS or production acceptance', node: process.version, platform: process.platform, browser: report.stats, actualCloudRequests: 0, visualReview: 'Not claimed by an automated collector; inspect the PNGs separately.', files }, null, 2));
console.log(JSON.stringify({ head, base: beforeSha, screenshots: files.length, scope: 'DEV-05E mock/base/offline CMS separately labeled' }));
