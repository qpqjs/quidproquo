import type { EventDocExportUiSetExportingPayload } from '../effects/EventDocExportUiSetExportingEffect';
import type { EventDocExportUiState } from '../types/EventDocExportUiState';

/** Sets the exporting flag. */
export const setExporting = (state: EventDocExportUiState, { isExporting }: EventDocExportUiSetExportingPayload): EventDocExportUiState => ({
  ...state,
  isExporting,
});
