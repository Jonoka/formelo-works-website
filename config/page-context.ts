/** Stable public page references, never visitor IDs or proof of acquisition source. */
export const pageContexts = {
  home: { path: '/', label: 'Home', referenceCode: 'WEB-HOME' },
  tshirts: { path: '/clothing/t-shirts/', label: 'T-shirts', referenceCode: 'WEB-TSHIRTS' },
  hoodies: { path: '/clothing/hoodies/', label: 'Hoodies', referenceCode: 'WEB-HOODIES' },
  manufacturing: { path: '/manufacturing/', label: 'Manufacturing', referenceCode: 'WEB-MANUFACTURING' },
  factory: { path: '/our-factory/', label: 'Our Factory', referenceCode: 'WEB-FACTORY' },
  contact: { path: '/contact/', label: 'Contact', referenceCode: 'WEB-CONTACT' },
} as const;
export type ContextKey = keyof typeof pageContexts;
export type CorePageKey = 'manufacturing' | 'factory' | 'contact';
export type PageReference<K extends ContextKey> = (typeof pageContexts)[K]['referenceCode'];
export type ReferenceCode = PageReference<ContextKey>;
