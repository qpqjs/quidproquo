import { KeyValueStoreQPQConfigSetting, KvsQueryOperation, Nullable } from 'quidproquo-core';

import { flattenKvsQueryConditions } from './flattenKvsQueryConditions';

/**
 * Pick the GSI that can serve the query, or null to query the primary table.
 * Returns the GSI's partition key name, which is also its index name (the CDK
 * construct names each GSI after its partition key).
 *
 * A Query MUST constrain the partition key of whatever it runs against. So: if
 * the query names the primary partition key, the primary table can serve it
 * (strongly consistent, and its sort key is available) - prefer it over any GSI.
 * Otherwise route to the GSI whose partition key the query names. Deciding on
 * the primary SORT key instead is wrong: a GSI commonly has the primary sort key
 * as its partition key (pk userId / sk tenantId with a GSI on tenantId), and a
 * query on that key alone can only be served by the GSI.
 */
export const getDynamoTableIndexByConfigAndQuery = (setting: KeyValueStoreQPQConfigSetting, query: KvsQueryOperation): Nullable<string> => {
  const queriedKeys = flattenKvsQueryConditions(query).map((condition) => condition.key);

  const primaryPartitionKey = setting.partitionKey?.key;
  if (primaryPartitionKey && queriedKeys.includes(primaryPartitionKey)) {
    return null;
  }

  const matchingIndex = setting.indexes.find((index) => queriedKeys.includes(index.partitionKey.key));

  return matchingIndex ? matchingIndex.partitionKey.key : null;
};
