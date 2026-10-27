export function getAllEnumValues<T extends Record<string, any>>(enumObj: T): Array<T[keyof T]> {
  return Object.values(enumObj) as Array<T[keyof T]>;
}
