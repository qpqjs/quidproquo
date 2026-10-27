import type { EventDocImportUiState } from '../types/EventDocImportUiState';
import { selectEventDocImportDivergedRows } from './selectEventDocImportDivergedRows';

/**
 * Roughly how many target events a forced overwrite would discard, for the confirm warning. An estimate: the plan does not
 * carry the divergence index, so this is the event-count delta floored at 1 per diverged row. The apply reports the true count.
 */
export const selectEventDocImportDiscardEstimate = (state: EventDocImportUiState): number =>
  selectEventDocImportDivergedRows(state).reduce((total, row) => total + Math.max(row.existingEvents - row.incomingEvents, 1), 0);
