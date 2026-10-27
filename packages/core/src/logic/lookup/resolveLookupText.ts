export function resolveLookupText<T extends Record<string, string | number>>(value: T[keyof T], enumObj: T): keyof T | string {
  return (Object.keys(enumObj) as Array<keyof T>).find((key) => enumObj[key] === value) || '';
}
