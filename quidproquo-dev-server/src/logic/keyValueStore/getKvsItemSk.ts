import { KeyValueStoreQPQConfigSetting } from 'quidproquo-core';

/** The item's sort key value, or null when the store has no sort key. */
export const getKvsItemSk = (item: any, storeConfig: KeyValueStoreQPQConfigSetting): any =>
  storeConfig.sortKeys.length > 0 ? item[storeConfig.sortKeys[0].key] : null;
