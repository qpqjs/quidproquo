import { askKeyValueStoreQuery, AskResponse, kvsAnd, kvsEqual } from '@qpqjs/core';
import { Nullable } from '@qpqjs/core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocSummary } from '../models';
import { askEventDocResolveScope } from './askEventDocResolveScope';

/** The summary row by id, or null. Soft-deleted rows are returned as-is. Pass `consistentRead` to see a write of moments ago. */
export function* askEventDocGetById<T extends EventDocSummary = EventDocSummary>(
  id: string,
  options?: { consistentRead?: boolean },
): AskResponse<Nullable<T>> {
  const { storeName, type } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  const page = yield* askKeyValueStoreQuery<T>(storeName, kvsAnd([kvsEqual('type', type), kvsEqual('id', id)]), {
    limit: 1,
    scope,
    consistentRead: options?.consistentRead,
  });

  return page.items[0] ?? null;
}
