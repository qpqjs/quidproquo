/**
 * The type of `omitKey`'s result: the key is gone from a concrete object type, while a record
 * with an index signature keeps its type, since it never tracked individual keys.
 */
export type OmitKey<T, K extends PropertyKey> = string extends keyof T ? T : Omit<T, K>;

/** A copy of `record` without `key`. The input is never mutated. */
export const omitKey = <T extends object, K extends keyof T & string>(record: T, key: K): OmitKey<T, K> =>
  Object.fromEntries(Object.entries(record).filter(([k]) => k !== key)) as OmitKey<T, K>;
