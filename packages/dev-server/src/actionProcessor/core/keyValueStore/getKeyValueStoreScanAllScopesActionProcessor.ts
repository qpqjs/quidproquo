import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askKeyValueStoreScanAllScopesBase,
  createActionProcessor,
  KeyValueStoreActionType,
  KvsScopedItem,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { getKvsRepository } from '../../../logic/keyValueStore/getKvsRepository';
import { decodeScanAllScopesPageKey, encodeScanAllScopesPageKey } from '../../../logic/keyValueStore/scanAllScopesPageKey';
import { ResolvedDevServerConfig } from '../../../types';

// Every row in the store, across every scope, each tagged with the scope it came from.
// Migration-only: see askKeyValueStoreScanAllScopes for why this exception exists.
//
// The sqlite engine partitions by a scope COLUMN rather than by composed key, so crossing
// scopes means listing the scopes with data and reading each partition, plus the unscoped
// one. Items come
// back raw either way, so a caller sees the same shape as the DynamoDB processor produces
// after it decomposes the key.
//
// This PAGES, one partition page per call, exactly like the DynamoDB processor. It would be
// less code to drain everything internally and always answer `nextPageKey: undefined`, but
// then the same action would page deployed and not locally: a caller that stopped after one
// page would be correct on the dev server and silently skip most of the data in production,
// which is the worst shape a migration bug can take. Same contract on both, or the local run
// proves nothing.
const getProcessKeyValueStoreScanAllScopes = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askKeyValueStoreScanAllScopesBase> => {
  return async ({ keyValueStoreName, filterCondition, nextPageKey }) => {
    try {
      const repository = getKvsRepository(qpqConfig, devServerConfig);

      // `undefined` first: the unscoped partition is a real partition, not an absence, and
      // leaving it out is exactly the kind of quiet gap a migration must not have.
      const partitions: (string | undefined)[] = [undefined, ...(await repository.listScopes(keyValueStoreName))];

      const resume = decodeScanAllScopesPageKey(nextPageKey);
      const startAt = Math.max(
        partitions.findIndex((scope) => scope === resume.scope),
        0,
      );

      // Walk forward until a partition yields something. Skipping past empty ones here rather
      // than returning an empty page keeps a caller's drain loop from spinning once per empty
      // tenant folder.
      for (let index = startAt; index < partitions.length; index++) {
        const scope = partitions[index];
        const inner = index === startAt ? resume.inner : undefined;

        const page = await repository.scan(keyValueStoreName, filterCondition, inner, undefined, scope);
        const items: KvsScopedItem<any>[] = page.items.map((item: any) => ({ scope, item }));

        // More of this partition to come.
        if (page.nextPageKey) {
          return actionResult({ items, nextPageKey: encodeScanAllScopesPageKey({ scope, inner: page.nextPageKey }) });
        }

        const nextScope = partitions[index + 1];

        if (items.length > 0) {
          return actionResult({
            items,
            // Undefined once the last partition is done, which is what ends the caller's loop.
            nextPageKey: index + 1 < partitions.length ? encodeScanAllScopesPageKey({ scope: nextScope }) : undefined,
          });
        }
      }

      return actionResult({ items: [], nextPageKey: undefined });
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        KvsStoreNotFoundError: (error) => actionResultError(askKeyValueStoreScanAllScopesBase.errorType.StoreNotFound, error.message),
      });
    }
  };
};

export const getKeyValueStoreScanAllScopesActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askKeyValueStoreScanAllScopesBase, (qpqConfig) => getProcessKeyValueStoreScanAllScopes(qpqConfig, devServerConfig));
