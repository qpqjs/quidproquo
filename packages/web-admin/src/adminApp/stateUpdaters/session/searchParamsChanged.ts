import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionSearchParamsChangedData } from '../../effects/session/AdminSessionSearchParamsChangedEffect';
import { AdminSessionState } from '../../types/AdminSessionState';

export const searchParamsChanged = (
  state: AdminSessionState,
  { data }: EventDocEventPayload<AdminSessionSearchParamsChangedData>,
): AdminSessionState => ({
  ...state,
  search: data.search,
});
