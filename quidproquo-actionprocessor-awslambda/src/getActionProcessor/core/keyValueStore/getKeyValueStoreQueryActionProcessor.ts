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

      // Scope lives inside the stored key values (the pk, and a scoped GSI's hidden
      // partition key copy), so key conditions are rewritten to the composed form.
      // The index is picked from the caller's condition: the rewrite renames a scoped
      // GSI's partition key, but the index keeps its declared name.
      const scoped = getScopedKvsTranslatorOrThrow(qpqConfig, keyValueStoreName, options?.scope);
      const indexName = getDynamoTableIndexByConfigAndQuery(storeConfig, keyCondition) ?? undefined;

      const items = await query<any>(
        dynamoTableName,
        region,
        scoped.keyCondition(keyCondition, indexName),
        scoped.filter(options?.filter),
        options?.nextPageKey,
        indexName,
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
