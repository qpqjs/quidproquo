import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

// The store's key attributes, lifted off a stored item. A stream record carries only the keys
// (plus the images), and locally we have the whole item, so this picks out the same subset a
// real stream would have delivered.
export const toKvsStreamKeys = (qpqConfig: QPQConfig, keyValueStoreName: string, item: Record<string, unknown>): Record<string, unknown> => {
  const storeConfig = qpqCoreUtils.getKeyValueStoreByName(qpqConfig, keyValueStoreName);

  if (!storeConfig) {
    return {};
  }

  const keyAttributes = [storeConfig.partitionKey, ...storeConfig.sortKeys];

  return Object.fromEntries(keyAttributes.map((attribute) => [attribute.key, item[attribute.key]]));
};

// The composite key string the dev server addresses an item by: `pk` alone, or `pk#sk`. Mirrors
// what the get/delete processors build from an explicit key + sortKey, but derived from a
// whole item, which is what an upsert has to work with.
export const toKvsCompositeKey = (qpqConfig: QPQConfig, keyValueStoreName: string, item: Record<string, unknown>): string => {
  const storeConfig = qpqCoreUtils.getKeyValueStoreByName(qpqConfig, keyValueStoreName);
  const [sortKey] = storeConfig?.sortKeys ?? [];

  const partitionValue = String(item[storeConfig?.partitionKey.key ?? ''] ?? '');

  return sortKey ? `${partitionValue}#${String(item[sortKey.key] ?? '')}` : partitionValue;
};
