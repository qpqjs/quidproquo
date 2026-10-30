import { awsNamingUtils, qpqConfigAwsUtils } from '@qpqjs/config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreUpsertBase,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  resolveKvsStoreConfigOrThrow,
  transientErrorMap,
} from '@qpqjs/core';

import { putItem } from '../../../logic/dynamo';
import { getScopedKvsTranslatorOrThrow } from '../../../logic/dynamo/scope';

const getProcessKeyValueStoreUpsert = (qpqConfig: QPQConfig): ProcessorFor<typeof askKeyValueStoreUpsertBase> => {
  return async ({ keyValueStoreName, item, options }) => {
    const dynamoTableName = awsNamingUtils.getKvsDynamoTableNameFromConfig(keyValueStoreName, qpqConfig, 'kvs');
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

      return actionResult(undefined);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        ...transientErrorMap(),
        InternalServerError: () => actionResultError(askKeyValueStoreUpsertBase.errorType.Throttled, 'KVS Service Unavailable'),
        ResourceNotFoundException: () => actionResultError(askKeyValueStoreUpsertBase.errorType.ResourceNotFound, 'KVS Resource Not Found'),
        ConditionalCheckFailedException: () => actionResultError(askKeyValueStoreUpsertBase.errorType.Conflict, 'KVS item already exists'),
        TransactionConflictException: () =>
          actionResultError(askKeyValueStoreUpsertBase.errorType.WriteContention, 'KVS item is being written by a transaction'),
        InvalidScopeError: (error) => actionResultError(askKeyValueStoreUpsertBase.errorType.InvalidScope, error.message),
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreUpsertBase.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreUpsertActionProcessor = createActionProcessor(askKeyValueStoreUpsertBase, getProcessKeyValueStoreUpsert);
