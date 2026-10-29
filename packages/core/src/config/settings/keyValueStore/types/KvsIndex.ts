import { KvsKey } from './KvsKey';

export type KvsIndex<T extends object = any> = {
  // What the index is queried by (askKeyValueStoreQuery's `indexName` option) and deployed as.
  name: string;
  partitionKey: KvsKey<T>;
  sortKey?: KvsKey<T>;
};
