// OFFLINE SYNTHETIC fixtures. Recorded review and permission flags are test data, never real approval.
import { localFixedPageCopy } from '../../shared/fixed-page-copy';
import { manufacturingPreview } from '../../web/src/content/manufacturing-preview';
import { factoryPreview } from '../../web/src/content/factory-preview';
import { contactPreview } from '../../web/src/content/contact-preview';
import { privacyPreview } from '../../web/src/content/privacy-preview';
import type { InformationRow } from '../../shared/content';
import type { FixedPageKey } from '../../shared/cms-fixed';
import type { RecordValue } from '../../shared/cms-validation';
import { fixtureBody, fixtureReference } from './cms-articles';

export function fixtureFixedContent(key: FixedPageKey, revision = 'one'): RecordValue {
  const base = { _type: 'pageTemplateContent', pageKey: key, eyebrow: `OFFLINE ${key} ${revision}` };
  const copy = key === 'manufacturing' || key === 'factory' || key === 'contact' ? localFixedPageCopy[key] : null;
  const sections = copy ? Object.fromEntries(Object.entries(copy.sections).map(([name, value]) => [name, { _type: 'object', eyebrow: `OFFLINE ${value.eyebrow}`, title: value.title, description: `OFFLINE ${revision}: ${value.description || `${key} ${name} supporting copy. No factory claim.`}` }])) : {};
  const rows = (name: string, input: InformationRow[]) => input.map((value, i) => ({ _type: 'object', _key: `${name}-${i}`, title: value.title, description: `OFFLINE ${key} ${name} ${i + 1} ${revision}: ${value.description}` }));
  const links = copy?.relatedLinks.map((link, i) => ({ _type: 'object', _key: `link-${i}`, label: link.label, target: fixtureReference(link.href), fragment: link.href.split('#')[1] ?? null }));
  const info = { ...base, contextNote: `OFFLINE ${revision}: synthetic procurement guidance, not confirmed factory commitments.`, sections, relatedLinks: links };
  if (key === 'manufacturing') return { ...info, guideTitle: 'Offline preparation guide', preparationLead: 'An early idea is enough.', preparationNote: `OFFLINE preparation note ${revision}; no tech pack or registered company is required to start a discussion.`,
    options: rows('options', manufacturingPreview.options), moqFactors: rows('moqFactors', manufacturingPreview.moqFactors), preparation: rows('preparation', manufacturingPreview.preparation), sampling: rows('sampling', manufacturingPreview.sampling), productionSteps: rows('productionSteps', manufacturingPreview.productionSteps) };
  if (key === 'factory') return { ...info, overview: `OFFLINE factory overview ${revision}: ${factoryPreview.overview}`, overviewNote: `OFFLINE profile note ${revision}; operating identity and arrangements are synthetic, not verified factory evidence.`,
    arrangements: rows('arrangements', factoryPreview.arrangements), qualityDiscussion: rows('qualityDiscussion', factoryPreview.qualityDiscussion), gallery: [], credentials: [] };
  if (key === 'contact') return { ...info, preparation: rows('preparation', contactPreview.preparation), preparationNote: `OFFLINE contact preparation note ${revision}: ${contactPreview.preparationNote}` };
  if (key === 'blogIndex') return { ...base, columnNote: `OFFLINE Journal column note ${revision}: article cards still come from the existing article-delivery collection.` };
  const body = structuredClone(privacyPreview.body);
  body.unshift({ type: 'paragraph', content: [{ type: 'text', text: `OFFLINE policy paragraph ${revision}: this synthetic policy is not in effect and identifies no real legal operator.` }] });
  return { ...base, body: fixtureBody(body), policyStatus: 'draft_not_in_effect', legalReviewStatus: 'pending', legalReviewedAt: null, effectiveAt: null, legalEntity: null, privacyContact: null, providers: null, retention: null };
}
