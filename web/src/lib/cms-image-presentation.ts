import type { CmsApprovedImage } from '../../../shared/cms-image';
/** Only accepts already-converted images. No URL/permission fallback and no editor-supplied styles. */
export function cmsImagePresentation(image: CmsApprovedImage, maxWidth = 1200) {
  const { width, height, crop, hotspot } = image;
  const left = Math.floor((crop?.['left'] ?? 0) * width), top = Math.floor((crop?.['top'] ?? 0) * height);
  const cropWidth = Math.max(1, width - left - Math.floor((crop?.['right'] ?? 0) * width));
  const cropHeight = Math.max(1, height - top - Math.floor((crop?.['bottom'] ?? 0) * height));
  const url = (requestedWidth: number) => {
    const src = new URL(image.url);
    if (crop) src.searchParams.set('rect', `${left},${top},${cropWidth},${cropHeight}`);
    src.searchParams.set('w', String(Math.min(cropWidth, requestedWidth)));
    src.searchParams.set('auto', 'format'); src.searchParams.set('fit', 'max');
    return src.href;
  };
  const x = Math.max(0, Math.min(1, ((hotspot?.['x'] ?? .5) * width - left) / cropWidth));
  const y = Math.max(0, Math.min(1, ((hotspot?.['y'] ?? .5) * height - top) / cropHeight));
  const widths = [...new Set([480, 800, maxWidth].map(value => Math.min(value, maxWidth, cropWidth)))].sort((a, b) => a - b);
  return { src: url(maxWidth), width: cropWidth, height: cropHeight, position: `${x * 100}% ${y * 100}%`, srcset: widths.map(value => `${url(value)} ${value}w`).join(', ') };
}
