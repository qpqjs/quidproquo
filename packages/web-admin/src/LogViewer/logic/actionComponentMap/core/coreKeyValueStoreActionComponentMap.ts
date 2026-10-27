import { KeyValueStoreActionType } from 'quidproquo-core';

export const coreKeyValueStoreActionComponentMap: Record<string, string[]> = {
  [KeyValueStoreActionType.Query]: ['askKeyValueStoreQuery', 'keyValueStoreName', 'keyCondition', 'options'],
  [KeyValueStoreActionType.Upsert]: ['askKeyValueStoreUpsert', 'keyValueStoreName', 'item', 'options'],
  [KeyValueStoreActionType.UpsertMany]: ['askKeyValueStoreUpsertMany', 'keyValueStoreName', 'items', 'options'],
  [KeyValueStoreActionType.Get]: ['askKeyValueStoreGet', 'keyValueStoreName', 'key', 'options'],
  [KeyValueStoreActionType.GetAll]: ['askKeyValueStoreGetAll', 'keyValueStoreName', 'options'],
  [KeyValueStoreActionType.Delete]: ['askKeyValueStoreDelete', 'keyValueStoreName', 'key', 'sortKey', 'options'],
  [KeyValueStoreActionType.Update]: ['askKeyValueStoreUpdate', 'keyValueStoreName', 'updates', 'key', 'sortKey', 'options'],
  [KeyValueStoreActionType.Scan]: ['askKeyValueStoreScan', 'keyValueStoreName', 'filterCondition', 'nextPageKey'],
};

export default coreKeyValueStoreActionComponentMap;
