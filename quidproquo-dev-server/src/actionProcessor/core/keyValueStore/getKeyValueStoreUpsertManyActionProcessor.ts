import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreUpsertManyBase,
  createActionProcessor,
  KeyValueStoreActionType,
  KvsStreamEventType,
  ProcessorFor,
  QPQConfig,
  validateScopedKvsItemOrThrow,
} from 'quidproquo-core';

import { getKvsRepository } from '../../../logic/keyValueStore/getKvsRepository';
import { toKvsCompositeKey, toKvsStreamKeys } from '../../../logic/keyValueStore/toKvsStreamKeys';
import { emitKvsStreamEvent } from '../../../logic/kvsStream';
import { ResolvedDevServerConfig } from '../../../types';

// The batch sibling of Upsert: one repository call, so the whole batch lands
// as a single unit (one transaction on an engine that has them). Per-item
// stream emission is kept - AWS streams emit one record per item regardless of
// how it was written, and local projectors must see the same shape.
// Unconditional, like BatchWriteItem.
const getProcessKeyValueStoreUpsertMany = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askKeyValueStoreUpsertManyBase> => {
  return async ({ keyValueStoreName, items, options }, session) => {
    try {
      const scope = options?.scope;
      const repository = getKvsRepository(qpqConfig, devServerConfig);

      // Validate EVERY item (scope rules + in-batch duplicate keys) before the
      // first write, for AWS parity: the awslambda processor maps/checks the
      // whole batch eagerly, so a bad item at position 3 means NOTHING lands.
      // Interleaving validation with the writes would leave items 1-2 written
      // and stream-emitted locally where prod writes nothing.
      const seenKeys = new Set<string>();
      for (const item of items) {
        validateScopedKvsItemOrThrow(qpqConfig, keyValueStoreName, scope, item);

        const itemKey = toKvsCompositeKey(qpqConfig, keyValueStoreName, item);
        if (seenKeys.has(itemKey)) {
          return actionResultError(
            askKeyValueStoreUpsertManyBase.errorType.DuplicateKey,
            `Duplicate key [${itemKey}] in batch upsert to [${keyValueStoreName}]`,
          );
        }
        seenKeys.add(itemKey);
      }

      const results = await repository.upsertMany(keyValueStoreName, items, scope);

      // Stand in for the change stream, AFTER the batch has committed - see
      // emitKvsStreamEvent. upsertMany reports what each write replaced, so
      // Insert vs Modify stays right per item without re-reading.
      for (const { item, oldItem } of results) {
        await emitKvsStreamEvent(qpqConfig, session, {
          keyValueStoreName,
          eventType: oldItem ? KvsStreamEventType.Modify : KvsStreamEventType.Insert,
          scope,
          keys: toKvsStreamKeys(qpqConfig, keyValueStoreName, item),
          newImage: item,
          oldImage: oldItem ?? undefined,
        });
      }

      return actionResult(void 0);
    } catch (error: any) {
      return actionResultErrorFromCaughtError(error, {
        InvalidScopeError: (error) => actionResultError(askKeyValueStoreUpsertManyBase.errorType.InvalidScope, error.message),
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreUpsertManyBase.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreUpsertManyActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askKeyValueStoreUpsertManyBase, (qpqConfig) => getProcessKeyValueStoreUpsertMany(qpqConfig, devServerConfig));
