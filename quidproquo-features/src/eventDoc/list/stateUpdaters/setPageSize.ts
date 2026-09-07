import type { EventDocListSetPageSizePayload } from '../effects/EventDocListSetPageSizeEffect';
import type { EventDocListState } from '../types/EventDocListState';

/** Sets the page size and restarts the walk: cursors recorded under the old size would skip or repeat rows. */
export const setPageSize = (state: EventDocListState, { pageSize }: EventDocListSetPageSizePayload): EventDocListState => {
  const nextPageSize = Math.max(1, Math.floor(pageSize));

  if (nextPageSize === state.pageSize) {
    return state;
  }

  return {
    ...state,
    pageSize: nextPageSize,
    pageIndex: 0,
    cursors: [null],
    nextPageKey: null,
  };
};
