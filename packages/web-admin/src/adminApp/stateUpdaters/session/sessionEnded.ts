import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionEndedData } from '../../effects/session/AdminSessionEndedEffect';
import { AdminSessionState } from '../../types/AdminSessionState';

export const sessionEnded = (state: AdminSessionState, { metadata }: EventDocEventPayload<AdminSessionEndedData>): AdminSessionState => ({
  ...state,
  endedAt: metadata.createdAt,
});
