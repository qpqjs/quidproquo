import { askKeyValueStoreQueryAll, AskResponse, kvsEqual } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocSummary } from '../models';
import { askEventDocResolveScope } from './askEventDocResolveScope';

export type EventDocListOptions = {
  includeDeleted?: boolean;
};

/** Every summary row in the collection, newest first, read and sorted in memory. Prefer askEventDocListPage for large collections. */
export function* askEventDocList<T extends EventDocSummary = EventDocSummary>(options?: EventDocListOptions): AskResponse<T[]> {
  const { storeName, type } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  const items = yield* askKeyValueStoreQueryAll<T>(storeName, kvsEqual('type', type), { scope });

  const visible = options?.includeDeleted ? items : items.filter((model) => !model.deletedAt);

  return [...visible].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
