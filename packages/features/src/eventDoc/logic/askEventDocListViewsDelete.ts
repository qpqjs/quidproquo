import { askMap, AskResponse } from '@qpqjs/core';

import { askEventDocListViewDelete } from '../data/askEventDocListViewDelete';
import { askEventDocListViewNamesResolve } from './askEventDocListViewNamesResolve';

/**
 * Hard delete of every list view row a document has. Internal cleanup for a document whose log is gone; the public
 * lifecycle uses `askEventDocSoftDelete`.
 */
export function* askEventDocListViewsDelete(id: string): AskResponse<void> {
  const viewNames = yield* askEventDocListViewNamesResolve();

  yield* askMap(viewNames, function* askDeleteOne(viewName: string) {
    yield* askEventDocListViewDelete(id, viewName);
  });
}
