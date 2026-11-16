import { askKeyValueStoreQuery, AskResponse, kvsAnd, kvsEqual, Nullable } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { EventDocStoredListView } from '../types/EventDocStoredListView';
import { askEventDocResolveScope } from './askEventDocResolveScope';
import { eventDocListViewPk } from './eventDocListViewPk';

/** One document's row for one list view, or null. Soft-deleted rows are returned as they are. Pass `consistentRead` to see a write of moments ago. */
export function* askEventDocListViewGet(
  viewName: string,
  id: string,
  options?: { consistentRead?: boolean },
): AskResponse<Nullable<EventDocStoredListView>> {
  const { listsStoreName, type } = yield* askEventDocStoreReadOrThrow();
  const scope = yield* askEventDocResolveScope();

  const page = yield* askKeyValueStoreQuery<EventDocStoredListView>(
    listsStoreName,
    kvsAnd([kvsEqual('pk', eventDocListViewPk(viewName, type)), kvsEqual('id', id)]),
    { limit: 1, scope, consistentRead: options?.consistentRead },
  );

  return page.items[0] ?? null;
}
