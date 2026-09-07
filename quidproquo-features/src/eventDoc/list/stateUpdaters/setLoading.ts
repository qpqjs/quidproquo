import type { EventDocListSetLoadingPayload } from '../effects/EventDocListSetLoadingEffect';
import type { EventDocListState } from '../types/EventDocListState';

/** Sets the loading flag. */
export const setLoading = (state: EventDocListState, { isLoading }: EventDocListSetLoadingPayload): EventDocListState => ({
  ...state,
  isLoading,
});
