/** Returns the array with duplicates removed, keeping the FIRST item for each key (SameValueZero key equality). */
export function uniqueBy<T>(array: T[], keyFn: (item: T) => unknown): T[] {
  const seen = new Set<unknown>();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
