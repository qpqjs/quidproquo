import type { EventDocImportUiSetPlanPayload } from '../effects/EventDocImportUiSetPlanEffect';
import type { EventDocImportUiState } from '../types/EventDocImportUiState';

/** Stores a fresh plan and resets isApplied so the screen returns to the review state. */
export const setPlan = (state: EventDocImportUiState, { transferId, source, rows }: EventDocImportUiSetPlanPayload): EventDocImportUiState => ({
  ...state,
  transferId,
  source,
  rows,
  isApplied: false,
  isLoading: false,
  error: null,
});
