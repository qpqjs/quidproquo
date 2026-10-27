import { AskResponse } from 'quidproquo-core';

import { EventDocSummary } from '../../models';
import { askEventDocListFetch } from './askEventDocListFetch';

/** Every summary in a collection, by walking all pages. O(collection): only for callers that need the whole set. */
export function* askEventDocListFetchAll(serviceName: string, basePath: string): AskResponse<EventDocSummary[]> {
  const items: EventDocSummary[] = [];
  let nextPageKey: string | undefined;

  do {
    const page = yield* askEventDocListFetch(serviceName, basePath, { nextPageKey });
    items.push(...page.items);
    nextPageKey = page.nextPageKey;
  } while (nextPageKey);

  return items;
}
