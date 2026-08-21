import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreQueryBase,
  createActionProcessor,
  KeyValueStoreActionType,
  ProcessorFor,
  QPQConfig,
  validateScopedKvsKeyConditionOrThrow,
} from 'quidproquo-core';

import { getKvsRepository } from '../../../logic/keyValueStore/getKvsRepository';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessKeyValueStoreQuery = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askKeyValueStoreQueryBase> => {
  return async ({ keyValueStoreName, keyCondition, options }) => {
    try {
      const scope = options?.scope;
      const repository = getKvsRepository(qpqConfig, devServerConfig);

      // The sqlite engine partitions per-scope at the ROW level, so the query
      // conditions run unmodified against the scope's own rows. The validation
      // is pure dynamo parity: a query that only works locally must fail here
      // too, not in production - a scoped query must constrain the real pk
      // attribute (the local DSL's 'pk' alias is unknown to the dynamo
      // translator, so an alias-keyed scoped query must fail locally first),
      // and an unscoped one must not carry the reserved scope delimiter in a pk
      // comparison.
      validateScopedKvsKeyConditionOrThrow(qpqConfig, keyValueStoreName, scope, keyCondition);

      const result = await repository.query(
        keyValueStoreName,
        keyCondition,
        options?.filter,
        options?.nextPageKey,
        undefined, // indexName - for basic implementation
        options?.limit,
        options?.sortAscending ?? true,
        scope,
      );

      return actionResult(result);
    } catch (error: any) {
      return actionResultErrorFromCaughtError(error, {
        InvalidScopeError: (error) => actionResultError(askKeyValueStoreQueryBase.errorType.InvalidScope, error.message),
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreQueryBase.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreQueryActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askKeyValueStoreQueryBase, (qpqConfig) => getProcessKeyValueStoreQuery(qpqConfig, devServerConfig));
