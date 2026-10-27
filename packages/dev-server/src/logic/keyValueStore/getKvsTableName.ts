import { KeyValueStoreQPQConfigSetting, QPQConfig, qpqCoreUtils } from 'quidproquo-core';

/**
 * The (unquoted) table a store lives in: qpq_kvs_<ownerModule>_<storeName>.
 * The OWNER module names the table, so a store owned by service A and read by
 * service B resolves to the same rows from either side.
 */
export const getKvsTableName = (qpqConfig: QPQConfig, storeConfig: KeyValueStoreQPQConfigSetting, keyValueStoreName: string): string => {
  const ownerModule = storeConfig.owner?.module ?? qpqCoreUtils.getApplicationModuleName(qpqConfig);
  return `qpq_kvs_${ownerModule}_${keyValueStoreName}`;
};
