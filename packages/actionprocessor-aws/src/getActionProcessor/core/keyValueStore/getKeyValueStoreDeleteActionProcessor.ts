import { awsNamingUtils, qpqConfigAwsUtils } from '@qpqjs/config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreDelete,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  resolveKvsStoreConfigOrThrow,
  transientErrorMap,
} from '@qpqjs/core';

import { deleteItem } from '../../../logic/dynamo';
import { getScopedKvsTranslatorOrThrow } from '../../../logic/dynamo/scope';

const getProcessKeyValueStoreDelete = (qpqConfig: QPQConfig): ProcessorFor<typeof askKeyValueStoreDelete> => {
  return async ({ keyValueStoreName, key, sortKey, options }) => {
    const dynamoTableName = awsNamingUtils.getKvsDynamoTableNameFromConfig(keyValueStoreName, qpqConfig, 'kvs');
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      const storeConfig = resolveKvsStoreConfigOrThrow(qpqConfig, keyValueStoreName);
      const scoped = getScopedKvsTranslatorOrThrow(qpqConfig, keyValueStoreName, options?.scope);

      await deleteItem(dynamoTableName, region, scoped.key(key), storeConfig.partitionKey.key, sortKey, storeConfig.sortKeys[0]?.key);

      return actionResult(undefined);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        ...transientErrorMap(),
        InternalServerError: () => actionResultError(askKeyValueStoreDelete.errorType.Throttled, 'KVS Service Unavailable'),
        ResourceNotFoundException: () => actionResultError(askKeyValueStoreDelete.errorType.ResourceNotFound, 'KVS Resource Not Found'),
        InvalidScopeError: (error) => actionResultError(askKeyValueStoreDelete.errorType.InvalidScope, error.message),
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreDelete.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreDeleteActionProcessor = createActionProcessor(askKeyValueStoreDelete, getProcessKeyValueStoreDelete);
