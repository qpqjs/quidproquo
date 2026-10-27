import { createInitialEventDocExportUiState, type EventDocExportUiState } from '../types/EventDocExportUiState';

/** Opens from pristine state with loading on, since candidates are fetched next. */
export const open = (): EventDocExportUiState => ({
  ...createInitialEventDocExportUiState(),
  isOpen: true,
  isLoading: true,
});
