import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreGetBase,
  createActionProcessor,
  KeyValueStoreActionType,
  ProcessorFor,
  QPQConfig,
  resolveKvsStoreConfigOrThrow,
} from 'quidproquo-core';

import { getKvsDynamoTableNameFromConfig } from '../../../awsNamingUtils';
import { getItem } from '../../../logic/dynamo';
import { getScopedKvsTranslatorOrThrow } from '../../../logic/dynamo/scope';

const getProcessKeyValueStoreGet = (qpqConfig: QPQConfig): ProcessorFor<typeof askKeyValueStoreGetBase> => {
  return async ({ keyValueStoreName, key, options }) => {
    const dynamoTableName = getKvsDynamoTableNameFromConfig(keyValueStoreName, qpqConfig, 'kvs');
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      const storeConfig = resolveKvsStoreConfigOrThrow(qpqConfig, keyValueStoreName);
      const scoped = getScopedKvsTranslatorOrThrow(qpqConfig, keyValueStoreName, options?.scope);

      const result = await getItem(dynamoTableName, region, storeConfig.partitionKey.key, scoped.key(key));

      return actionResult(scoped.strip(result));
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        InternalServerError: () => actionResultError(askKeyValueStoreGetBase.errorType.ServiceUnavailable, 'KVS Service Unavailable'),
        ResourceNotFoundException: () => actionResultError(askKeyValueStoreGetBase.errorType.ResourceNotFound, 'KVS Resource Not Found'),
        InvalidScopeError: (error) => actionResultError(askKeyValueStoreGetBase.errorType.InvalidScope, error.message),
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreGetBase.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreGetActionProcessor = createActionProcessor(askKeyValueStoreGetBase, getProcessKeyValueStoreGet);
