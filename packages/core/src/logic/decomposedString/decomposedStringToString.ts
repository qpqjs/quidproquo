import { DecomposedString, DecomposedStringPrimitive } from '../../types';

export function decomposedStringToString(
  decomposedString: DecomposedString,
  valueResolver: (value: DecomposedStringPrimitive) => string = (v) => String(v),
) {
  // This runs over persisted log payloads, which can be missing or malformed
  // (callers pass payload?.messageParts). Degrade to a partial string instead
  // of throwing or printing "undefined" fillers.
  const [strings = [], values = []] = decomposedString ?? [];

  return values.reduce(
    (str: string, value: DecomposedStringPrimitive, index: number) => `${str}${valueResolver(value)}${strings[index + 1] ?? ''}`,
    strings[0] ?? '',
  );
}
