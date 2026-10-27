import { EventDocEventPayload } from 'quidproquo-features';

import { AdminSessionState } from '../../AdminSessionState';
import { SessionEndedData } from '../../effects/session/SessionEndedEvent';

export const sessionEnded = (state: AdminSessionState, { metadata }: EventDocEventPayload<SessionEndedData>): AdminSessionState => ({
  ...state,
  endedAt: metadata.createdAt,
});
