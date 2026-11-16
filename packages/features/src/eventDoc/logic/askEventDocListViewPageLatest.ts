import { AskResponse, askThrowError, ErrorTypeEnum, QpqPagedData } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { askEventDocListViewPage, EventDocListViewPageOptions } from '../data/askEventDocListViewPage';
import { askEventDocListViewNamesResolve } from './askEventDocListViewNamesResolve';
import { askEventDocListViewStatesMigrate } from './askEventDocListViewStatesMigrate';

/**
 * One page of a list view across the collection, newest first: each item is the view's state at the latest schema with
 * the collection's `type` stamped on. Throws NotFound for a view the collection does not have as a list view, so a
 * caller cannot address a partition by guessing a name.
 */
export function* askEventDocListViewPageLatest(viewName: string, options?: EventDocListViewPageOptions): AskResponse<QpqPagedData<unknown>> {
  const { type } = yield* askEventDocStoreReadOrThrow();
  const viewNames = yield* askEventDocListViewNamesResolve();

  if (!viewNames.includes(viewName)) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `${type} has no list view named ${viewName}`);
  }

  const page = yield* askEventDocListViewPage(viewName, options);
  const states = yield* askEventDocListViewStatesMigrate(
    viewName,
    page.items.map((row) => row.state),
  );

  return { ...page, items: states.map((state) => ({ ...(state as object), type })) };
}
