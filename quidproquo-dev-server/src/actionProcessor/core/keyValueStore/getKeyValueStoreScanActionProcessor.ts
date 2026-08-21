import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreScanBase,
  createActionProcessor,
  KeyValueStoreActionType,
  ProcessorFor,
  QPQConfig,
  resolveScopedPkAttributeOrThrow,
} from 'quidproquo-core';

import { getKvsRepository } from '../../../logic/keyValueStore/getKvsRepository';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessKeyValueStoreScan = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askKeyValueStoreScanBase> => {
  return async ({ keyValueStoreName, filterCondition, nextPageKey, options }) => {
    try {
      const scope = options?.scope;
      const repository = getKvsRepository(qpqConfig, devServerConfig);

      // The sqlite engine partitions per-scope at the ROW level, so a scoped
      // scan just iterates the scope's own rows - no injected filter needed.
      if (scope !== undefined) {
        resolveScopedPkAttributeOrThrow(qpqConfig, keyValueStoreName, scope);
      }

      const result = await repository.scan(
        keyValueStoreName,
        filterCondition,
        nextPageKey,
        undefined, // limit is not in the scan payload, using default
        scope,
      );

      return actionResult(result);
    } catch (error: any) {
      return actionResultErrorFromCaughtError(error, {
        InvalidScopeError: (error) => actionResultError(askKeyValueStoreScanBase.errorType.InvalidScope, error.message),
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreScanBase.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreScanActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askKeyValueStoreScanBase, (qpqConfig) => getProcessKeyValueStoreScan(qpqConfig, devServerConfig));
