// AWS SDK client constructors vary in config type and optionality (some take an optional
// config); `any` here is the variance boundary that lets one helper accept them all.
type AnyClientConstructor = new (args: any) => unknown;

// One client instance per (client class, config) pair, reused across invocations in a
// warm lambda container so connection pools and SDK middleware are not rebuilt per call.
const cache = new WeakMap<AnyClientConstructor, Map<string, unknown>>();

/**
 * Returns a cached AWS SDK v3 client for the given class and config, creating it on first
 * use.
 */
export function createAwsClient<TClient>(ClientClass: new (args: any) => TClient, args: object): TClient {
  let argsCache = cache.get(ClientClass);
  if (!argsCache) {
    argsCache = new Map();
    cache.set(ClientClass, argsCache);
  }

  const argsKey = JSON.stringify(args);

  if (!argsCache.has(argsKey)) {
    argsCache.set(argsKey, new ClientClass(args));
  }

  return argsCache.get(argsKey) as TClient;
}
