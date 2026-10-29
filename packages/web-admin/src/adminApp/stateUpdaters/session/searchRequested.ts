import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionSearchRequestedData } from '../../effects/session/AdminSessionSearchRequestedEffect';
import { AdminSessionState } from '../../types/AdminSessionState';
import { SearchOrigin } from '../../types/SearchOrigin';

// The explicit "run this search" intent; the fetched results live in the
// volatile slice keyed by these params, only the ask is part of the record.
// The Dashboard's automatic error sweep is recorded but does not overwrite the
// user's own filter state.
export const searchRequested = (state: AdminSessionState, { data }: EventDocEventPayload<AdminSessionSearchRequestedData>): AdminSessionState => ({
  ...state,
  search: data.origin === SearchOrigin.dashboard ? state.search : data.search,
  lastSearchRequest: data,
});
