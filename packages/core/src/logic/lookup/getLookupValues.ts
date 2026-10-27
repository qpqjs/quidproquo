export function getLookupValues<T extends Record<string, any>>(enumObj: T): Array<keyof T | 'All'> {
  // Filter out numeric keys by checking if Number(key) is NaN.
  const namedKeys = Object.keys(enumObj).filter((key) => isNaN(Number(key))) as Array<keyof T>;
  return ['All', ...namedKeys];
}
