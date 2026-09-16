/** Deep-copies a value, applying `transform` to every string leaf in objects and arrays. */
export const mapStrings = <T>(value: T, transform: (text: string) => string): T => {
  if (typeof value === 'string') {
    return transform(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => mapStrings(entry, transform)) as T;
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, mapStrings(entry, transform)])) as T;
  }

  return value;
};
