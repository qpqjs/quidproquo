import { askPagedDataDrain, AskResponse } from '@qpqjs/core';

import { EventDocSummary } from '../../models';
import { askEventDocListFetch } from './askEventDocListFetch';

/** Every summary in a collection, by walking all pages. O(collection): only for callers that need the whole set. */
export function* askEventDocListFetchAll(serviceName: string, basePath: string): AskResponse<EventDocSummary[]> {
  const { items } = yield* askPagedDataDrain(function* askSummaryPage(nextPageKey) {
    return yield* askEventDocListFetch(serviceName, basePath, { nextPageKey });
  });

  return items;
}
