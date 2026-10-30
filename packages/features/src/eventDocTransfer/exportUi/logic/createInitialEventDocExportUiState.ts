import { EventDocExportUiState } from '../types/EventDocExportUiState';

/** Initial (closed) export dialog state. */
export const createInitialEventDocExportUiState = (): EventDocExportUiState => ({
  isOpen: false,
  candidates: [],
  selectedIds: [],
  items: [],
  isLoading: false,
  isExporting: false,
  error: null,
  result: null,
});
