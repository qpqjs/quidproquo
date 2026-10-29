import { createInitialEventDocExportUiState } from '../logic/createInitialEventDocExportUiState';
import { EventDocExportUiState } from '../types/EventDocExportUiState';

/** Returns the dialog to its initial state. */
export const reset = (): EventDocExportUiState => createInitialEventDocExportUiState();
