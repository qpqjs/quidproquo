/**
 * Deep-copies a value, calling `onMatch` for every property whose lower-cased name satisfies
 * `matches`, at any depth. `onMatch` receives the property value and returns its replacement;
 * matched subtrees are not descended into. Keys in `ignoredKeys` are skipped and descended normally.
 */
export const mapMatchingKeyedValues = <T>(
  value: T,
  matches: (lowerKey: string) => boolean,
  ignoredKeys: readonly string[],
  onMatch: (entry: unknown) => unknown,
): T => {
  if (Array.isArray(value)) {
    return value.map((entry) => mapMatchingKeyedValues(entry, matches, ignoredKeys, onMatch)) as T;
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  const mapEntry = ([key, entry]: [string, unknown]): [string, unknown] => {
    const lowerKey = key.toLowerCase();

    if (ignoredKeys.includes(lowerKey)) {
      return [key, mapMatchingKeyedValues(entry, matches, ignoredKeys, onMatch)];
    }

    return matches(lowerKey) ? [key, onMatch(entry)] : [key, mapMatchingKeyedValues(entry, matches, ignoredKeys, onMatch)];
  };

  return Object.fromEntries(Object.entries(value).map(mapEntry)) as T;
};
