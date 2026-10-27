import type { EventDocListSetErrorPayload } from '../effects/EventDocListSetErrorEffect';
import type { EventDocListState } from '../types/EventDocListState';

/** Sets or clears the error. */
export const setError = (state: EventDocListState, { error }: EventDocListSetErrorPayload): EventDocListState => ({
  ...state,
  error,
});
