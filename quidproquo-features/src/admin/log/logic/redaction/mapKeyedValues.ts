/**
 * Deep-copies a value, calling `onMatch` for every property whose (lower-cased) name is in `keys`,
 * at any depth. `onMatch` receives the property value and returns its replacement; matched
 * subtrees are not descended into. Keys in `ignoredKeys` are skipped and descended normally.
 */
export const mapKeyedValues = <T>(value: T, keys: readonly string[], ignoredKeys: readonly string[], onMatch: (entry: unknown) => unknown): T => {
  if (Array.isArray(value)) {
    return value.map((entry) => mapKeyedValues(entry, keys, ignoredKeys, onMatch)) as T;
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  const mapEntry = ([key, entry]: [string, unknown]): [string, unknown] => {
    const lowerKey = key.toLowerCase();

    if (ignoredKeys.includes(lowerKey)) {
      return [key, mapKeyedValues(entry, keys, ignoredKeys, onMatch)];
    }

    return keys.includes(lowerKey) ? [key, onMatch(entry)] : [key, mapKeyedValues(entry, keys, ignoredKeys, onMatch)];
  };

  return Object.fromEntries(Object.entries(value).map(mapEntry)) as T;
};
