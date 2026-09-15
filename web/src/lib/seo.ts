/** Content stores the page-specific title only; the layout adds the configured brand. */
export function titleWithBrand(title: string, brandName: string): string {
  if (!title.trim() || !brandName.trim()) throw new Error('SEO title and configured brand must not be empty.');
  return `${title.trim()} — ${brandName.trim()}`;
}
