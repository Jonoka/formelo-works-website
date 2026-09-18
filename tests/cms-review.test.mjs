import assert from 'node:assert/strict';
import test from 'node:test';
import { editorialCaptureDefinition, expectedEditorialCaptures, editorialCapturesFromReport, editorialPngDimensions } from '../scripts/collect-cms-review.mjs';

const attachment = name => ({ name, contentType: 'image/png', path: `test-results/editorial-fixture/${name}.png` });
const report = () => ({ stats: { expected: 445, unexpected: 0, skipped: 0, flaky: 0 }, suites: [{ specs: [{ tests: [{ results: [{ attachments: expectedEditorialCaptures().map(({ name }) => attachment(name)) }] }] }] }] });
const attachments = value => value.suites[0].specs[0].tests[0].results[0].attachments;
// Header fixtures test classification/dimension guards, not actual image decoding.
const header = (width, height = 900) => {
  const bytes = Buffer.alloc(24); Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
  bytes.writeUInt32BE(13, 8); bytes.write('IHDR', 12, 'ascii'); bytes.writeUInt32BE(width, 16); bytes.writeUInt32BE(height, 20); return bytes;
};
test('focused review requires exactly six full pages plus sixteen known page viewport details', () => {
  const definitions = expectedEditorialCaptures();
  assert.equal(definitions.length, 22); assert.equal(definitions.filter(d => d.kind === 'full-page').length, 6);
  assert.equal(editorialCapturesFromReport(report()).size, 22);
  assert.equal(editorialCaptureDefinition('journal-390-table-1'), null);
  assert.equal(editorialCaptureDefinition('quote-1440-table-2'), null);
});
test('quantity-table quote element crops are not classified as full-page screenshots', () => {
  const value = report();
  for (const width of [1440, 390]) for (const scale of [100, 200]) for (const js of [true, false]) {
    const name = `quote-${width}-text-${scale}-js-${js}`;
    attachments(value).push(attachment(name)); assert.equal(editorialCaptureDefinition(name), null);
  }
  for (const name of ['quantity-390-text-100-js-true-left', 'quantity-touch-390-js-false', 'moq-questions-1440-text-100-js-true']) attachments(value).push(attachment(name));
  assert.equal(editorialCapturesFromReport(value).size, 22);
});
test('every selected page capture, including table details, retains strict PNG width validation', () => {
  for (const { name, width } of expectedEditorialCaptures()) {
    assert.deepEqual(editorialPngDimensions(name, header(width)), { width, height: 900 });
    assert.throws(() => editorialPngDimensions(name, header(width - 40)), /dimensions do not match/);
  }
  assert.throws(() => editorialPngDimensions('quote-390-text-100-js-true', header(350)), /unsupported screenshot kind/);
});
test('missing required full-page or detail captures fail rather than creating an incomplete package', () => {
  for (const { name } of expectedEditorialCaptures()) {
    const value = report(), items = attachments(value);
    items.splice(items.findIndex(item => item.name === name), 1);
    assert.throws(() => editorialCapturesFromReport(value), /required screenshot missing/);
  }
});
test('duplicate and malformed expected attachments fail without accepting arbitrary names', () => {
  const duplicate = report(); attachments(duplicate).push(attachment('quote-390'));
  assert.throws(() => editorialCapturesFromReport(duplicate), /duplicate screenshot/);
  for (const patch of [{ contentType: 'image/jpeg' }, { path: null }, { path: '' }]) {
    const value = report(); Object.assign(attachments(value)[0], patch);
    assert.throws(() => editorialCapturesFromReport(value), /attachment is invalid/);
  }
});
test('incomplete, skipped, failed or flaky browser runs cannot produce passing review evidence', () => {
  for (const patch of [{ expected: 444 }, { unexpected: 1 }, { skipped: 1 }, { flaky: 1 }]) {
    const value = report(); Object.assign(value.stats, patch);
    assert.throws(() => editorialCapturesFromReport(value), /445-test DEV-05E browser regression/);
  }
  assert.throws(() => editorialCapturesFromReport(null), /445-test DEV-05E browser regression/);
});
test('invalid PNG headers and zero-height images fail with controlled errors', () => {
  assert.throws(() => editorialPngDimensions('quote-390', Buffer.alloc(8)), /invalid PNG header/);
  const wrong = header(390); wrong.write('IDAT', 12, 'ascii');
  assert.throws(() => editorialPngDimensions('quote-390', wrong), /invalid PNG header/);
  assert.throws(() => editorialPngDimensions('quote-390', header(390, 0)), /dimensions do not match/);
});
