import type { EventDocImportUiSetErrorPayload } from '../effects/EventDocImportUiSetErrorEffect';
import type { EventDocImportUiState } from '../types/EventDocImportUiState';

/** Sets the error and clears both busy flags. */
export const setError = (state: EventDocImportUiState, { error }: EventDocImportUiSetErrorPayload): EventDocImportUiState => ({
  ...state,
  error,
  isLoading: false,
  isApplying: false,
});
