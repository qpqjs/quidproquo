import { askKeyValueStoreQueryAll, AskResponse, kvsEqual } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { EventDocStoredListView } from '../types/EventDocStoredListView';
import { askEventDocResolveScope } from './askEventDocResolveScope';
import { eventDocListViewPk } from './eventDocListViewPk';

/** Every row of one list view in the collection, soft-deleted included, in no promised order. Prefer askEventDocListViewPage for large collections. */
export function* askEventDocListViewAll(viewName: string): AskResponse<EventDocStoredListView[]> {
  const { listsStoreName, type } = yield* askEventDocStoreReadOrThrow();
  const scope = yield* askEventDocResolveScope();

  return yield* askKeyValueStoreQueryAll<EventDocStoredListView>(listsStoreName, kvsEqual('pk', eventDocListViewPk(viewName, type)), { scope });
}
