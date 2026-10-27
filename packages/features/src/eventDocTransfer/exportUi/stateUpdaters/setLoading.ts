import type { EventDocExportUiSetLoadingPayload } from '../effects/EventDocExportUiSetLoadingEffect';
import type { EventDocExportUiState } from '../types/EventDocExportUiState';

/** Sets the loading flag. */
export const setLoading = (state: EventDocExportUiState, { isLoading }: EventDocExportUiSetLoadingPayload): EventDocExportUiState => ({
  ...state,
  isLoading,
});
