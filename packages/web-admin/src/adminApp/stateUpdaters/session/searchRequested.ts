import { EventDocEventPayload } from 'quidproquo-features';

import { AdminSessionState } from '../../AdminSessionState';
import { SearchRequestedData } from '../../effects/session/SearchRequestedEvent';
import { SearchOrigin } from '../../types/SearchOrigin';

// The explicit "run this search" intent; the fetched results live in the
// volatile slice keyed by these params — only the ask is part of the record.
// The Dashboard's automatic error sweep is recorded but does not overwrite the
// user's own filter state.
export const searchRequested = (state: AdminSessionState, { data }: EventDocEventPayload<SearchRequestedData>): AdminSessionState => ({
  ...state,
  search: data.origin === SearchOrigin.dashboard ? state.search : data.search,
  lastSearchRequest: data,
});
