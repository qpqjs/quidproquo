export function createErrorTypeEnumValue(base: string, error: string): string {
  return `${base}-${error}`;
}

export function createErrorEnumForAction<T extends string>(base: string, values: T[]): { [K in T]: string } {
  // Null prototype so every value lands as an own property. On a plain object a key
  // like "__proto__" would hit the prototype setter and silently drop the entry.
  const errorEnum = values.reduce(
    (acc, value) => {
      acc[value] = createErrorTypeEnumValue(base, value);
      return acc;
    },
    Object.create(null) as { [K in T]: string },
  );

  return errorEnum;
}
