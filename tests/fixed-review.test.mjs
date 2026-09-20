import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { fixedReviewBrowser, fixedReviewOffline, fixedReviewPng } from '../scripts/collect-fixed-review.mjs';
const head = 'a'.repeat(40), tree = 'b'.repeat(40), start = '2026-09-20T06:10:00Z';
const stats = { expected: 461, unexpected: 0, skipped: 0, flaky: 0, startTime: start };
const value = () => ({ head, tree, workingTreeClean: true, actualCloudRequests: 0, source: 'OFFLINE SYNTHETIC RESPONSE; NOT REAL SANITY CONTENT', scope: 'DEV-05F five fixed routes', viewport: 390, capturedAt: '2026-09-20T06:11:00Z', screenshots: ['manufacturing', 'factory', 'contact', 'blogIndex', 'privacy'].map(key => ({ file: `${key}-390.png` })) });
test('fixed evidence requires the complete new browser suite, not the historical 445', () => {
  fixedReviewBrowser(stats);
  for (const patch of [{ expected: 445 }, { expected: 460 }, { skipped: 1 }, { unexpected: 1 }, { flaky: 1 }, { startTime: '' }]) assert.throws(() => fixedReviewBrowser({ ...stats, ...patch }), /FIXED_EVIDENCE_BROWSER/);
});
test('fixed screenshots must be clean, exact-head, fresh, offline and complete', () => {
  fixedReviewOffline(value(), head, tree, start);
  for (const patch of [{ head: 'c'.repeat(40) }, { tree: head }, { workingTreeClean: false }, { actualCloudRequests: 1 }, { source: 'real' }, { capturedAt: '2026-09-19' }, { capturedAt: '' }, { screenshots: [] }]) assert.throws(() => fixedReviewOffline({ ...value(), ...patch }, head, tree, start), /FIXED_EVIDENCE_OFFLINE_SOURCE/);
});
test('fixed evidence rejects duplicate or missing page captures', () => {
  const item = value(); item.screenshots[4] = item.screenshots[0];
  assert.throws(() => fixedReviewOffline(item, head, tree, start), /FIXED_EVIDENCE_OFFLINE_SELECTION/);
});
test('fixed PNG evidence checks dimensions and the recorded content hash', () => {
  const bytes = Buffer.alloc(24); Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes); bytes.writeUInt32BE(13, 8); bytes.write('IHDR', 12); bytes.writeUInt32BE(390, 16); bytes.writeUInt32BE(844, 20);
  const hash = createHash('sha256').update(bytes).digest('hex');
  assert.equal(fixedReviewPng(bytes, 390, hash).height, 844);
  assert.throws(() => fixedReviewPng(bytes, 1440, hash), /FIXED_EVIDENCE_PNG/);
  assert.throws(() => fixedReviewPng(bytes, 390, 'wrong'), /FIXED_EVIDENCE_HASH/);
  assert.throws(() => fixedReviewPng(Buffer.alloc(8), 390, hash), /FIXED_EVIDENCE_PNG/);
});
