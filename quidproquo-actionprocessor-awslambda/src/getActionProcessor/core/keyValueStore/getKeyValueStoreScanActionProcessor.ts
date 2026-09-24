import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreScanBase,
  createActionProcessor,
  KeyValueStoreActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { getKvsDynamoTableNameFromConfig } from '../../../awsNamingUtils';
import { scan } from '../../../logic/dynamo';
import { getScopedKvsTranslatorOrThrow } from '../../../logic/dynamo/scope';

const getProcessKeyValueStoreScan = (qpqConfig: QPQConfig): ProcessorFor<typeof askKeyValueStoreScanBase> => {
  return async ({ keyValueStoreName, filterCondition, nextPageKey, options }) => {
    const dynamoTableName = getKvsDynamoTableNameFromConfig(keyValueStoreName, qpqConfig, 'kvs');
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      // A scan has no key condition, so scope is enforced as a begins_with
      // prefix predicate ANDed onto the caller's filter. Still a full-table
      // scan on the Dynamo side - only the results are isolated.
      const scoped = getScopedKvsTranslatorOrThrow(qpqConfig, keyValueStoreName, options?.scope);

      const items = await scan<any>(dynamoTableName, region, scoped.scanFilter(filterCondition), scoped.pageKey(nextPageKey));

      items.items = items.items.map((item: any) => scoped.strip(item));

      return actionResult(items);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        InternalServerError: () => actionResultError(askKeyValueStoreScanBase.errorType.ServiceUnavailable, 'KVS Service Unavailable'),
        ResourceNotFoundException: () => actionResultError(askKeyValueStoreScanBase.errorType.ResourceNotFound, 'KVS Resource Not Found'),
        InvalidScopeError: (error) => actionResultError(askKeyValueStoreScanBase.errorType.InvalidScope, error.message),
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreScanBase.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreScanActionProcessor = createActionProcessor(askKeyValueStoreScanBase, getProcessKeyValueStoreScan);
