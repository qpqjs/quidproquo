import type { EventDocListSetConfigPayload } from '../effects/EventDocListSetConfigEffect';
import type { EventDocListState } from '../types/EventDocListState';

/** Merges the host-supplied config into state. */
export const setConfig = (state: EventDocListState, config: EventDocListSetConfigPayload): EventDocListState => ({
  ...state,
  ...config,
});
