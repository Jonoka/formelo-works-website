import type { EditorialBlock, Inline, TextMark } from './editorial';
import { validateEditorialBody, validateEditorialLink } from './editorial-policy';
import { array, fail, keyed, record, reference, string, CmsContentError, type RecordValue } from './cms-validation';

type PendingLink = { type: 'reference'; text: string; target: RecordValue; fragment: string | null; marks?: TextMark[] };
type InputInline = Inline | PendingLink;
type InputBlock = Exclude<EditorialBlock, { type: 'paragraph' | 'list' | 'callout' }> |
  { type: 'paragraph'; content: InputInline[] } | { type: 'list'; ordered: boolean; items: InputInline[][] } |
  { type: 'callout'; title: string; content: InputInline[] };
export type ReferenceResolver = (reference: unknown, field: string) => string;

function spans(block: RecordValue, field: string): InputInline[] {
  const definitions = keyed(block['markDefs'], `${field}.markDefs`);
  const used = new Set<string>();
  const children = keyed(block['children'], `${field}.children`);
  if (!children.length || children.length > 40) fail(`${field}.children`);
  const result = children.map((child, index): InputInline => {
    const path = `${field}.children[${index}]`;
    record(child, path, ['_type', '_key', 'text', 'marks']);
    if (child['_type'] !== 'span') fail(path, 'CMS_UNSUPPORTED_BLOCK');
    const text = string(child['text'], `${path}.text`, true);
    const supplied = array(child['marks'], `${path}.marks`, 0, 3).map(mark => string(mark, `${path}.marks`));
    if (new Set(supplied).size !== supplied.length) fail(`${path}.marks`);
    const marks = supplied.filter((mark): mark is TextMark => mark === 'strong' || mark === 'em');
    const annotations = supplied.filter(mark => mark !== 'strong' && mark !== 'em');
    if (annotations.length > 1) fail(`${path}.marks`, 'CMS_UNSUPPORTED_MARK');
    const formatting = marks.length ? { marks } : {};
    if (!annotations.length) return { type: 'text', text, ...formatting };
    const key = annotations[0]!;
    const annotation = definitions.find(item => item['_key'] === key);
    if (!annotation) fail(`${path}.marks`, 'CMS_REFERENCE');
    used.add(key);
    if (annotation['_type'] === 'editorialExternalLink') {
      record(annotation, `${field}.markDefs`, ['_type', '_key', 'href']);
      const href = string(annotation['href'], `${field}.markDefs.href`);
      try { if (validateEditorialLink(href) !== 'source') fail(field); } catch { fail(`${field}.markDefs.href`, 'CMS_LINK'); }
      return { type: 'link', text, href, ...formatting };
    }
    if (annotation['_type'] === 'editorialInternalLink') {
      record(annotation, `${field}.markDefs`, ['_type', '_key', 'target', 'fragment']);
      const target = reference(annotation['target'], `${field}.markDefs.target`);
      const fragment = annotation['fragment'] == null ? null : string(annotation['fragment'], `${field}.markDefs.fragment`);
      if (fragment !== null && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fragment)) fail(`${field}.markDefs.fragment`, 'CMS_LINK');
      return { type: 'reference', target, fragment, text, ...formatting };
    }
    return fail(`${field}.markDefs`, 'CMS_UNSUPPORTED_MARK');
  });
  if (definitions.length !== used.size || !result.some(item => item.text.trim())) fail(field, 'CMS_UNUSED_OR_EMPTY');
  return result;
}
function textBlock(block: RecordValue, field: string): InputInline[] {
  record(block, field, ['_type', '_key', 'style', 'children', 'markDefs', 'listItem', 'level']);
  if (block['_type'] !== 'block' || !['normal', 'h2', 'h3'].includes(String(block['style']))) fail(field, 'CMS_UNSUPPORTED_BLOCK');
  if (block['listItem'] != null && (!['bullet', 'number'].includes(String(block['listItem'])) || block['level'] !== 1 || block['style'] !== 'normal')) fail(field, 'CMS_UNSUPPORTED_LIST');
  if (block['listItem'] == null && block['level'] != null) fail(field, 'CMS_UNSUPPORTED_LIST');
  return spans(block, field);
}
/** Validate native Portable Text and bounded custom objects without querying an account.
 * References remain unresolved tokens here. Only convertCmsBody produces rendering data. */
