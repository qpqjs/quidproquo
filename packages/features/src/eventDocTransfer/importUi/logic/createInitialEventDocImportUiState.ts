import { EventDocImportUiState } from '../types/EventDocImportUiState';

/** Initial (empty) import screen state. */
export const createInitialEventDocImportUiState = (): EventDocImportUiState => ({
  transferId: null,
  source: null,
  rows: [],
  isLoading: false,
  isApplying: false,
  isApplied: false,
  error: null,
});
