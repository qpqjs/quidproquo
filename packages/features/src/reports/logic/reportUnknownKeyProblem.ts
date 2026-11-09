import { Nullable } from '@qpqjs/core';

/** The first key of `record` outside `allowedKeys`, as a sentence, or null when there is none. Catches a misspelt option. */
export const reportUnknownKeyProblem = (record: Record<string, unknown>, allowedKeys: readonly string[]): Nullable<string> => {
  const unknownKey = Object.keys(record).find((key) => !allowedKeys.includes(key));

  return unknownKey === undefined ? null : `unknown key '${unknownKey}' (expected one of ${allowedKeys.join(', ')})`;
};
