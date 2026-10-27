import { SessionLogState } from '../../SessionLogState';

export const flushStarted = (state: SessionLogState): SessionLogState => ({
  ...state,
  flush: { ...state.flush, inFlight: true },
});
