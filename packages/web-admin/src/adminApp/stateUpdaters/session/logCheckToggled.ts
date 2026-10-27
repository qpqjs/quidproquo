import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionState } from '../../AdminSessionState';
import { LogCheckToggledData } from '../../effects/session/LogCheckToggledEvent';

export const logCheckToggled = (state: AdminSessionState, { data }: EventDocEventPayload<LogCheckToggledData>): AdminSessionState => ({
  ...state,
  logChecks: { ...state.logChecks, [data.correlationId]: data.checked },
});
