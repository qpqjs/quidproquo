import { askKeyValueStoreDelete, AskResponse } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { askEventDocResolveScope } from './askEventDocResolveScope';
import { eventDocListViewPk } from './eventDocListViewPk';

/** Hard delete of one document's row for one list view. Internal cleanup only; the public lifecycle uses `askEventDocSoftDelete`. */
export function* askEventDocListViewDelete(id: string, viewName: string): AskResponse<void> {
  const { listsStoreName, type } = yield* askEventDocStoreReadOrThrow();
  const scope = yield* askEventDocResolveScope();

  yield* askKeyValueStoreDelete(listsStoreName, eventDocListViewPk(viewName, type), id, { scope });
}
