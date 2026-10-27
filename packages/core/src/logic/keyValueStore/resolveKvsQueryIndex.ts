import { KvsQueryOperation } from '../../actions/keyValueStore/types';
import { KeyValueStoreQPQConfigSetting, KvsIndex, KvsKey } from '../../config/settings/keyValueStore';
import { Nullable } from '../../types/Nullable';
import { flattenKvsQueryConditions } from './flattenKvsQueryConditions';
import { KvsIndexNotFoundError } from './KvsIndexNotFoundError';

// A key condition may only name the partition key and sort key of whatever it runs against, and must
// name the partition key.
const keySchemaServes = (queriedKeys: string[], partitionKey: KvsKey, sortKey?: KvsKey): boolean =>
  queriedKeys.includes(partitionKey.key) && queriedKeys.every((key) => key === partitionKey.key || key === sortKey?.key);

/**
 * The index a query runs against, or null for the table itself. `name` forces the declared index with
 * that name; an undeclared name throws KvsIndexNotFoundError. Otherwise the first of the table, then each
 * index in declaration order, whose keys cover every attribute the key condition names; the table wins
 * ties (it can serve consistent reads). Null when nothing covers it, so the table refuses the query.
 */
export const resolveKvsQueryIndex = (
  storeConfig: KeyValueStoreQPQConfigSetting,
  keyCondition: KvsQueryOperation,
  name?: string,
): Nullable<KvsIndex> => {
  if (name !== undefined) {
    const namedIndex = storeConfig.indexes.find((index) => index.name === name);
    if (!namedIndex) {
      throw new KvsIndexNotFoundError(storeConfig.keyValueStoreName, name);
    }

    return namedIndex;
  }

  const queriedKeys = flattenKvsQueryConditions(keyCondition).map((condition) => condition.key);
  if (keySchemaServes(queriedKeys, storeConfig.partitionKey, storeConfig.sortKeys[0])) {
    return null;
  }

  return storeConfig.indexes.find((index) => keySchemaServes(queriedKeys, index.partitionKey, index.sortKey)) ?? null;
};
