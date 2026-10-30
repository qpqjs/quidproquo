import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionLogCheckToggledData } from '../../effects/session/AdminSessionLogCheckToggledEffect';
import { AdminSessionState } from '../../types/AdminSessionState';

export const logCheckToggled = (state: AdminSessionState, { data }: EventDocEventPayload<AdminSessionLogCheckToggledData>): AdminSessionState => ({
  ...state,
  logChecks: { ...state.logChecks, [data.correlationId]: data.checked },
});
