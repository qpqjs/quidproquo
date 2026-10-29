import { createInitialEventDocImportUiState } from '../logic/createInitialEventDocImportUiState';
import type { EventDocImportUiState } from '../types/EventDocImportUiState';

/** Returns the screen to its initial state. */
export const reset = (): EventDocImportUiState => createInitialEventDocImportUiState();
