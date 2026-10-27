import type { EventDocImportUiSetLoadingPayload } from '../effects/EventDocImportUiSetLoadingEffect';
import type { EventDocImportUiState } from '../types/EventDocImportUiState';

/** Sets the loading flag. */
export const setLoading = (state: EventDocImportUiState, { isLoading }: EventDocImportUiSetLoadingPayload): EventDocImportUiState => ({
  ...state,
  isLoading,
});
