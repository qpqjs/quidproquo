import { AskResponse, askStateRead } from 'quidproquo-core';

import { askUIEventDocListSetPageIndex } from '../actionCreators/askUIEventDocListSetPageIndex';
import type { EventDocListState } from '../types/EventDocListState';
import { askEventDocListLoad } from './askEventDocListLoad';

/** Walks back one page, re-fetching it from the cursor recorded when it was first visited. */
export function* askEventDocListPreviousPage(): AskResponse<void> {
  const state = yield* askStateRead<EventDocListState>();

  if (state.pageIndex === 0) {
    return;
  }

  const previousIndex = state.pageIndex - 1;

  yield* askUIEventDocListSetPageIndex(previousIndex, state.cursors[previousIndex] ?? null);
  yield* askEventDocListLoad(state.serviceName, state.listBasePath || state.basePath);
}
