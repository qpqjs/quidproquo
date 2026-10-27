import { EventDocEventPayload } from 'quidproquo-features';

import { AdminSessionState } from '../../AdminSessionState';
import { CorrelationClosedData } from '../../effects/session/CorrelationClosedEvent';

export const correlationClosed = (state: AdminSessionState, { data }: EventDocEventPayload<CorrelationClosedData>): AdminSessionState => ({
  ...state,
  openCorrelation: state.openCorrelation === data.correlationId ? null : state.openCorrelation,
});
