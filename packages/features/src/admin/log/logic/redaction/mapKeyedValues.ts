import { mapMatchingKeyedValues } from './mapMatchingKeyedValues';

/**
 * Deep-copies a value, calling `onMatch` for every property whose (lower-cased) name is in `keys`,
 * at any depth. `onMatch` receives the property value and returns its replacement; matched
 * subtrees are not descended into. Keys in `ignoredKeys` are skipped and descended normally.
 */
export const mapKeyedValues = <T>(value: T, keys: readonly string[], ignoredKeys: readonly string[], onMatch: (entry: unknown) => unknown): T =>
  mapMatchingKeyedValues(value, (lowerKey) => keys.includes(lowerKey), ignoredKeys, onMatch);