export function parseCmsBody(value: unknown): InputBlock[] {
  const raw = keyed(value, 'body');
  if (!raw.length) fail('body');
  const result: InputBlock[] = [];
  let h2 = false;
  for (const [index, block] of raw.entries()) {
    const field = `body[${index}]`;
    if (block['_type'] === 'block') {
      const content = textBlock(block, field);
      if (block['style'] !== 'normal') {
        if (content.some(item => item.type !== 'text' || item.marks?.length)) fail(field, 'CMS_HEADING_FORMAT');
        if (block['style'] === 'h3' && !h2) fail(field, 'CMS_HEADING_ORDER');
        if (block['style'] === 'h2') h2 = true;
        result.push({ type: 'heading', level: block['style'] === 'h2' ? 2 : 3, text: content.map(item => item.text).join('') });
      } else if (block['listItem'] != null) {
        const ordered = block['listItem'] === 'number', previous = result.at(-1);
        if (previous?.type === 'list' && previous.ordered === ordered) {
          if (previous.items.length >= 30) fail(field, 'CMS_UNSUPPORTED_LIST');
          previous.items.push(content);
        } else result.push({ type: 'list', ordered, items: [content] });
      } else result.push({ type: 'paragraph', content });
    } else if (block['_type'] === 'editorialTable') {
      record(block, field, ['_type', '_key', 'caption', 'columns', 'rows']);
      const columns = array(block['columns'], `${field}.columns`, 2, 6).map(v => string(v, `${field}.columns`));
      const rows = keyed(block['rows'], `${field}.rows`);
      if (!rows.length || rows.length > 30) fail(`${field}.rows`);
      const cells = rows.map(row => {
        record(row, `${field}.rows`, ['_type', '_key', 'cells']);
        if (row['_type'] !== 'editorialTableRow') fail(`${field}.rows`, 'CMS_UNSUPPORTED_BLOCK');
        return array(row['cells'], `${field}.rows.cells`, columns.length, columns.length).map(v => string(v, `${field}.rows.cells`));
      });
      result.push({ type: 'table', caption: string(block['caption'], `${field}.caption`), columns, rows: cells });
    } else if (block['_type'] === 'editorialCallout') {
      record(block, field, ['_type', '_key', 'title', 'content']);
      const content = keyed(block['content'], `${field}.content`);
      if (content.length !== 1 || content[0]!['style'] !== 'normal' || content[0]!['listItem'] != null) fail(`${field}.content`);
      result.push({ type: 'callout', title: string(block['title'], `${field}.title`), content: textBlock(content[0]!, `${field}.content[0]`) });
    } else if (block['_type'] === 'editorialTemplate') {
      record(block, field, ['_type', '_key', 'title', 'text']);
      result.push({ type: 'template', title: string(block['title'], `${field}.title`), text: string(block['text'], `${field}.text`) });
    } else fail(field, 'CMS_UNSUPPORTED_BLOCK');
  }
  return result;
}
export function validateCmsBodyInput(value: unknown): true | string {
  try { parseCmsBody(value); return true; }
  catch (error) { return error instanceof CmsContentError ? error.message : 'CMS_INVALID: body'; }
}
export function convertCmsBody(value: unknown, resolve: ReferenceResolver): EditorialBlock[] {
  const mapInline = (items: InputInline[], field: string): Inline[] => items.map((item, index) => {
    if (item.type !== 'reference') return item;
    const href = resolve(item.target, `${field}[${index}].target`) + (item.fragment === null ? '' : `#${item.fragment}`);
    try { if (validateEditorialLink(href) !== 'internal') fail(field); } catch { fail(field, 'CMS_LINK'); }
    return { type: 'link', text: item.text, href, ...(item.marks ? { marks: item.marks } : {}) };
  });
  const body = parseCmsBody(value).map((block, index): EditorialBlock => {
    const field = `body[${index}]`;
    if (block.type === 'paragraph' || block.type === 'callout') return { ...block, content: mapInline(block.content, field) };
    if (block.type === 'list') return { ...block, items: block.items.map((item, row) => mapInline(item, `${field}.items[${row}]`)) };
    return block;
  });
  try { validateEditorialBody(body); } catch { fail('body', 'CMS_RENDER_CONTRACT'); }
  return body;
}
