import type { EventDocListSetPageIndexPayload } from '../effects/EventDocListSetPageIndexEffect';
import type { EventDocListState } from '../types/EventDocListState';

/** Moves the walk to a page and records the cursor that loads it, so Previous can re-fetch it later. */
export const setPageIndex = (state: EventDocListState, { pageIndex, cursor }: EventDocListSetPageIndexPayload): EventDocListState => {
  const cursors = [...state.cursors];
  cursors[pageIndex] = cursor;

  return { ...state, pageIndex, cursors };
};
