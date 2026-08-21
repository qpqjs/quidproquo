import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreGetBase,
  createActionProcessor,
  KeyValueStoreActionType,
  ProcessorFor,
  QPQConfig,
  validateScopedKvsKeyOrThrow,
} from 'quidproquo-core';

import { getKvsRepository } from '../../../logic/keyValueStore/getKvsRepository';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessKeyValueStoreGet = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig): ProcessorFor<typeof askKeyValueStoreGetBase> => {
  return async ({ keyValueStoreName, key, options }) => {
    try {
      const scope = options?.scope;
      const repository = getKvsRepository(qpqConfig, devServerConfig);

      // The sqlite engine partitions per-scope at the ROW level (a scope
      // column in the primary key), so keys stay raw - the scope just selects
      // which rows the store reads. The key is still validated for AWS parity:
      // a key prod rejects (bad scope, or the reserved scope delimiter in the
      // raw value) must fail locally too.
      validateScopedKvsKeyOrThrow(qpqConfig, keyValueStoreName, scope, key);

      return actionResult(await repository.get(keyValueStoreName, key, scope));
    } catch (error: any) {
      return actionResultErrorFromCaughtError(error, {
        InvalidScopeError: (error) => actionResultError(askKeyValueStoreGetBase.errorType.InvalidScope, error.message),
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreGetBase.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreGetActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askKeyValueStoreGetBase, (qpqConfig) => getProcessKeyValueStoreGet(qpqConfig, devServerConfig));
