import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreUpdateBase,
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

const getProcessKeyValueStoreUpdate = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askKeyValueStoreUpdateBase> => {
  return async ({ keyValueStoreName, key, sortKey, updates, options }, session) => {
    try {
      const scope = options?.scope;
      const repository = getKvsRepository(qpqConfig, devServerConfig);

      // The sqlite engine partitions per-scope at the ROW level (a scope
      // column in the primary key), so keys and items stay raw - the scope
      // just selects which rows the store updates. The key is still validated
      // for AWS parity: a key prod rejects (bad scope, or the reserved scope
      // delimiter in the raw value) must fail locally too.
      validateScopedKvsKeyOrThrow(qpqConfig, keyValueStoreName, scope, key);

      const result = await repository.update(keyValueStoreName, String(key), sortKey ? String(sortKey) : undefined, updates, scope);

      // Stand in for the change stream, AFTER the write has committed. An update always
      // targets an existing item (UpdateItem upserts, but the result is the item as it now
      // stands), so this is always a Modify.
      await emitKvsStreamEvent(qpqConfig, session, {
        keyValueStoreName,
        eventType: KvsStreamEventType.Modify,
        scope,
        keys: toKvsStreamKeys(qpqConfig, keyValueStoreName, result ?? {}),
        newImage: result ?? undefined,
      });

      return actionResult(result);
    } catch (error: any) {
      return actionResultErrorFromCaughtError(error, {
        InvalidScopeError: (error) => actionResultError(askKeyValueStoreUpdateBase.errorType.InvalidScope, error.message),
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreUpdateBase.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreUpdateActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askKeyValueStoreUpdateBase, (qpqConfig) => getProcessKeyValueStoreUpdate(qpqConfig, devServerConfig));
