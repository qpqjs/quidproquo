import type { EventDocExportUiToggleSelectedPayload } from '../effects/EventDocExportUiToggleSelectedEffect';
import type { EventDocExportUiState } from '../types/EventDocExportUiState';

/** Ticks or unticks a candidate. */
export const toggleSelected = (state: EventDocExportUiState, { id }: EventDocExportUiToggleSelectedPayload): EventDocExportUiState => ({
  ...state,
  selectedIds: state.selectedIds.includes(id) ? state.selectedIds.filter((selectedId) => selectedId !== id) : [...state.selectedIds, id],
});
