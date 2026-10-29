import { awsNamingUtils, qpqConfigAwsUtils } from '@qpqjs/config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreUpdateBase,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  resolveKvsStoreConfigOrThrow,
  transientErrorMap,
} from '@qpqjs/core';

import { updateItem } from '../../../logic/dynamo';
import { getScopedKvsTranslatorOrThrow } from '../../../logic/dynamo/scope';

const getProcessKeyValueStoreUpdate = (qpqConfig: QPQConfig): ProcessorFor<typeof askKeyValueStoreUpdateBase> => {
  return async ({ keyValueStoreName, key, sortKey, updates, options }) => {
    const dynamoTableName = awsNamingUtils.getKvsDynamoTableNameFromConfig(keyValueStoreName, qpqConfig, 'kvs');
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      const storeConfig = resolveKvsStoreConfigOrThrow(qpqConfig, keyValueStoreName);
      const scoped = getScopedKvsTranslatorOrThrow(qpqConfig, keyValueStoreName, options?.scope);

      const item = await updateItem(
        dynamoTableName,
        region,
        scoped.update(updates),
        storeConfig.partitionKey.key,
        scoped.key(key),
        storeConfig.sortKeys[0]?.key,
        sortKey,
        scoped.filter(options?.condition),
      );

      return actionResult(scoped.strip(item));
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        ...transientErrorMap(),
        InternalServerError: () => actionResultError(askKeyValueStoreUpdateBase.errorType.Throttled, 'KVS Service Unavailable'),
        ResourceNotFoundException: () => actionResultError(askKeyValueStoreUpdateBase.errorType.ResourceNotFound, 'KVS Resource Not Found'),
        ConditionalCheckFailedException: () => actionResultError(askKeyValueStoreUpdateBase.errorType.ConditionFailed, 'KVS update condition failed'),
        InvalidScopeError: (error) => actionResultError(askKeyValueStoreUpdateBase.errorType.InvalidScope, error.message),
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreUpdateBase.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreUpdateActionProcessor = createActionProcessor(askKeyValueStoreUpdateBase, getProcessKeyValueStoreUpdate);
