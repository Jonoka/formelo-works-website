/** Current homepage destinations only. The final ten-route plan remains in config/routes.json. */
export const homepageNavigation = [
  { label: 'Manufacturing', href: '/#capabilities' },
  { label: 'Our Factory', href: '/#factory' },
  { label: 'Journal', href: '/#journal' },
  { label: 'Contact', href: '/#contact' },
] as const;
export const demonstrationNavigation = [
  { label: 'T-shirts', href: '/#t-shirts' },
  { label: 'Hoodies', href: '/#hoodies' },
] as const;
export const footerNavigation = [
  homepageNavigation[0], { label: 'Proposed process', href: '/#production' }, homepageNavigation[2],
] as const;
