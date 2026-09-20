// Offline only. No factory claim, published seed, real contacts or real media.
import { fixtureSiteBundle, fixtureApprovedImage, mutateSite } from './cms-site';
import type { RecordValue } from '../../shared/cms-validation';

export function siteDeliveryFixture(revision = 'one', relatedArticles = true): RecordValue {
  const value = fixtureSiteBundle();
  mutateSite(value, ['settings', 0, 'brandName'], `OFFLINE STUDIO ${revision}`);
  const pages = value['pages'] as RecordValue[], home = pages.find(page => page['pageKey'] === 'home')!;
  Object.assign(home, { title: `Clothing made for your next chapter — offline ${revision}.`, intro: `OFFLINE ${revision}: fabric, fit and finishing for an independent collection.`, _rev: `offline-home-${revision}` });
  const categories = value['categories'] as RecordValue[];
  categories.forEach((category, index) => {
    const slug = index ? 'hoodies' : 't-shirts';
    Object.assign(category, { name: `Offline ${index ? 'Hoodies' : 'T-shirts'} ${revision}`, title: `Custom ${index ? 'hoodie' : 'T-shirt'} manufacturing — offline ${revision}.`, intro: `OFFLINE ${revision}: ${slug} introduction and category-card summary from one record.`, _rev: `offline-category-${slug}-${revision}` });
    const image = fixtureApprovedImage(revision === 'one' ? (index ? 'g' : 'h') : (index ? 'k' : 'l'));
    Object.assign(image, { alt: `OFFLINE ${slug} image ${revision}`, caption: `OFFLINE ${slug} image — not a real garment or factory record.`, crop: { left: .1, right: .2, top: .05, bottom: .15 }, hotspot: { x: .6, y: .4, width: .2, height: .2 } });
    category['heroImage'] = image;
    const samples = category['samples'] as RecordValue[];
    Object.assign(samples[0]!, { name: `OFFLINE ${slug} multi-image sample ${revision}`, fabric: 'OFFLINE test fabric', weightGsm: 245, fit: 'OFFLINE test fit', techniqueNotes: 'OFFLINE test technique notes', images: [fixtureApprovedImage('e'), fixtureApprovedImage('f')] });
    (category['capabilityRows'] as RecordValue[])[0]!['limitNote'] = `OFFLINE ${slug} capability limitation`;
    if (!relatedArticles) category['relatedArticles'] = [];
  });
  Object.assign(categories[1]!, { moqMode: 'override', moqOverride: { _type: 'moqPolicy', mode: 'confirmedQuantity', quantity: 120, unit: 'pieces', basis: 'OFFLINE per style per colour', sizeMixing: 'OFFLINE size mixing condition', conditions: 'OFFLINE material limitation', confirmedAt: '2026-09-17' } });
  // Non-default valid editorial order must drive cards and the global category navigation.
  (value['settings'] as RecordValue[])[0]!['featuredCategories'] = [...((value['settings'] as RecordValue[])[0]!['featuredCategories'] as unknown[])].reverse();
  return value;
}
