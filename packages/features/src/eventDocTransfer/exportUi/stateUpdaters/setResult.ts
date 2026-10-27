import type { EventDocExportUiSetResultPayload } from '../effects/EventDocExportUiSetResultEffect';
import type { EventDocExportUiState } from '../types/EventDocExportUiState';

/** Stores the export result and replaces the manifest with what the bundle actually covered. */
export const setResult = (state: EventDocExportUiState, { result }: EventDocExportUiSetResultPayload): EventDocExportUiState => ({
  ...state,
  result,
  items: result.items,
  isExporting: false,
});
