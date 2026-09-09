import type { EventDocListPageLoadedPayload } from '../effects/EventDocListPageLoadedEffect';
import type { EventDocListState } from '../types/EventDocListState';

/** Replaces the current page's rows and records the cursor for the page after it. */
export const pageLoaded = (state: EventDocListState, { items, nextPageKey }: EventDocListPageLoadedPayload): EventDocListState => ({
  ...state,
  items,
  nextPageKey,
});
