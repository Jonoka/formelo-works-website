import routes from '../config/routes.json' with { type: 'json' };
import sourcePolicy from '../config/editorial-sources.json' with { type: 'json' };
import type { EditorialBlock, Inline } from './editorial';

// Pure validation shared by Studio, the CMS adapter and the existing renderer.
const fragments: Record<string, string[]> = {
  '/manufacturing/': ['options', 'moq', 'prepare', 'sampling', 'production', 'faq'],
  '/': ['capabilities', 'categories', 't-shirts', 'hoodies', 'factory', 'production', 'journal', 'enquiry-guide', 'contact'],
};
export function editorialObject(value: unknown, keys: string[], optional: string[] = []): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some(key => !keys.includes(key) && !optional.includes(key)) || keys.some(key => !(key in value))) {
    throw new Error('Invalid editorial structure or unsupported fields.');
  }
  return value as Record<string, unknown>;
}
export function editorialText(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > 16000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) {
    throw new Error('Readable bounded editorial text required.');
  }
}
export function validateEditorialLink(href: string): 'internal' | 'source' {
  if (typeof href !== 'string' || /[\s\\\u0000-\u001f]/.test(href)) throw new Error('Unsafe editorial link.');
  if (href.startsWith('/') && !href.startsWith('//')) {
    const [path, fragment, extra] = href.split('#');
    if (!path || extra !== undefined || !routes.pages.some(page => page.path === path) ||
        (fragment !== undefined && !fragments[path]?.includes(fragment))) throw new Error('Unknown internal editorial link.');
    return 'internal';
  }
  if (!href.startsWith('https://') || !sourcePolicy.sources.some(source => source.href === href && source.title && source.reviewedAt)) {
    throw new Error('External editorial link is not a reviewed HTTPS source.');
  }
  const url = new URL(href);
  if (url.username || url.password || url.search || url.hash || url.href !== href) throw new Error('Unsafe source URL.');
  return 'source';
}
export function validateEditorialInline(value: unknown): asserts value is Inline[] {
  if (!Array.isArray(value) || !value.length || value.length > 40) throw new Error('Invalid editorial inline content.');
  for (const item of value) {
    const kind = (item as Inline | null)?.type;
    editorialObject(item, kind === 'link' ? ['type', 'text', 'href'] : ['type', 'text'], ['marks']);
    if (kind !== 'text' && kind !== 'link') throw new Error('Unsupported editorial inline type.');
    // Formatting can create whitespace-only spans. Preserve those bytes, not empty paragraphs.
    if (typeof item.text !== 'string' || !item.text.length || item.text.length > 16000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(item.text)) throw new Error('Invalid editorial span.');
    if (item.marks !== undefined && (!Array.isArray(item.marks) || !item.marks.length || item.marks.length > 2 ||
        new Set(item.marks).size !== item.marks.length || item.marks.some((mark: unknown) => mark !== 'strong' && mark !== 'em'))) throw new Error('Unsupported editorial marks.');
    if (kind === 'link') validateEditorialLink(item.href);
  }
  if (!value.some(item => item.text.trim())) throw new Error('Empty editorial inline content.');
}
export function validateEditorialBody(value: unknown): asserts value is EditorialBlock[] {
  if (!Array.isArray(value) || !value.length || value.length > 160) throw new Error('Invalid editorial body.');
  let hasH2 = false;
  for (const block of value) {
    switch (block?.type) {
      case 'heading':
        editorialObject(block, ['type', 'level', 'text']); editorialText(block.text);
        if (block.level !== 2 && block.level !== 3) throw new Error('Only H2/H3 editorial headings are supported.');
        if (block.level === 3 && !hasH2) throw new Error('H3 requires a preceding H2.');
        if (block.level === 2) hasH2 = true;
        break;
      case 'paragraph': editorialObject(block, ['type', 'content']); validateEditorialInline(block.content); break;
      case 'list':
        editorialObject(block, ['type', 'ordered', 'items']);
        if (typeof block.ordered !== 'boolean' || !Array.isArray(block.items) || !block.items.length || block.items.length > 30) throw new Error('Invalid editorial list.');
        block.items.forEach(validateEditorialInline); break;
      case 'table':
        editorialObject(block, ['type', 'caption', 'columns', 'rows']); editorialText(block.caption);
        if (!Array.isArray(block.columns) || block.columns.length < 2 || block.columns.length > 6 ||
            !Array.isArray(block.rows) || !block.rows.length || block.rows.length > 30) throw new Error('Invalid editorial table.');
        block.columns.forEach(editorialText);
        for (const row of block.rows) {
          if (!Array.isArray(row) || row.length !== block.columns.length) throw new Error('Editorial table cells must match columns.');
          row.forEach(editorialText);
        }
        break;
      case 'callout': editorialObject(block, ['type', 'title', 'content']); editorialText(block.title); validateEditorialInline(block.content); break;
      case 'template': editorialObject(block, ['type', 'title', 'text']); editorialText(block.title); editorialText(block.text); break;
      default: throw new Error('Unsupported editorial block; raw HTML, scripts and embeds are forbidden.');
    }
  }
}
export function prepareEditorialBody(body: EditorialBlock[]) {
  validateEditorialBody(body);
  const used = new Set<string>();
  const blocks = body.map((block, index) => {
    if (block.type !== 'heading') return { block, id: `body-block-${index + 1}` };
    const base = `section-${block.text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'heading'}`;
    let id = base;
    for (let suffix = 2; used.has(id); suffix++) id = `${base}-${suffix}`;
    used.add(id);
    return { block, id };
  });
  const headings = blocks.flatMap(({ block, id }) => block.type === 'heading' && block.level === 2 ? [{ text: block.text, id }] : []);
  return { blocks, toc: headings.length >= 3 ? headings : [] };
}
