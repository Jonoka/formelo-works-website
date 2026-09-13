export function validSlug(value: unknown): true | string {
  const slug = (value as { current?: unknown } | undefined)?.current;
  return typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ? true : 'Use a lowercase, hyphen-separated slug without a path, query or fragment.';
}

export function validMoq(value: unknown): true | string {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object') return 'Enter an MOQ policy.';
  const policy = value as Record<string, unknown>;
  if (policy['mode'] !== 'confirmedQuantity' && policy['mode'] !== 'projectBased') return 'Select an MOQ mode.';
  if (policy['mode'] === 'confirmedQuantity' && (!Number.isInteger(policy['quantity']) || Number(policy['quantity']) <= 0)) {
    return 'A confirmed quantity must be a positive integer.';
  }
  if (policy['mode'] === 'projectBased' && policy['quantity'] != null) return 'Project-based MOQ must not include a quantity.';
  return true;
}
