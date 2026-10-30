import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionTabChangedData } from '../../effects/session/AdminSessionTabChangedEffect';
import { AdminSessionState } from '../../types/AdminSessionState';

export const tabChanged = (state: AdminSessionState, { data }: EventDocEventPayload<AdminSessionTabChangedData>): AdminSessionState => ({
  ...state,
  tab: data.tab,
});
