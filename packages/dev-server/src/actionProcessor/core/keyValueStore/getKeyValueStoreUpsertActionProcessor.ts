import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreUpsertBase,
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

const getProcessKeyValueStoreUpsert = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askKeyValueStoreUpsertBase> => {
  return async ({ keyValueStoreName, item, options }, session) => {
    try {
      const scope = options?.scope;
      const repository = getKvsRepository(qpqConfig, devServerConfig);

      // The sqlite engine partitions per-scope at the ROW level (a scope
      // column in the primary key), so the item is stored raw - the scope just
      // selects which rows the store writes. The item's pk value is still
      // validated for AWS parity: a write prod rejects (bad scope, or the
      // reserved scope delimiter in the raw value, scoped or not) must fail
      // locally too.
      validateScopedKvsItemOrThrow(qpqConfig, keyValueStoreName, scope, item);

      // Read first only to tell an insert from a modify, the one thing the write itself does
      // not reveal. Cheap locally, and it keeps eventType honest for a generic consumer.
      const existing = await repository.get(keyValueStoreName, toKvsCompositeKey(qpqConfig, keyValueStoreName, item), scope);
      const result = await repository.upsert(keyValueStoreName, item, { ifNotExists: options?.ifNotExists }, scope);

      // Stand in for the change stream, AFTER the write has committed - see emitKvsStreamEvent.
      await emitKvsStreamEvent(qpqConfig, session, {
        keyValueStoreName,
        eventType: existing ? KvsStreamEventType.Modify : KvsStreamEventType.Insert,
        scope,
        keys: toKvsStreamKeys(qpqConfig, keyValueStoreName, item),
        newImage: item,
        oldImage: existing ?? undefined,
      });

      return actionResult(result);
    } catch (error: any) {
      return actionResultErrorFromCaughtError(error, {
        ConditionalCheckFailedException: () => actionResultError(askKeyValueStoreUpsertBase.errorType.Conflict, 'KVS item already exists'),
        InvalidScopeError: (error) => actionResultError(askKeyValueStoreUpsertBase.errorType.InvalidScope, error.message),
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreUpsertBase.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreUpsertActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askKeyValueStoreUpsertBase, (qpqConfig) => getProcessKeyValueStoreUpsert(qpqConfig, devServerConfig));
