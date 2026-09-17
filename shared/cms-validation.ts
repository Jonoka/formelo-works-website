/** Errors contain codes and developer-owned field paths only, never supplied values or causes. */
export class CmsContentError extends Error {
  constructor(readonly code: string, readonly field: string) {
    super(`${code}: ${field}`);
    this.name = 'CmsContentError';
  }
}
export function fail(field: string, code = 'CMS_INVALID'): never { throw new CmsContentError(code, field); }
export type RecordValue = Record<string, unknown>;
export function record(value: unknown, field: string, allowed?: readonly string[]): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(field);
  const result = value as RecordValue;
  if (allowed && Object.keys(result).some(key => !allowed.includes(key))) fail(field, 'CMS_UNSUPPORTED_FIELD');
  return result;
}
export function string(value: unknown, field: string, whitespace = false): string {
  if (typeof value !== 'string' || !(whitespace ? value.length : value.trim().length) || value.length > 16000 ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) fail(field);
  return value;
}
export function array(value: unknown, field: string, min = 0, max = 160): unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) fail(field);
  return value;
}
export function id(value: unknown, field: string): string {
  const result = string(value, field);
  if (result.length > 128 || !/^[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*$/.test(result) || /^(drafts|versions)\./.test(result)) fail(field, 'CMS_UNPUBLISHED');
  return result;
}
export function keyed(value: unknown, field: string): RecordValue[] {
  const keys = new Set<string>();
  return array(value, field, 0, 160).map((item, index) => {
    const path = `${field}[${index}]`, result = record(item, path), key = string(result['_key'], `${path}._key`);
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(key) || keys.has(key)) fail(`${path}._key`);
    keys.add(key); return result;
  });
}
export function date(value: unknown, field: string, now: number, datetime = false): string {
  const result = string(value, field);
  const pattern = datetime ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/ : /^\d{4}-\d{2}-\d{2}$/;
  const time = Date.parse(result);
  if (!pattern.test(result) || !Number.isFinite(time) || !Number.isFinite(now) || time > now ||
      new Date(time).toISOString().slice(0, 10) !== result.slice(0, 10) ||
      (datetime && new Date(time).toISOString().replace('.000Z', 'Z') !== result.replace('.000Z', 'Z'))) fail(field, 'CMS_DATE');
  return result;
}
export function reference(value: unknown, field: string): RecordValue {
  const result = record(value, field, ['_type', '_ref', '_key', '_weak', 'document']);
  if (result['_type'] !== 'reference' || (result['_weak'] != null && result['_weak'] !== false)) fail(field, 'CMS_REFERENCE');
  id(result['_ref'], `${field}._ref`); return result;
}
