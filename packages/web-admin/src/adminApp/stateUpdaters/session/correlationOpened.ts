import { EventDocEventPayload } from 'quidproquo-features';

import { AdminSessionState } from '../../AdminSessionState';
import { CorrelationOpenedData } from '../../effects/session/CorrelationOpenedEvent';

export const correlationOpened = (state: AdminSessionState, { data }: EventDocEventPayload<CorrelationOpenedData>): AdminSessionState => ({
  ...state,
  openCorrelation: data.correlationId,
});
