import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreScanAllScopesBase,
  createActionProcessor,
  KeyValueStoreQPQConfigSetting,
  KvsScopedItem,
  ProcessorFor,
  QPQConfig,
  resolveKvsStoreConfigOrThrow,
} from 'quidproquo-core';

import { getKvsDynamoTableNameFromConfig } from '../../../awsNamingUtils';
import { scan } from '../../../logic/dynamo';
import { decomposeScopedKvsValue, stripScopedKvsIndexAttributes } from '../../../logic/dynamo/scope';

// Split a stored row into the scope it lives under and the item a scoped read would return. Only a
// string pk can carry a composed scope; anything else is unscoped by construction. A scoped row's
// hidden index copies are dropped too, so a caller re-writing it under another scope can't carry
// the old scope's copies across.
const toKvsScopedItem = (storeConfig: KeyValueStoreQPQConfigSetting, item: Record<string, any>): KvsScopedItem<any> => {
  if (storeConfig.partitionKey.type !== 'string') {
    return { item };
  }

  const partitionKey = storeConfig.partitionKey.key;
  const { scope, rawValue } = decomposeScopedKvsValue(String(item[partitionKey] ?? ''));
  const rawItem = { ...item, [partitionKey]: rawValue };

  return { scope, item: scope === undefined ? rawItem : stripScopedKvsIndexAttributes(rawItem) };
};

// Every row in the table, scope and all. No scoped translator is involved: that is the whole
// point, and it is why this action is migration-only (see askKeyValueStoreScanAllScopes).
//
// The scope is composed into the partition key value, so each row is split back into the
// scope it belongs to plus its raw key, exactly as the stream processor does. The caller gets
// items indistinguishable from a scoped read, plus the scope beside them.
const getProcessKeyValueStoreScanAllScopes = (qpqConfig: QPQConfig): ProcessorFor<typeof askKeyValueStoreScanAllScopesBase> => {
  return async ({ keyValueStoreName, filterCondition, nextPageKey }) => {
    const dynamoTableName = getKvsDynamoTableNameFromConfig(keyValueStoreName, qpqConfig, 'kvs');
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      const storeConfig = resolveKvsStoreConfigOrThrow(qpqConfig, keyValueStoreName);

      const page = await scan<any>(dynamoTableName, region, filterCondition, nextPageKey);
      const items = page.items.map((item: Record<string, any>) => toKvsScopedItem(storeConfig, item));

      return actionResult({ items, nextPageKey: page.nextPageKey });
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        InternalServerError: () => actionResultError(askKeyValueStoreScanAllScopesBase.errorType.ServiceUnavailable, 'KVS Service Unavailable'),
        ResourceNotFoundException: () => actionResultError(askKeyValueStoreScanAllScopesBase.errorType.ResourceNotFound, 'KVS Resource Not Found'),
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreScanAllScopesBase.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreScanAllScopesActionProcessor = createActionProcessor(
  askKeyValueStoreScanAllScopesBase,
  getProcessKeyValueStoreScanAllScopes,
);
