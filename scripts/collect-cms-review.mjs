import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

// Only editorial.spec.ts's page screenshots belong in this focused package.
// quantity-table.spec.ts also attaches quote-1440-text-... element crops; those
// remain in the full artifact and must never be mislabeled as viewport captures.
const definitions = new Map();
for (const page of ['journal', 'quote', 'moq']) for (const width of [1440, 390]) {
  const suffixes = page === 'journal' ? ['', '-viewport']
    : page === 'quote' ? ['', '-viewport', '-table-1', '-long-text']
      : ['', '-viewport', '-table-1', '-table-2', '-long-text'];
  for (const suffix of suffixes) {
    const name = `${page}-${width}${suffix}`;
    definitions.set(name, Object.freeze({ name, page, width, kind: suffix === '' ? 'full-page' : 'viewport' }));
  }
}
export function expectedEditorialCaptures() { return [...definitions.values()]; }
export function editorialCaptureDefinition(name) { return definitions.get(name) ?? null; }
export function editorialCapturesFromReport(report) {
  if (!report || report.stats?.unexpected !== 0 || report.stats?.skipped !== 0 ||
      report.stats?.flaky !== 0 || report.stats?.expected !== 445) {
    throw new Error('CMS_EVIDENCE: the full 445-test DEV-05E browser regression has not passed.');
  }
  const captures = new Map();
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value.attachments)) for (const item of value.attachments) {
      if (!item || !editorialCaptureDefinition(item.name)) continue;
      if (item.contentType !== 'image/png' || typeof item.path !== 'string' || !item.path) {
        throw new Error('CMS_EVIDENCE: an expected screenshot attachment is invalid.');
      }
      if (captures.has(item.name)) throw new Error('CMS_EVIDENCE: duplicate screenshot name.');
      captures.set(item.name, item.path);
    }
    for (const child of Object.values(value)) {
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child === 'object') visit(child);
    }
  }
  visit(report);
  for (const name of definitions.keys()) {
    if (!captures.has(name)) throw new Error(`CMS_EVIDENCE: required screenshot missing (${name}).`);
  }
  return captures;
}
export function editorialPngDimensions(name, bytes) {
  const definition = editorialCaptureDefinition(name);
  if (!definition) throw new Error('CMS_EVIDENCE: unsupported screenshot kind.');
  if (!Buffer.isBuffer(bytes) || bytes.length < 24 ||
      !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
      bytes.readUInt32BE(8) !== 13 || bytes.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('CMS_EVIDENCE: invalid PNG header.');
  }
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  // All selected names are page.screenshot captures at DPR 1, including table
  // and template viewport details. No exception for a name containing 'table'.
  if (width !== definition.width || height < 1) {
    throw new Error(`CMS_EVIDENCE: screenshot dimensions do not match ${name} (${width}x${height}).`);
  }
  return { width, height };
}
export function collectCmsReview(root = process.cwd()) {
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  const head = git(['rev-parse', 'HEAD']), tree = git(['rev-parse', 'HEAD^{tree}']);
  if (spawnSync('git', ['diff', '--quiet', 'HEAD'], { cwd: root }).status !== 0) throw new Error('CMS_EVIDENCE: tracked source differs from HEAD.');
  if (spawnSync('git', ['ls-files', '--error-unmatch', 'scripts/collect-cms-review.mjs'], { cwd: root, stdio: 'ignore' }).status !== 0) throw new Error('CMS_EVIDENCE: collector must be committed first.');
  const untracked = git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean);
  if (untracked.some(path => /^(?:web|studio|shared|config|scripts|tests|docs)\//.test(path))) throw new Error('CMS_EVIDENCE: untracked source prevents exact-HEAD evidence.');
  if (process.env.GITHUB_RUN_ID) {
    const source = JSON.parse(readFileSync(resolve(root, 'review/source.json'), 'utf8'));
    if (source.headSha !== head || source.checkoutSha !== head || source.checkoutTree !== tree || source.runId !== process.env.GITHUB_RUN_ID) {
      throw new Error('CMS_EVIDENCE: CI run/source identity does not match this checkout.');
    }
  }
  const reportPath = resolve(root, 'test-results/results.json');
  const reportBytes = readFileSync(reportPath), report = JSON.parse(reportBytes.toString('utf8'));
  const captures = editorialCapturesFromReport(report);
  const resultsRoot = realpathSync(resolve(root, 'test-results'));
  const files = [], pendingCopies = [];
  for (const [name, attachedPath] of [...captures].sort()) {
    const suppliedPath = resolve(root, attachedPath);
    if (!existsSync(suppliedPath)) throw new Error('CMS_EVIDENCE: missing attachment.');
    const path = realpathSync(suppliedPath), inside = relative(resultsRoot, path);
    if (!inside || inside === '..' || inside.startsWith('..' + sep) || isAbsolute(inside)) throw new Error('CMS_EVIDENCE: attachment is outside the current test-results tree.');
    const bytes = readFileSync(path), dimensions = editorialPngDimensions(name, bytes);
    pendingCopies.push({ name, path });
    files.push({ name, kind: editorialCaptureDefinition(name).kind, path: `screenshots/${name}.png`,
      reportAttachment: relative(root, path).replaceAll('\\', '/'), ...dimensions,
      sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  // Validate the complete selection before producing a seemingly finished pack.
  const directory = resolve(root, 'review/cms-editorial');
  mkdirSync(`${directory}/screenshots`, { recursive: true });
  for (const { name, path } of pendingCopies) copyFileSync(path, `${directory}/screenshots/${name}.png`);
  const summary = { scope: 'Current-head default mock pages, not live CMS. Six full pages and sixteen viewport/table/template details. Element crops from quantity-table.spec.ts remain in the full artifact; no physical-device or visual-approval claim.',
    head, tree, foundationBase: '11ee7e633ee76f4cf23d3811bc93f9fdbaa2c9d0', branch: git(['branch', '--show-current']),
    runId: process.env.GITHUB_RUN_ID ?? null, platform: process.platform, node: process.version, collectedAt: new Date().toISOString(), trackedSourceMatchesHead: true,
    reportStartTime: report.stats.startTime ?? null, reportSha256: createHash('sha256').update(reportBytes).digest('hex'), browser: report.stats, screenshots: files };
  writeFileSync(`${directory}/evidence.json`, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ head, tree, screenshots: files.length, requestedFullPageScreenshots: 6, browserPassed: report.stats.expected, evidence: 'review/cms-editorial/evidence.json' }));
  return summary;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) collectCmsReview();
