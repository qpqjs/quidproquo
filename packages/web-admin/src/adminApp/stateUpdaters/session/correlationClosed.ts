import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionCorrelationClosedData } from '../../effects/session/AdminSessionCorrelationClosedEffect';
import { AdminSessionState } from '../../types/AdminSessionState';

export const correlationClosed = (
  state: AdminSessionState,
  { data }: EventDocEventPayload<AdminSessionCorrelationClosedData>,
): AdminSessionState => ({
  ...state,
  openCorrelation: state.openCorrelation === data.correlationId ? null : state.openCorrelation,
});
