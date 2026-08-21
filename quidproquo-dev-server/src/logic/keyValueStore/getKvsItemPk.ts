import { KeyValueStoreQPQConfigSetting } from 'quidproquo-core';

/** The item's partition key value, native JS type preserved. */
export const getKvsItemPk = (item: any, storeConfig: KeyValueStoreQPQConfigSetting): any => item[storeConfig.partitionKey.key];
