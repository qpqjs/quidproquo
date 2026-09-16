/** Every string leaf in a value, in traversal order. */
export const collectStrings = (value: unknown): string[] => {
  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectStrings);
  }

  if (value !== null && typeof value === 'object') {
    return Object.values(value).flatMap(collectStrings);
  }

  return [];
};
