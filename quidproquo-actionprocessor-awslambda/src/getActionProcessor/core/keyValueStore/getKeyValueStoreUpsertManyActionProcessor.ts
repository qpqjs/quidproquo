import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreUpsertManyBase,
  createActionProcessor,
  getScopedKvsTranslatorOrThrow,
  KeyValueStoreActionType,
  ProcessorFor,
  QPQConfig,
  resolveKvsStoreConfigOrThrow,
} from 'quidproquo-core';

import { getKvsDynamoTableNameFromConfig } from '../../../awsNamingUtils';
import { batchPutItems, transactPutItems } from '../../../logic/dynamo';

// The batch sibling of Upsert. Unconditional: BatchWriteItem in chunks of 25,
// partial-acceptance retry inside batchPutItems. With ifNotExists: TransactWriteItems
// in chunks of 100, every put conditional, each chunk all-or-nothing, a lost
// condition surfacing as the namespaced Conflict. Streams emit one record per
// item no matter how it was written, so downstream projectors see the same
// records as N single upserts.
const getProcessKeyValueStoreUpsertMany = (qpqConfig: QPQConfig): ProcessorFor<typeof askKeyValueStoreUpsertManyBase> => {
  return async ({ keyValueStoreName, items, options }) => {
    const dynamoTableName = getKvsDynamoTableNameFromConfig(keyValueStoreName, qpqConfig, 'kvs');
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      const storeConfig = resolveKvsStoreConfigOrThrow(qpqConfig, keyValueStoreName);

      // Same-key duplicates are rejected UP FRONT, before anything is written.
      // Dynamo itself only rejects them when both land in the same 25-item
      // chunk — across chunks the later write silently wins — so left to the
      // service the outcome would depend on item position.
      const seenKeys = new Set<string>();
      for (const item of items) {
        const itemKey = [storeConfig.partitionKey, ...storeConfig.sortKeys].map((key) => String(item[key.key])).join('#');
        if (seenKeys.has(itemKey)) {
          return actionResultError(
            askKeyValueStoreUpsertManyBase.errorType.DuplicateKey,
            `Duplicate key [${itemKey}] in batch upsert to [${keyValueStoreName}]`,
          );
        }
        seenKeys.add(itemKey);
      }

      // The scope lives inside the stored partition key value, so each item is
      // persisted with a composed pk; reads strip it back off.
      const scoped = getScopedKvsTranslatorOrThrow(qpqConfig, keyValueStoreName, options?.scope);

      const scopedItems = items.map((item) => scoped.item(item));

      if (options?.ifNotExists) {
        await transactPutItems(dynamoTableName, scopedItems, storeConfig.partitionKey.key, region);
      } else {
        await batchPutItems(dynamoTableName, scopedItems, region);
      }

      return actionResult(void 0);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        InternalServerError: () => actionResultError(askKeyValueStoreUpsertManyBase.errorType.ServiceUnavailable, 'KVS Service Unavailable'),
        ResourceNotFoundException: () => actionResultError(askKeyValueStoreUpsertManyBase.errorType.ResourceNotFound, 'KVS Resource Not Found'),
        // Retries exhausted on UnprocessedItems — sustained throttle, a transient
        // fault: callers must see ServiceUnavailable, not a permanent failure.
        BatchWriteUnprocessedItemsError: () =>
          actionResultError(askKeyValueStoreUpsertManyBase.errorType.ServiceUnavailable, 'KVS batch write throttled'),
        ConditionalCheckFailedException: () => actionResultError(askKeyValueStoreUpsertManyBase.errorType.Conflict, 'KVS item already exists'),
        InvalidScopeError: (error) => actionResultError(askKeyValueStoreUpsertManyBase.errorType.InvalidScope, error.message),
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreUpsertManyBase.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreUpsertManyActionProcessor = createActionProcessor(askKeyValueStoreUpsertManyBase, getProcessKeyValueStoreUpsertMany);
