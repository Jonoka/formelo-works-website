import { fail, id, record, reference, string } from './cms-validation';

export interface CmsAssetContext { projectId: string; dataset: string }
export interface CmsApprovedImage {
  source: 'sanity';
  assetId: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  caption: string | null;
  publicUseApproved: true;
  decorative: false;
  crop: Record<string, number> | null;
  hotspot: Record<string, number> | null;
}

function publishedIdentity(value: unknown, field: string): string {
  const doc = record(value, field);
  const result = id(doc['_id'], `${field}._id`);
  if (doc['_originalId'] != null) fail(`${field}._originalId`, 'CMS_UNPUBLISHED');
  return result;
}

function geometry(value: unknown, keys: string[], field: string): Record<string, number> | null {
  if (value == null) return null;
  const input = record(value, field, keys), output: Record<string, number> = {};
  for (const key of keys) {
    const number = input[key];
    if (typeof number !== 'number' || !Number.isFinite(number) || number < 0 || number > 1) fail(field, 'CMS_IMAGE');
    output[key] = number;
  }
  if (keys.includes('left') && (output['left']! + output['right']! >= 1 || output['top']! + output['bottom']! >= 1)) fail(field, 'CMS_IMAGE');
  if (keys.includes('x') && (output['width']! <= 0 || output['height']! <= 0 ||
      output['x']! - output['width']! / 2 < 0 || output['x']! + output['width']! / 2 > 1 ||
      output['y']! - output['height']! / 2 < 0 || output['y']! + output['height']! / 2 > 1)) fail(field, 'CMS_IMAGE');
  return output;
}

/** Strict public image conversion shared by article covers and future site/category delivery. */
export function convertCmsApprovedImage(value: unknown, field: string, context: CmsAssetContext): CmsApprovedImage {
  const image = record(value, field, ['_type', 'asset', 'alt', 'caption', 'publicUseApproved', 'decorative', 'crop', 'hotspot']);
  if (image['_type'] !== 'approvedImage' || image['publicUseApproved'] !== true || image['decorative'] !== false) fail(field, 'CMS_ASSET_APPROVAL');
  const ref = reference(image['asset'], `${field}.asset`), asset = record(ref['document'], `${field}.asset.document`);
  const assetId = publishedIdentity(asset, `${field}.asset.document`);
  const match = /^image-([a-zA-Z0-9]{16,64})-([1-9][0-9]*)x([1-9][0-9]*)-(jpg|png|webp|avif)$/.exec(assetId);
  if (ref['_ref'] !== assetId || asset['_type'] !== 'sanity.imageAsset' || !match) fail(`${field}.asset`, 'CMS_IMAGE');
  const width = Number(match[2]), height = Number(match[3]);
  const dimensions = record(record(asset['metadata'], `${field}.asset.metadata`)['dimensions'], `${field}.asset.metadata.dimensions`);
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width > 20000 || height > 20000 ||
      dimensions['width'] !== width || dimensions['height'] !== height) fail(`${field}.asset.metadata.dimensions`, 'CMS_IMAGE');
  const url = `https://cdn.sanity.io/images/${context.projectId}/${context.dataset}/${match[1]}-${width}x${height}.${match[4]}`;
  if (asset['url'] !== url) fail(`${field}.asset.url`, 'CMS_IMAGE');
  return {
    source: 'sanity', assetId, url, width, height,
    alt: string(image['alt'], `${field}.alt`),
    caption: image['caption'] == null ? null : string(image['caption'], `${field}.caption`),
    publicUseApproved: true, decorative: false,
    crop: geometry(image['crop'], ['top', 'bottom', 'left', 'right'], `${field}.crop`),
    hotspot: geometry(image['hotspot'], ['x', 'y', 'width', 'height'], `${field}.hotspot`),
  };
}
