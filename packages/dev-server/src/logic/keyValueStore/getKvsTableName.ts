import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { resolveOwnedStoreLocation } from '../config/resolveOwnedStoreLocation';

/**
 * The (unquoted) table a store lives in: qpq_kvs_<ownerService>_<storeName>.
 * The OWNER service names the table, under the owner's name for the store (its
 * resourceNameOverride when it renamed it), so a store owned by service A and read
 * by service B resolves to the same rows from either side, as the dynamo table does.
 */
export const getKvsTableName = (keyValueStoreName: string, qpqConfig: QPQConfig): string => {
  const storeConfig = qpqCoreUtils.resolveKeyValueStoreOrThrow(keyValueStoreName, qpqConfig);
  const { serviceName, key } = resolveOwnedStoreLocation(keyValueStoreName, storeConfig.owner, qpqConfig);

  return `qpq_kvs_${serviceName}_${key}`;
};
