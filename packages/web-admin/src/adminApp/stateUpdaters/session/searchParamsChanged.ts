import { EventDocEventPayload } from 'quidproquo-features';

import { AdminSessionState } from '../../AdminSessionState';
import { SearchParamsChangedData } from '../../effects/session/SearchParamsChangedEvent';

export const searchParamsChanged = (state: AdminSessionState, { data }: EventDocEventPayload<SearchParamsChangedData>): AdminSessionState => ({
  ...state,
  search: data.search,
});
