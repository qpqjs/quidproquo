import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreQueryBase,
  createActionProcessor,
  KeyValueStoreActionType,
  ProcessorFor,
  QPQConfig,
  resolveKvsStoreConfigOrThrow,
} from 'quidproquo-core';

import { getKvsDynamoTableNameFromConfig } from '../../../awsNamingUtils';
import { query } from '../../../logic/dynamo';
import { getDynamoTableIndexByConfigAndQuery } from '../../../logic/dynamo/qpqDynamoOrm';
import { getScopedKvsTranslatorOrThrow } from '../../../logic/dynamo/scope';

const getProcessKeyValueStoreQuery = (qpqConfig: QPQConfig): ProcessorFor<typeof askKeyValueStoreQueryBase> => {
  return async ({ keyValueStoreName, keyCondition, options }) => {
    const dynamoTableName = getKvsDynamoTableNameFromConfig(keyValueStoreName, qpqConfig, 'kvs');
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      const storeConfig = resolveKvsStoreConfigOrThrow(qpqConfig, keyValueStoreName);

      // Scope lives inside the pk values, so pk conditions are rewritten to the
      // composed form (throws when the key condition never constrains the pk).
      const scoped = getScopedKvsTranslatorOrThrow(qpqConfig, keyValueStoreName, options?.scope);
      const effectiveKeyCondition = scoped.keyCondition(keyCondition);

      const items = await query<any>(
        dynamoTableName,
        region,
        effectiveKeyCondition,
        scoped.filter(options?.filter),
        options?.nextPageKey,
        getDynamoTableIndexByConfigAndQuery(storeConfig, effectiveKeyCondition) ?? undefined,
        options?.limit,
        options?.sortAscending,
        options?.consistentRead,
      );

      items.items = items.items.map((item: any) => scoped.strip(item));

      return actionResult(items);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        InternalServerError: () => actionResultError(askKeyValueStoreQueryBase.errorType.ServiceUnavailable, 'KVS Service Unavailable'),
        ResourceNotFoundException: () => actionResultError(askKeyValueStoreQueryBase.errorType.ResourceNotFound, 'KVS Resource Not Found'),
        InvalidScopeError: (error) => actionResultError(askKeyValueStoreQueryBase.errorType.InvalidScope, error.message),
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreQueryBase.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreQueryActionProcessor = createActionProcessor(askKeyValueStoreQueryBase, getProcessKeyValueStoreQuery);
