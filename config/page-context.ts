/** Stable public page references, never visitor IDs or proof of acquisition source. */
export const pageContexts = {
  home: { path: '/', label: 'Home', referenceCode: 'WEB-HOME' },
  tshirts: { path: '/clothing/t-shirts/', label: 'T-shirts', referenceCode: 'WEB-TSHIRTS' },
  hoodies: { path: '/clothing/hoodies/', label: 'Hoodies', referenceCode: 'WEB-HOODIES' },
  manufacturing: { path: '/manufacturing/', label: 'Manufacturing', referenceCode: 'WEB-MANUFACTURING' },
  factory: { path: '/our-factory/', label: 'Our Factory', referenceCode: 'WEB-FACTORY' },
  contact: { path: '/contact/', label: 'Contact', referenceCode: 'WEB-CONTACT' },
  blog: { path: '/blog/', label: 'Journal', referenceCode: 'WEB-BLOG' },
  quoteGuide: { path: '/blog/what-to-send-for-a-clothing-quote/', label: 'Quote guide', referenceCode: 'WEB-QUOTE-GUIDE' },
  moqGuide: { path: '/blog/moq-per-style-per-color/', label: 'MOQ guide', referenceCode: 'WEB-MOQ-GUIDE' },
} as const;
export type ContextKey = keyof typeof pageContexts;
export type CorePageKey = 'manufacturing' | 'factory' | 'contact';
export type PageReference<K extends ContextKey> = (typeof pageContexts)[K]['referenceCode'];
export type ReferenceCode = PageReference<ContextKey>;
