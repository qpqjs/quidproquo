import { askKeyValueStoreQuerySingle, AskResponse, kvsAnd, kvsEqual } from 'quidproquo-core';
import { Nullable } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocSummary } from '../models';
import { askEventDocResolveScope } from './askEventDocResolveScope';

/** The summary row by id, or null. Soft-deleted rows are returned as-is. */
export function* askEventDocGetById<T extends EventDocSummary = EventDocSummary>(id: string): AskResponse<Nullable<T>> {
  const { storeName, type } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  return yield* askKeyValueStoreQuerySingle<T>(storeName, kvsAnd([kvsEqual('type', type), kvsEqual('id', id)]), undefined, undefined, 1, scope);
}
