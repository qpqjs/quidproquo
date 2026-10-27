import { AskResponse, askStateRead } from 'quidproquo-core';

import { askUIEventDocListSetPageIndex } from '../actionCreators/askUIEventDocListSetPageIndex';
import type { EventDocListState } from '../types/EventDocListState';
import { askEventDocListLoad } from './askEventDocListLoad';

/** Walks forward one page. Gated on `nextPageKey`, never on item count: a page can come back short and still have more after it. */
export function* askEventDocListNextPage(): AskResponse<void> {
  const state = yield* askStateRead<EventDocListState>();

  if (!state.nextPageKey) {
    return;
  }

  yield* askUIEventDocListSetPageIndex(state.pageIndex + 1, state.nextPageKey);
  yield* askEventDocListLoad(state.serviceName, state.listBasePath || state.basePath);
}
