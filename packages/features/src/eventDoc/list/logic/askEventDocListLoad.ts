import { AskResponse, askStateRead } from '@qpqjs/core';

import { askUiCatch } from '../../../ui/logic/askUiCatch';
import { askEventDocListPageLoaded } from '../actionCreators/askEventDocListPageLoaded';
import { askEventDocListSetError } from '../actionCreators/askEventDocListSetError';
import { askEventDocListSetLoading } from '../actionCreators/askEventDocListSetLoading';
import { askEventDocListFetch } from '../transport/askEventDocListFetch';
import type { EventDocListRow } from '../types/EventDocListRow';
import type { EventDocListState } from '../types/EventDocListState';

/**
 * Loads the page the walk is currently on, from the list view the config names; the cursor comes from
 * `state.cursors[pageIndex]`, never from the caller.
 */
export function* askEventDocListLoad(serviceName: string, basePath: string): AskResponse<void> {
  const state = yield* askStateRead<EventDocListState>();

  const result = yield* askUiCatch(
    askEventDocListFetch<EventDocListRow>(serviceName, basePath, {
      limit: state.pageSize,
      nextPageKey: state.cursors[state.pageIndex],
      view: state.listView,
    }),
    { askSetError: askEventDocListSetError, askSetBusy: askEventDocListSetLoading, errorText: 'Failed to load items.' },
  );

  if (!result.success) {
    return;
  }

  yield* askEventDocListPageLoaded(result.result.items, result.result.nextPageKey ?? null);
}
