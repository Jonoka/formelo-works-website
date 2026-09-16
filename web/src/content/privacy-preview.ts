import type { EditorialBlock, PrivacyPreview } from '../../../shared/editorial';
const p = (text: string): EditorialBlock => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const h2 = (text: string): EditorialBlock => ({ type: 'heading', level: 2, text });
export const privacyPreview: PrivacyPreview = {
  kind: 'legal_preview', status: 'draft_not_in_effect', productionAllowed: false, referenceCode: null,
  title: 'Privacy notice',
  seo: { seoTitle: 'Draft privacy notice — not in effect', seoDescription: 'A non-effective privacy draft for a local concept website. The legal entity, privacy contact, service providers, retention periods and effective date remain to be confirmed.' },
  legalEntity: null, privacyContact: null, providers: null, retention: null, effectiveAt: null,
  body: [
    p('This page documents the current concept website and the decisions needed before a real privacy notice can take effect. It is not an operative policy for a live customer service. The provisional brand name does not identify a confirmed legal entity.'),
    h2('Current local concept'),
    p('The website is currently a local, static concept preview. Analytics is off. There is no on-site enquiry form, customer account, customer file upload, subscription or checkout. Email and WhatsApp contact details have not been configured; their displayed controls are disabled. This preview is not currently receiving customer enquiries through those channels.'),
    p('The article enquiry text is ordinary selectable page content. Selecting it does not submit a message to the website. There is no copy-to-clipboard button or upload facility. Do not enter private project information into developer tools or other parts of this preview.'),
    h2('Technical activity is not the same as an enquiry'),
    p('Viewing a page involves a browser and a serving environment. Local development or review tools may create technical records such as requests, errors and test output. The absence of forms and analytics must not be interpreted as a promise that no data is ever processed by any part of that environment.'),
    p('No production hosting or operational logging configuration is confirmed by this draft. Before launch, the operator must identify the actual services and their logging, security, access and deletion settings. Candidate hosting or CMS technologies in planning documents are not statements that those services are already processing website visitor data.'),
    h2('Links and future contact channels'),
    p('Some editorial articles link to explicitly reviewed external HTTPS sources. Those links are ordinary links, not embedded third-party content or analytics. Opening one takes you to a separate website whose practices are outside this draft. The source links are not a statement that the source provider operates this website.'),
    p('If email or WhatsApp channels are enabled in the future, communicating through them would be a separate action using the relevant service. The actual recipients, providers, purposes, data categories and handling arrangements must be documented before activation. This draft does not claim that messages have already been collected, sent or received.'),
    h2('Details still to be confirmed'),
    { type: 'table', caption: 'Pending operational details — no values are assumed', columns: ['Detail', 'Current status'], rows: [
      ['Legal entity / website operator', 'To be confirmed. A provisional brand is not the legal identity.'],
      ['Privacy contact and request route', 'To be confirmed. No privacy email address is available here.'],
      ['Actual service providers and locations', 'To be confirmed against the deployed configuration.'],
      ['Data categories, purposes and applicable grounds', 'To be reviewed against actual operations and target markets.'],
      ['Retention and deletion periods', 'To be confirmed for each actual data category and service.'],
      ['Effective date', 'Not set. This draft is not in effect.'],
    ] },
    h2('Review before public operation'),
    p('Before the site is used publicly, the operator must replace this draft with a notice that reflects the confirmed legal identity, services, contact channels and actual handling of information. The relevant target-market requirements, any transfers, request procedures and any storage or consent requirements need a separate review. This draft does not assert unconditional GDPR compliance or compliance with another legal regime.'),
    p('No cookie banner or consent-management system is implemented in this concept increment. Whether either is needed must be assessed against the eventual technology and target markets rather than inferred from this draft. The site remains blocked from production release until its release requirements are met.'),
  ],
};
