import { SessionLogDocCreatedPayload } from '../../effects/sessionLog/SessionLogDocCreatedEffect';
import { SessionLogState } from '../../SessionLogState';

// The backend doc exists (INIT_STATE seeded server-side); its acked events
// become the base of the local log.
export const docCreated = (state: SessionLogState, payload: SessionLogDocCreatedPayload): SessionLogState => ({
  ...state,
  docId: payload.docId,
  events: payload.events,
});
