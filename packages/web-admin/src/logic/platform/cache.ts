type CacheKey = string;
type CachedFunction<T extends (...args: any[]) => any> = (...args: Parameters<T>) => ReturnType<T>;

export function cache<T extends (...args: any[]) => any>(fn: T): CachedFunction<T> {
  const cache = new WeakMap<T, Map<CacheKey, ReturnType<T>>>();

  return (...args: Parameters<T>): ReturnType<T> => {
    if (!cache.has(fn)) {
      cache.set(fn, new Map());
    }

    const funcCache = cache.get(fn)!;
    const cacheKey = JSON.stringify(args);

    if (funcCache.has(cacheKey)) {
      return funcCache.get(cacheKey)!;
    }

    const result = fn(...args);
    funcCache.set(cacheKey, result);

    return result;
  };
}
