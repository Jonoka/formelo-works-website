import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../web/src/lib/content';
import { imageSrcSet, validateLocalImage } from '../web/src/lib/images';
import type { LocalPreviewImage } from '../shared/content';
import tokens from '../docs/design/tokens.json';
import manifest from '../assets/manifest.json';

const root = fileURLToPath(new URL('../', import.meta.url));

test('homepage concepts do not become confirmed categories or published articles', async () => {
  const content = await loadContent('mock');
  assert.equal(content.homepagePreview.factsStatus, 'unconfirmed');
  assert.equal(content.home.title, 'Custom apparel manufacturing for brands in motion.');
  assert.equal(content.homepagePreview.heroTitleLines.join(' '), content.home.title, 'Line-break hints must preserve the shared title');
  assert.deepEqual(content.homepagePreview.demonstrationCategories.map(item => item.anchor), ['t-shirts', 'hoodies']);
  assert.ok(content.homepagePreview.demonstrationCategories.every(item => item.status === 'demonstration_only'));
  assert.equal(content.homepagePreview.capabilities.length, 4);
  assert.equal(content.homepagePreview.processSteps.length, 4);
  assert.equal(content.home.faqItems.length, 3);
  assert.equal(content.homepagePreview.journalTopics.length, 2);
  assert.deepEqual(content.categories, []);
  assert.deepEqual(content.articles, []);
});

test('missing garment assets remain pending and UI media is explicitly local, not Sanity', async () => {
  const { homepagePreview } = await loadContent('mock');
  const images = [homepagePreview.heroImage, ...homepagePreview.demonstrationCategories.map(item => item.image)];
  assert.deepEqual(images.map(image => image.requiredAssetId), ['HERO-001', 'CAT-TS-001', 'CAT-HD-001']);
  for (const image of images) {
    validateLocalImage(image);
    assert.equal(image.source, 'local');
    assert.equal(image.kind, 'placeholder');
    assert.equal(image.productionAllowed, false);
    assert.equal('asset' in image, false);
    assert.equal('_ref' in image, false);
    assert.equal(imageSrcSet(image, 'image/webp'), undefined);
    const asset = manifest.assets.find(item => item.id === image.requiredAssetId);
    assert.equal(asset?.status, 'pending_generation');
    assert.equal(asset?.path, null);
    assert.match(image.alt, /pending/i);
  }
  const placeholder = manifest.assets.find(item => item.id === 'UI-MEDIA-PENDING-001');
  assert.ok(placeholder?.path && 'sha256' in placeholder);
  const hash = createHash('sha256').update(readFileSync(`${root}/${placeholder.path}`)).digest('hex');
  assert.equal(hash, placeholder.sha256);
});

test('unknown media providers and unsafe local paths fail closed', async () => {
  const { homepagePreview } = await loadContent('mock');
  for (const change of [
    { source: 'sanity' }, { kind: 'unreviewed' }, { src: 'https://example.invalid/photo.webp' },
    { src: '/media/../secret.png' }, { width: 0 }, { height: -10 }, { alt: '' }, { productionAllowed: true },
  ]) {
    const image = { ...homepagePreview.heroImage, ...change } as unknown as LocalPreviewImage;
    assert.throws(() => validateLocalImage(image), /Invalid local preview image/);
  }
});

test('raster renditions are sorted by width and must match the source aspect ratio', async () => {
  const { homepagePreview } = await loadContent('mock');
  const image: LocalPreviewImage = { ...homepagePreview.heroImage, kind: 'concept', src: '/media/test-source.webp',
    renditions: [
      { src: '/media/test-960.webp', width: 960, height: 720, format: 'image/webp' },
      { src: '/media/test-480.webp', width: 480, height: 360, format: 'image/webp' },
    ] };
  assert.equal(imageSrcSet(image, 'image/webp'), '/media/test-480.webp 480w, /media/test-960.webp 960w');
  assert.equal(imageSrcSet(image, 'image/avif'), undefined);
  // These are in-memory unit fixtures, not claimed/generated on-disk image assets.
  image.renditions.push({ src: '/media/test-bad.webp', width: 640, height: 640, format: 'image/webp' });
  assert.throws(() => validateLocalImage(image), /Invalid or duplicate/);
});

test('generated CSS remains an exact derivative of the one token file', () => {
  const result = spawnSync(process.execPath, ['scripts/sync-design-tokens.mjs', '--check'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

function luminance(hex: string): number {
  const parts = hex.replace('#', '').match(/../g);
  assert.ok(parts && parts.length === 3);
  const values = parts.map(part => {
    const value = parseInt(part, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * values[0]! + 0.7152 * values[1]! + 0.0722 * values[2]!;
}
function contrast(first: string, second: string): number {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0]! + .05) / (values[1]! + .05);
}
test('normal-text and control token contrast meets the documented thresholds', () => {
  const c = tokens.color;
  for (const [foreground, background] of [[c.text, c.background], [c.muted, c.background], [c.muted, c.divider], [c.onAccent, c.accent], [c.onAccent, c.accentHover], [c.onDark, c.footer]]) {
    assert.ok(foreground && background);
    assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background}`);
  }
  assert.ok(contrast(c.controlBorder, c.background) >= 3);
});

test('loading content also isolates mutable local preview state', async () => {
  const first = await loadContent('mock');
  first.homepagePreview.capabilities[0]!.title = 'Changed only in this test';
  first.homepagePreview.heroImage.src = '/media/changed-only-in-this-test.svg';
  const next = await loadContent('mock');
  assert.notEqual(next.homepagePreview.capabilities[0]!.title, first.homepagePreview.capabilities[0]!.title);
  assert.notEqual(next.homepagePreview.heroImage.src, first.homepagePreview.heroImage.src);
});
