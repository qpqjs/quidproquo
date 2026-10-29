import { SessionLogFlushFailedPayload } from '../../effects/sessionLog/SessionLogFlushFailedEffect';
import { SessionLogState } from '../../types/SessionLogState';

export const flushFailed = (state: SessionLogState, payload: SessionLogFlushFailedPayload): SessionLogState => ({
  ...state,
  flush: {
    inFlight: false,
    lastError: payload.errorText,
    retryCount: state.flush.retryCount + 1,
  },
});
