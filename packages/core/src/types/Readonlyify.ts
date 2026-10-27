type ReadonlyifyTuple<T extends readonly unknown[]> = T extends readonly []
  ? readonly []
  : T extends readonly [infer H, ...infer R]
    ? readonly [Readonlyify<H>, ...ReadonlyifyTuple<R>]
    : never;

export type Readonlyify<T> =
  // functions unchanged
  T extends (...args: any) => any
    ? T
    : // Map/Set -> readonly variants
      T extends Map<infer K, infer V>
      ? ReadonlyMap<Readonlyify<K>, Readonlyify<V>>
      : T extends ReadonlyMap<infer K, infer V>
        ? ReadonlyMap<Readonlyify<K>, Readonlyify<V>>
        : T extends Set<infer U>
          ? ReadonlySet<Readonlyify<U>>
          : T extends ReadonlySet<infer U>
            ? ReadonlySet<Readonlyify<U>>
            : // Tuples first (preserve tuple-ness)
              T extends readonly [any, ...any[]]
              ? ReadonlyifyTuple<T>
              : // Arrays (mutable or already readonly)
                T extends (infer E)[]
                ? ReadonlyArray<Readonlyify<E>>
                : T extends readonly (infer E)[]
                  ? ReadonlyArray<Readonlyify<E>>
                  : // Plain objects (use mapped `readonly` on props)
                    T extends object
                    ? { readonly [K in keyof T]: Readonlyify<T[K]> }
                    : // Primitives
                      T;
