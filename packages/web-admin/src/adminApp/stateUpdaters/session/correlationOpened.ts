import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionCorrelationOpenedData } from '../../effects/session/AdminSessionCorrelationOpenedEffect';
import { AdminSessionState } from '../../types/AdminSessionState';

export const correlationOpened = (
  state: AdminSessionState,
  { data }: EventDocEventPayload<AdminSessionCorrelationOpenedData>,
): AdminSessionState => ({
  ...state,
  openCorrelation: data.correlationId,
});
