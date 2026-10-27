import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreGetAllBase,
  createActionProcessor,
  KeyValueStoreActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { getKvsDynamoTableNameFromConfig } from '../../../awsNamingUtils';
import { getAllItems } from '../../../logic/dynamo';
import { getScopedKvsTranslatorOrThrow } from '../../../logic/dynamo/scope';

const getProcessKeyValueStoreGetAll = (qpqConfig: QPQConfig): ProcessorFor<typeof askKeyValueStoreGetAllBase> => {
  return async ({ keyValueStoreName, options }) => {
    const dynamoTableName = getKvsDynamoTableNameFromConfig(keyValueStoreName, qpqConfig, 'kvs');
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      // GetAll has no key condition, so scope is enforced as a begins_with
      // prefix filter (a full scan on the Dynamo side either way).
      const scoped = getScopedKvsTranslatorOrThrow(qpqConfig, keyValueStoreName, options?.scope);

      const result = await getAllItems(dynamoTableName, region, scoped.scanFilter(undefined));

      return actionResult(result.map((item) => scoped.strip(item)));
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        InternalServerError: () => actionResultError(askKeyValueStoreGetAllBase.errorType.ServiceUnavailable, 'KVS Service Unavailable'),
        ResourceNotFoundException: () => actionResultError(askKeyValueStoreGetAllBase.errorType.ResourceNotFound, 'KVS Resource Not Found'),
        InvalidScopeError: (error) => actionResultError(askKeyValueStoreGetAllBase.errorType.InvalidScope, error.message),
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreGetAllBase.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreGetAllActionProcessor = createActionProcessor(askKeyValueStoreGetAllBase, getProcessKeyValueStoreGetAll);
