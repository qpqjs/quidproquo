import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionState } from '../../AdminSessionState';
import { TabChangedData } from '../../effects/session/TabChangedEvent';

export const tabChanged = (state: AdminSessionState, { data }: EventDocEventPayload<TabChangedData>): AdminSessionState => ({
  ...state,
  tab: data.tab,
});
