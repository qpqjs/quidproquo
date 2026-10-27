import NodeCache from 'node-cache';

// `any` is the variance boundary that lets one signature wrap functions of any arity.
type AnyFunc = (...args: any[]) => any;

// Keyed per wrapped function so each memoized function gets its own cache.
const cache = new WeakMap<AnyFunc, NodeCache>();

/**
 * Memoizes a synchronous function by its JSON-stringified arguments.
 * Note: only truthy results are cached; a falsy result is recomputed on every call.
 * @param func The function to memoize.
 * @param ttlInSeconds Time-to-live for the cached values in seconds.
 * @returns The memoized function.
 */
export const memoFunc = <T extends AnyFunc>(func: T, ttlInSeconds: number = 3600): T => {
  return ((...args: Parameters<T>) => {
    if (!cache.has(func)) {
      cache.set(func, new NodeCache({ stdTTL: ttlInSeconds }));
    }

    const cacheKey = JSON.stringify(args);
    const nodeCache = cache.get(func)!;
    const cachedValue = nodeCache.get<ReturnType<T>>(cacheKey);

    if (cachedValue) {
      return cachedValue;
    }

    const result = func(...args);
    nodeCache.set(cacheKey, result);

    return result;
  }) as T;
};
