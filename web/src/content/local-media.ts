import manifest from '../../../assets/manifest.json';
import type { HomepageAssetId, LocalPreviewImage } from '../../../shared/content';
import { validateLocalImage } from '../lib/images';

type RecordValue = Record<string, unknown>;
function record(value: unknown): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid asset manifest record.');
  return value as RecordValue;
}
function mediaPath(path: unknown): string {
  if (typeof path !== 'string' || !/^web\/public\/media\/[a-z0-9][a-z0-9/_-]*\.(?:svg|webp|avif|png|jpe?g)$/.test(path)) {
    throw new Error('Manifest image must have an explicit local public media path.');
  }
  return path.slice('web/public'.length);
}
/** Pending is an explicit asset state, NEVER a fallback for an invalid ready asset/provider. */
export function localPreviewFromManifest(id: HomepageAssetId, alt: string, data: unknown = manifest): LocalPreviewImage {
  const assets = record(data)['assets'];
  if (!Array.isArray(assets)) throw new Error('Missing asset manifest.');
  const entries = assets.map(record);
  if (new Set(entries.map(item => item['id'])).size !== entries.length) throw new Error('Duplicate asset manifest IDs.');
  const target = entries.find(item => item['id'] === id);
  if (!target || target['productionAllowed'] !== false || target['replacementRequiredBeforeLaunch'] !== true) {
    throw new Error('Missing or production-enabled homepage concept record.');
  }
  let image: LocalPreviewImage;
  if (target['status'] === 'pending_generation') {
    if (target['path'] !== null) throw new Error('Pending asset must not advertise an existing image.');
    const pending = entries.find(item => item['id'] === 'UI-MEDIA-PENDING-001');
    if (!pending || pending['status'] !== 'interface_placeholder' || pending['productionAllowed'] !== false) {
      throw new Error('Missing explicit interface placeholder.');
    }
    const dimensions = record(pending['dimensions']);
    image = { source: 'local', kind: 'placeholder', assetId: 'UI-MEDIA-PENDING-001', requiredAssetId: id,
      src: mediaPath(pending['path']), alt: `Image pending. ${alt} No garment photograph is shown.`,
      width: dimensions['width'] as number, height: dimensions['height'] as number,
      renditions: [], productionAllowed: false };
  } else if (target['status'] === 'generated_concept') {
    if (target['source'] !== 'AI-generated concept' || target['conceptStatus'] !== 'concept_only' ||
        target['generationOutput'] !== 'independent_image' || target['approval'] !== 'pending_user_review') {
      throw new Error('Concept provenance, independent output and review state must be explicit.');
    }
    const dimensions = record(target['dimensions']);
    const variants = target['renditions'];
    if (!Array.isArray(variants) || variants.length === 0) throw new Error('Concept web renditions are required.');
    const sourceImage = record(target['sourceImage']);
    if (typeof sourceImage['path'] !== 'string' || !/^assets\/concepts\/source\/[a-z0-9-]+\.(?:png|webp|jpg)$/.test(sourceImage['path'])) {
      throw new Error('An independent source image is required; never use the webpage reference.');
    }
    image = { source: 'local', kind: 'concept', assetId: id, requiredAssetId: id,
      src: mediaPath(target['path']), alt: `AI-generated concept: ${alt} Not a factory sample.`,
      width: dimensions['width'] as number, height: dimensions['height'] as number,
      renditions: variants.map(value => {
        const variant = record(value);
        return { src: mediaPath(variant['path']), width: variant['width'] as number,
          height: variant['height'] as number, format: variant['format'] as 'image/avif' | 'image/webp' };
      }), productionAllowed: false };
  } else {
    throw new Error('Unsupported homepage asset state; refusing a placeholder fallback.');
  }
  validateLocalImage(image);
  return image;
}
