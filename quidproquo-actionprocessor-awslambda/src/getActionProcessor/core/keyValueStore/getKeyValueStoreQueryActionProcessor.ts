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
  resolveKvsQueryIndex,
  resolveKvsStoreConfigOrThrow,
} from 'quidproquo-core';

import { getKvsDynamoTableNameFromConfig } from '../../../awsNamingUtils';
import { query } from '../../../logic/dynamo';
import { getScopedKvsTranslatorOrThrow } from '../../../logic/dynamo/scope';

const getProcessKeyValueStoreQuery = (qpqConfig: QPQConfig): ProcessorFor<typeof askKeyValueStoreQueryBase> => {
  return async ({ keyValueStoreName, keyCondition, options }) => {
    const dynamoTableName = getKvsDynamoTableNameFromConfig(keyValueStoreName, qpqConfig, 'kvs');
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      const storeConfig = resolveKvsStoreConfigOrThrow(qpqConfig, keyValueStoreName);

      // Scope lives inside the stored key values (the pk, and a scoped GSI's hidden
      // partition key copy), so key conditions are rewritten to the composed form.
      // The index is picked from the caller's condition (or named by options.indexName)
      // before the rewrite, which renames a scoped GSI's partition key.
      const scoped = getScopedKvsTranslatorOrThrow(qpqConfig, keyValueStoreName, options?.scope);
      const index = resolveKvsQueryIndex(storeConfig, keyCondition, options?.indexName);

      const items = await query<any>(
        dynamoTableName,
        region,
        scoped.keyCondition(keyCondition, index?.partitionKey.key),
        scoped.filter(options?.filter),
        options?.nextPageKey,
        index?.name,
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
        KvsIndexNotFoundError: (error) => actionResultError(askKeyValueStoreQueryBase.errorType.IndexNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreQueryActionProcessor = createActionProcessor(askKeyValueStoreQueryBase, getProcessKeyValueStoreQuery);
