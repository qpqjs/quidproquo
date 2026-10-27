import NodeCache from 'node-cache';

// `any` is the variance boundary that lets one signature wrap functions of any arity.
type AnyFunc = (...args: any[]) => any;

// Keyed per wrapped function so each memoized function gets its own cache.
const cache = new WeakMap<AnyFunc, NodeCache>();

/**
 * Memoizes an async function by its JSON-stringified arguments, caching the RESOLVED
 * value (falsy values included). A rejected promise is not cached, so failures retry.
 * @param func The function to memoize.
 * @param ttlInSeconds Time-to-live for the cached values in seconds.
 * @returns The memoized function.
 */
export const memoFuncAsync = <T extends AnyFunc>(func: T, ttlInSeconds: number = 3600): T => {
  return (async (...args: Parameters<T>) => {
    if (!cache.has(func)) {
      cache.set(func, new NodeCache({ stdTTL: ttlInSeconds }));
    }

    const cacheKey = JSON.stringify(args);
    const nodeCache = cache.get(func)!;

    if (nodeCache.has(cacheKey)) {
      return nodeCache.get<Awaited<ReturnType<T>>>(cacheKey);
    }

    // Await before caching so only resolved values are stored
    const result = await func(...args);
    nodeCache.set(cacheKey, result);

    return result;
  }) as unknown as T;
};
