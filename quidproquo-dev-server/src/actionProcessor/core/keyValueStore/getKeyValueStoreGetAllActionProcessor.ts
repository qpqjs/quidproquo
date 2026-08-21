import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreGetAllBase,
  createActionProcessor,
  KeyValueStoreActionType,
  ProcessorFor,
  QPQConfig,
  resolveScopedPkAttributeOrThrow,
} from 'quidproquo-core';

import { getKvsRepository } from '../../../logic/keyValueStore/getKvsRepository';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessKeyValueStoreGetAll = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askKeyValueStoreGetAllBase> => {
  return async ({ keyValueStoreName, options }) => {
    try {
      const scope = options?.scope;
      const repository = getKvsRepository(qpqConfig, devServerConfig);

      // The sqlite engine partitions per-scope at the ROW level, so a scoped
      // get-all just reads the scope's own rows - the validation here is kept
      // purely for dynamo error parity.
      if (scope !== undefined) {
        resolveScopedPkAttributeOrThrow(qpqConfig, keyValueStoreName, scope);
      }

      const items = await repository.getAll(keyValueStoreName, scope);

      return actionResult(items);
    } catch (error: any) {
      return actionResultErrorFromCaughtError(error, {
        InvalidScopeError: (error) => actionResultError(askKeyValueStoreGetAllBase.errorType.InvalidScope, error.message),
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreGetAllBase.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreGetAllActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askKeyValueStoreGetAllBase, (qpqConfig) => getProcessKeyValueStoreGetAll(qpqConfig, devServerConfig));
