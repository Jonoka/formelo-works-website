/** Only implemented categories; other planned pages resolve to real homepage sections. */
export const homepageNavigation = [
  { label: 'Manufacturing', href: '/#capabilities' },
  { label: 'Our Factory', href: '/#factory' },
  { label: 'Journal', href: '/#journal' },
  { label: 'Contact', href: '/#contact' },
] as const;
export const demonstrationNavigation = [
  { label: 'T-shirts', href: '/clothing/t-shirts/' },
  { label: 'Hoodies', href: '/clothing/hoodies/' },
] as const;
export const footerNavigation = [
  homepageNavigation[0], { label: 'Proposed process', href: '/#production' }, homepageNavigation[2],
] as const;
