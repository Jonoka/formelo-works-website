import type { LocalPreviewImage } from '../../../shared/content';

const localPath = /^\/media\/[a-z0-9][a-z0-9/_-]*\.(?:svg|webp|avif|jpe?g|png)$/;
/** Reject unknown/remote providers. There is deliberately no CMS-to-mock fallback. */
export function validateLocalImage(image: LocalPreviewImage): void {
  if (image.source !== 'local' || !['concept', 'placeholder'].includes(image.kind) ||
      image.productionAllowed !== false || !localPath.test(image.src) || !image.alt.trim() ||
      !Number.isSafeInteger(image.width) || !Number.isSafeInteger(image.height) || image.width <= 0 || image.height <= 0) {
    throw new Error('Invalid local preview image; no source fallback is permitted.');
  }
  if (image.kind === 'concept' && (image.assetId !== image.requiredAssetId || image.src.endsWith('.svg'))) {
    throw new Error('Invalid local preview image: concepts cannot impersonate placeholders.');
  }
  const seen = new Set<string>();
  for (const variant of image.renditions) {
    const key = `${variant.format}:${variant.width}`;
    if (!localPath.test(variant.src) || !['image/avif', 'image/webp'].includes(variant.format) ||
        !Number.isSafeInteger(variant.width) || !Number.isSafeInteger(variant.height) ||
        variant.width <= 0 || variant.height <= 0 || variant.width > image.width || variant.height > image.height ||
        !variant.src.endsWith(variant.format === 'image/avif' ? '.avif' : '.webp') ||
        Math.abs(variant.width / variant.height - image.width / image.height) > 0.015 || seen.has(key)) {
      throw new Error('Invalid or duplicate local image rendition.');
    }
    seen.add(key);
  }
}
export function imageSrcSet(image: LocalPreviewImage, format: 'image/avif' | 'image/webp'): string | undefined {
  validateLocalImage(image);
  const variants = image.renditions.filter(item => item.format === format).sort((a, b) => a.width - b.width);
  return variants.length ? variants.map(item => `${item.src} ${item.width}w`).join(', ') : undefined;
}
