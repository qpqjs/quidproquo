import type { EventDocImportUiSetResultPayload } from '../effects/EventDocImportUiSetResultEffect';
import type { EventDocImportUiState } from '../types/EventDocImportUiState';

/** Replaces the rows with the apply result and marks the plan applied. */
export const setResult = (state: EventDocImportUiState, { rows }: EventDocImportUiSetResultPayload): EventDocImportUiState => ({
  ...state,
  rows,
  isApplied: true,
  isApplying: false,
});
