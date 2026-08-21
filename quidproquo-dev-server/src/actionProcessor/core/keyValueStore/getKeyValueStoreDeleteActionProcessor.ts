import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreDelete,
  createActionProcessor,
  KeyValueStoreActionType,
  KvsStreamEventType,
  ProcessorFor,
  QPQConfig,
  validateScopedKvsKeyOrThrow,
} from 'quidproquo-core';

import { getKvsRepository } from '../../../logic/keyValueStore/getKvsRepository';
import { toKvsStreamKeys } from '../../../logic/keyValueStore/toKvsStreamKeys';
import { emitKvsStreamEvent } from '../../../logic/kvsStream';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessKeyValueStoreDelete = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askKeyValueStoreDelete> => {
  return async ({ keyValueStoreName, key, sortKey, options }, session) => {
    try {
      const scope = options?.scope;
      const repository = getKvsRepository(qpqConfig, devServerConfig);

      // The sqlite engine partitions per-scope at the ROW level (a scope
      // column in the primary key), so keys stay raw - the scope just selects
      // which rows the store deletes from. The key is still validated for AWS
      // parity: a key prod rejects (bad scope, or the reserved scope delimiter
      // in the raw value) must fail locally too.
      validateScopedKvsKeyOrThrow(qpqConfig, keyValueStoreName, scope, key);

      const compositeKey = sortKey !== undefined ? `${key}#${sortKey}` : String(key);

      // Grab it before it goes: a Remove record's only payload is what used to be there.
      const removed = await repository.get(keyValueStoreName, compositeKey, scope);
      const result = await repository.delete(keyValueStoreName, compositeKey, scope);

      if (!result) {
        return actionResultError('ResourceNotFound', `Item with key '${key}' not found`);
      }

      // Stand in for the change stream, AFTER the delete has committed.
      await emitKvsStreamEvent(qpqConfig, session, {
        keyValueStoreName,
        eventType: KvsStreamEventType.Remove,
        scope,
        keys: removed ? toKvsStreamKeys(qpqConfig, keyValueStoreName, removed) : {},
        oldImage: removed ?? undefined,
      });

      return actionResult(undefined);
    } catch (error: any) {
      return actionResultErrorFromCaughtError(error, {
        InvalidScopeError: (error) => actionResultError(askKeyValueStoreDelete.errorType.InvalidScope, error.message),
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreDelete.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreDeleteActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askKeyValueStoreDelete, (qpqConfig) => getProcessKeyValueStoreDelete(qpqConfig, devServerConfig));
