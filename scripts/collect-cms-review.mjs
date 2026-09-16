import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isAbsolute, relative, resolve, sep } from 'node:path';

// Collect only screenshots attached to the completed current report. Never search old .local evidence.
const root = process.cwd();
const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim();
const head = git(['rev-parse', 'HEAD']);
if (spawnSync('git', ['diff', '--quiet', 'HEAD']).status !== 0) throw new Error('CMS_EVIDENCE: tracked source differs from HEAD.');
if (spawnSync('git', ['ls-files', '--error-unmatch', 'scripts/collect-cms-review.mjs'], { stdio: 'ignore' }).status !== 0) throw new Error('CMS_EVIDENCE: collector must be committed first.');
const untracked = git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean);
if (untracked.some(path => /^(?:web|studio|shared|config|scripts|tests|docs)\//.test(path))) throw new Error('CMS_EVIDENCE: untracked source prevents exact-HEAD evidence.');
const reportPath = 'test-results/results.json';
const report = JSON.parse(readFileSync(reportPath, 'utf8'));
if (report.stats.unexpected !== 0 || report.stats.skipped !== 0 || report.stats.flaky !== 0 || report.stats.expected !== 412) throw new Error('CMS_EVIDENCE: the full 412-test browser regression has not passed.');
const captures = new Map();
function visit(value) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value.attachments)) for (const item of value.attachments) {
    if (item.contentType !== 'image/png' || !/^(journal|quote|moq)-(1440|390)(?:-[a-z0-9-]+)?$/.test(item.name)) continue;
    if (captures.has(item.name)) throw new Error('CMS_EVIDENCE: duplicate screenshot name.');
    const path = resolve(root, item.path);
    const inside = relative(root, path);
    if (inside.startsWith('..' + sep) || isAbsolute(inside) || !existsSync(path)) throw new Error('CMS_EVIDENCE: missing or out-of-project attachment.');
    captures.set(item.name, path);
  }
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) child.forEach(visit); else if (child && typeof child === 'object') visit(child);
  }
}
visit(report);
for (const page of ['journal', 'quote', 'moq']) for (const width of [1440, 390]) if (!captures.has(`${page}-${width}`)) throw new Error('CMS_EVIDENCE: one of the six requested screenshots is absent.');
const directory = 'review/cms-editorial'; mkdirSync(`${directory}/screenshots`, { recursive: true });
const files = [];
for (const [name, path] of [...captures].sort()) {
  const bytes = readFileSync(path);
  if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('CMS_EVIDENCE: invalid PNG.');
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  const expected = Number(name.split('-')[1]);
  if (!name.includes('table') && width !== expected) throw new Error('CMS_EVIDENCE: screenshot viewport does not match its label.');
  copyFileSync(path, `${directory}/screenshots/${name}.png`);
  files.push({ name, path: `screenshots/${name}.png`, reportAttachment: relative(root, path).replaceAll('\\', '/'), width, height, sha256: createHash('sha256').update(bytes).digest('hex') });
}
const summary = { scope: 'Current-head default mock pages, not live CMS. Extra captures are viewport/table/template details; no assertion of physical-device acceptance.',
  head, tree: git(['rev-parse', 'HEAD^{tree}']), foundationBase: '11ee7e633ee76f4cf23d3811bc93f9fdbaa2c9d0', branch: git(['branch', '--show-current']),
  platform: process.platform, node: process.version, collectedAt: new Date().toISOString(), trackedSourceMatchesHead: true,
  untrackedNonSourcePaths: untracked, reportSha256: createHash('sha256').update(readFileSync(reportPath)).digest('hex'), browser: report.stats, screenshots: files };
writeFileSync(`${directory}/evidence.json`, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ head, tree: summary.tree, screenshots: files.length, requestedFullPageScreenshots: 6, browserPassed: report.stats.expected, evidence: `${directory}/evidence.json` }));
