import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreUpsertBase,
  createActionProcessor,
  getScopedKvsTranslatorOrThrow,
  KeyValueStoreActionType,
  ProcessorFor,
  QPQConfig,
  resolveKvsStoreConfigOrThrow,
} from 'quidproquo-core';

import { getKvsDynamoTableNameFromConfig } from '../../../awsNamingUtils';
import { putItem } from '../../../logic/dynamo';

const getProcessKeyValueStoreUpsert = (qpqConfig: QPQConfig): ProcessorFor<typeof askKeyValueStoreUpsertBase> => {
  return async ({ keyValueStoreName, item, options }) => {
    const dynamoTableName = getKvsDynamoTableNameFromConfig(keyValueStoreName, qpqConfig, 'kvs');
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      const storeConfig = resolveKvsStoreConfigOrThrow(qpqConfig, keyValueStoreName);

      const keys = [
        storeConfig.partitionKey,
        ...storeConfig.sortKeys,
        ...storeConfig.indexes.map((i) => i.partitionKey),
        ...storeConfig.indexes.filter((i) => !!i.sortKey).map((i) => i.sortKey!),
      ];

      // The scope lives inside the stored partition key value, so the item is
      // persisted with a composed pk; reads strip it back off.
      const scoped = getScopedKvsTranslatorOrThrow(qpqConfig, keyValueStoreName, options?.scope);

      await putItem(
        dynamoTableName,
        scoped.item(item),
        keys,
        {
          expires: options?.ttlInSeconds,
          ifNotExistsAttribute: options?.ifNotExists ? storeConfig.partitionKey.key : undefined,
        },
        region,
      );

      return actionResult(void 0);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        InternalServerError: () => actionResultError(askKeyValueStoreUpsertBase.errorType.ServiceUnavailable, 'KVS Service Unavailable'),
        ResourceNotFoundException: () => actionResultError(askKeyValueStoreUpsertBase.errorType.ResourceNotFound, 'KVS Resource Not Found'),
        ConditionalCheckFailedException: () => actionResultError(askKeyValueStoreUpsertBase.errorType.Conflict, 'KVS item already exists'),
        // Same lost race as an existing item: a transaction holds the item right now.
        TransactionConflictException: () =>
          actionResultError(askKeyValueStoreUpsertBase.errorType.Conflict, 'KVS item is being written by a transaction'),
        InvalidScopeError: (error) => actionResultError(askKeyValueStoreUpsertBase.errorType.InvalidScope, error.message),
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreUpsertBase.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreUpsertActionProcessor = createActionProcessor(askKeyValueStoreUpsertBase, getProcessKeyValueStoreUpsert);
