import type { EventDocExportUiSetErrorPayload } from '../effects/EventDocExportUiSetErrorEffect';
import type { EventDocExportUiState } from '../types/EventDocExportUiState';

/** Sets the error and clears both busy flags. */
export const setError = (state: EventDocExportUiState, { error }: EventDocExportUiSetErrorPayload): EventDocExportUiState => ({
  ...state,
  error,
  isLoading: false,
  isExporting: false,
});
